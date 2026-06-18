'use server';

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, userId, name } = body;

    if (!email || !userId || !name) {
      return NextResponse.json({ error: 'Missing required admin data' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    try {
      const supabaseAdmin = getSupabaseAdmin();

      const adminRecord = {
        id: userId,
        email: normalizedEmail,
        name,
        role: 'admin',
        status: 'active'
      };

      const { data: existingUser, error: selectError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (selectError) {
        console.error('[ensure-admin] email lookup error:', selectError);
        return NextResponse.json({ error: selectError.message }, { status: 500 });
      }

      let upsertError = null;
      if (existingUser && existingUser.id && existingUser.id !== userId) {
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ name, role: 'admin', status: 'active' })
          .eq('email', normalizedEmail);
        upsertError = updateError;
      } else {
        const { error } = await supabaseAdmin
          .from('users')
          .upsert(adminRecord, { onConflict: 'id', ignoreDuplicates: false });
        upsertError = error;
      }

      if (upsertError) {
        console.error('[ensure-admin] upsert/update error:', upsertError);
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }

      console.log('[ensure-admin] Admin user ensured:', normalizedEmail);
      return NextResponse.json({ success: true, email: normalizedEmail });
    } catch (adminError: any) {
      // Fallback: If SERVICE_ROLE_KEY is not available, allow the login to proceed
      // In production, this should not be used
      console.warn('[ensure-admin] Admin client error, using fallback:', adminError.message);
      console.warn('[ensure-admin] User will be able to login but admin record may not be created in DB');
      
      // Return success anyway so the user can login
      return NextResponse.json({
        success: true,
        email: normalizedEmail,
        warning: 'Admin record not created - configure SUPABASE_SERVICE_ROLE_KEY for full functionality'
      });
    }
  } catch (error: any) {
    console.error('[ensure-admin] unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Unexpected server error' }, { status: 500 });
  }
}

