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
  /* grocery-list item id -> id of the product the customer chose */
  overrides?: Record<string, string>;
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
  pinned?: ShoppingOption;
  tiers: Tier[];
};

function storeKey(product: Product): string {
  return (
    product.store_id ??
    `${product.stores?.name}-${product.stores?.city}`
  );
}

/**
 * Work out, for every grocery-list item, which products
 * could be used (before deciding on stores).
 *
 * - "cheapest" mode ignores brand preferences.
 * - "preferred" mode removes blocked brands and tries
 *   preferred brands first.
 * - Items the customer swapped are pinned to their choice.
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

    // The customer picked a specific product.
    const overrideId = options.overrides?.[item.id];

    if (overrideId) {
      const chosen = matches.find(
        (product) => product.id === overrideId
      );

      if (chosen) {
        const [pinned] = calculateShoppingOptions(
          [chosen],
          quantity,
          item.unit
        );

        if (pinned) {
          return { item, pinned, tiers: [] };
        }
      }
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

    if (choice.pinned) {
      results.push(
        toResult(choice.item, choice.pinned, "swapped")
      );
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
 * Returns null if the customer's swapped items already
 * sit in more than `maxStores` stores.
 */
function planWithStoreLimit(
  choices: ItemChoice[],
  maxStores: number | null
): ShoppingPlan | null {
  if (maxStores === null) {
    return assemblePlan(evaluateStores(choices, null));
  }

  const pinnedStores = new Set(
    choices
      .filter((choice) => choice.pinned)
      .map((choice) => storeKey(choice.pinned!.product))
  );

  if (pinnedStores.size > maxStores) {
    return null;
  }

  const others = new Set<string>();

  for (const choice of choices) {
    for (const tier of choice.tiers) {
      for (const option of tier.options) {
        const key = storeKey(option.product);

        if (!pinnedStores.has(key)) {
          others.add(key);
        }
      }
    }
  }

  const pickCount = Math.min(
    maxStores - pinnedStores.size,
    others.size
  );

  let best: ShoppingPlan | null = null;
  let bestScore: [number, number, number] | null = null;

  for (const combo of combinations(
    Array.from(others),
    pickCount
  )) {
    const evaluated = evaluateStores(
      choices,
      new Set([...pinnedStores, ...combo])
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

  return best;
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
 * The shopping plan for the given options.
 * (maxStores is honoured when possible; otherwise all stores.)
 */
export function computeShoppingPlan(
  items: ShoppingListItem[],
  products: Product[],
  options: PlanOptions = DEFAULT_OPTIONS
): ShoppingPlan {
  const choices = buildItemChoices(items, products, options);

  return (
    planWithStoreLimit(choices, options.maxStores ?? null) ??
    planWithStoreLimit(choices, null)!
  );
}

/**
 * The same shopping list planned three ways, so the
 * customer can compare: any number of stores, at most 2
 * stores, and 1 store. A limit is null when the customer's
 * swapped items already need more stores than that.
 */
export function computePlanVariants(
  items: ShoppingListItem[],
  products: Product[],
  options: PlanOptions = DEFAULT_OPTIONS,
  limits: number[] = [2, 1]
): {
  any: ShoppingPlan;
  byLimit: Record<number, ShoppingPlan | null>;
} {
  const choices = buildItemChoices(items, products, options);

  const byLimit: Record<number, ShoppingPlan | null> = {};

  for (const limit of limits) {
    byLimit[limit] = planWithStoreLimit(choices, limit);
  }

  return {
    any: planWithStoreLimit(choices, null)!,
    byLimit,
  };
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
