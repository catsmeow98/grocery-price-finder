"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";

import ShoppingPlanStore from "./ShoppingPlanStore";

import {
  getOrCreateShoppingList,
  getShoppingListItems,
  getProductsWithStores,
  type ShoppingListItem,
} from "@/lib/database";

import {
  applySwaps,
  computePlanVariants,
  getSwapAlternatives,
  swapKey,
} from "@/lib/shoppingUtils";

import {
  getPreferenceRows,
  toPreferenceMap,
} from "@/lib/preferences";

import {
  parsePlanSettings,
  savePlanSettings,
} from "@/lib/planSettings";

import type {
  PlanMode,
  PreferenceMap,
  Product,
  ShoppingResult,
} from "@/types/shopping";

type ShoppingPlanProps = {
  refreshKey: number;
};

export default function ShoppingPlan({
  refreshKey,
}: ShoppingPlanProps) {
  const [items, setItems] = useState<
    ShoppingListItem[]
  >([]);

  const [products, setProducts] = useState<
    Product[]
  >([]);

  const [preferences, setPreferences] =
    useState<PreferenceMap>({});

  const [listId, setListId] = useState<
    string | null
  >(null);

  /*
   * Plan choices. These are saved with the list, so a page
   * reload (or another device) shows the same plan.
   *
   * mode: null = the customer has not chosen yet, so we ask.
   * maxStores: the automatic plan used as the starting point
   *            (null = any number of stores).
   * swaps: grocery-list item id -> swapKey of the product
   *        the customer picked by hand.
   */
  const [mode, setMode] =
    useState<PlanMode | null>(null);

  const [maxStores, setMaxStores] = useState<
    1 | 2 | null
  >(null);

  const [swaps, setSwaps] = useState<
    Record<string, string>
  >({});

  const [settingsReady, setSettingsReady] =
    useState(false);

  const [saveProblem, setSaveProblem] =
    useState(false);

  const hydratedRef = useRef(false);
  const lastSavedRef = useRef("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [prefsWarning, setPrefsWarning] =
    useState(false);

  useEffect(() => {
    async function loadPlanData() {
      try {
        setLoading(true);
        setError(null);

        const list =
          await getOrCreateShoppingList();

        const listItems =
          await getShoppingListItems(list.id);

        setItems(listItems);
        setListId(list.id);

        /*
         * Restore the saved plan choices the first time only.
         * (Adding an item later must not reset them.)
         */
        if (!hydratedRef.current) {
          const saved = parsePlanSettings(
            (list as { plan_settings?: unknown })
              .plan_settings
          );

          hydratedRef.current = true;
          lastSavedRef.current =
            JSON.stringify(saved);

          setMode(saved.mode);
          setMaxStores(saved.maxStores);
          setSwaps(saved.swaps);
          setSettingsReady(true);
        }

        if (listItems.length === 0) {
          return;
        }

        const loadedProducts =
          await getProductsWithStores();

        setProducts(loadedProducts as Product[]);

        /*
         * Preferences are optional: if they can't be
         * loaded, the plan still works without them.
         */
        try {
          setPrefsWarning(false);

          setPreferences(
            toPreferenceMap(
              await getPreferenceRows()
            )
          );
        } catch (prefError) {
          console.error(
            "Unable to load preferences:",
            prefError
          );

          setPreferences({});
          setPrefsWarning(true);
        }
      } catch (err) {
        console.error(err);

        setError(
          "Unable to create your shopping plan."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlanData();
  }, [refreshKey]);

  /*
   * Save the plan choices shortly after they change.
   * Swaps for items that were removed from the list are dropped.
   */
  useEffect(() => {
    if (!settingsReady || !listId) return;

    const liveIds = new Set(
      items.map((item) => item.id)
    );

    const payload = {
      mode,
      maxStores,
      swaps: Object.fromEntries(
        Object.entries(swaps).filter(([id]) =>
          liveIds.has(id)
        )
      ),
    };

    const json = JSON.stringify(payload);

    if (json === lastSavedRef.current) return;

    const timer = setTimeout(async () => {
      try {
        await savePlanSettings(listId, payload);

        lastSavedRef.current = json;
        setSaveProblem(false);
      } catch (err) {
        console.error(
          "Unable to save plan choices:",
          err
        );

        setSaveProblem(true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    settingsReady,
    listId,
    items,
    mode,
    maxStores,
    swaps,
  ]);

  /*
   * The automatic plans: any number of stores, at most 2
   * stores, and 1 store. They ignore swaps, so they stay
   * comparable.
   */
  const variants = useMemo(
    () =>
      mode && items.length > 0
        ? computePlanVariants(items, products, {
            mode,
            preferences,
          })
        : null,
    [items, products, preferences, mode]
  );

  /*
   * The automatic plan the customer started from.
   * Swaps are applied on top of it.
   */
  const baseline = variants
    ? maxStores === null
      ? variants.any
      : variants.byLimit[maxStores]
    : null;

  const plan = useMemo(
    () =>
      baseline
        ? applySwaps(items, products, baseline, swaps)
        : null,
    [baseline, items, products, swaps]
  );

  const isCustom = Boolean(
    plan?.results.some(
      (result) => result.basis === "swapped"
    )
  );

  /* What each item would be without swaps (for "vs default"). */
  const defaults = useMemo(() => {
    const map: Record<string, ShoppingResult> = {};

    for (const result of baseline?.results ?? []) {
      map[result.item.id] = result;
    }

    return map;
  }, [baseline]);

  function chooseStoreLimit(limit: 1 | 2 | null) {
    // Choosing an automatic plan replaces any swaps.
    setSwaps({});
    setMaxStores(limit);
  }

  function handleSwap(itemId: string, key: string) {
    const automatic = defaults[itemId];

    setSwaps((current) => {
      const next = { ...current };

      // Swapping back to the default product = no swap.
      if (
        automatic &&
        swapKey(automatic.product) === key
      ) {
        delete next[itemId];
      } else {
        next[itemId] = key;
      }

      return next;
    });
  }

  function handleResetSwap(itemId: string) {
    setSwaps((current) => {
      const next = { ...current };

      delete next[itemId];

      return next;
    });
  }

  const getAlternatives = (item: ShoppingListItem) =>
    getSwapAlternatives(item, products);

  const preferredCount = Object.values(
    preferences
  ).filter((value) => value === "preferred").length;

  const blockedCount = Object.values(
    preferences
  ).filter((value) => value === "blocked").length;

  const results = plan?.results ?? [];
  const skipped = plan?.skipped ?? [];
  const storeGroups = plan?.storeGroups ?? [];
  const total = plan?.total ?? 0;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">
          Finding the best prices...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="text-sm text-red-400">
          {error}
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">
          Your grocery list is empty.
        </p>
      </div>
    );
  }

  const warning = (
    <>
      {prefsWarning && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Your brand preferences could not be loaded, so
          blocked and preferred brands are NOT applied to
          this plan.
        </p>
      )}

      {saveProblem && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Your plan choices could not be saved, so a
          reload will lose them.
        </p>
      )}
    </>
  );

  /*
   * Ask how to build the plan before showing it.
   */
  if (mode === null) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        {warning}

        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Build your shopping plan
        </p>

        <h2 className="mt-2 text-2xl font-bold text-foreground">
          How should we choose products?
        </h2>


        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("cheapest")}
            className="rounded-2xl border border-border bg-background/40 p-5 text-left transition hover:border-primary/40 hover:bg-surface-hover"
          >
            <p className="text-lg font-semibold text-foreground">
              Cheapest
            </p>

            <p className="mt-1 text-sm text-text-muted">
              The lowest total price, whatever the
              brand. Ignores your brand preferences.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode("preferred")}
            className="rounded-2xl border border-border bg-background/40 p-5 text-left transition hover:border-accent/40 hover:bg-surface-hover"
          >
            <p className="text-lg font-semibold text-foreground">
              My preferred brands
            </p>

            <p className="mt-1 text-sm text-text-muted">
              Uses your preferred brands when
              available (otherwise the cheapest) and
              never uses brands you blocked.
            </p>
          </button>
        </div>

        <p className="mt-4 text-xs text-text-muted">
          You have {preferredCount} preferred and{" "}
          {blockedCount} blocked{" "}
          {preferredCount + blockedCount === 1
            ? "brand"
            : "brands"}
          .{" "}
          <Link
            href="/preferences"
            className="text-primary underline"
          >
            Manage preferences
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {warning}

      {/* Plan type */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-text-muted">
          Plan type
        </span>

        <div className="inline-flex rounded-xl border border-border bg-surface p-1">
          {(
            [
              ["cheapest", "Cheapest"],
              ["preferred", "Preferred brands"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => {
                // A different plan type starts fresh.
                setSwaps({});
                setMode(value);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                mode === value
                  ? "bg-primary text-background"
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <Link
          href="/preferences"
          className="text-sm text-text-muted underline hover:text-foreground"
        >
          Manage preferences
        </Link>
      </div>

      {/* Store limit */}
      {variants && (
        <div>
          <p className="mb-2 text-sm text-text-muted">
            How many stores do you want to visit?
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                [null, "Any number of stores", variants.any],
                [2, "Up to 2 stores", variants.byLimit[2]],
                [1, "1 store only", variants.byLimit[1]],
              ] as const
            ).map(([limit, label, option]) => {
              const selected =
                !isCustom && maxStores === limit;

              const missing = option.skipped.filter(
                (entry) =>
                  entry.reason === "not_at_stores"
              ).length;

              const difference =
                option.total - variants.any.total;

              return (
                <button
                  key={String(limit)}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => chooseStoreLimit(limit)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface hover:bg-surface-hover"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">
                    {label}
                  </p>

                  <p className="mt-1 text-xl font-bold text-foreground">
                    ${option.total.toFixed(2)}
                  </p>

                  <p className="text-xs text-text-muted">
                    {option.storeGroups
                      .map((group) => group.storeName)
                      .join(" + ") || "No stores"}
                  </p>

                  {missing > 0 ? (
                    <p className="mt-1 text-xs text-red-400">
                      {missing}{" "}
                      {missing === 1 ? "item is" : "items are"}{" "}
                      not sold there
                    </p>
                  ) : limit !== null &&
                    Math.abs(difference) >= 0.005 ? (
                    <p className="mt-1 text-xs text-text-muted">
                      {difference > 0 ? "+" : "-"}$
                      {Math.abs(difference).toFixed(2)} vs
                      any number of stores
                    </p>
                  ) : null}
                </button>
              );
            })}

            {isCustom && (
              <div
                aria-current="true"
                className="rounded-2xl border border-primary bg-primary/10 p-4"
              >
                <p className="text-sm font-medium text-foreground">
                  Custom
                </p>

                <p className="mt-1 text-xl font-bold text-foreground">
                  ${total.toFixed(2)}
                </p>

                <p className="text-xs text-text-muted">
                  {storeGroups
                    .map((group) => group.storeName)
                    .join(" + ") || "No stores"}
                </p>

                <button
                  type="button"
                  onClick={() => setSwaps({})}
                  className="mt-2 text-xs text-text-secondary underline hover:text-foreground"
                >
                  Reset all swaps
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-2xl border border-border bg-surface p-6">

        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Your Shopping Plan
        </p>

        <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">

          <div>
            <p className="text-3xl font-bold text-foreground">
              ${total.toFixed(2)}
            </p>

            <p className="text-sm text-text-muted">
              estimated total
            </p>
          </div>

          <div>
            <p className="text-2xl font-semibold text-foreground">
              {results.length}
            </p>

            <p className="text-sm text-text-muted">
              of {items.length} items matched
            </p>
          </div>

          <div>
            <p className="text-2xl font-semibold text-foreground">
              {storeGroups.length}
            </p>

            <p className="text-sm text-text-muted">
              {storeGroups.length === 1
                ? "store"
                : "stores"}
            </p>
          </div>

        </div>
      </div>

      {/* Store breakdown */}
      <div>

        <h2 className="mb-4 text-2xl font-bold text-foreground">
          Where to shop
        </h2>

        <div className="space-y-4">

          {storeGroups.map((store) => (
            <ShoppingPlanStore
              key={`${store.storeName}-${store.city}`}
              store={store}
              preferences={preferences}
              defaults={defaults}
              getAlternatives={getAlternatives}
              onSwap={handleSwap}
              onResetSwap={handleResetSwap}
            />
          ))}

        </div>

      </div>

      {/* Items that could not be planned */}
      {skipped.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Not included
          </h3>

          <ul className="mt-3 space-y-2">
            {skipped.map(({ item, reason }) => (
              <li
                key={item.id}
                className="text-sm text-text-muted"
              >
                <span className="font-medium text-foreground">
                  {item.product_name}
                </span>
                {reason === "blocked"
                  ? " — every brand of this item is blocked in your preferences."
                  : reason === "not_at_stores"
                    ? " — not sold at the store(s) in this plan."
                    : " — no matching prices found."}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
