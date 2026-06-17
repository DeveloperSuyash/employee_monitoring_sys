import { supabase } from '@/lib/supabase';

/**
 * DETECTED SCHEMA SYNC:
 * users: id, email, name, role, status, created_at
 * activity_logs: id, user_id, domain, url, time_spent, visit_count, created_at
 */

const REQUEST_TIMEOUT_MS = 10000;

async function fetchAdminDashboardPayload(label: string) {
  console.log(`[${label}] start`);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch('/api/admin-dashboard', {
      cache: 'no-store',
      signal: controller.signal
    });
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(`[${label}] API error:`, payload);
      throw new Error(payload?.error || `Admin dashboard API failed with ${res.status}`);
    }

    console.log(`[${label}] success`);
    return payload;
  } catch (error) {
    console.error(`[${label}] failed:`, error);
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    console.log(`[${label}] finished`);
  }
}

export async function fetchAdminDashboard() {
  return fetchAdminDashboardPayload('fetchAdminDashboard');
}

export async function fetchAdminStats() {
  try {
    const payload = await fetchAdminDashboardPayload('fetchAdminStats');
    return payload.stats || { totalUsers: 0, activeUsers: 0, onlineUsers: 0, totalHours: '0h' };
  } catch (error) {
    console.error('fetchAdminStats crash:', error);
    return { totalUsers: 0, activeUsers: 0, onlineUsers: 0, totalHours: '0h' };
  }
}

export async function fetchEmployeeList() {
  try {
    const payload = await fetchAdminDashboardPayload('fetchEmployeeList');
    return payload.employees || [];
  } catch (error) {
    console.error('fetchEmployeeList crash:', error);
    return [];
  }
}

export async function fetchEmployeeDetails(employeeId: string) {
  try {
    console.log('[fetchEmployeeDetails] start', employeeId);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`/api/admin-dashboard?employeeId=${encodeURIComponent(employeeId)}`, {
        cache: 'no-store',
        signal: controller.signal
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('fetchEmployeeDetails API error:', payload);
        return null;
      }

      console.log('[fetchEmployeeDetails] success', employeeId);
      return payload.employeeDetails || null;
    } finally {
      window.clearTimeout(timeoutId);
      console.log('[fetchEmployeeDetails] finished', employeeId);
    }
  } catch (error) {
    console.error('fetchEmployeeDetails crash:', error);
    return null;
  }
}
