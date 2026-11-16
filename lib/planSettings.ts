import { createClient } from "@/lib/supabase/client";

import type { PlanMode } from "@/types/shopping";

/*
 * Everything about a shopping plan that the customer chose
 * (as opposed to what the list itself contains).
 */
export type PlanSettings = {
  mode: PlanMode | null;
  maxStores: 1 | 2 | null;
  /* grocery-list item id -> swapKey(product) */
  swaps: Record<string, string>;
};

export const EMPTY_PLAN_SETTINGS: PlanSettings = {
  mode: null,
  maxStores: null,
  swaps: {},
};

/* Read saved settings defensively (the data comes from the database). */
export function parsePlanSettings(raw: unknown): PlanSettings {
  if (typeof raw !== "object" || raw === null) {
    return { ...EMPTY_PLAN_SETTINGS, swaps: {} };
  }

  const value = raw as Record<string, unknown>;

  const mode =
    value.mode === "cheapest" || value.mode === "preferred"
      ? value.mode
      : null;

  const maxStores =
    value.maxStores === 1 || value.maxStores === 2
      ? value.maxStores
      : null;

  const swaps: Record<string, string> = {};

  if (
    typeof value.swaps === "object" &&
    value.swaps !== null
  ) {
    for (const [itemId, key] of Object.entries(
      value.swaps as Record<string, unknown>
    )) {
      if (typeof key === "string") {
        swaps[itemId] = key;
      }
    }
  }

  return { mode, maxStores, swaps };
}

export async function savePlanSettings(
  listId: string,
  settings: PlanSettings
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("shopping_lists")
    .update({ plan_settings: settings })
    .eq("id", listId);

  if (error) {
    throw error;
  }
}
