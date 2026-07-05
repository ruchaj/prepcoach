-- ============================================================
-- PrepCoach — Database Schema + RLS
-- Run this entire file in the Supabase SQL editor.
-- ============================================================

-- ------------------------------------------------------------
-- Phase 2: Tables, indexes, and the profile trigger
-- ------------------------------------------------------------

-- profiles: one row per auth user
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  target_role      text,
  resume           text,
  experience_level text,
  created_at       timestamptz default now()
);

-- sessions: one mock interview
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  target_role text,          -- snapshot at session start
  resume      text,          -- snapshot, so editing the profile later doesn't rewrite history
  created_at  timestamptz default now()
);

-- turns: each message in a session
create table turns (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  role       text not null check (role in ('coach','user')),
  content    text not null,
  scores     jsonb,          -- only set on 'user' turns
  created_at timestamptz default now()
);

-- indexes for the common lookups
create index sessions_user_id_idx  on sessions(user_id, created_at desc);
create index turns_session_id_idx  on turns(session_id, created_at asc);

-- auto-create a profile when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ------------------------------------------------------------
-- Phase 3: Row Level Security
-- ------------------------------------------------------------

alter table profiles enable row level security;
alter table sessions enable row level security;
alter table turns    enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own sessions" on sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- turns has no user_id, so the policy reaches through the parent session
create policy "own turns" on turns
  for all
  using     (auth.uid() = (select user_id from sessions where id = turns.session_id))
  with check(auth.uid() = (select user_id from sessions where id = turns.session_id));
