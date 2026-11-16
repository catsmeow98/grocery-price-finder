-- 09_stores_and_lists.sql
-- Run once in Supabase SQL Editor. Safe to re-run.
--
--  * user_excluded_stores: stores a customer never wants prices from
--  * shopping_lists.last_opened_at: remembers which saved list was open last

create table if not exists public.user_excluded_stores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  store_id   uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, store_id)
);

alter table public.user_excluded_stores enable row level security;

drop policy if exists "own excluded stores" on public.user_excluded_stores;

create policy "own excluded stores" on public.user_excluded_stores
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.shopping_lists
  add column if not exists last_opened_at timestamptz not null default now();
