'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  BarChart3, 
  Calendar,
  Briefcase,
  Download,
  Filter,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchAdminStats, fetchEmployeeList } from '@/lib/stats';
import { supabase } from '@/lib/supabase';

export default function HRDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, onlineUsers: 0 });
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [s, e] = await Promise.all([fetchAdminStats(), fetchEmployeeList()]);
      setStats(s);
      // HR can view all employees but specifically filters out system settings
      setEmployees(e);
    } catch (err) {
      console.error('Failed to load HR data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Briefcase size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">HR Portal</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
            HR
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Human Resources</h1>
            <p className="mt-1 text-slate-500 text-sm">Monitoring team productivity and attendance summary.</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50">
            <Download size={18} />
            <span>Generate Report</span>
          </button>
        </div>

        {/* HR Context Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <HRStat title="Attendance" value={`${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%`} icon={Calendar} color="text-blue-600" />
          <HRStat title="Active tracking" value={stats.activeUsers.toString()} icon={Activity} color="text-emerald-600" />
          <HRStat title="Total Records" value={stats.totalUsers.toString()} icon={Users} color="text-indigo-600" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Organization Productivity</h3>
            <Filter size={18} className="text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Work Time</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Score</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold">{emp.name || emp.email} ({emp.role})</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{Math.floor(emp.todayTime / 3600)}h {Math.floor((emp.todayTime % 3600) / 60)}m</td>
                    <td className="px-6 py-4">
                       <span className={cn("px-2 py-1 rounded text-xs font-bold", emp.productivity > 70 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                         {emp.productivity}%
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      {emp.status === 'active' ? <CheckCircle size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-rose-400" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function HRStat({ title, value, icon: Icon, color }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
        <Icon className={color} size={24} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{title}</p>
        <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      </div>
    </div>
  );
}
