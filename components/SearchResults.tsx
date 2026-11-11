"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";
import BrandToggle from "@/components/BrandToggle";
import { usePreferences } from "@/components/preferences/usePreferences";
import { withNext } from "@/lib/redirect";
import type { Preference } from "@/types/shopping";
import {
  getQuantityKey,
  formatQuantity,
} from "@/lib/priceUtils";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  quantity: number;
  unit: string;
  unit_type: string;
  price: number;
  regular_price?: number;
  sale_price?: number | null;
  stores?: {
    name: string;
    city: string;
  } | null;
};

type SearchResultsProps = {
  products: Product[];
  search?: string;
};

export default function SearchResults({
  products,
  search,
}: SearchResultsProps) {
  const router = useRouter();

  const {
    map: preferences,
    loggedIn,
    updatePreference,
    problem: preferenceProblem,
  } = usePreferences();

  function handleSetPreference(
    productName: string,
    brand: string,
    preference: Preference | null
  ) {
    // Logged out: log in first, then come back here.
    if (loggedIn === false) {
      router.push(
        withNext(
          "/login",
          window.location.pathname +
            window.location.search
        )
      );
      return;
    }

    updatePreference(productName, brand, preference);
  }

  // --------------------------------
  // Filter state
  // --------------------------------

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedStore, setSelectedStore] = useState("");

  const [compareBrands, setCompareBrands] = useState(true);

  // --------------------------------
  // Filter options
  // --------------------------------

  const productOptions = useMemo(() => {
    return [...new Set(products.map((product) => product.name))].sort();
  }, [products]);

  const quantityOptions = useMemo(() => {
    const quantities = new Map<
        string,
        {
        value: string;
        label: string;
        }
    >();

    products.forEach((product) => {
        const value = getQuantityKey(
        Number(product.quantity),
        product.unit,
        product.unit_type
        );

        const label = formatQuantity(
        Number(product.quantity),
        product.unit,
        product.unit_type
        );

        // Only add the first representation of
        // each normalized quantity.
        if (!quantities.has(value)) {
        quantities.set(value, {
            value,
            label,
        });
        }
    });

    return Array.from(quantities.values()).sort(
        (a, b) => {
        const aValue = Number(
            a.value.split("-").pop()
        );

        const bValue = Number(
            b.value.split("-").pop()
        );

        return aValue - bValue;
        }
    );
    }, [products]);


  const brandOptions = useMemo(() => {
    return [
      ...new Set(
        products
          .map((product) => product.brand)
          .filter(
            (brand): brand is string => Boolean(brand)
          )
      ),
    ].sort();
  }, [products]);

  const storeOptions = useMemo(() => {
    return [
      ...new Set(
        products
          .map((product) => product.stores?.name)
          .filter(
            (store): store is string => Boolean(store)
          )
      ),
    ].sort();
  }, [products]);

  // --------------------------------
  // Apply filters
  // --------------------------------

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
        if (
        selectedProduct &&
        product.name !== selectedProduct
        ) {
        return false;
        }

        const quantityKey = getQuantityKey(
        product.quantity,
        product.unit,
        product.unit_type
        );

        if (
        selectedQuantity &&
        quantityKey !== selectedQuantity
        ) {
        return false;
        }

        if (
        selectedBrand &&
        product.brand !== selectedBrand
        ) {
        return false;
        }

        if (
        selectedStore &&
        product.stores?.name !== selectedStore
        ) {
        return false;
        }

        return true;
    });
    }, [
    products,
    selectedProduct,
    selectedQuantity,
    selectedBrand,
    selectedStore,
    ]);

  // --------------------------------
  // Group products for display
  // --------------------------------

  const groupedProducts = useMemo(() => {
    const groups: Record<
      string,
      {
        name: string;
        products: Product[];
      }
    > = {};

    filteredProducts.forEach((product) => {
      /*
       * When Compare Brands is ON:
       *
       * All brands, stores, and quantities
       * for a product go into ONE card.
       */
      const productKey = compareBrands
        ? product.name
        : `${product.name}-${product.brand}`;

      if (!groups[productKey]) {
        groups[productKey] = {
          name: product.name,
          products: [],
        };
      }

      groups[productKey].products.push(product);
    });

    return Object.entries(groups).map(
      ([key, group]) => ({
        key,
        ...group,
      })
    );
  }, [filteredProducts, compareBrands]);

  // --------------------------------
  // Render
  // --------------------------------

  return (
    <>
      {preferenceProblem && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {preferenceProblem}
        </p>
      )}

      {/* Results header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          {filteredProducts.length} prices found
        </p>

        <BrandToggle
          enabled={compareBrands}
          onChange={setCompareBrands}
        />
      </div>

      {/* Filters */}
      <FilterBar
        products={productOptions}
        quantities={quantityOptions}
        brands={brandOptions}
        stores={storeOptions}
        selectedProduct={selectedProduct}
        selectedQuantity={selectedQuantity}
        selectedBrand={selectedBrand}
        selectedStore={selectedStore}
        onProductChange={setSelectedProduct}
        onQuantityChange={setSelectedQuantity}
        onBrandChange={setSelectedBrand}
        onStoreChange={setSelectedStore}
      />

      {/* Results */}
      <div className="mt-8">
        {groupedProducts.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {groupedProducts.map((group) => (
              <ProductCard
                key={group.key}
                name={group.name}
                products={group.products}
                separateBrands={!compareBrands}
                preferences={preferences}
                onSetPreference={handleSetPreference}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center">
            <div className="text-4xl">
              🛒
            </div>

            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No products found
            </h3>

            <p className="mt-2 text-sm text-text-muted">
              Try adjusting your filters or searching
              for something else.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
