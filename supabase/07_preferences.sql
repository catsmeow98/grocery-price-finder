-- 07_preferences.sql
-- Run once in Supabase SQL Editor. Safe to re-run.
-- Stores each user's preferred / blocked brands per product name.

create table if not exists public.product_preferences (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_name text not null,
  brand        text not null,
  preference   text not null check (preference in ('preferred', 'blocked')),
  created_at   timestamptz not null default now(),
  unique (user_id, product_name, brand)
);

alter table public.product_preferences enable row level security;

drop policy if exists "own preferences" on public.product_preferences;

create policy "own preferences" on public.product_preferences
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
