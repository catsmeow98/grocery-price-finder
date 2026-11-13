"use client";

import { useState } from "react";

import { getPreference } from "@/lib/preferenceUtils";

import type {
  PreferenceMap,
  ShoppingOption,
  ShoppingResult,
} from "@/types/shopping";

import type { ShoppingListItem } from "@/lib/database";

type ShoppingPlanItemProps = {
  result: ShoppingResult;
  preferences: PreferenceMap;
  getAlternatives: (
    item: ShoppingListItem
  ) => ShoppingOption[];
  onSwap: (itemId: string, productId: string) => void;
  onResetSwap: (itemId: string) => void;
};

function formatDifference(amount: number): string {
  if (Math.abs(amount) < 0.005) return "same price";

  return `${amount > 0 ? "+" : "-"}$${Math.abs(
    amount
  ).toFixed(2)}`;
}

export default function ShoppingPlanItem({
  result,
  preferences,
  getAlternatives,
  onSwap,
  onResetSwap,
}: ShoppingPlanItemProps) {
  const [open, setOpen] = useState(false);

  const alternatives = open
    ? getAlternatives(result.item)
    : [];

  return (
    <div className="rounded-xl bg-background/40 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-foreground">
            {result.item.product_name}
          </p>

          <p className="text-sm text-text-muted">
            {result.product.brand
              ? `${result.product.brand} · `
              : ""}

            {result.packagesNeeded} ×{" "}

            {result.product.quantity}{" "}

            {result.product.unit}
          </p>

          {result.basis === "preferred" && (
            <p className="mt-1 text-xs font-medium text-accent">
              ♥ Preferred brand
            </p>
          )}

          {result.basis === "fallback" && (
            <p className="mt-1 text-xs text-text-muted">
              No preferred brand available, so we
              chose the cheapest.
            </p>
          )}

          {result.basis === "swapped" && (
            <p className="mt-1 text-xs font-medium text-primary">
              ↔ You chose this product
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="font-semibold text-foreground">
            ${result.totalPrice.toFixed(2)}
          </p>

          {result.product.sale_price ? (
            <span className="rounded-full border border-accent-border bg-accent-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
              Sale
            </span>
          ) : null}

          <div>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className="mt-1 text-xs text-text-secondary underline hover:text-foreground"
            >
              {open ? "Close" : "Swap"}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 text-xs text-text-muted">
            Choose a different product for this item
            (cheapest first):
          </p>

          <ul className="space-y-1">
            {alternatives.map((option) => {
              const isCurrent =
                option.product.id === result.product.id;

              const preference = getPreference(
                preferences,
                option.product.name,
                option.product.brand
              );

              return (
                <li key={option.product.id}>
                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      onSwap(
                        result.item.id,
                        option.product.id
                      );
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                      isCurrent
                        ? "border-primary/40 bg-primary/10"
                        : "border-border hover:bg-surface-hover"
                    }`}
                  >
                    <span>
                      <span className="font-medium text-foreground">
                        {option.product.brand ?? "No brand"}
                      </span>

                      <span className="text-text-muted">
                        {" · "}
                        {option.packagesNeeded} ×{" "}
                        {option.product.quantity}{" "}
                        {option.product.unit}
                        {option.product.stores
                          ? ` · ${option.product.stores.name}`
                          : ""}
                      </span>

                      {preference === "preferred" && (
                        <span className="ml-2 text-xs text-accent">
                          ♥ Preferred
                        </span>
                      )}

                      {preference === "blocked" && (
                        <span className="ml-2 text-xs text-red-400">
                          ⊘ Blocked
                        </span>
                      )}
                    </span>

                    <span className="shrink-0 text-right">
                      <span className="font-semibold text-foreground">
                        ${option.totalPrice.toFixed(2)}
                      </span>

                      <span className="block text-xs text-text-muted">
                        {isCurrent
                          ? "current"
                          : formatDifference(
                              option.totalPrice -
                                result.totalPrice
                            )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {result.basis === "swapped" && (
            <button
              type="button"
              onClick={() => {
                onResetSwap(result.item.id);
                setOpen(false);
              }}
              className="mt-3 text-xs text-text-secondary underline hover:text-foreground"
            >
              Reset to automatic choice
            </button>
          )}
        </div>
      )}
    </div>
  );
}
