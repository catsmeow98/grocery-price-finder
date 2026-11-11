"use client";

import { useEffect, useMemo, useState } from "react";

import { getCurrentUser } from "@/lib/auth";
import {
  getPreferenceRows,
  setPreference,
  toPreferenceMap,
  type PreferenceRow,
} from "@/lib/preferences";
import { preferenceKey } from "@/lib/preferenceUtils";

import type { Preference } from "@/types/shopping";

/*
 * Loads the logged-in user's brand preferences once and
 * lets components change them.
 *
 * loggedIn: undefined = still checking, false = logged out
 */
export function usePreferences() {
  const [rows, setRows] = useState<PreferenceRow[]>([]);

  const [loggedIn, setLoggedIn] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const user = await getCurrentUser();

        if (!active) return;

        setLoggedIn(Boolean(user));

        if (user) {
          const loaded = await getPreferenceRows();

          if (active) setRows(loaded);
        }
      } catch (error) {
        console.error(
          "Unable to load preferences:",
          error
        );

        if (active) {
          setLoggedIn((current) =>
            current === undefined ? false : current
          );
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const map = useMemo(() => toPreferenceMap(rows), [rows]);

  async function updatePreference(
    productName: string,
    brand: string,
    preference: Preference | null
  ) {
    const key = preferenceKey(productName, brand);

    // Update the screen right away...
    setRows((current) => {
      const others = current.filter(
        (row) =>
          preferenceKey(row.product_name, row.brand) !==
          key
      );

      return preference
        ? [
            ...others,
            {
              id: `tmp-${key}`,
              product_name: productName,
              brand,
              preference,
            },
          ]
        : others;
    });

    // ...then save; reload the real data if saving fails.
    try {
      await setPreference(productName, brand, preference);
    } catch (error) {
      console.error("Unable to save preference:", error);

      try {
        setRows(await getPreferenceRows());
      } catch {
        /* ignore */
      }
    }
  }

  return { map, loggedIn, updatePreference };
}
