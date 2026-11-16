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
  /* null / undefined = shop at as many stores as needed */
  maxStores?: number | null;
};

/*
 * One list item and the products it could be bought as.
 *
 * tiers are tried in order. In "preferred" mode the first
 * tier holds the preferred brands and the second holds
 * every allowed brand. In "cheapest" mode there is one tier.
 */
type Tier = {
  basis: ResultBasis;
  options: ShoppingOption[];
};

type ItemChoice = {
  item: ShoppingListItem;
  skip?: "blocked" | "no_match";
  tiers: Tier[];
};

function storeKey(product: Product): string {
  return (
    product.store_id ??
    `${product.stores?.name}-${product.stores?.city}`
  );
}

/**
 * Identifies one product at one store. Unlike the price-row
 * id, it stays the same when prices are refreshed, so saved
 * swaps keep working.
 */
export function swapKey(product: Product): string {
  return `${product.product_id ?? product.id}|${
    product.store_id ?? ""
  }`;
}

/**
 * Work out, for every grocery-list item, which products
 * could be used (before deciding on stores).
 *
 * - "cheapest" mode ignores brand preferences.
 * - "preferred" mode removes blocked brands and tries
 *   preferred brands first.
 */
function buildItemChoices(
  items: ShoppingListItem[],
  products: Product[],
  options: PlanOptions
): ItemChoice[] {
  const prefOf = (product: Product) =>
    getPreference(
      options.preferences,
      product.name,
      product.brand
    );

  return items.map((item): ItemChoice => {
    const quantity = Number(item.quantity);

    const matches = findProductMatches(
      products,
      item.product_name
    );

    if (matches.length === 0) {
      return { item, skip: "no_match", tiers: [] };
    }

    const allowed =
      options.mode === "preferred"
        ? matches.filter(
            (product) => prefOf(product) !== "blocked"
          )
        : matches;

    if (allowed.length === 0) {
      return { item, skip: "blocked", tiers: [] };
    }

    const tiers: Tier[] = [];

    if (options.mode === "preferred") {
      tiers.push({
        basis: "preferred",
        options: calculateShoppingOptions(
          allowed.filter(
            (product) => prefOf(product) === "preferred"
          ),
          quantity,
          item.unit
        ),
      });

      tiers.push({
        basis: "fallback",
        options: calculateShoppingOptions(
          allowed,
          quantity,
          item.unit
        ),
      });
    } else {
      tiers.push({
        basis: "cheapest",
        options: calculateShoppingOptions(
          allowed,
          quantity,
          item.unit
        ),
      });
    }

    const usable = tiers.filter(
      (tier) => tier.options.length > 0
    );

    if (usable.length === 0) {
      return { item, skip: "no_match", tiers: [] };
    }

    return { item, tiers: usable };
  });
}

function toResult(
  item: ShoppingListItem,
  option: ShoppingOption,
  basis: ResultBasis
): ShoppingResult {
  return {
    item,
    basis,
    product: option.product,
    packagesNeeded: option.packagesNeeded,
    totalQuantity: option.totalQuantity,
    totalPrice: option.totalPrice,
  };
}

/*
 * Buy every item as cheaply as possible, but only from the
 * given stores (null = any store). Items that none of those
 * stores carry are reported as "not_at_stores".
 */
function evaluateStores(
  choices: ItemChoice[],
  stores: Set<string> | null
): { results: ShoppingResult[]; skipped: SkippedItem[] } {
  const results: ShoppingResult[] = [];
  const skipped: SkippedItem[] = [];

  for (const choice of choices) {
    if (choice.skip) {
      skipped.push({
        item: choice.item,
        reason: choice.skip,
      });
      continue;
    }

    let chosen: ShoppingResult | null = null;

    for (const tier of choice.tiers) {
      const pool = stores
        ? tier.options.filter((option) =>
            stores.has(storeKey(option.product))
          )
        : tier.options;

      const best = findCheapestOption(pool);

      if (best) {
        chosen = toResult(choice.item, best, tier.basis);
        break;
      }
    }

    if (chosen) {
      results.push(chosen);
    } else {
      skipped.push({
        item: choice.item,
        reason: "not_at_stores",
      });
    }
  }

  return { results, skipped };
}

function assemblePlan(evaluated: {
  results: ShoppingResult[];
  skipped: SkippedItem[];
}): ShoppingPlan {
  const storeGroups = groupResultsByStore(
    evaluated.results
  );

  return {
    results: evaluated.results,
    skipped: evaluated.skipped,
    storeGroups,
    total: calculateShoppingTotal(storeGroups),
  };
}

function* combinations<T>(
  values: T[],
  size: number,
  start = 0,
  current: T[] = []
): Generator<T[]> {
  if (current.length === size) {
    yield [...current];
    return;
  }

  for (let i = start; i < values.length; i++) {
    current.push(values[i]);
    yield* combinations(values, size, i + 1, current);
    current.pop();
  }
}

/*
 * The best plan that uses at most `maxStores` stores.
 *
 * "Best" = fewest items that cannot be bought, then the
 * lowest total, then the fewest stores actually visited.
 */
function planWithStoreLimit(
  choices: ItemChoice[],
  maxStores: number | null
): ShoppingPlan {
  if (maxStores === null) {
    return assemblePlan(evaluateStores(choices, null));
  }

  const stores = new Set<string>();

  for (const choice of choices) {
    for (const tier of choice.tiers) {
      for (const option of tier.options) {
        stores.add(storeKey(option.product));
      }
    }
  }

  const pickCount = Math.min(maxStores, stores.size);

  let best: ShoppingPlan | null = null;
  let bestScore: [number, number, number] | null = null;

  for (const combo of combinations(
    Array.from(stores),
    pickCount
  )) {
    const evaluated = evaluateStores(
      choices,
      new Set(combo)
    );

    const plan = assemblePlan(evaluated);

    const missing = evaluated.skipped.filter(
      (entry) => entry.reason === "not_at_stores"
    ).length;

    const score: [number, number, number] = [
      missing,
      plan.total,
      plan.storeGroups.length,
    ];

    const better =
      bestScore === null ||
      score[0] < bestScore[0] ||
      (score[0] === bestScore[0] &&
        (score[1] < bestScore[1] - 1e-9 ||
          (Math.abs(score[1] - bestScore[1]) <= 1e-9 &&
            score[2] < bestScore[2])));

    if (better) {
      best = plan;
      bestScore = score;
    }
  }

  return best as ShoppingPlan;
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

const DEFAULT_OPTIONS: PlanOptions = {
  mode: "cheapest",
  preferences: {},
};

/**
 * The automatic shopping plan for the given options.
 */
export function computeShoppingPlan(
  items: ShoppingListItem[],
  products: Product[],
  options: PlanOptions = DEFAULT_OPTIONS
): ShoppingPlan {
  return planWithStoreLimit(
    buildItemChoices(items, products, options),
    options.maxStores ?? null
  );
}

/**
 * The same shopping list planned three ways, so the
 * customer can compare: any number of stores, at most 2
 * stores, and 1 store.
 */
export function computePlanVariants(
  items: ShoppingListItem[],
  products: Product[],
  options: PlanOptions = DEFAULT_OPTIONS,
  limits: number[] = [2, 1]
): {
  any: ShoppingPlan;
  byLimit: Record<number, ShoppingPlan>;
} {
  const choices = buildItemChoices(items, products, options);

  const byLimit: Record<number, ShoppingPlan> = {};

  for (const limit of limits) {
    byLimit[limit] = planWithStoreLimit(choices, limit);
  }

  return {
    any: planWithStoreLimit(choices, null),
    byLimit,
  };
}

/**
 * Put the customer's swaps on top of an automatic plan.
 * Only the swapped items change; every other item keeps the
 * choice it had in the plan.
 *
 * swaps: grocery-list item id -> swapKey(product)
 */
export function applySwaps(
  items: ShoppingListItem[],
  products: Product[],
  plan: ShoppingPlan,
  swaps: Record<string, string>
): ShoppingPlan {
  const planned = new Map(
    plan.results.map((result) => [result.item.id, result])
  );

  const skippedBy = new Map(
    plan.skipped.map((entry) => [entry.item.id, entry])
  );

  const results: ShoppingResult[] = [];
  const skipped: SkippedItem[] = [];

  for (const item of items) {
    const wanted = swaps[item.id];

    if (wanted) {
      const chosen = findProductMatches(
        products,
        item.product_name
      ).find((product) => swapKey(product) === wanted);

      if (chosen) {
        const [option] = calculateShoppingOptions(
          [chosen],
          Number(item.quantity),
          item.unit
        );

        if (option) {
          results.push(toResult(item, option, "swapped"));
          continue;
        }
      }
    }

    const result = planned.get(item.id);

    if (result) {
      results.push(result);
      continue;
    }

    const entry = skippedBy.get(item.id);

    if (entry) {
      skipped.push(entry);
    }
  }

  return assemblePlan({ results, skipped });
}

/**
 * Every product (any brand, any store) that could replace
 * the product chosen for a list item, cheapest first.
 */
export function getSwapAlternatives(
  item: ShoppingListItem,
  products: Product[]
): ShoppingOption[] {
  return calculateShoppingOptions(
    findProductMatches(products, item.product_name),
    Number(item.quantity),
    item.unit
  ).sort((a, b) => a.totalPrice - b.totalPrice);
}

export async function getShoppingPlanData(
  items: ShoppingListItem[],
  products: Product[],
  options?: PlanOptions
) {
  return computeShoppingPlan(items, products, options);
}
