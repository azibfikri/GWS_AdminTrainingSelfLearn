-- Applied remotely via Supabase MCP (2026-08-10). Username/password profiles for GWS Study Desk.

create extension if not exists citext;

create table if not exists public.gws_study_users (
  id uuid primary key default gen_random_uuid(),
  username citext not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.gws_study_progress (
  user_id uuid primary key references public.gws_study_users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.gws_study_users enable row level security;
alter table public.gws_study_progress enable row level security;

revoke all on public.gws_study_users from anon, authenticated;
revoke all on public.gws_study_progress from anon, authenticated;
