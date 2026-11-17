-- 12_merge_duplicate_stores.sql
-- Merges duplicate store rows (same name, address and city, ignoring
-- upper/lower case and extra spaces) into one, e.g. "Aldi" and "ALDI".
-- Prices (and any customer include/exclude choices) move to the row we keep.
-- Sample stores are left alone. Run STEP 1 to preview, then STEP 2, then STEP 3.

-- STEP 1 (preview, changes nothing): which stores would be merged?
-- Rows with keep = 1 stay; the others are merged into them.
select s.id, s.name, s.address, s.city,
       (select count(*) from public.prices p where p.store_id = s.id) as price_rows,
       row_number() over (
         partition by lower(trim(s.name)), lower(trim(coalesce(s.address,''))), lower(trim(coalesce(s.city,'')))
         order by (select count(*) from public.prices p where p.store_id = s.id) desc,
                  (s.latitude is not null) desc, s.id
       ) as keep
from public.stores s
where s.name not like 'Sample %'
  and (lower(trim(s.name)), lower(trim(coalesce(s.address,''))), lower(trim(coalesce(s.city,'')))) in (
    select lower(trim(name)), lower(trim(coalesce(address,''))), lower(trim(coalesce(city,'')))
    from public.stores
    where name not like 'Sample %'
    group by 1, 2, 3
    having count(*) > 1)
order by lower(trim(s.name)), keep;

-- STEP 2 (makes the change): select everything from here to STEP 3 and run it.
-- It is one block, so it works even if the editor runs statements separately.
do $$
begin
  create temp table store_map (dup_id uuid, keep_id uuid) on commit drop;

  insert into store_map
  select id,
         first_value(id) over (
           partition by lower(trim(name)), lower(trim(coalesce(address,''))), lower(trim(coalesce(city,'')))
           order by (select count(*) from public.prices p where p.store_id = stores.id) desc,
                    (latitude is not null) desc, id
         )
  from public.stores
  where name not like 'Sample %';

  delete from store_map where dup_id = keep_id;

  update public.prices pr
  set store_id = m.keep_id
  from store_map m
  where pr.store_id = m.dup_id;

  -- Keep a customer's include/exclude choice unless they already have one for the kept store.
  update public.user_store_overrides o
  set store_id = m.keep_id
  from store_map m
  where o.store_id = m.dup_id
    and not exists (
      select 1 from public.user_store_overrides x
      where x.user_id = o.user_id and x.store_id = m.keep_id);

  -- Deleting a store also removes any leftover choices that pointed at it.
  delete from public.stores s
  using store_map m
  where s.id = m.dup_id;
end $$;

-- STEP 3 (run after STEP 2 succeeds): stop duplicates being created again.
create unique index if not exists stores_unique_location
on public.stores (lower(trim(name)), lower(trim(coalesce(address,''))), lower(trim(coalesce(city,''))));
