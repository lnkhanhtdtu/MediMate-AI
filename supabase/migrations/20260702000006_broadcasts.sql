-- ============================================================================
-- Broadcasts: system-wide announcements sent by admins, visible to all users.
-- ============================================================================
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.broadcasts enable row level security;

-- Any authenticated user may READ broadcasts (to see the latest announcement banner).
drop policy if exists "broadcasts_select_authenticated" on public.broadcasts;
create policy "broadcasts_select_authenticated"
  on public.broadcasts
  for select
  to authenticated
  using (true);

-- No INSERT/UPDATE/DELETE policy is granted to normal users: broadcasts are created
-- only through the admin API using the service-role key (which bypasses RLS). This
-- prevents patients from creating or altering system announcements.

create index if not exists broadcasts_created_at_idx on public.broadcasts (created_at desc);
