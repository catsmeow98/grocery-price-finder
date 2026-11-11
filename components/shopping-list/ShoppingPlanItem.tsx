"use client";

import type { ShoppingResult } from "@/types/shopping";

type ShoppingPlanItemProps = {
  result: ShoppingResult;
};

export default function ShoppingPlanItem({
  result,
}: ShoppingPlanItemProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-background/40 px-4 py-3">
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
            No preferred brand available, so we chose
            the cheapest.
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
      </div>
    </div>
  );
}