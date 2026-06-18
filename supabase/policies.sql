-- Supabase RLS policy definitions for the employee monitoring system.
-- Apply these in the Supabase SQL editor or as part of migration.

-- Enable row-level security on the users table.
alter table public.users enable row level security;

-- Authenticated users can read their own user record.
create policy "Authenticated users can read own user record"
  on public.users
  for select
  using (
    auth.role() = 'authenticated'
    and auth.uid() = id
  );

-- Authenticated users can insert their own user record.
create policy "Authenticated users can insert own user record"
  on public.users
  for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = id
  );

-- Authenticated users can update their own user record.
create policy "Authenticated users can update own user record"
  on public.users
  for update
  using (
    auth.role() = 'authenticated'
    and auth.uid() = id
  )
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = id
  );

-- Service role can bypass all RLS restrictions on users.
create policy "Service role can manage users"
  on public.users
  for all
  using (
    auth.role() = 'service_role'
  )
  with check (
    auth.role() = 'service_role'
  );

-- Enable row-level security on the activity_logs table.
alter table public.activity_logs enable row level security;

-- Authenticated users can insert their own activity logs.
create policy "Authenticated users can insert own activity logs"
  on public.activity_logs
  for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = user_id
  );

-- Authenticated users can read their own activity logs.
create policy "Authenticated users can read own activity logs"
  on public.activity_logs
  for select
  using (
    auth.role() = 'authenticated'
    and auth.uid() = user_id
  );

-- Service role can bypass all RLS restrictions on activity_logs.
create policy "Service role can manage activity logs"
  on public.activity_logs
  for all
  using (
    auth.role() = 'service_role'
  )
  with check (
    auth.role() = 'service_role'
  );
