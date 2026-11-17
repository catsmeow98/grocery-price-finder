import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { lookupZip } from "@/lib/geo";
import {
  computeStoreAccess,
  type HomeLocation,
  type StoreAccess,
  type StoreLocation,
} from "@/lib/storeAccessUtils";

/* Every store location (public). */
async function getStoreLocations(): Promise<StoreLocation[]> {
  const supabase = createClient();

  const withCoordinates = await supabase
    .from("stores")
    .select("id, name, city, address, latitude, longitude")
    .order("name", { ascending: true });

  if (!withCoordinates.error) {
    return (withCoordinates.data ?? []) as StoreLocation[];
  }

  // Coordinates don't exist yet (SQL not run): load without.
  const plain = await supabase
    .from("stores")
    .select("id, name, city, address")
    .order("name", { ascending: true });

  if (plain.error) {
    throw plain.error;
  }

  return (plain.data ?? []).map((row) => ({
    ...(row as Omit<StoreLocation, "latitude" | "longitude">),
    latitude: null,
    longitude: null,
  }));
}

export async function getHomeLocation(): Promise<HomeLocation | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_location")
    .select("zip, latitude, longitude, max_miles")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;

  return {
    zip: data.zip,
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    maxMiles: Number(data.max_miles),
  };
}

async function getStoreOverrides(): Promise<
  Record<string, boolean>
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_store_overrides")
    .select("store_id, included");

  if (error) {
    throw error;
  }

  const overrides: Record<string, boolean> = {};

  for (const row of (data ?? []) as {
    store_id: string;
    included: boolean;
  }[]) {
    overrides[row.store_id] = row.included;
  }

  return overrides;
}

/*
 * Every store location with whether this customer shops there.
 * Logged-out visitors have no location or overrides, so
 * every store is included.
 */
export async function loadStoreAccess(): Promise<{
  access: StoreAccess[];
  home: HomeLocation | null;
}> {
  const [stores, home, overrides] = await Promise.all([
    getStoreLocations(),
    getHomeLocation(),
    getStoreOverrides(),
  ]);

  return {
    access: computeStoreAccess(stores, home, overrides),
    home,
  };
}

/* Save the customer's ZIP and max driving distance. */
export async function saveHomeLocation(
  zip: string,
  maxMiles: number
): Promise<void> {
  if (!Number.isFinite(maxMiles) || maxMiles <= 0) {
    throw new Error("Enter a distance greater than 0.");
  }

  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { latitude, longitude } = await lookupZip(zip);

  const supabase = createClient();

  const { error } = await supabase
    .from("user_location")
    .upsert(
      {
        user_id: user.id,
        zip: zip.trim(),
        latitude,
        longitude,
        max_miles: maxMiles,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    throw error;
  }
}

export async function clearHomeLocation(): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("user_location")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}

/*
 * Save the customer's own choice for one store location.
 * included = null removes the choice (back to the default).
 */
export async function setStoreOverride(
  storeId: string,
  included: boolean | null
): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const supabase = createClient();

  if (included === null) {
    const { error } = await supabase
      .from("user_store_overrides")
      .delete()
      .eq("user_id", user.id)
      .eq("store_id", storeId);

    if (error) throw error;

    return;
  }

  const { error } = await supabase
    .from("user_store_overrides")
    .upsert(
      {
        user_id: user.id,
        store_id: storeId,
        included,
      },
      { onConflict: "user_id,store_id" }
    );

  if (error) throw error;
}
