-- ══════════════════════════════════════════════════════════════════
-- BETA TESTER SYSTEM — Supabase migration
-- ══════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL editor ONCE.
-- Safe to re-run: every statement uses IF NOT EXISTS / IF EXISTS.
--
-- After running, the app's beta system will be fully operational:
--   - Pros can submit beta requests from /settings/beta-tester
--   - Admins see requests in /admin-beta in real time
--   - Approvals push users into /beta-space
--   - All reports land in /admin-feedback
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- 1. user_profiles.beta_status column
-- ──────────────────────────────────────────────────────────────────
alter table public.user_profiles
  add column if not exists beta_status text
    check (beta_status in ('none', 'pending', 'approved', 'rejected'))
    default 'none';

-- Backfill existing rows so the column is never null
update public.user_profiles
  set beta_status = 'none'
  where beta_status is null;


-- ──────────────────────────────────────────────────────────────────
-- 2. beta_requests table (one row per submitted candidature)
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.beta_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  motivation text not null,
  feedback text,
  experience text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists idx_beta_requests_status on public.beta_requests (status);
create index if not exists idx_beta_requests_user_id on public.beta_requests (user_id);


-- ──────────────────────────────────────────────────────────────────
-- 3. beta_reports table (bugs / feedback / suggestions from testers)
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.beta_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('bug', 'feedback', 'suggestion')),
  title text,
  description text not null,
  step text,
  verdict text,
  status text not null default 'received'
    check (status in ('received', 'in_progress', 'fixed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_beta_reports_status on public.beta_reports (status);
create index if not exists idx_beta_reports_user_id on public.beta_reports (user_id);
create index if not exists idx_beta_reports_kind on public.beta_reports (kind);


-- ──────────────────────────────────────────────────────────────────
-- 4. Realtime: publish all three tables so the front-end listens
-- ──────────────────────────────────────────────────────────────────
-- If your publication "supabase_realtime" exists, add these tables to it.
-- Wrapped in a DO block so re-running is safe.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.beta_requests;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.beta_reports;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.user_profiles;
    exception when duplicate_object then null;
    end;
  end if;
end $$;


-- ──────────────────────────────────────────────────────────────────
-- 5. Row Level Security
-- ──────────────────────────────────────────────────────────────────
-- The app's admin uses a localStorage-based auth (not Supabase auth),
-- which means ALL admin writes go through the anon key. We therefore
-- need permissive write policies on beta_requests and the beta_status
-- column. In production you should replace these with proper service-
-- role calls via an Edge Function — but for the current client-only
-- setup, the policies below are the minimum required to make the flow
-- work end-to-end.
--
-- IMPORTANT: make sure your UI prevents non-admin users from mutating
-- foreign rows. These policies do not distinguish "admin" from a
-- malicious anon client.

alter table public.beta_requests enable row level security;
alter table public.beta_reports enable row level security;

-- beta_requests: anyone can read and write (admin reads + user inserts)
drop policy if exists "beta_requests_anon_all" on public.beta_requests;
create policy "beta_requests_anon_all"
  on public.beta_requests
  for all
  using (true)
  with check (true);

-- beta_reports: same
drop policy if exists "beta_reports_anon_all" on public.beta_reports;
create policy "beta_reports_anon_all"
  on public.beta_reports
  for all
  using (true)
  with check (true);

-- user_profiles.beta_status updates: allow anon updates so the admin
-- panel can flip the flag. The rest of user_profiles keeps whatever
-- policies you already have.
drop policy if exists "user_profiles_beta_status_update" on public.user_profiles;
create policy "user_profiles_beta_status_update"
  on public.user_profiles
  for update
  using (true)
  with check (true);


-- ══════════════════════════════════════════════════════════════════
-- Done. Reload the app and the beta system should be fully functional.
-- ══════════════════════════════════════════════════════════════════
