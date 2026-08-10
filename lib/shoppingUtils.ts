import {
  getBestPackageCombination,
} from "@/lib/priceUtils";

import type {
  Product,
  ShoppingOption,
  ShoppingResult,
  StoreGroup,
} from "@/types/shopping";

import type { ShoppingListItem } from "@/lib/database";

/**
 * Find products that match a grocery-list item.
 *
 * Example:
 *
 * "beef"
 *
 * can match:
 * - Ground Beef 80/20
 * - Beef Brisket
 * - Beef Chuck Roast
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

  return products.filter(
    (product) =>
      product.name
        .toLowerCase()
        .includes(searchTerm)
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

/**
 * Build the complete shopping plan.
 *
 * For every grocery-list item:
 *
 * 1. Find matching products
 * 2. Calculate quantity-aware options
 * 3. Select the cheapest option
 * 4. Return the recommended product
 */
export function buildShoppingResults(
  items: ShoppingListItem[],
  products: Product[]
): ShoppingResult[] {
  const results: ShoppingResult[] = [];

  for (const item of items) {
    const matches =
      findProductMatches(
        products,
        item.product_name
      );

    if (matches.length === 0) {
      continue;
    }

    const options =
      calculateShoppingOptions(
        matches,
        Number(item.quantity),
        item.unit
      );

    if (options.length === 0) {
      continue;
    }

    const cheapest =
      findCheapestOption(options);

    if (!cheapest) {
      continue;
    }

    results.push({
      item,
      product: cheapest.product,
      packagesNeeded:
        cheapest.packagesNeeded,
      totalQuantity:
        cheapest.totalQuantity,
      totalPrice:
        cheapest.totalPrice,
    });
  }

  return results;
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

export async function getShoppingPlanData(
  items: ShoppingListItem[],
  products: Product[]
) {
  const results =
    buildShoppingResults(
      items,
      products
    );

  const storeGroups =
    groupResultsByStore(
      results
    );

  const total =
    calculateShoppingTotal(
      storeGroups
    );

  return {
    results,
    storeGroups,
    total,
  };
}