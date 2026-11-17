"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  clearHomeLocation,
  loadStoreAccess,
  saveHomeLocation,
  setStoreOverride,
} from "@/lib/storeAccess";
import type {
  HomeLocation,
  StoreAccess,
  StoreAccessReason,
} from "@/lib/storeAccessUtils";
import {
  getPreferenceRows,
  removePreferenceById,
  type PreferenceRow,
} from "@/lib/preferences";

function Section({
  onRemove,
  title,
  description,
  list,
}: {
  onRemove: (id: string) => void;
  title: string;
  description: string;
  list: PreferenceRow[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-xl font-semibold text-foreground">
        {title}
      </h2>

      <p className="mt-1 text-sm text-text-muted">
        {description}
      </p>

      {list.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          None yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {list.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between rounded-xl bg-background/40 px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">
                  {row.product_name}
                </p>

                <p className="text-sm text-text-muted">
                  {row.brand}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onRemove(row.id)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition hover:bg-surface-hover hover:text-foreground"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const REASON_TEXT: Record<StoreAccessReason, string> = {
  closest: "Closest location of this store in your area",
  other_location:
    "Farther location, left out because a closer one is included",
  outside_radius: "Outside your driving distance",
  no_location: "No location on file for this store yet",
  no_home: "",
};

function StoresSection() {
  const [access, setAccess] = useState<StoreAccess[]>([]);
  const [home, setHome] = useState<HomeLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);

  const [zip, setZip] = useState("");
  const [miles, setMiles] = useState("15");
  const [saving, setSaving] = useState(false);

  async function reload() {
    try {
      const loaded = await loadStoreAccess();

      setAccess(loaded.access);
      setHome(loaded.home);

      if (loaded.home) {
        setZip(loaded.home.zip);
        setMiles(String(loaded.home.maxMiles));
      }
    } catch (err) {
      console.error(err);

      setProblem(
        "Unable to load your stores. Has supabase/10_locations.sql been run?"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSaveLocation() {
    try {
      setSaving(true);
      setProblem(null);

      await saveHomeLocation(zip, Number(miles));
      await reload();
    } catch (err) {
      console.error(err);

      setProblem(
        err instanceof Error
          ? err.message
          : "Unable to save your location."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleClearLocation() {
    try {
      setProblem(null);

      await clearHomeLocation();

      setZip("");
      await reload();
    } catch (err) {
      console.error(err);

      setProblem("Unable to clear your location.");
    }
  }

  async function handleToggle(entry: StoreAccess) {
    const next = !entry.included;

    try {
      setProblem(null);

      // Matching the default means "no personal choice".
      await setStoreOverride(
        entry.store.id,
        next === entry.defaultIncluded ? null : next
      );

      await reload();
    } catch (err) {
      console.error(err);

      setProblem("Your store choice could not be saved.");
    }
  }

  const includedCount = access.filter(
    (entry) => entry.included
  ).length;

  // Group by chain (access is already sorted by chain, then distance).
  const chains: { name: string; rows: StoreAccess[] }[] = [];

  for (const entry of access) {
    const last = chains[chains.length - 1];

    if (
      last &&
      last.name.toLowerCase() ===
        entry.store.name.trim().toLowerCase()
    ) {
      last.rows.push(entry);
    } else {
      chains.push({
        name: entry.store.name,
        rows: [entry],
      });
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-xl font-semibold text-foreground">
        Stores near you
      </h2>

      <p className="mt-1 text-sm text-text-muted">
        Set your ZIP code and how far you&apos;ll drive. Prices
        are specific to each store location, so when a store
        has several locations in range, we include the closest
        and leave out the rest. You can change any location
        below.
      </p>

      {/* Location */}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor="zip"
            className="block text-xs text-text-muted"
          >
            Your ZIP code
          </label>

          <input
            id="zip"
            value={zip}
            inputMode="numeric"
            maxLength={5}
            onChange={(event) =>
              setZip(event.target.value)
            }
            placeholder="48091"
            className="mt-1 w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label
            htmlFor="miles"
            className="block text-xs text-text-muted"
          >
            Max driving distance (miles)
          </label>

          <input
            id="miles"
            type="number"
            min={1}
            max={500}
            value={miles}
            onChange={(event) =>
              setMiles(event.target.value)
            }
            className="mt-1 w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <button
          type="button"
          disabled={saving || !zip.trim()}
          onClick={handleSaveLocation}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background transition hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save location"}
        </button>

        {home && (
          <button
            type="button"
            onClick={handleClearLocation}
            className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition hover:bg-surface-hover hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-text-muted">
        {home
          ? `Distances are estimates from the middle of ZIP ${home.zip} (straight-line distance plus 30% for roads).`
          : "No location set, so every store is included."}
      </p>

      {problem && (
        <p className="mt-3 text-sm text-red-400">{problem}</p>
      )}

      {/* Store locations */}
      {loading ? (
        <p className="mt-6 text-sm text-text-muted">
          Loading stores...
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-text-secondary">
            {includedCount} of {access.length} store locations
            included
          </p>

          <div className="mt-3 space-y-5">
            {chains.map((chain) => (
              <div key={chain.name}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                  {chain.name}
                </h3>

                <ul className="mt-2 space-y-2">
                  {chain.rows.map((entry) => (
                    <li
                      key={entry.store.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-background/40 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {[entry.store.address, entry.store.city]
                            .filter(Boolean)
                            .join(", ")}
                        </p>

                        <p className="text-sm text-text-muted">
                          {entry.miles !== null
                            ? `about ${entry.miles.toFixed(1)} mi`
                            : "distance unknown"}

                          {REASON_TEXT[entry.reason]
                            ? ` · ${REASON_TEXT[entry.reason]}`
                            : ""}

                          {entry.override !== undefined
                            ? " · your choice"
                            : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        aria-pressed={entry.included}
                        onClick={() => handleToggle(entry)}
                        className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm transition ${
                          entry.included
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-red-500/40 bg-red-500/10 text-red-400"
                        }`}
                      >
                        {entry.included ? "Included" : "Excluded"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function PreferencesPage() {
  const [rows, setRows] = useState<
    PreferenceRow[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function load() {
      try {
        setRows(await getPreferenceRows());
      } catch (err) {
        console.error(err);

        setError("Unable to load your preferences.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleRemove(id: string) {
    try {
      await removePreferenceById(id);

      setRows((current) =>
        current.filter((row) => row.id !== id)
      );
    } catch (err) {
      console.error(err);

      setError("Unable to remove that preference.");
    }
  }

  const preferred = rows.filter(
    (row) => row.preference === "preferred"
  );

  const blocked = rows.filter(
    (row) => row.preference === "blocked"
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Preferences
        </h1>

        <p className="mt-2 text-text-muted">
          Choose preferred and blocked brands from
          the{" "}
          <Link
            href="/"
            className="text-primary underline"
          >
            search page
          </Link>{" "}
          using the ♡ Prefer and ⊘ Block buttons.
          Your shopping plan can use them.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-text-muted">
            Loading...
          </p>
        ) : (
          <div className="mt-8 space-y-6">
            {error && (
              <p className="text-sm text-red-400">
                {error}
              </p>
            )}

            <Section
              onRemove={handleRemove}
              title="Preferred brands"
              description="Used first when you choose the preferred-brands plan."
              list={preferred}
            />

            <Section
              onRemove={handleRemove}
              title="Blocked brands"
              description="Never recommended in any plan."
              list={blocked}
            />

            <StoresSection />
          </div>
        )}
      </div>
    </main>
  );
}
