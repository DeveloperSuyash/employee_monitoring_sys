import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client using SERVICE_ROLE_KEY.
 * This client bypasses RLS and should ONLY be used in server actions.
 * 
 * Uses lazy initialization — client is created on first use, not at import time.
 * 
 * This implementation does not fallback to anon key for admin operations.
 * A real SUPABASE_SERVICE_ROLE_KEY is required for admin insert/update/delete.
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
  console.log('└──────────────────────────────────');

  // ── Validation ──
  if (!supabaseUrl) {
    throw new Error(
      'Server Configuration Error: NEXT_PUBLIC_SUPABASE_URL is not set. ' +
      'Add it to .env.local'
    );
  }

  if (!supabaseServiceKey ||
      supabaseServiceKey === 'PLACEHOLDER_SERVICE_ROLE_KEY' ||
      supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE' ||
      supabaseServiceKey.length < 50) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not configured or invalid.');
    console.error('To fix: Open .env.local and set SUPABASE_SERVICE_ROLE_KEY to your actual service_role key.');
    console.error('Get it from: https://supabase.com/dashboard/project/lrvwbtfqdjjjqmpfbfvz/settings/api');
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured or invalid. ' +
      'Set the actual service_role key in .env.local for admin operations.'
    );
  }

  const keyToUse: string = supabaseServiceKey;

  // Only create client if not already cached
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl, keyToUse, {
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
