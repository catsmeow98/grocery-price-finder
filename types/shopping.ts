import type { ShoppingListItem } from "@/lib/database";

export type ProductOption = {
  name: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  regular_price?: number;
  sale_price?: number | null;
  quantity: number;
  unit: string;
  unit_type: string;
  brand: string | null;
  store_id: string | null;
  observed_at?: string | null;
  stores: {
    name: string;
    city: string;
  } | null;
};

export type Preference = "preferred" | "blocked";

/* key = preferenceKey(productName, brand) */
export type PreferenceMap = Record<string, Preference>;

export type PlanMode = "cheapest" | "preferred";

/*
 * Why this product was chosen:
 *   cheapest  - lowest total price
 *   preferred - cheapest among the user's preferred brands
 *   fallback  - preferred mode, but no preferred brand
 *               available, so the cheapest was used
 *   swapped   - the customer picked this product by hand
 */
export type ResultBasis =
  | "cheapest"
  | "preferred"
  | "fallback"
  | "swapped";

export type SkippedItem = {
  item: ShoppingListItem;
  reason: "blocked" | "no_match" | "not_at_stores";
};

export type ShoppingResult = {
  item: ShoppingListItem;
  basis?: ResultBasis;
  product: Product;
  packagesNeeded: number;
  totalPrice: number;
  totalQuantity?: number;
};

export type StoreGroup = {
  storeName: string;
  city: string;
  items: ShoppingResult[];
  total: number;
};

export type ShoppingOption = {
  product: Product;
  packagesNeeded: number;
  totalQuantity: number;
  totalPrice: number;
};

export type RequestedQuantityOption = {
  value: string;
  quantity: number;
  unit: string;
  label: string;
};

export type ShoppingPlan = {
  results: ShoppingResult[];
  skipped: SkippedItem[];
  storeGroups: StoreGroup[];
  total: number;
};