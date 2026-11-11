"use client";

import { useEffect, useState } from "react";

import {
  getOrCreateShoppingList,
  getShoppingListItems,
  addShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  type ShoppingListItem,
} from "@/lib/database";

import { supabase } from "@/lib/supabase";

export type ProductOption = {
  name: string;
};

export type RequestedQuantityOption = {
  value: string;
  quantity: number;
  unit: string;
  label: string;
};

type UseGroceryListProps = {
  onFindBestPrices: () => void;
};

export function useGroceryList({
  onFindBestPrices,
}: UseGroceryListProps) {
  const [editingItemId, setEditingItemId] =
    useState<string | null>(null);

  const [editingQuantityKey, setEditingQuantityKey] =
    useState("");

  const [duplicateWarning, setDuplicateWarning] =
    useState<string | null>(null);

  const [savingEdit, setSavingEdit] =
    useState(false);

  const [productName, setProductNameRaw] =
    useState("");

  /*
   * The product the user picked from the dropdown.
   * Items can only be added when productName matches it.
   */
  const [selectedProduct, setSelectedProduct] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [unit, setUnit] =
    useState("");

  const [items, setItems] =
    useState<ShoppingListItem[]>([]);

  const [shoppingListId, setShoppingListId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [adding, setAdding] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [productOptions, setProductOptions] =
    useState<ProductOption[]>([]);

  const [quantityOptions, setQuantityOptions] =
    useState<RequestedQuantityOption[]>([]);

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const [loadingQuantities, setLoadingQuantities] =
    useState(false);

  const [selectedQuantityKey, setSelectedQuantityKey] =
    useState("");

  /*
   * Called when the user TYPES in the product box.
   * Typing clears any earlier dropdown choice, so a
   * hand-typed name can never be added to the list.
   */
  function setProductName(value: string) {
    setProductNameRaw(value);

    if (value !== selectedProduct) {
      setSelectedProduct("");
      setQuantity("");
      setUnit("");
      setSelectedQuantityKey("");
      setQuantityOptions([]);
    }
  }

  /*
   * Load the shopping list.
   */
  useEffect(() => {
    async function loadList() {
      try {
        setLoading(true);
        setError(null);

        const list =
          await getOrCreateShoppingList();

        setShoppingListId(list.id);

        const listItems =
          await getShoppingListItems(list.id);

        setItems(listItems);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load your grocery list."
        );
      } finally {
        setLoading(false);
      }
    }

    loadList();
  }, []);

  /*
   * Product autocomplete.
   */
  useEffect(() => {
    const searchTerm =
      productName.trim();

    if (!searchTerm) {
      setProductOptions([]);
      setShowSuggestions(false);
      return;
    }

    // Don't reopen the dropdown right after a selection.
    if (searchTerm === selectedProduct) {
      return;
    }

    const timeout = setTimeout(
      async () => {
        try {
          const { data, error } =
            await supabase
              .from("products")
              // prices!inner: only suggest products that
              // have at least one price.
              .select("name, prices!inner(id)")
              .ilike(
                "name",
                `%${searchTerm}%`
              );

          if (error) {
            throw error;
          }

          const uniqueNames =
            Array.from(
              new Set(
                (data || []).map(
                  (product) =>
                    product.name
                )
              )
            );

          setProductOptions(
            uniqueNames.map(
              (name) => ({ name })
            )
          );

          setShowSuggestions(
            uniqueNames.length > 0
          );
        } catch (err) {
          console.error(
            "Unable to search products:",
            err
          );
        }
      },
      250
    );

    return () =>
      clearTimeout(timeout);
  }, [productName, selectedProduct]);

  /*
   * Generate requested quantity
   * options based on product type.
   */
  function buildQuantityOptions(
    unitType: string
  ): RequestedQuantityOption[] {
    const options: RequestedQuantityOption[] =
      [];

    if (unitType === "weight") {
      for (let i = 1; i <= 20; i++) {
        options.push({
          value: `${i}-lb`,
          quantity: i,
          unit: "lb",
          label: `${i} lb`,
        });
      }

      return options;
    }

    if (unitType === "volume") {
      for (let i = 1; i <= 10; i++) {
        options.push({
          value: `${i}-gal`,
          quantity: i,
          unit: "gal",
          label: `${i} gal`,
        });
      }

      return options;
    }

    if (unitType === "count") {
      for (let i = 1; i <= 20; i++) {
        options.push({
          value: `${i}-count`,
          quantity: i,
          unit: "count",
          label: `${i} count`,
        });
      }

      return options;
    }

    for (let i = 1; i <= 20; i++) {
      options.push({
        value: `${i}-${unitType}`,
        quantity: i,
        unit: unitType,
        label: `${i} ${unitType}`,
      });
    }

    return options;
  }

  /*
   * Select a product and load its
   * available quantity type.
   */
  async function selectProduct(
    product: ProductOption
  ) {
    try {
      setProductNameRaw(product.name);
      setSelectedProduct(product.name);
      setShowSuggestions(false);

      setQuantity("");
      setUnit("");
      setSelectedQuantityKey("");
      setQuantityOptions([]);

      setLoadingQuantities(true);
      setError(null);

      const { data, error } =
        await supabase
          .from("products")
          .select(
            "quantity, unit, unit_type"
          )
          .eq("name", product.name);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setQuantityOptions([]);
        return;
      }

      const unitType =
        String(data[0].unit_type)
          .toLowerCase()
          .trim();

      const requestedOptions =
        buildQuantityOptions(
          unitType
        );

      setQuantityOptions(
        requestedOptions
      );

      setQuantity("");
      setUnit("");
      setSelectedQuantityKey("");
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load available quantities."
      );
    } finally {
      setLoadingQuantities(false);
    }
  }

  /*
   * Select a requested quantity.
   */
  function selectQuantity(
    value: string
  ) {
    const selected =
      quantityOptions.find(
        (option) =>
          option.value === value
      );

    if (!selected) {
      setSelectedQuantityKey("");
      setQuantity("");
      setUnit("");
      return;
    }

    setSelectedQuantityKey(value);
    setQuantity(
      String(selected.quantity)
    );
    setUnit(selected.unit);
  }

  /*
   * Add item.
   */
  async function addItem() {
    const trimmedName =
      productName.trim();

    setDuplicateWarning(null);

    if (!trimmedName) {
      return;
    }

    if (trimmedName !== selectedProduct) {
      setError(
        "Please choose a product from the dropdown list."
      );

      return;
    }

    const duplicate =
      items.find(
        (item) =>
          item.product_name
            .toLowerCase() ===
          trimmedName.toLowerCase()
      );

    if (duplicate) {
      setDuplicateWarning(
        `${duplicate.product_name} is already on your list. Edit the existing item below instead of adding it again.`
      );

      return;
    }

    if (!quantity || !unit) {
      setError(
        "Please select a quantity."
      );

      return;
    }

    if (!shoppingListId) {
      return;
    }

    try {
      setAdding(true);
      setError(null);

      const newItem =
        await addShoppingListItem({
          shoppingListId,
          productName:
            trimmedName,
          quantity:
            Number(quantity),
          unit,
        });

      setItems((current) => [
        ...current,
        newItem,
      ]);

      setProductNameRaw("");
      setSelectedProduct("");
      setQuantity("");
      setUnit("");
      setSelectedQuantityKey("");
      setProductOptions([]);
      setQuantityOptions([]);
      setShowSuggestions(false);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to add this item."
      );
    } finally {
      setAdding(false);
    }
  }

  /*
   * Begin editing an existing item.
   */
    async function startEditingItem(
    item: ShoppingListItem
    ) {
    console.log("EDIT CLICKED:", item);

    // Immediately switch this item into edit mode.
    setEditingItemId(item.id);

    // Clear the previous item's selection.
    setEditingQuantityKey("");

    setError(null);

    try {
        setLoadingQuantities(true);

        const { data, error } =
        await supabase
            .from("products")
            .select(
            "quantity, unit, unit_type"
            )
            .eq(
            "name",
            item.product_name
            );

        if (error) {
        throw error;
        }

        console.log(
        "PRODUCT DATA FOR EDIT:",
        data
        );

        if (!data || data.length === 0) {
        setQuantityOptions([]);
        return;
        }

        const unitType =
        String(data[0].unit_type)
            .toLowerCase()
            .trim();

        const options =
        buildQuantityOptions(
            unitType
        );

        console.log(
        "EDIT QUANTITY OPTIONS:",
        options
        );

        setQuantityOptions(options);

        const currentOption =
        options.find(
            (option) =>
            Number(option.quantity) ===
                Number(item.quantity) &&
            option.unit.toLowerCase() ===
                item.unit.toLowerCase()
        );

        if (currentOption) {
        setEditingQuantityKey(
            currentOption.value
        );
        }
    } catch (err) {
        console.error(
        "EDIT ERROR:",
        err
        );

        setError(
        "Unable to load quantity options."
        );
    } finally {
        setLoadingQuantities(false);
    }
    }


  /*
   * Save edited quantity.
   */
  async function saveItemQuantity(
    item: ShoppingListItem
  ) {
    if (!editingQuantityKey) {
      return;
    }

    const selected =
      quantityOptions.find(
        (option) =>
          option.value ===
          editingQuantityKey
      );

    if (!selected) {
      return;
    }

    try {
      setSavingEdit(true);
      setError(null);

      const updated =
        await updateShoppingListItem(
          item.id,
          selected.quantity,
          selected.unit
        );

      setItems((current) =>
        current.map(
          (currentItem) =>
            currentItem.id === item.id
              ? updated
              : currentItem
        )
      );

      setEditingItemId(null);
      setEditingQuantityKey("");
    } catch (err) {
      console.error(err);

      setError(
        "Unable to update this item."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  /*
   * Remove item.
   */
  async function removeItem(
    id: string
  ) {
    try {
      setError(null);

      await deleteShoppingListItem(
        id
      );

      setItems((current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to remove this item."
      );
    }
  }

  return {
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

    editingItemId,
    editingQuantityKey,
    savingEdit,
    duplicateWarning,
    selectedQuantityKey,

    setProductName,
    setQuantity,
    setUnit,
    setEditingQuantityKey,
    setEditingItemId,

    selectProduct,
    selectQuantity,

    addItem,
    removeItem,
    startEditingItem,
    saveItemQuantity,

    onFindBestPrices,
  };
}