-- 06_prevent_duplicate_products.sql
-- Run AFTER 05 succeeds. Stops the same product (name + brand + size + unit)
-- from being created twice, so imports can't create duplicates again.
create unique index if not exists products_unique_item
on public.products (lower(name), lower(coalesce(brand, '')), quantity, lower(unit));
