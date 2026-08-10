"use client";

import type { StoreGroup } from "@/types/shopping";

import ShoppingPlanItem from "./ShoppingPlanItem";

type ShoppingPlanStoreProps = {
  store: StoreGroup;
};

export default function ShoppingPlanStore({
  store,
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
          />
        ))}

      </div>

    </div>
  );
}