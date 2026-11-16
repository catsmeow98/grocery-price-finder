import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth";

export type StoreRow = {
  id: string;
  name: string;
  city: string;
  address: string | null;
};

/* Every store in the database (public). */
export async function getAllStores(): Promise<StoreRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("stores")
    .select("id, name, city, address")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as StoreRow[];
}

/* Ids of the stores the logged-in customer excluded. */
export async function getExcludedStoreIds(): Promise<
  string[]
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_excluded_stores")
    .select("store_id");

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    (row: { store_id: string }) => row.store_id
  );
}

export async function setStoreExcluded(
  storeId: string,
  excluded: boolean
) {
  const supabase = createClient();

  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  if (excluded) {
    const { error } = await supabase
      .from("user_excluded_stores")
      .upsert(
        { user_id: user.id, store_id: storeId },
        { onConflict: "user_id,store_id" }
      );

    if (error) throw error;

    return;
  }

  const { error } = await supabase
    .from("user_excluded_stores")
    .delete()
    .eq("user_id", user.id)
    .eq("store_id", storeId);

  if (error) throw error;
}
