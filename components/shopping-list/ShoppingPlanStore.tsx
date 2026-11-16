"use client";

import type {
  PreferenceMap,
  ShoppingOption,
  ShoppingResult,
  StoreGroup,
} from "@/types/shopping";

import type { ShoppingListItem } from "@/lib/database";

import ShoppingPlanItem from "./ShoppingPlanItem";

type ShoppingPlanStoreProps = {
  store: StoreGroup;
  preferences: PreferenceMap;
  /* what each item would be without swaps */
  defaults: Record<string, ShoppingResult>;
  getAlternatives: (
    item: ShoppingListItem
  ) => ShoppingOption[];
  onSwap: (itemId: string, swapKey: string) => void;
  onResetSwap: (itemId: string) => void;
};

export default function ShoppingPlanStore({
  store,
  preferences,
  defaults,
  getAlternatives,
  onSwap,
  onResetSwap,
}: ShoppingPlanStoreProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">

      {/* Store header */}
      <div className="mb-5 flex items-start justify-between">

        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {store.storeName}
          </h3>

          <p className="text-sm text-text-muted">
            {store.city}
          </p>
        </div>

        <div className="text-right">

          <p className="text-xl font-bold text-primary">
            ${store.total.toFixed(2)}
          </p>

          <p className="text-xs text-text-muted">
            {store.items.length}{" "}
            {store.items.length === 1
              ? "item"
              : "items"}
          </p>

        </div>

      </div>

      {/* Grocery items */}
      <div className="space-y-2">

        {store.items.map((result) => (
          <ShoppingPlanItem
            key={result.item.id}
            result={result}
            preferences={preferences}
            defaultResult={defaults[result.item.id]}
            getAlternatives={getAlternatives}
            onSwap={onSwap}
            onResetSwap={onResetSwap}
          />
        ))}

      </div>

    </div>
  );
}