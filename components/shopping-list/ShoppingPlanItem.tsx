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
      </div>

      <p className="font-semibold text-foreground">
        ${result.totalPrice.toFixed(2)}
      </p>
    </div>
  );
}