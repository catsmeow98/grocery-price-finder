# Grocery Price Finder

Compare grocery prices across stores, build a shopping list, and get the cheapest shopping plan.

Stack: Next.js 16, React 19, TypeScript, Tailwind 4, Supabase (Postgres + Auth), Vercel.

## Run locally

1. `npm install`
2. Create `.env.local` in this folder:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. `npm run dev` then open http://localhost:3000

## Database setup (Supabase SQL Editor)

1. `supabase/01_security.sql` - row-level security
2. `supabase/02_sample_data.sql` - sample stores, products, prices (remove later with `03_remove_sample_data.sql`)
3. `supabase/04_find_orphan_products.sql` - find products with no prices

Project status and next steps: see `NOTES.md`.
