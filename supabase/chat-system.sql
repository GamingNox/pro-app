-- ══════════════════════════════════════════════════════════════════
-- CHAT SYSTEM — Supabase migration
-- ══════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL editor ONCE.
-- Safe to re-run: every statement uses IF NOT EXISTS / IF EXISTS.
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- 1. user_profiles.chat_enabled — pro toggles chat on/off
-- ──────────────────────────────────────────────────────────────────
alter table public.user_profiles
  add column if not exists chat_enabled boolean default true;

update public.user_profiles
  set chat_enabled = true
  where chat_enabled is null;


-- ──────────────────────────────────────────────────────────────────
-- 2. messages table — chat between pro and client, scoped to a booking
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid references auth.users(id) on delete set null,
  booking_id uuid,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_booking_id on public.messages (booking_id);
create index if not exists idx_messages_sender on public.messages (sender_id);
create index if not exists idx_messages_receiver on public.messages (receiver_id);
create index if not exists idx_messages_created_at on public.messages (created_at desc);


-- ──────────────────────────────────────────────────────────────────
-- 3. Realtime: publish messages table
-- ──────────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.messages;
    exception when duplicate_object then null;
    end;
  end if;
end $$;


-- ──────────────────────────────────────────────────────────────────
-- 4. Row Level Security
-- ──────────────────────────────────────────────────────────────────
alter table public.messages enable row level security;

drop policy if exists "messages_anon_all" on public.messages;
create policy "messages_anon_all"
  on public.messages
  for all
  using (true)
  with check (true);

-- ══════════════════════════════════════════════════════════════════
-- Done. Reload the app and the chat system should be fully functional.
-- ══════════════════════════════════════════════════════════════════
