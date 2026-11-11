-- 03_remove_sample_data.sql
-- Deletes ONLY the sample rows created by 02_sample_data.sql.
delete from public.prices   where source = 'sample';
delete from public.products where "UPC" like 'SAMPLE-%';
delete from public.stores   where name like 'Sample %';
