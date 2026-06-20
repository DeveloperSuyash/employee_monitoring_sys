'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Activity, 
  Clock, 
  Search, 
  Plus, 
  MoreVertical, 
  ArrowUpRight,
  UserPlus,
  Shield,
  Briefcase,
  User as UserIcon,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  Edit,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchAdminDashboard, fetchEmployeeDetails } from '@/lib/stats';
import { createUserAction, deleteUserAction, updateUserRoleAction, toggleUserStatusAction } from '@/app/actions/user-actions';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'bhuisompa001@gmail.com';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, onlineUsers: 0, totalHours: '0h' });
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; email: string } | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // New User Form State
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'employee', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('[admin-page] page initialization');
    void loadData();
    void loadCurrentUser();

    async function loadCurrentUser() {
      console.log('[admin-page] auth check start');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          console.warn('[admin-page] auth check failed: no session');
          router.replace('/');
          return;
        }

        const sessionEmail = session.user.email?.toLowerCase() || '';
        const { data: profile, error } = await supabase
          .from('users')
          .select('name,role,email')
          .or(`id.eq.${session.user.id},email.eq.${sessionEmail}`)
          .single();

        if (error) {
          console.warn('Unable to resolve current admin user profile:', error.message);
          if (sessionEmail === ADMIN_EMAIL) {
            console.warn('[admin-page] Admin email detected despite missing profile; continuing to admin.');
            setCurrentUser({ name: 'Admin', role: 'admin', email: sessionEmail });
            return;
          }
          router.replace('/');
          return;
        }

        if (!profile?.role) {
          if (sessionEmail === ADMIN_EMAIL) {
            console.warn('[admin-page] Admin profile missing role, using email fallback.');
            setCurrentUser({ name: profile?.name || 'Admin', role: 'admin', email: sessionEmail });
            return;
          }
          console.warn('Admin profile missing role, redirecting to login.');
          router.replace('/');
          return;
        }

        if (profile.role !== 'admin') {
          console.warn('[admin-page] auth check failed: non-admin user');
          router.replace('/employee');
          return;
        }

        console.log('[admin-page] auth check success');
        setCurrentUser({
          name: profile.name || session.user.email || 'Administrator',
          role: profile.role,
          email: profile.email || session.user.email || ''
        });
      } catch (err) {
        console.error('Failed to load current user session:', err);
        router.replace('/');
      }
    }
  }, [router]);

  async function loadData() {
    console.log('[admin-page] fetchAdminStats start');
    try {
      setLoading(true);
      setError(null);
      const payload = await fetchAdminDashboard();
      const nextStats = payload.stats || { totalUsers: 0, activeUsers: 0, onlineUsers: 0, totalHours: '0h' };
      const nextEmployees = payload.employees || [];
      setStats(nextStats);
      setEmployees(nextEmployees);
      console.log('[admin-page] fetchUsers success', nextEmployees.length);
      if (nextEmployees.length === 0 && nextStats.totalUsers === 0) {
        setError('No users found. Please check your database connection and Supabase policies.');
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err?.name === 'AbortError'
        ? 'Admin dashboard request timed out. Check /api/admin-dashboard and Supabase configuration.'
        : `Connection Error: ${err?.message || 'Could not connect to Supabase.'}`);
    } finally {
      console.log('[admin-page] fetchAdminStats finished; loading=false');
      setLoading(false);
    }
  }

  async function handleOpenDetails(userId: string) {
    try {
      setDetailsLoading(true);
      setSelectedEmployeeId(userId);
      console.log('[admin-dashboard] Selected employee:', userId);
      const details = await fetchEmployeeDetails(userId);
      console.log('[admin-dashboard] Activity logs fetched:', details);
      setSelectedEmployeeDetails(details);
    } catch (err) {
      console.error('Failed to load user details:', err);
      setSelectedEmployeeDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createUserAction(newUser);
      setShowAddModal(false);
      setNewUser({ name: '', email: '', role: 'employee', password: '' });
      await loadData();
    } catch (err: any) {
      alert('Error creating user: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      await deleteUserAction(id);
      await loadData();
    }
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    await updateUserRoleAction(id, newRole);
    await loadData();
    setActiveMenuId(null);
  };

  const handleToggleStatus = async (id: string, status: string) => {
    await toggleUserStatusAction(id, status);
    await loadData();
    setActiveMenuId(null);
  };

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Shield size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Admin Console</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold">{currentUser?.name || currentUser?.email || 'Administrator'}</div>
                <div className="text-xs text-slate-400">{currentUser?.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}` : 'Admin'}</div>
                <div className="text-xs text-slate-400">{currentUser?.email || ''}</div>
             </div>
             <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                {currentUser?.name ? currentUser.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() : 'SB'}
             </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Organization Dashboard</h1>
            <p className="mt-1 text-slate-500 text-sm">Real-time database records and activity summary.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95"
          >
            <UserPlus size={18} />
            <span>Create New User</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600 flex items-center gap-3">
            <XCircle size={18} />
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Employees" value={stats.totalUsers.toString()} icon={Users} color="bg-blue-500" />
          <StatCard title="Active Accounts" value={stats.activeUsers.toString()} icon={CheckCircle} color="bg-emerald-500" />
          <StatCard title="Online Now" value={stats.onlineUsers.toString()} icon={Clock} color="bg-indigo-500" />
          <StatCard title="Company Track Time" value={stats.totalHours} icon={Activity} color="bg-amber-500" />
        </div>

        {/* User Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-visible">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h3 className="font-bold text-slate-800">All Database Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Today's Time</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Websites</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Visits</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                          {emp.name ? emp.name[0] : emp.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{emp.name || 'No Name'}</div>
                          <div className="text-xs text-slate-400">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={emp.role} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", emp.status === 'active' ? "bg-emerald-500" : "bg-rose-400")} />
                        <span className="text-sm font-medium capitalize">{emp.status || 'inactive'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">
                      {formatSeconds(emp.todayTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">
                      {emp.websiteCount || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">
                      {emp.totalVisits || 0}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === emp.id ? null : emp.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {activeMenuId === emp.id && (
                        <div className="absolute right-6 top-12 z-50 w-44 rounded-xl border border-slate-100 bg-white p-1 shadow-xl">
                          <MenuItem icon={UserIcon} label="View Details" onClick={() => handleOpenDetails(emp.id)} />
                          <div className="my-1 h-[1px] bg-slate-100" />
                          <p className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400">Change Role To</p>
                          <MenuItem icon={Shield} label="Admin" onClick={() => handleChangeRole(emp.id, 'admin')} disabled={emp.role === 'admin'} />
                          <MenuItem icon={UserIcon} label="Employee" onClick={() => handleChangeRole(emp.id, 'employee')} disabled={emp.role === 'employee'} />
                          <div className="my-1 h-[1px] bg-slate-100" />
                          <MenuItem 
                             icon={emp.status === 'active' ? XCircle : CheckCircle} 
                             label={emp.status === 'active' ? 'Deactivate' : 'Activate'} 
                             onClick={() => handleToggleStatus(emp.id, emp.status)} 
                          />
                          <MenuItem icon={Trash2} label="Delete User" onClick={() => handleDeleteUser(emp.id)} danger />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedEmployeeDetails && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Employee details</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {selectedEmployeeDetails.employee?.name || selectedEmployeeDetails.employee?.email || 'Unknown Employee'}
                </h2>
                <p className="text-sm text-slate-500">{selectedEmployeeDetails.employee?.email || 'No email available'}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedEmployeeDetails(null);
                  setSelectedEmployeeId(null);
                }}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Close details
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-10 text-center text-slate-500">Loading employee details…</div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <InfoCard label="Role" value={selectedEmployeeDetails.employee?.role || 'Employee'} />
                  <InfoCard label="Status" value={selectedEmployeeDetails.employee?.status || 'active'} />
                  <InfoCard label="Time tracked" value={formatSeconds(selectedEmployeeDetails.totalTime || 0)} />
                  <InfoCard label="Website count" value={String(selectedEmployeeDetails.websiteCount || 0)} />
                  <InfoCard label="Visit count" value={String(selectedEmployeeDetails.visitCount || 0)} />
                </div>

                <div className="mt-6">
                  <h3 className="text-base font-semibold text-slate-900 mb-3">Recent activity logs (last 50 records)</h3>
                  {selectedEmployeeDetails.logs?.length ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full border-collapse text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Domain</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Time Spent</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Visits</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Last Visit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {selectedEmployeeDetails.logs.map((log: any, index: number) => (
                            <tr key={`${log.created_at}-${index}`} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900">{log.domain || 'Unknown domain'}</div>
                                <div className="text-xs text-slate-500 truncate max-w-[280px]">{log.url || '-'}</div>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                                {formatSeconds(Number(log.time_spent || 0))}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                                {Number(log.visit_count || 0)}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-500">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No tracked activity found for this employee.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create New User</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Full Name</label>
                <input 
                  type="text" required
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Email Address</label>
                <input 
                  type="email" required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">System Role</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none bg-white"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
                <input 
                  type="password" required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Set a secure password"
                />
              </div>
              <div className="pt-4 text-xs text-slate-400">
                <p>Note: The administrator sets the password when creating the user.</p>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                <span>Create User Account</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-white", color)}>
          <Icon size={20} />
        </div>
        <ArrowUpRight className="text-slate-300" size={16} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: any = {
    admin: "bg-purple-50 text-purple-700 border-purple-100",
    hr: "bg-blue-50 text-blue-700 border-blue-100",
    employee: "bg-slate-50 text-slate-600 border-slate-100"
  };
  const label = role === 'admin' ? 'Admin' : role === 'hr' ? 'HR' : 'Employee';
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase border", styles[role] || styles.employee)}>
      {label}
    </span>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger, disabled }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors disabled:opacity-30",
        danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
