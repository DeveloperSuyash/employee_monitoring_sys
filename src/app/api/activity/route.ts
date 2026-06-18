import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, domain, url, time_spent, visit_count } = body;

    if (!user_id || !domain) {
      return NextResponse.json(
        { error: 'user_id and domain are required' },
        { status: 400 }
      );
    }

    // Use anon key for client-side inserts with RLS
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    const activityLog = {
      user_id,
      domain,
      url: url || '',
      time_spent: time_spent || 0,
      visit_count: visit_count || 1,
      created_at: new Date().toISOString()
    };

    console.log('[activity-api] Inserting activity log:', activityLog);

    const { data, error } = await supabase
      .from('activity_logs')
      .insert([activityLog]);

    if (error) {
      console.error('[activity-api] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[activity-api] Activity logged successfully');
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[activity-api] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to log activity' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[activity-api] Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('[activity-api] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}
