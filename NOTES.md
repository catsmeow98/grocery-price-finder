# NOTES: Grocery Price Finder

Last updated: 2026-11-11

> Read this file first at the start of every session. Update it at the end of every session.
> Goal right now: a **working prototype using sample data** (not Metro Detroit specific).

## Done (verified by reading the code in the repo)
- Next.js 16 + React 19 + TypeScript + Tailwind 4 app, deployed config for Vercel
- Production build errors fixed (commit 315869a)
- Supabase auth: signup, login, logout pages and forms
- Search page (`app/page.tsx`): SearchBar, FilterBar, BrandToggle, ProductCard, SearchResults
- Unit-price math (`lib/priceUtils.ts`): weight to oz, volume to fl oz, count
- Shopping list (`components/shopping-list/`): add, edit quantity, delete, product autocomplete
- Shopping plan (`lib/shoppingUtils.ts`): match items, compute packages needed, pick cheapest, group by store, total
- Secrets: no keys in code. `.env*` is gitignored. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used.

## Real database (confirmed from Supabase 2026-11-11)
- `stores(id uuid, name, city, address, state, zip, created_at)`
- `products(id uuid, name, brand, quantity, unit, unit_type, "UPC", updated_at)`  (no price, no store)
- `prices(id, product_id, store_id, price, sale_price, available, observed_at, source, created_at)`
- `shopping_lists(id, name, user_id, created_at)`, `shopping_list_items(id, shopping_list_id, product_name, quantity, unit, completed, created_at)`
- Row counts before this session: 4 stores, 176 products, 1 price
- RLS before this session: ON for prices/lists/items, OFF for stores and products (fixed by 01_security.sql, not yet run)

## Done this session (code written, NOT yet tested; no node_modules available to build)
- Decision: Option B (products + prices tables). The app now reads prices via `lib/products.ts` (`getProductsWithPrices`): newest price per product+store, skips unavailable, uses sale price when lower
- `app/page.tsx` and `getProductsWithStores()` in `lib/database.ts` use it
- `supabase/01_security.sql`: RLS on, public read of stores/products/prices, per-user lists
- `scripts/make_sample_data.py` generates `supabase/02_sample_data.sql` (44 products, 4 stores, ~239 price rows incl. sales, old prices, missing and out-of-stock items); `supabase/03_remove_sample_data.sql` deletes only sample rows

## Reported but NOT in the repo (exists only on the owner's computer)
- `scripts/import-prices.ts` (CSV importer), `data/grocery_prices.csv`

## In Progress
- Owner click-testing the full flow (search, list, plan, two users)
- Owner to run `supabase/05_merge_duplicate_products.sql` (step 1 preview, then step 2), then `06_prevent_duplicate_products.sql`

## Done 2026-11-11 (later; untested, no build possible in cloud)
- List items must be picked from the dropdown (typing clears the selection); dropdown only suggests products that have prices; planner matches by exact name only
- `proxy.ts` moved to project root so it runs; `/shopping-list` and `/shopping-plan` now redirect to /login when logged out; removed [AUTH] debug log
- Home page shows real "Prices as of <date>"
- README rewritten; added `supabase/04_find_orphan_products.sql`

## Next (in order)
1. Run `supabase/01_security.sql`, then `supabase/02_sample_data.sql` in the Supabase SQL Editor
2. `npm install`, `npm run build`, `npm run dev`; fix any errors
3. Click-test: search, add items to a list (log in first), open shopping plan
4. Add real prices for the 175 catalog products that have none (they are real products: Meijer/Kirkland/etc.). Needs updated CSV importer
5. Verify Vercel production (env vars set, login works)
6. Commit the CSV importer; update it to the products + prices layout
7. Update this file and commit after every working step

## Known issues / risks
- 175 of 176 real catalog products have no prices yet, so they don't show in search or the dropdown. 11 duplicate groups (same name/brand/size) from the importer; merge with 05.
- Catalog data oddities to review: Canned Black Beans S&W 180 oz, Eggs Kirkland 60 ct; units use `ct` and `Count`/`Weight` capitalized (code lowercases, OK).
- Subscriptions/Stripe are out of scope until the prototype works.

## Open questions
Run in Supabase: SQL Editor, New query, paste, Run.

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

select tablename, rowsecurity
from pg_tables
where schemaname = 'public';
```

## Decision log
- 2026-11-10: Dropped the subscription model for now; focus on a working local grocery comparison prototype.
- 2026-11-11: Option B chosen: keep `products` + `prices` tables (supports price history).
- 2026-11-10: Data source for the prototype = generated sample data (tagged `sample`), not real prices.
