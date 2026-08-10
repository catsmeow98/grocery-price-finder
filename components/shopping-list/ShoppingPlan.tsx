"use client";

import { useEffect, useState } from "react";

import ShoppingPlanStore from "./ShoppingPlanStore";

import {
  getOrCreateShoppingList,
  getShoppingListItems,
  getProductsWithStores,
  type ShoppingListItem,
} from "@/lib/database";

import {
  getShoppingPlanData,
} from "@/lib/shoppingUtils";

import type {
  Product,
  ShoppingPlan,
  ShoppingResult,
  StoreGroup,
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

  const [plan, setPlan] =
    useState<ShoppingPlan | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadPlan() {
      try {
        setLoading(true);
        setError(null);

        /*
         * Get the current shopping list.
         */
        const list =
          await getOrCreateShoppingList();

        /*
         * Get all grocery-list items.
         */
        const listItems =
          await getShoppingListItems(
            list.id
          );

        setItems(listItems);

        /*
         * If the list is empty,
         * clear the shopping plan.
         */
        if (listItems.length === 0) {
          setPlan(null);
          return;
        }

        /*
         * Get all products and stores.
         */
        const products =
          await getProductsWithStores();

        const typedProducts =
          products as Product[];

        /*
         * Build the complete shopping plan.
         *
         * This handles:
         *
         * - product matching
         * - quantity normalization
         * - package calculations
         * - cheapest option
         * - store grouping
         * - total cost
         */
        const shoppingPlan =
          await getShoppingPlanData(
            listItems,
            typedProducts
          );

        setPlan(shoppingPlan);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to create your shopping plan."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, [refreshKey]);

  /*
   * Pull the calculated values
   * out of the shopping plan.
   */
  const results =
    plan?.results ?? [];

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

  return (
    <div className="space-y-8">

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
            />
          ))}

        </div>

      </div>

    </div>
  );
}
