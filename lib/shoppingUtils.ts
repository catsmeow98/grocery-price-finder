import {
  getBestPackageCombination,
} from "@/lib/priceUtils";

import { getPreference } from "@/lib/preferenceUtils";

import type {
  PlanMode,
  PreferenceMap,
  Product,
  ResultBasis,
  ShoppingOption,
  ShoppingPlan,
  ShoppingResult,
  SkippedItem,
  StoreGroup,
} from "@/types/shopping";

import type { ShoppingListItem } from "@/lib/database";

/**
 * Find the products that match a grocery-list item.
 *
 * Match is by exact product name (case-insensitive).
 * Items are chosen from the dropdown, so names always
 * match what is in the database.
 */
export function findProductMatches(
  products: Product[],
  productName: string
): Product[] {
  const searchTerm =
    productName
      .toLowerCase()
      .trim();

  if (!searchTerm) {
    return [];
  }

  /*
   * Items are always picked from the dropdown, so the name
   * must match a product name exactly ("Milk" never matches
   * "Almond Milk").
   */
  return products.filter(
    (product) =>
      product.name.toLowerCase().trim() ===
      searchTerm
  );
}

/**
 * Calculate every valid way a product can
 * satisfy the requested grocery quantity.
 *
 * Example:
 *
 * User wants:
 * 3 lb chicken
 *
 * Product:
 * 1 lb @ $5.99
 *
 * Result:
 * 3 packages
 * $17.97 total
 */
export function calculateShoppingOptions(
  products: Product[],
  requestedQuantity: number,
  requestedUnit: string
): ShoppingOption[] {
  return products
    .map((product) => {
      const combination =
        getBestPackageCombination({
          requestedQuantity,
          requestedUnit,

          productQuantity:
            Number(
              product.quantity
            ),

          productUnit:
            product.unit,

          unitType:
            product.unit_type,

          price:
            Number(product.price),
        });

      if (!combination) {
        return null;
      }

      return {
        product,

        packagesNeeded:
          combination.packagesNeeded,

        totalQuantity:
          combination.totalQuantity,

        totalPrice:
          combination.totalPrice,
      };
    })
    .filter(
      (
        option
      ): option is ShoppingOption =>
        option !== null
    );
}

/**
 * Find the cheapest product/package
 * combination.
 *
 * This compares the actual total cost
 * required to satisfy the requested
 * quantity — NOT the price of one package.
 */
export function findCheapestOption(
  options: ShoppingOption[]
): ShoppingOption | null {
  if (options.length === 0) {
    return null;
  }

  return [...options].sort(
    (a, b) =>
      a.totalPrice -
      b.totalPrice
  )[0];
}

export type PlanOptions = {
  mode: PlanMode;
  preferences: PreferenceMap;
};

/**
 * Build the shopping results.
 *
 * For every grocery-list item:
 *
 * 1. Find matching products
 * 2. "cheapest" mode: ignore all brand preferences and
 *    pick the lowest price
 * 3. "preferred" mode: remove blocked brands, then keep
 *    only preferred brands when any are available;
 *    otherwise fall back to the cheapest allowed option
 * 4. Pick the cheapest of what is left
 */
export function buildShoppingResults(
  items: ShoppingListItem[],
  products: Product[],
  options: PlanOptions = {
    mode: "cheapest",
    preferences: {},
  }
): {
  results: ShoppingResult[];
  skipped: SkippedItem[];
} {
  const results: ShoppingResult[] = [];
  const skipped: SkippedItem[] = [];

  const prefOf = (product: Product) =>
    getPreference(
      options.preferences,
      product.name,
      product.brand
    );

  for (const item of items) {
    const matches = findProductMatches(
      products,
      item.product_name
    );

    if (matches.length === 0) {
      skipped.push({ item, reason: "no_match" });
      continue;
    }

    // Blocked brands only matter in "preferred" mode.
    const allowed =
      options.mode === "preferred"
        ? matches.filter(
            (product) => prefOf(product) !== "blocked"
          )
        : matches;

    if (allowed.length === 0) {
      skipped.push({ item, reason: "blocked" });
      continue;
    }

    let candidates = allowed;
    let basis: ResultBasis = "cheapest";

    if (options.mode === "preferred") {
      const preferred = allowed.filter(
        (product) => prefOf(product) === "preferred"
      );

      if (preferred.length > 0) {
        candidates = preferred;
        basis = "preferred";
      } else {
        basis = "fallback";
      }
    }

    const shoppingOptions =
      calculateShoppingOptions(
        candidates,
        Number(item.quantity),
        item.unit
      );

    const cheapest =
      findCheapestOption(shoppingOptions);

    if (!cheapest) {
      skipped.push({ item, reason: "no_match" });
      continue;
    }

    results.push({
      item,
      basis,
      product: cheapest.product,
      packagesNeeded: cheapest.packagesNeeded,
      totalQuantity: cheapest.totalQuantity,
      totalPrice: cheapest.totalPrice,
    });
  }

  return { results, skipped };
}

/**
 * Group shopping results by store.
 */
export function groupResultsByStore(
  results: ShoppingResult[]
): StoreGroup[] {
  const groups =
    new Map<string, StoreGroup>();

  for (const result of results) {
    const store =
      result.product.stores;

    if (!store) {
      continue;
    }

    const key =
      `${store.name}-${store.city}`;

    if (!groups.has(key)) {
      groups.set(key, {
        storeName: store.name,
        city: store.city,
        items: [],
        total: 0,
      });
    }

    const group =
      groups.get(key)!;

    group.items.push(result);

    group.total +=
      result.totalPrice;
  }

  return Array.from(
    groups.values()
  );
}

/**
 * Calculate the total cost of the
 * complete shopping plan.
 */
export function calculateShoppingTotal(
  storeGroups: StoreGroup[]
): number {
  return storeGroups.reduce(
    (total, store) =>
      total + store.total,
    0
  );
}

export function computeShoppingPlan(
  items: ShoppingListItem[],
  products: Product[],
  options?: PlanOptions
): ShoppingPlan {
  const { results, skipped } = buildShoppingResults(
    items,
    products,
    options
  );

  const storeGroups = groupResultsByStore(results);

  return {
    results,
    skipped,
    storeGroups,
    total: calculateShoppingTotal(storeGroups),
  };
}

export async function getShoppingPlanData(
  items: ShoppingListItem[],
  products: Product[],
  options?: PlanOptions
) {
  return computeShoppingPlan(items, products, options);
}
