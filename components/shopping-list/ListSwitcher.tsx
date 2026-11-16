"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createShoppingList,
  deleteShoppingList,
  getShoppingLists,
  renameShoppingList,
  setActiveShoppingList,
  type ShoppingList,
} from "@/lib/database";

type ListWithCount = ShoppingList & {
  itemCount: number;
};

type ListSwitcherProps = {
  /* Called after the open list changes (switch, create, delete). */
  onListChanged: () => void;
};

type Mode = "idle" | "creating" | "renaming" | "deleting";

const MAX_NAME_LENGTH = 60;

export default function ListSwitcher({
  onListChanged,
}: ListSwitcherProps) {
  const [lists, setLists] = useState<ListWithCount[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [nameInput, setNameInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const loaded = await getShoppingLists();

      setLists(loaded);

      // The first list is the one that is open.
      setActiveId(loaded[0]?.id ?? null);
    } catch (err) {
      console.error(err);

      setError("Unable to load your lists.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = lists.find((list) => list.id === activeId);

  async function run(action: () => Promise<void>) {
    try {
      setBusy(true);
      setError(null);

      await action();
      await load();

      setMode("idle");
      setNameInput("");

      onListChanged();
    } catch (err) {
      console.error(err);

      setError(
        "That didn't work. If this keeps happening, make sure supabase/09_stores_and_lists.sql has been run."
      );
    } finally {
      setBusy(false);
    }
  }

  function handleSwitch(id: string) {
    if (id === activeId) return;

    run(() => setActiveShoppingList(id));
  }

  function handleCreate() {
    const name = nameInput.trim();

    if (!name) return;

    run(async () => {
      await createShoppingList(name);
    });
  }

  function handleRename() {
    const name = nameInput.trim();

    if (!name || !active) return;

    run(() => renameShoppingList(active.id, name));
  }

  function handleDelete() {
    if (!active) return;

    run(() => deleteShoppingList(active.id));
  }

  const buttonClass =
    "rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition hover:bg-surface-hover hover:text-foreground disabled:opacity-50";

  return (
    <div className="mb-8 rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="list-select"
          className="text-sm text-text-muted"
        >
          Saved list
        </label>

        <select
          id="list-select"
          value={activeId ?? ""}
          disabled={busy || lists.length === 0}
          onChange={(event) =>
            handleSwitch(event.target.value)
          }
          className="min-w-[12rem] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name} ({list.itemCount}{" "}
              {list.itemCount === 1 ? "item" : "items"})
            </option>
          ))}
        </select>

        {mode === "idle" && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError(null);
                setNameInput("");
                setMode("creating");
              }}
              className={buttonClass}
            >
              + New list
            </button>

            <button
              type="button"
              disabled={busy || !active}
              onClick={() => {
                setError(null);
                setNameInput(active?.name ?? "");
                setMode("renaming");
              }}
              className={buttonClass}
            >
              Rename
            </button>

            <button
              type="button"
              disabled={busy || !active}
              onClick={() => {
                setError(null);
                setMode("deleting");
              }}
              className={buttonClass}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {(mode === "creating" || mode === "renaming") && (
        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();

            if (mode === "creating") handleCreate();
            else handleRename();
          }}
        >
          <input
            autoFocus
            value={nameInput}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) =>
              setNameInput(event.target.value)
            }
            placeholder={
              mode === "creating"
                ? "e.g. Weekend cookout"
                : "List name"
            }
            className="min-w-[14rem] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />

          <button
            type="submit"
            disabled={busy || !nameInput.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background transition hover:bg-primary-hover disabled:opacity-50"
          >
            {mode === "creating" ? "Create list" : "Save name"}
          </button>

          <button
            type="button"
            onClick={() => setMode("idle")}
            className={buttonClass}
          >
            Cancel
          </button>
        </form>
      )}

      {mode === "deleting" && active && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-text-secondary">
            Delete &ldquo;{active.name}&rdquo; and its{" "}
            {active.itemCount}{" "}
            {active.itemCount === 1 ? "item" : "items"}?
            This can&apos;t be undone.
          </p>

          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="rounded-lg bg-red-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            Yes, delete
          </button>

          <button
            type="button"
            onClick={() => setMode("idle")}
            className={buttonClass}
          >
            Keep it
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
