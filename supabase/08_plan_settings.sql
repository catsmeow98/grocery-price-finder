-- 08_plan_settings.sql
-- Run once in Supabase SQL Editor. Safe to re-run.
-- Saves each list's plan choices (plan type, store limit, product swaps)
-- so they survive a page reload and show up on your other devices.

alter table public.shopping_lists
  add column if not exists plan_settings jsonb not null default '{}'::jsonb;
