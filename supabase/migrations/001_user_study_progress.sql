-- Run in Supabase SQL Editor (Dashboard → SQL) for cloud profile sync.
-- Enables email/password auth in Dashboard → Authentication → Providers first.

create table if not exists public.user_study_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_study_progress enable row level security;

create policy "Users read own progress"
  on public.user_study_progress for select
  using (auth.uid() = user_id);

create policy "Users insert own progress"
  on public.user_study_progress for insert
  with check (auth.uid() = user_id);

create policy "Users update own progress"
  on public.user_study_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_user_study_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_study_progress_updated_at on public.user_study_progress;
create trigger user_study_progress_updated_at
  before update on public.user_study_progress
  for each row execute function public.set_user_study_progress_updated_at();
