"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { withNext } from "@/lib/redirect";
import {
  getOrCreateShoppingList,
  getShoppingListItems,
  addShoppingListItem,
} from "@/lib/database";

type AddToListButtonProps = {
  productName: string;
  defaultQuantity: number;
  defaultUnit: string;
};

type Status =
  | "idle"
  | "adding"
  | "added"
  | "exists"
  | "error";

export default function AddToListButton({
  productName,
  defaultQuantity,
  defaultUnit,
}: AddToListButtonProps) {
  const router = useRouter();

  const [status, setStatus] =
    useState<Status>("idle");

  async function handleAdd() {
    try {
      setStatus("adding");

      const user = await getCurrentUser();

      // Not logged in: go log in, then come back here.
      if (!user) {
        const here =
          window.location.pathname +
          window.location.search;

        router.push(withNext("/login", here));
        return;
      }

      const list = await getOrCreateShoppingList();
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

  if (status === "added" || status === "exists") {
    return (
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium text-primary">
          {status === "added"
            ? "✓ Added to your list"
            : "Already on your list"}
        </p>

        <Link
          href="/shopping-list"
          className="text-xs text-text-secondary underline hover:text-foreground"
        >
          View list
        </Link>
      </div>
    );
  }

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={handleAdd}
        disabled={status === "adding"}
        className="rounded-xl border border-primary/40 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "adding" ? "Adding..." : "+ Add to list"}
      </button>

      {status === "error" && (
        <p className="mt-1 text-xs text-red-400">
          Couldn&apos;t add. Try again.
        </p>
      )}
    </div>
  );
}
