"use client";

import { useState } from "react";
import Link from "next/link";

import ShoppingPlan from "@/components/shopping-list/ShoppingPlan";

export default function ShoppingPlanPage() {
  const [refreshKey] = useState(0);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Shopping Plan
            </h1>

            <p className="mt-2 max-w-2xl text-text-muted">
              The cheapest way to buy everything
              on your grocery list, grouped by
              store.
            </p>
          </div>

          <Link
            href="/shopping-list"
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-hover"
          >
            Edit grocery list
          </Link>
        </div>

        <ShoppingPlan refreshKey={refreshKey} />
      </div>
    </main>
  );
}
