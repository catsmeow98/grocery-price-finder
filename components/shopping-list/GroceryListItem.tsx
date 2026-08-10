"use client";

import type { ShoppingListItem } from "@/lib/database";

export type EditQuantityOption = {
  value: string;
  quantity: number;
  unit: string;
  label: string;
};

type GroceryListItemProps = {
  item: ShoppingListItem;

  onRemove: (id: string) => void;
  onEdit: (item: ShoppingListItem) => void;

  editing: boolean;
  editingQuantityKey: string;
  quantityOptions: EditQuantityOption[];
  savingEdit: boolean;

  onQuantityChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function GroceryListItem({
  item,
  onRemove,
  onEdit,

  editing,
  editingQuantityKey,
  quantityOptions,
  savingEdit,

  onQuantityChange,
  onSave,
  onCancel,
}: GroceryListItemProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-background/30 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-foreground">
            {item.product_name}
          </p>

          {!editing && (
            <p className="text-sm text-text-muted">
              {item.quantity} {item.unit}
            </p>
          )}
        </div>

        {!editing && (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                console.log("EDIT BUTTON CLICKED");
                onEdit(item);
                }}
              className="text-sm font-medium text-primary transition hover:opacity-80"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-sm font-medium text-text-muted transition hover:text-red-400"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={editingQuantityKey}
            onChange={(e) =>
              onQuantityChange(e.target.value)
            }
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">
              Select quantity
            </option>

            {quantityOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={
                savingEdit ||
                !editingQuantityKey
              }
              className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingEdit
                ? "Saving..."
                : "Save"}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={savingEdit}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-background"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
