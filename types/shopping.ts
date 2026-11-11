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

export type ShoppingResult = {
  item: ShoppingListItem;
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
  storeGroups: StoreGroup[];
  total: number;
};