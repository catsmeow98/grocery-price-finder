"use client";

import { useEffect, useMemo, useState } from "react";

import { getCurrentUser } from "@/lib/auth";
import {
  getExcludedStoreIds,
  setStoreExcluded,
} from "@/lib/excludedStores";

/*
 * The stores the logged-in customer excluded, loaded once.
 * Logged-out visitors simply have none.
 */
export function useExcludedStores() {
  const [ids, setIds] = useState<string[]>([]);

  const [problem, setProblem] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const user = await getCurrentUser();

        if (!user || !active) return;

        const loaded = await getExcludedStoreIds();

        if (active) setIds(loaded);
      } catch (error) {
        console.error(
          "Unable to load excluded stores:",
          error
        );

        if (active) {
          setProblem(
            "Your excluded stores could not be loaded, so they are not being applied."
          );
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const excluded = useMemo(() => new Set(ids), [ids]);

  async function setExcluded(
    storeId: string,
    value: boolean
  ) {
    // Update the screen right away, then save.
    setIds((current) =>
      value
        ? current.includes(storeId)
          ? current
          : [...current, storeId]
        : current.filter((id) => id !== storeId)
    );

    try {
      await setStoreExcluded(storeId, value);
      setProblem(null);
    } catch (error) {
      console.error(
        "Unable to save store choice:",
        error
      );

      setProblem(
        "Your store choice could not be saved. Has supabase/09_stores_and_lists.sql been run?"
      );

      try {
        setIds(await getExcludedStoreIds());
      } catch {
        /* ignore */
      }
    }
  }

  return { excluded, problem, setExcluded };
}
