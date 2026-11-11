import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { preferenceKey } from "@/lib/preferenceUtils";

import type {
  Preference,
  PreferenceMap,
} from "@/types/shopping";

export type PreferenceRow = {
  id: string;
  product_name: string;
  brand: string;
  preference: Preference;
};

export async function getPreferenceRows(): Promise<
  PreferenceRow[]
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("product_preferences")
    .select("id, product_name, brand, preference")
    .order("product_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as PreferenceRow[];
}

export function toPreferenceMap(
  rows: PreferenceRow[]
): PreferenceMap {
  const map: PreferenceMap = {};

  for (const row of rows) {
    map[preferenceKey(row.product_name, row.brand)] =
      row.preference;
  }

  return map;
}

/*
 * Save a preference, or clear it when preference is null.
 */
export async function setPreference(
  productName: string,
  brand: string,
  preference: Preference | null
) {
  const supabase = createClient();

  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  if (preference === null) {
    const { error } = await supabase
      .from("product_preferences")
      .delete()
      .eq("user_id", user.id)
      .eq("product_name", productName)
      .eq("brand", brand);

    if (error) throw error;

    return;
  }

  const { error } = await supabase
    .from("product_preferences")
    .upsert(
      {
        user_id: user.id,
        product_name: productName,
        brand,
        preference,
      },
      { onConflict: "user_id,product_name,brand" }
    );

  if (error) throw error;
}

export async function removePreferenceById(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("product_preferences")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
