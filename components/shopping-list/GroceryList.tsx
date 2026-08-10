"use client";

import GroceryListForm from "./GroceryListForm";
import GroceryListItem, {
  type EditQuantityOption,
} from "./GroceryListItem";

import { useGroceryList } from "./useGroceryList";

type GroceryListProps = {
  onFindBestPrices: () => void;
};

export default function GroceryList({
  onFindBestPrices,
}: GroceryListProps) {
  const groceryList =
    useGroceryList({
      onFindBestPrices,
    });

  const {
    items,
    productName,
    quantity,
    unit,

    shoppingListId,

    loading,
    adding,
    error,

    productOptions,
    quantityOptions,
    showSuggestions,
    loadingQuantities,

    duplicateWarning,

    setProductName,
    setQuantity,
    setUnit,

    selectProduct,
    addItem,
    removeItem,
    startEditingItem,

    editingItemId,
    editingQuantityKey,
    savingEdit,

    setEditingItemId,
    setEditingQuantityKey,
    saveItemQuantity,

    onFindBestPrices: findBestPrices,
  } = groceryList;

  return (
    <div className="space-y-6">
      <GroceryListForm
        productName={productName}
        quantity={quantity}
        unit={unit}
        suggestions={productOptions}
        showSuggestions={
          showSuggestions
        }
        quantityOptions={
          quantityOptions
        }
        loadingQuantities={
          loadingQuantities
        }
        adding={adding}
        loading={loading}
        shoppingListId={
          shoppingListId
        }
        onProductChange={
          setProductName
        }
        onProductSelect={
          selectProduct
        }
        onQuantityChange={
          setQuantity
        }
        onQuantitySelect={
        groceryList.selectQuantity
        }
        onUnitChange={
          setUnit
        }
        onAdd={addItem}
      />

      {duplicateWarning && (
        <p className="text-sm text-yellow-400">
          {duplicateWarning}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="relative z-10 rounded-2xl border border-border bg-surface p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-foreground">
            Your grocery list
          </h2>

          <p className="text-sm text-text-muted">
            {items.length}{" "}
            {items.length === 1
              ? "item"
              : "items"}
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-text-muted">
              Loading your grocery list...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-text-muted">
              Your grocery list is empty.
            </p>

            <p className="mt-1 text-xs text-text-muted">
              Add something above to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
                <GroceryListItem
                    key={item.id}
                    item={item}
                    onRemove={removeItem}
                    onEdit={startEditingItem}
                    editing={
                    editingItemId === item.id
                    }
                    editingQuantityKey={
                    editingQuantityKey
                    }
                    quantityOptions={
                    quantityOptions as EditQuantityOption[]
                    }
                    savingEdit={savingEdit}
                    onQuantityChange={
                    setEditingQuantityKey
                    }
                    onSave={() =>
                    saveItemQuantity(item)
                    }
                    onCancel={() => {
                    setEditingItemId(null);
                    setEditingQuantityKey("");
                    }}
                />
                ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <button
          type="button"
          onClick={
            findBestPrices
          }
          className="w-full rounded-xl bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Find Best Prices
        </button>
      )}
    </div>
  );
}
