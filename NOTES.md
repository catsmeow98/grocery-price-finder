# NOTES: Grocery Price Finder

Last updated: 2026-11-10

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

## Reported but NOT in the repo (exists only on the owner's computer, never committed)
- `scripts/import-prices.ts` (CSV importer)
- `data/grocery_prices.csv`
- A 1-row import test (ALDI Warren, Friendly Farms 2% milk, 1 gal, $2.99)

## In Progress
- Getting the app to show real rows from sample data end to end

## Next (in order)
1. Confirm the real Supabase schema (run the SQL in "Open questions") and paste the result
2. Decide the schema direction (Option A or B below), then align the app and the importer
3. Commit the importer and CSV to the repo
4. Generate a sample dataset (about 40 products x 6 stores, tagged `source = 'sample'`) and import it
5. Click-test: search, add to list, build shopping plan
6. Verify row-level security (lists private per user; products, stores, prices read-only to the public)
7. Verify the Vercel production site: env vars set, login works, data loads
8. Add a `NOTES.md` update + commit after every working step

## Known issues / risks
- **Schema mismatch (high priority):** the UI reads `products.price` and `products.store_id` (a number) and joins `stores(name, city)`. The reported importer writes UUIDs and a separate `prices` table. Imported prices will not show up until these agree.
- `lib/proxy.ts` is probably not active. Next.js 16 expects `proxy.ts` at the project root (verify, then move).
- "Updated recently" on the home page is hard-coded text, not real data.
- The planner matches products by substring of name (e.g. "milk" also matches "almond milk").
- README is still the default Next.js template.
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
- 2026-11-10: Data source for the prototype = generated sample data (tagged `sample`), not real prices.
