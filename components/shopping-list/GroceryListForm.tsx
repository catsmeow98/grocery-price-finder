"use client";

import QuantitySelector, {
  type QuantityOption,
} from "./QuantitySelector";

import ProductAutocomplete from "./ProductAutocomplete";
import type { ProductOption } from "@/types/shopping";


type GroceryListFormProps = {
  productName: string;
  quantity: string;
  unit: string;

  suggestions: ProductOption[];
  showSuggestions: boolean;

  quantityOptions: QuantityOption[];
  loadingQuantities: boolean;

  adding: boolean;
  loading: boolean;
  shoppingListId: string | null;

  onProductChange: (value: string) => void;

  onProductSelect: (
    product: ProductOption
  ) => void;

  onQuantityChange: (
    value: string
  ) => void;

  onQuantitySelect: (
    value: string
    ) => void;

  onUnitChange: (
    value: string
  ) => void;

  onAdd: () => void;
};

export default function GroceryListForm({
  productName,
  quantity,
  unit,
  suggestions,
  showSuggestions,
  quantityOptions,
  loadingQuantities,
  adding,
  loading,
  shoppingListId,
  onProductChange,
  onProductSelect,
  onQuantityChange,
  onQuantitySelect,
  onUnitChange,
  onAdd,
}: GroceryListFormProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-xl font-semibold text-foreground">
        Build your grocery list
      </h2>

      <p className="mb-5 text-sm text-text-muted">
        Add the items you need and we'll
        find the best prices.
      </p>

      <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <ProductAutocomplete
          value={productName}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          onChange={onProductChange}
          onSelect={onProductSelect}
        />

        <QuantitySelector
            quantity={quantity}
            unit={unit}
            options={quantityOptions}
            loading={loadingQuantities}
            onQuantityChange={onQuantityChange}
            onQuantitySelect={onQuantitySelect}
            onUnitChange={onUnitChange}
            />

        <button
          type="button"
          onClick={onAdd}
          disabled={
            adding ||
            loading ||
            !shoppingListId ||
            !productName.trim() ||
            !quantity ||
            !unit
          }
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}