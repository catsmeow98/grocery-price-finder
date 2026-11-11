import type { SupabaseClient } from "@supabase/supabase-js";

import type { Product } from "@/types/shopping";

/*
 * Shape of one row returned by the prices query below.
 * (Supabase returns joined tables as objects.)
 */
type PriceRow = {
  id: string;
  product_id: string;
  store_id: string;
  price: number | string;
  sale_price: number | string | null;
  available: boolean | null;
  observed_at: string | null;
  created_at: string | null;
  products: {
    name: string;
    brand: string | null;
    quantity: number | string;
    unit: string;
    unit_type: string;
  } | null;
  stores: {
    name: string;
    city: string;
  } | null;
};

/*
 * Load every product with its CURRENT price at each store.
 *
 * The prices table keeps history (one row per observation),
 * so we keep only the newest row for each product + store,
 * and drop it if that newest row says "not available".
 *
 * The result is flattened into the Product shape the search
 * page and shopping planner already use:
 *   price = the price a shopper pays today
 *           (the sale price when there is one)
 */
export async function getProductsWithPrices(
  client: SupabaseClient,
  search?: string
): Promise<Product[]> {
  const { data, error } = await client
    .from("prices")
    .select(
      `
      id,
      product_id,
      store_id,
      price,
      sale_price,
      available,
      observed_at,
      created_at,
      products!inner (
        name,
        brand,
        quantity,
        unit,
        unit_type
      ),
      stores (
        name,
        city
      )
    `
    )
    .order("observed_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as PriceRow[];

  const term = search?.trim().toLowerCase();

  // Newest observation per product + store wins.
  // (Rows are already ordered newest first.)
  const latest = new Map<string, PriceRow>();

  for (const row of rows) {
    if (!row.products) continue;

    if (
      term &&
      !row.products.name.toLowerCase().includes(term)
    ) {
      continue;
    }

    const key = `${row.product_id}|${row.store_id}`;

    if (!latest.has(key)) {
      latest.set(key, row);
    }
  }

  const products: Product[] = [];

  for (const row of latest.values()) {
    if (row.available === false) continue;
    if (!row.products) continue;

    const regular = Number(row.price);
    const sale =
      row.sale_price === null
        ? null
        : Number(row.sale_price);

    const onSale =
      sale !== null && sale > 0 && sale < regular;

    products.push({
      id: row.id,
      name: row.products.name,
      brand: row.products.brand,
      quantity: Number(row.products.quantity),
      unit: row.products.unit,
      unit_type: row.products.unit_type,
      price: onSale ? (sale as number) : regular,
      regular_price: regular,
      sale_price: onSale ? sale : null,
      store_id: row.store_id,
      stores: row.stores,
    });
  }

  // Cheapest first (the search page re-sorts by unit price).
  products.sort((a, b) => a.price - b.price);

  return products;
}
