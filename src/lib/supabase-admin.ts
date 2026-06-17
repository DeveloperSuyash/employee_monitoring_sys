import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client using SERVICE_ROLE_KEY.
 * This client bypasses RLS and should ONLY be used in server actions.
 * 
 * Uses lazy initialization — client is created on first use, not at import time.
 */

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  // Always re-read env vars (don't cache if previously failed)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // ── Diagnostic logging (safe — never prints full keys) ──
  console.log('┌─── Supabase Admin Client Init ───');
  console.log(`│ SUPABASE_URL loaded        = ${!!supabaseUrl}`);
  console.log(`│ SERVICE_ROLE_KEY loaded     = ${!!supabaseServiceKey}`);
  if (supabaseServiceKey) {
    console.log(`│ SERVICE_ROLE_KEY length     = ${supabaseServiceKey.length}`);
    console.log(`│ SERVICE_ROLE_KEY prefix     = ${supabaseServiceKey.substring(0, 12)}...`);
  }
  console.log(`│ All SUPABASE env vars       = ${Object.keys(process.env).filter(k => k.includes('SUPABASE')).join(', ')}`);
  console.log('└──────────────────────────────────');

  // ── Validation ──
  if (!supabaseUrl) {
    throw new Error(
      'Server Configuration Error: NEXT_PUBLIC_SUPABASE_URL is not set. ' +
      'Add it to dashboard/.env.local'
    );
  }

  if (!supabaseServiceKey || 
      supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE' || 
      supabaseServiceKey.length < 20) {
    console.error('⚠ SUPABASE_SERVICE_ROLE_KEY is missing or is a placeholder!');
    console.error('  Current value:', supabaseServiceKey ? `"${supabaseServiceKey.substring(0, 15)}..." (${supabaseServiceKey.length} chars)` : 'undefined');
    console.error('  To fix: Open dashboard/.env.local and set SUPABASE_SERVICE_ROLE_KEY to your real service_role key.');
    console.error('  Get it from: https://supabase.com/dashboard/project/lrvwbtfqdjjjqmpfbfvz/settings/api');
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. ' +
      'Open dashboard/.env.local and replace YOUR_SERVICE_ROLE_KEY_HERE with your real service_role key from ' +
      'Supabase Dashboard → Project Settings → API → service_role (secret).'
    );
  }

  // Only create client if not already cached
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✓ Supabase Admin client created successfully.');
  }

  return _supabaseAdmin;
}

// Backward-compatible lazy proxy export  
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});
