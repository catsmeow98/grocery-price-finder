"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { withNext } from "@/lib/redirect";
import {
  getShoppingLists,
  createShoppingList,
  getShoppingListItems,
  addShoppingListItem,
  type ShoppingList,
} from "@/lib/database";

type AddToListButtonProps = {
  productName: string;
  defaultQuantity: number;
  defaultUnit: string;
};

type Status =
  | "idle"
  | "loading"
  | "choosing"
  | "adding"
  | "added"
  | "exists"
  | "error";

type ListWithCount = ShoppingList & { itemCount: number };

export default function AddToListButton({
  productName,
  defaultQuantity,
  defaultUnit,
}: AddToListButtonProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [lists, setLists] = useState<ListWithCount[]>([]);
  const [listName, setListName] = useState("");

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (status !== "choosing") return;

    function onClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setStatus("idle");
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setStatus("idle");
    }

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [status]);

  async function addToList(list: { id: string; name: string }) {
    try {
      setStatus("adding");
      setListName(list.name);

      const items = await getShoppingListItems(list.id);

      const alreadyThere = items.some(
        (item) =>
          item.product_name.toLowerCase() ===
          productName.toLowerCase()
      );

      if (alreadyThere) {
        setStatus("exists");
        return;
      }

      await addShoppingListItem({
        shoppingListId: list.id,
        productName,
        quantity: defaultQuantity,
        unit: defaultUnit,
      });

      setStatus("added");
    } catch (error) {
      console.error("Unable to add to list:", error);
      setStatus("error");
    }
  }

  async function handleClick() {
    try {
      setStatus("loading");

      const user = await getCurrentUser();

      // Not logged in: go log in, then come back here.
      if (!user) {
        const here =
          window.location.pathname + window.location.search;

        router.push(withNext("/login", here));
        return;
      }

      let allLists = await getShoppingLists();

      // First time: make a list so there is somewhere to add to.
      if (allLists.length === 0) {
        const created = await createShoppingList("My Grocery List");
        allLists = [{ ...created, itemCount: 0 }];
      }

      setLists(allLists);

      // Only one list: add straight away, no menu needed.
      if (allLists.length === 1) {
        await addToList(allLists[0]);
        return;
      }

      setStatus("choosing");
    } catch (error) {
      console.error("Unable to load lists:", error);
      setStatus("error");
    }
  }

  if (status === "added" || status === "exists") {
    return (
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium text-primary">
          {status === "added"
            ? `✓ Added to "${listName}"`
            : `Already on "${listName}"`}
        </p>

        <div className="flex justify-end gap-3 text-xs">
          <Link
            href="/shopping-list"
            className="text-text-secondary underline hover:text-foreground"
          >
            View list
          </Link>

          {lists.length > 1 && (
            <button
              type="button"
              onClick={() => setStatus("choosing")}
              className="text-text-secondary underline hover:text-foreground"
            >
              Add to another list
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative shrink-0 text-right">
      <button
        type="button"
        onClick={
          status === "choosing"
            ? () => setStatus("idle")
            : handleClick
        }
        disabled={status === "loading" || status === "adding"}
        aria-haspopup="menu"
        aria-expanded={status === "choosing"}
        className="rounded-xl border border-primary/40 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" || status === "adding"
          ? "Adding..."
          : "+ Add to list ▾"}
      </button>

      {status === "choosing" && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface text-left shadow-lg"
        >
          <p className="px-4 pb-1 pt-3 text-xs text-text-muted">
            Add to which list?
          </p>

          {lists.map((list, index) => (
            <button
              key={list.id}
              type="button"
              role="menuitem"
              onClick={() => addToList(list)}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm text-foreground transition hover:bg-background"
            >
              <span className="truncate">
                {list.name}
                {index === 0 && (
                  <span className="ml-1 text-xs text-text-muted">
                    (open)
                  </span>
                )}
              </span>

              <span className="shrink-0 text-xs text-text-muted">
                {list.itemCount}{" "}
                {list.itemCount === 1 ? "item" : "items"}
              </span>
            </button>
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="mt-1 text-xs text-red-400">
          Couldn&apos;t add. Try again.
        </p>
      )}
    </div>
  );
}
