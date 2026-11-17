"use client";

import { useEffect, useMemo, useState } from "react";

import { loadStoreAccess } from "@/lib/storeAccess";

/*
 * The store locations this customer does NOT shop at, based on
 * their location, max driving distance and own choices.
 * Logged-out visitors have none.
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
        const { access } = await loadStoreAccess();

        if (active) {
          setIds(
            access
              .filter((entry) => !entry.included)
              .map((entry) => entry.store.id)
          );
        }
      } catch (error) {
        console.error(
          "Unable to load store choices:",
          error
        );

        if (active) {
          setProblem(
            "Your store choices could not be loaded, so they are not being applied."
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

  return { excluded, problem };
}
