"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import ShoppingPlanStore from "./ShoppingPlanStore";

import {
  getOrCreateShoppingList,
  getShoppingListItems,
  getProductsWithStores,
  type ShoppingListItem,
} from "@/lib/database";

import {
  computePlanVariants,
  getSwapAlternatives,
} from "@/lib/shoppingUtils";
import {
  getPreferenceRows,
  toPreferenceMap,
} from "@/lib/preferences";

import type {
  ShoppingPlan as ShoppingPlanData,
  PlanMode,
  PreferenceMap,
  Product,
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

  /*
   * null = the customer has not chosen yet,
   * so we ask them first.
   */
  const [prefsWarning, setPrefsWarning] =
    useState(false);

  /*
   * Products the customer swapped by hand:
   * grocery-list item id -> chosen product id.
   * (Kept for this visit only.)
   */
  const [overrides, setOverrides] = useState<
    Record<string, string>
  >({});

  /*
   * How many stores the customer is willing to visit.
   * null = any number of stores.
   */
  const [maxStores, setMaxStores] = useState<
    1 | 2 | null
  >(null);

  const [mode, setMode] =
    useState<PlanMode | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

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
   * The same list planned for any number of stores,
   * for at most 2 stores, and for 1 store.
   */
  const variants = useMemo(
    () =>
      mode && items.length > 0
        ? computePlanVariants(items, products, {
            mode,
            preferences,
            overrides,
          })
        : null,
    [items, products, preferences, mode, overrides]
  );

  const requestedPlan: ShoppingPlanData | null =
    variants
      ? maxStores === null
        ? variants.any
        : variants.byLimit[maxStores]
      : null;

  // The chosen limit may be impossible (swapped items
  // already sit in more stores than allowed).
  const limitUnavailable =
    maxStores !== null &&
    variants !== null &&
    requestedPlan === null;

  const plan = requestedPlan ?? variants?.any ?? null;

  function handleSwap(
    itemId: string,
    productId: string
  ) {
    setOverrides((current) => ({
      ...current,
      [itemId]: productId,
    }));
  }

  function handleResetSwap(itemId: string) {
    setOverrides((current) => {
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

  /*
   * Pull the calculated values
   * out of the shopping plan.
   */
  const results =
    plan?.results ?? [];

  const skipped =
    plan?.skipped ?? [];

  const storeGroups =
    plan?.storeGroups ?? [];

  const total =
    plan?.total ?? 0;

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">
          Finding the best prices...
        </p>
      </div>
    );
  }

  /*
   * Error state.
   */
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="text-sm text-red-400">
          {error}
        </p>
      </div>
    );
  }

  /*
   * Empty list.
   */
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">
          Your grocery list is empty.
        </p>
      </div>
    );
  }

  const warning = prefsWarning ? (
    <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      Your brand preferences could not be loaded, so
      blocked and preferred brands are NOT applied to
      this plan.
    </p>
  ) : null;

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
              onClick={() => setMode(value)}
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

          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                [null, "Any number of stores", variants.any],
                [2, "Up to 2 stores", variants.byLimit[2]],
                [1, "1 store only", variants.byLimit[1]],
              ] as const
            ).map(([limit, label, option]) => {
              const selected =
                !limitUnavailable && maxStores === limit;

              const missing = option
                ? option.skipped.filter(
                    (entry) =>
                      entry.reason === "not_at_stores"
                  ).length
                : 0;

              const difference = option
                ? option.total - variants.any.total
                : 0;

              return (
                <button
                  key={String(limit)}
                  type="button"
                  disabled={!option}
                  aria-pressed={selected}
                  onClick={() => setMaxStores(limit)}
                  className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface hover:bg-surface-hover"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">
                    {label}
                  </p>

                  {option ? (
                    <>
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
                          {Math.abs(difference).toFixed(2)}{" "}
                          vs any number of stores
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-text-muted">
                      Your swapped items are in more stores
                      than this.
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {limitUnavailable && (
            <p className="mt-2 text-xs text-text-muted">
              That store limit isn&apos;t possible with
              your swapped items, so we&apos;re showing
              any number of stores.
            </p>
          )}
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
