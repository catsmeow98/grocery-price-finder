"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useExcludedStores } from "@/components/preferences/useExcludedStores";
import {
  getAllStores,
  type StoreRow,
} from "@/lib/excludedStores";
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

function StoresSection() {
  const [stores, setStores] = useState<StoreRow[]>([]);

  const [loadError, setLoadError] = useState(false);

  const { excluded, problem, setExcluded } =
    useExcludedStores();

  useEffect(() => {
    async function load() {
      try {
        setStores(await getAllStores());
      } catch (err) {
        console.error(err);

        setLoadError(true);
      }
    }

    load();
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-xl font-semibold text-foreground">
        Stores
      </h2>

      <p className="mt-1 text-sm text-text-muted">
        Exclude stores you won&apos;t shop at. Their prices
        are hidden from search and left out of your
        shopping plans.
      </p>

      {(problem || loadError) && (
        <p className="mt-3 text-sm text-red-400">
          {problem ?? "Unable to load the store list."}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {stores.map((store) => {
          const isExcluded = excluded.has(store.id);

          return (
            <li
              key={store.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-background/40 px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">
                  {store.name}
                </p>

                <p className="text-sm text-text-muted">
                  {[store.address, store.city]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              <button
                type="button"
                aria-pressed={isExcluded}
                onClick={() =>
                  setExcluded(store.id, !isExcluded)
                }
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm transition ${
                  isExcluded
                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                    : "border-border text-text-secondary hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {isExcluded
                  ? "Excluded"
                  : "I shop here"}
              </button>
            </li>
          );
        })}
      </ul>
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
