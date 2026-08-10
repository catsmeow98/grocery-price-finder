"use client";

type FilterBarProps = {
  products: string[];

  quantities: {
    value: string;
    label: string;
  }[];

  brands: string[];
  stores: string[];

  selectedProduct: string;
  selectedQuantity: string;
  selectedBrand: string;
  selectedStore: string;

  onProductChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onStoreChange: (value: string) => void;
};

export default function FilterBar({
  products,
  quantities,
  brands,
  stores,
  selectedProduct,
  selectedQuantity,
  selectedBrand,
  selectedStore,
  onProductChange,
  onQuantityChange,
  onBrandChange,
  onStoreChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Product filter */}
      <select
        value={selectedProduct}
        onChange={(e) =>
          onProductChange(e.target.value)
        }
        className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
      >
        <option value="">All products</option>

        {products.map((product) => (
          <option key={product} value={product}>
            {product}
          </option>
        ))}
      </select>

      {/* Quantity filter */}
      <select
        value={selectedQuantity}
        onChange={(e) =>
          onQuantityChange(e.target.value)
        }
        className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
      >
        <option value="">All quantities</option>

        {quantities.map((quantity) => (
          <option
            key={quantity.value}
            value={quantity.value}
          >
            {quantity.label}
          </option>
        ))}
      </select>

      {/* Brand filter */}
      <select
        value={selectedBrand}
        onChange={(e) =>
          onBrandChange(e.target.value)
        }
        className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
      >
        <option value="">All brands</option>

        {brands.map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </select>

      {/* Store filter */}
      <select
        value={selectedStore}
        onChange={(e) =>
          onStoreChange(e.target.value)
        }
        className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
      >
        <option value="">All stores</option>

        {stores.map((store) => (
          <option key={store} value={store}>
            {store}
          </option>
        ))}
      </select>
    </div>
  );
}
