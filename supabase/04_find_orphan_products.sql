-- 04_find_orphan_products.sql
-- Run each query separately (Supabase shows one result at a time). Nothing here deletes data.

-- A) Products that have NO price rows (not counting sample data)
select p.id, p.name, p.brand, p.quantity, p.unit, p.unit_type, p."UPC"
from public.products p
left join public.prices pr on pr.product_id = p.id
where pr.id is null
  and coalesce(p."UPC", '') not like 'SAMPLE-%'
order by p.name;

-- B) Duplicate products (same name + brand + size + unit)
select name, brand, quantity, unit, count(*) as copies
from public.products
where coalesce("UPC", '') not like 'SAMPLE-%'
group by name, brand, quantity, unit
having count(*) > 1
order by copies desc;

-- C) Summary
select
  (select count(*) from public.products where coalesce("UPC", '') not like 'SAMPLE-%') as real_products,
  (select count(*) from public.products p where coalesce(p."UPC", '') not like 'SAMPLE-%'
     and not exists (select 1 from public.prices x where x.product_id = p.id)) as without_prices;
