-- 05_merge_duplicate_products.sql
-- Merges duplicate products (same name + brand + size + unit) into one.
-- Prices that pointed at a duplicate are moved to the product we keep.
-- Sample data is left alone. Run STEP 1 first to preview, then STEP 2.

-- STEP 1 (preview, changes nothing): which products would be removed?
select name, brand, quantity, unit, id,
       row_number() over (partition by name, brand, quantity, unit order by id) as n
from public.products
where coalesce("UPC",'') not like 'SAMPLE-%'
  and (name, brand, quantity, unit) in (
    select name, brand, quantity, unit
    from public.products
    where coalesce("UPC",'') not like 'SAMPLE-%'
    group by name, brand, quantity, unit
    having count(*) > 1)
order by name, brand, quantity, n;
-- Rows with n = 1 are kept; rows with n = 2 are merged into them.

-- STEP 2 (makes the change): select everything below and run it.
create temp table dup_map on commit drop as
select id as dup_id,
       first_value(id) over (partition by name, brand, quantity, unit order by id) as keep_id
from public.products
where coalesce("UPC",'') not like 'SAMPLE-%';

delete from dup_map where dup_id = keep_id;

update public.prices pr
set product_id = m.keep_id
from dup_map m
where pr.product_id = m.dup_id;

delete from public.products p
using dup_map m
where p.id = m.dup_id;
