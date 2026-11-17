-- 10_locations.sql
-- Run once in Supabase SQL Editor (after 09). Safe to re-run.
--
--  * stores.latitude / longitude : where each store location is
--  * user_location               : the customer's ZIP + max driving distance
--  * user_store_overrides        : the customer's own include/exclude choices
--                                  (replaces user_excluded_stores)

alter table public.stores
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

create table if not exists public.user_location (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  zip        text not null,
  latitude   double precision not null,
  longitude  double precision not null,
  max_miles  numeric not null default 15 check (max_miles > 0),
  updated_at timestamptz not null default now()
);

alter table public.user_location enable row level security;

drop policy if exists "own location" on public.user_location;

create policy "own location" on public.user_location
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.user_store_overrides (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  store_id   uuid not null references public.stores(id) on delete cascade,
  included   boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, store_id)
);

alter table public.user_store_overrides enable row level security;

drop policy if exists "own store overrides" on public.user_store_overrides;

create policy "own store overrides" on public.user_store_overrides
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Carry over stores that were excluded with the earlier version.
do $$
begin
  if to_regclass('public.user_excluded_stores') is not null then
    insert into public.user_store_overrides (user_id, store_id, included)
    select user_id, store_id, false from public.user_excluded_stores
    on conflict (user_id, store_id) do nothing;
  end if;
end $$;
