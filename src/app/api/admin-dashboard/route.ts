import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const employeeId = url.searchParams.get('employeeId');
    const supabaseAdmin = getSupabaseAdmin();

    const [usersResult, logsResult] = await Promise.all([
      supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('activity_logs').select('user_id,time_spent,visit_count,created_at,url,domain')
    ]);

    if (usersResult.error) {
      console.error('[admin-dashboard] users query error:', usersResult.error.message);
      return NextResponse.json({ error: usersResult.error.message }, { status: 500 });
    }

    if (logsResult.error) {
      console.error('[admin-dashboard] activity_logs query error:', logsResult.error.message);
      return NextResponse.json({ error: logsResult.error.message }, { status: 500 });
    }

    const users = usersResult.data || [];
    const logs = logsResult.data || [];
    console.log('[admin-dashboard] Activity logs fetched:', logs);
    console.log('[admin-dashboard] Selected employee id:', employeeId);

    const totalUsers = users.length;
    const activeUsers = users.filter((user: any) => user.status === 'active').length;
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const onlineUsers = new Set(logs.filter((log: any) => log.created_at >= tenMinsAgo).map((log: any) => log.user_id)).size;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySeconds = logs
      .filter((log: any) => log.created_at >= todayStart.toISOString())
      .reduce((sum: number, log: any) => sum + (Number(log.time_spent) || 0), 0);

    const todayTimeByUser = logs.reduce((map: Record<string, number>, log: any) => {
      if (!log.user_id) return map;
      const seconds = Number(log.time_spent) || 0;
      map[log.user_id] = (map[log.user_id] || 0) + seconds;
      return map;
    }, {} as Record<string, number>);

    // Aggregate visit counts per user and most visited domain
    const visitCountByUser: Record<string, number> = {};
    const websiteSetByUser: Record<string, Set<string>> = {};
    const domainCountByUser: Record<string, Record<string, number>> = {};
    logs.forEach((log: any) => {
      if (!log.user_id) return;
      visitCountByUser[log.user_id] = (visitCountByUser[log.user_id] || 0) + (Number(log.visit_count) || 0);
      websiteSetByUser[log.user_id] = websiteSetByUser[log.user_id] || new Set<string>();
      if (log.domain) {
        websiteSetByUser[log.user_id].add(log.domain);
      }
      domainCountByUser[log.user_id] = domainCountByUser[log.user_id] || {};
      domainCountByUser[log.user_id][log.domain] = (domainCountByUser[log.user_id][log.domain] || 0) + (Number(log.time_spent) || 0);
    });

    const mostVisitedByUser: Record<string, string | null> = {};
    Object.keys(domainCountByUser).forEach((uid) => {
      const domains = domainCountByUser[uid];
      const top = Object.entries(domains).sort((a: any, b: any) => b[1] - a[1])[0];
      mostVisitedByUser[uid] = top ? top[0] : null;
    });

    const employees = users.map((user: any) => ({
      ...user,
      todayTime: todayTimeByUser[user.id] || 0,
      websiteCount: websiteSetByUser[user.id]?.size || 0,
      totalVisits: visitCountByUser[user.id] || 0,
      mostVisited: mostVisitedByUser[user.id] || null,
      productivity: 0
    }));

    const response: any = {
      stats: {
        totalUsers,
        activeUsers,
        onlineUsers,
        totalHours: `${Math.floor(todaySeconds / 3600)}h`
      },
      employees
    };

    if (employeeId) {
      const employee = users.find((user: any) => user.id === employeeId);
      const employeeLogs = logs
        .filter((log: any) => log.user_id === employeeId)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const employeeTime = employeeLogs.reduce((sum: number, log: any) => sum + (Number(log.time_spent) || 0), 0);

      response.employeeDetails = {
        employee,
        logs: employeeLogs,
        totalTime: employeeTime,
        websiteCount: new Set(employeeLogs.map((log: any) => log.domain).filter(Boolean)).size,
        visitCount: employeeLogs.reduce((sum: number, log: any) => sum + (Number(log.visit_count) || 0), 0),
        productivity: 0
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[admin-dashboard] unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Unexpected server error' }, { status: 500 });
  }
}
