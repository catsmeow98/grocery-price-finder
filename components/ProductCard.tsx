import {
  getUnitPrice,
  formatUnitPrice,
} from "@/lib/priceUtils";

type Product = {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  unit: string;
  unit_type: string;
  price: number;
  stores?: {
    name: string;
    city: string;
  };
};

type ProductCardProps = {
  name: string;
  products: Product[];
  separateBrands?: boolean;
};

export default function ProductCard({
  name,
  products,
  separateBrands = false,
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

  const bestProduct = sortedProducts[0];

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
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-foreground">
          {cardTitle}
        </h3>

        <p className="mt-1 text-sm text-text-muted">
          {sortedProducts.length} options
        </p>
      </div>

      {/* Product options */}
      <div className="space-y-2">
        {sortedProducts.map((product, index) => {
          const isBestDeal = index === 0;

          return (
            <div
              key={product.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                isBestDeal
                  ? "border-accent-border bg-accent-background"
                  : "border-border-subtle bg-background/30"
              }`}
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
                  </p>

                  {/* Quantity / City */}
                  <p className="text-xs text-text-muted">
                    {product.quantity}{" "}
                    {product.unit}
                    {product.stores?.city
                      ? ` · ${product.stores.city}`
                      : ""}
                  </p>
                </div>
              </div>

              {/* Price information */}
              <div className="text-right">
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
