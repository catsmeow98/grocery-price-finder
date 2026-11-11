-- 01_security.sql
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.
--
-- What it does:
--   * Turns on row-level security (RLS) for stores and products
--     (they were OFF, meaning anyone with the public key could edit them).
--   * Lets everyone READ stores, products and prices (needed for search).
--     Nobody can write them through the public key.
--   * Makes sure each logged-in user can only see and change
--     their OWN shopping list and its items.

alter table public.stores   enable row level security;
alter table public.products enable row level security;
alter table public.prices   enable row level security;

drop policy if exists "public read stores"   on public.stores;
drop policy if exists "public read products" on public.products;
drop policy if exists "public read prices"   on public.prices;

create policy "public read stores"   on public.stores   for select using (true);
create policy "public read products" on public.products for select using (true);
create policy "public read prices"   on public.prices   for select using (true);

alter table public.shopping_lists      enable row level security;
alter table public.shopping_list_items enable row level security;

drop policy if exists "own lists"      on public.shopping_lists;
drop policy if exists "own list items" on public.shopping_list_items;

create policy "own lists" on public.shopping_lists
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own list items" on public.shopping_list_items
  for all to authenticated
  using (exists (
    select 1 from public.shopping_lists l
    where l.id = shopping_list_id and l.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.shopping_lists l
    where l.id = shopping_list_id and l.user_id = auth.uid()
  ));
