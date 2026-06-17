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

    const supabaseAdmin = getSupabaseAdmin();
    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from('users')
      .select('id,role,status,name,email')
      .eq('email', normalizedEmail)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('[ensure-admin] select error:', selectError);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    const adminRecord = {
      id: userId,
      email: normalizedEmail,
      name,
      role: 'admin',
      status: 'active'
    };

    let upsertError = null;
    if (existingUser) {
      const updateResponse = await supabaseAdmin
        .from('users')
        .update(adminRecord)
        .eq('email', normalizedEmail);
      upsertError = updateResponse.error;
    } else {
      const insertResponse = await supabaseAdmin
        .from('users')
        .insert(adminRecord);
      upsertError = insertResponse.error;
    }

    if (upsertError) {
      console.error('[ensure-admin] upsert error:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, admin: adminRecord });
  } catch (error: any) {
    console.error('[ensure-admin] unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Unexpected server error' }, { status: 500 });
  }
}
