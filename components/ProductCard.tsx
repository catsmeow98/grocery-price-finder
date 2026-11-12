import AddToListButton from "@/components/shopping-list/AddToListButton";
import BrandPreferenceButtons from "@/components/preferences/BrandPreferenceButtons";
import { getPreference } from "@/lib/preferenceUtils";
import type { Preference, PreferenceMap } from "@/types/shopping";
import {
  getUnitPrice,
  formatUnitPrice,
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

type ProductCardProps = {
  name: string;
  products: Product[];
  separateBrands?: boolean;
  preferences?: PreferenceMap;
  onSetPreference?: (
    productName: string,
    brand: string,
    preference: Preference | null
  ) => void;
};

export default function ProductCard({
  name,
  products,
  separateBrands = false,
  preferences,
  onSetPreference,
}: ProductCardProps) {
  /*
   * Calculate unit price for every option.
   */
  const productsWithUnitPrice = products.map(
    (product) => ({
      ...product,

      unitPrice: getUnitPrice({
        price: Number(product.price),
        quantity: Number(product.quantity),
        unit: product.unit,
        unit_type: product.unit_type,
      }),
    })
  );

  /*
   * Sort all options by unit price.
   * Lowest unit price = best value.
   */
  const sortedProducts = [
    ...productsWithUnitPrice,
  ].sort(
    (a, b) =>
      (a.unitPrice?.pricePerUnit ?? Infinity) -
      (b.unitPrice?.pricePerUnit ?? Infinity)
  );

  /*
   * Blocked brands are never the "best value".
   */
  const isBlocked = (product: Product) =>
    getPreference(
      preferences,
      product.name,
      product.brand
    ) === "blocked";

  // If every option is blocked, nothing is marked best value.
  const bestProduct = sortedProducts.find(
    (product) => !isBlocked(product)
  );

  /*
   * Dollar savings only applies when all
   * options have the same package size.
   */
  const comparableQuantities =
    products.length > 1 &&
    products.every(
      (product) =>
        product.quantity === products[0].quantity &&
        product.unit === products[0].unit
    );

  let dollarSavings = 0;

  if (comparableQuantities && bestProduct) {
    const highestPrice = Math.max(
      ...products.map((product) =>
        Number(product.price)
      )
    );

    dollarSavings =
      highestPrice - Number(bestProduct.price);
  }

  /*
   * What "Add to list" adds: 1 lb / 1 gal for weight and
   * volume items, or the smallest package size for counts
   * (e.g. 12 eggs). It can be edited on the list page.
   */
  const unitType = String(
    products[0]?.unit_type ?? ""
  )
    .toLowerCase()
    .trim();

  let defaultQuantity = 1;
  let defaultUnit = products[0]?.unit ?? "";

  if (unitType === "weight") {
    defaultUnit = "lb";
  } else if (unitType === "volume") {
    defaultUnit = "gal";
  } else if (unitType === "count") {
    defaultUnit = "count";

    const smallest = Math.min(
      ...products.map((product) =>
        Number(product.quantity)
      )
    );

    if (
      Number.isInteger(smallest) &&
      smallest >= 1 &&
      smallest <= 20
    ) {
      defaultQuantity = smallest;
    }
  }

  /*
   * When Compare Brands is OFF, the card
   * represents one brand, so include that
   * brand in the card title.
   *
   * Example:
   * Friendly Farms Almond Milk
   */
  const cardTitle =
    separateBrands && products[0]?.brand
      ? `${products[0].brand} ${name}`
      : name;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/30 hover:bg-surface-hover">
      {/* Product header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {cardTitle}
          </h3>

          <p className="mt-1 text-sm text-text-muted">
            {sortedProducts.length} options
          </p>
        </div>

        <AddToListButton
          productName={name}
          defaultQuantity={defaultQuantity}
          defaultUnit={defaultUnit}
        />
      </div>

      {/* Product options */}
      <div className="space-y-2">
        {sortedProducts.map((product) => {
          const isBestDeal =
            product.id === bestProduct?.id;

          const preference = getPreference(
            preferences,
            product.name,
            product.brand
          );

          const onSale = Boolean(product.sale_price);

          return (
            <div
              key={product.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                isBestDeal
                  ? "border-accent-border bg-accent-background"
                  : "border-border-subtle bg-background/30"
              } ${preference === "blocked" ? "opacity-50" : ""}`}
            >
              {/* Store information */}
              <div className="flex items-center gap-3">
                {isBestDeal ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    ★
                  </div>
                ) : (
                  <div className="h-8 w-8 shrink-0" />
                )}

                <div>
                  {/* Compare Brands ON:
                      Brand @ Store

                      Compare Brands OFF:
                      Store only
                  */}
                  <p
                    className={`text-sm font-medium ${
                      isBestDeal
                        ? "text-foreground"
                        : "text-text-secondary"
                    }`}
                  >
                    {separateBrands
                      ? product.stores?.name
                      : product.brand
                        ? `${product.brand} @ `
                        : ""}
                    {!separateBrands &&
                      product.stores?.name}

                    {onSale && (
                      <span className="ml-2 rounded-full border border-accent-border bg-accent-background px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-accent">
                        Sale
                      </span>
                    )}
                  </p>

                  {/* Quantity / City */}
                  <p className="text-xs text-text-muted">
                    {product.quantity}{" "}
                    {product.unit}
                    {product.stores?.city
                      ? ` · ${product.stores.city}`
                      : ""}
                  </p>

                  {product.brand && onSetPreference && (
                    <BrandPreferenceButtons
                      brand={product.brand}
                      preference={preference}
                      onChange={(value) =>
                        onSetPreference(
                          product.name,
                          product.brand as string,
                          value
                        )
                      }
                    />
                  )}
                </div>
              </div>

              {/* Price information */}
              <div className="text-right">
                {onSale &&
                  product.regular_price !== undefined && (
                    <p className="text-xs text-text-muted line-through">
                      $
                      {Number(
                        product.regular_price
                      ).toFixed(2)}
                    </p>
                  )}

                <p
                  className={`text-lg font-semibold ${
                    isBestDeal
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  $
                  {Number(product.price).toFixed(2)}
                </p>

                {product.unitPrice && (
                  <p className="text-xs text-text-muted">
                    {formatUnitPrice(
                      product.unitPrice
                        .pricePerUnit,
                      product.unitPrice
                        .displayUnit
                    )}
                  </p>
                )}

                {isBestDeal && (
                  <p className="mt-1 text-xs font-medium text-accent">
                    ★ Best value
                    {dollarSavings > 0
                      ? ` · Save $${dollarSavings.toFixed(
                          2
                        )}`
                      : ""}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
