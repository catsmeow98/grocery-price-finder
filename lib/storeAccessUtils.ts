import { estimateDrivingMiles } from "@/lib/geo";

export type StoreLocation = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type HomeLocation = {
  zip: string;
  latitude: number;
  longitude: number;
  maxMiles: number;
};

/*
 * Why a store is (or isn't) included before the customer
 * makes their own choice:
 *   closest        - closest location of its chain in range
 *   other_location - a farther location of a chain that has a
 *                    closer one in range
 *   outside_radius - farther than the max driving distance
 *   no_location    - the store has no coordinates yet
 *   no_home        - the customer has not set a location
 */
export type StoreAccessReason =
  | "closest"
  | "other_location"
  | "outside_radius"
  | "no_location"
  | "no_home";

export type StoreAccess = {
  store: StoreLocation;
  /* estimated driving miles, null if unknown */
  miles: number | null;
  reason: StoreAccessReason;
  /* included before any customer override */
  defaultIncluded: boolean;
  /* the customer's own choice, if they made one */
  override: boolean | undefined;
  /* the final answer */
  included: boolean;
};

function chainKey(store: StoreLocation): string {
  return store.name.trim().toLowerCase();
}

/**
 * Decide which store locations a customer shops at.
 *
 * With a home location set:
 *  - locations farther than maxMiles are excluded;
 *  - when a chain has several locations in range, only the
 *    closest is included;
 *  - stores without coordinates stay included (we can't tell).
 * Without a home location, every store is included.
 *
 * The customer's overrides always win.
 */
export function computeStoreAccess(
  stores: StoreLocation[],
  home: HomeLocation | null,
  overrides: Record<string, boolean>
): StoreAccess[] {
  const base = stores.map((store) => {
    const miles =
      home &&
      store.latitude !== null &&
      store.longitude !== null
        ? estimateDrivingMiles(
            home.latitude,
            home.longitude,
            store.latitude,
            store.longitude
          )
        : null;

    return { store, miles };
  });

  // Closest in-range location of each chain.
  const closestOfChain = new Map<string, string>();

  if (home) {
    const best = new Map<string, number>();

    for (const { store, miles } of base) {
      if (miles === null || miles > home.maxMiles) continue;

      const key = chainKey(store);

      if (!best.has(key) || miles < best.get(key)!) {
        best.set(key, miles);
        closestOfChain.set(key, store.id);
      }
    }
  }

  const access = base.map(({ store, miles }): StoreAccess => {
    let reason: StoreAccessReason;
    let defaultIncluded: boolean;

    if (!home) {
      reason = "no_home";
      defaultIncluded = true;
    } else if (miles === null) {
      reason = "no_location";
      defaultIncluded = true;
    } else if (miles > home.maxMiles) {
      reason = "outside_radius";
      defaultIncluded = false;
    } else if (closestOfChain.get(chainKey(store)) === store.id) {
      reason = "closest";
      defaultIncluded = true;
    } else {
      reason = "other_location";
      defaultIncluded = false;
    }

    const override = overrides[store.id];

    return {
      store,
      miles,
      reason,
      defaultIncluded,
      override,
      included: override ?? defaultIncluded,
    };
  });

  // Group by chain, nearest first (unknown distance last).
  return access.sort((a, b) => {
    const byChain = chainKey(a.store).localeCompare(
      chainKey(b.store)
    );

    if (byChain !== 0) return byChain;

    return (
      (a.miles ?? Infinity) - (b.miles ?? Infinity)
    );
  });
}
