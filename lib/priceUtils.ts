export type UnitType =
  | "weight"
  | "volume"
  | "count";

type UnitPriceInput = {
  price: number;
  quantity: number;
  unit: string;
  unit_type: string;
};

export type UnitPriceResult = {
  pricePerUnit: number;
  displayUnit: string;
  normalizedQuantity: number;
  normalizedUnit: string;
};

/*
 * Normalize quantities so equivalent quantities
 * are represented the same way internally.
 *
 * Weight  → ounces
 * Volume  → fluid ounces
 * Count   → count
 */
export function normalizeQuantity(
  quantity: number,
  unit: string,
  unitType: string
) {
  const normalizedUnit =
    unit.toLowerCase().trim();

  const normalizedType =
    unitType.toLowerCase().trim();

  /*
   * WEIGHT
   *
   * Everything is converted to ounces.
   *
   * 1 lb  → 16 oz
   * 3 lb  → 48 oz
   * 5 lb  → 80 oz
   */
  if (normalizedType === "weight") {
    switch (normalizedUnit) {
      case "lb":
      case "lbs":
      case "pound":
      case "pounds":
        return {
          quantity: quantity * 16,
          unit: "oz",
        };

      case "oz":
      case "ounce":
      case "ounces":
        return {
          quantity,
          unit: "oz",
        };

      case "kg":
      case "kilogram":
      case "kilograms":
        return {
          quantity: quantity * 35.27396,
          unit: "oz",
        };

      case "g":
      case "gram":
      case "grams":
        return {
          quantity: quantity * 0.035274,
          unit: "oz",
        };

      default:
        return {
          quantity,
          unit: normalizedUnit,
        };
    }
  }

  /*
   * VOLUME
   *
   * Everything is converted to fluid ounces.
   *
   * 1 gal   → 128 oz
   * 0.5 gal → 64 oz
   * 1 qt    → 32 oz
   * 1 pt    → 16 oz
   */
  if (normalizedType === "volume") {
    switch (normalizedUnit) {
      case "gal":
      case "gallon":
      case "gallons":
        return {
          quantity: quantity * 128,
          unit: "oz",
        };

      case "qt":
      case "quart":
      case "quarts":
        return {
          quantity: quantity * 32,
          unit: "oz",
        };

      case "pt":
      case "pint":
      case "pints":
        return {
          quantity: quantity * 16,
          unit: "oz",
        };

      case "cup":
      case "cups":
        return {
          quantity: quantity * 8,
          unit: "oz",
        };

      case "oz":
      case "fl oz":
      case "floz":
      case "fluid oz":
      case "fluid ounce":
      case "fluid ounces":
        return {
          quantity,
          unit: "oz",
        };

      default:
        return {
          quantity,
          unit: normalizedUnit,
        };
    }
  }

  /*
   * COUNT
   */
  if (normalizedType === "count") {
    return {
      quantity,
      unit: "count",
    };
  }

  /*
   * Unknown unit type
   */
  return {
    quantity,
    unit: normalizedUnit,
  };
}

/*
 * Calculate price per normalized unit.
 *
 * Examples:
 *
 * $3.99 / 1 lb
 * → $0.249 / oz
 *
 * $3.99 / 1 gallon
 * → $0.031 / oz
 */
export function getUnitPrice({
  price,
  quantity,
  unit,
  unit_type,
}: UnitPriceInput): UnitPriceResult | null {
  if (
    !price ||
    !quantity ||
    !unit ||
    !unit_type
  ) {
    return null;
  }

  const normalized = normalizeQuantity(
    quantity,
    unit,
    unit_type
  );

  if (normalized.quantity <= 0) {
    return null;
  }

  return {
    pricePerUnit:
      price / normalized.quantity,

    displayUnit: normalized.unit,

    normalizedQuantity:
      normalized.quantity,

    normalizedUnit:
      normalized.unit,
  };
}

/*
 * Create a consistent key for filtering
 * and grouping equivalent quantities.
 *
 * Examples:
 *
 * 1 gallon  → volume-128
 * 128 oz    → volume-128
 * 4 quarts  → volume-128
 *
 * 1 lb      → weight-16
 * 16 oz     → weight-16
 */
export function getQuantityKey(
  quantity: number,
  unit: string,
  unitType: string
) {
  const normalized = normalizeQuantity(
    quantity,
    unit,
    unitType
  );

  return `${unitType
    .toLowerCase()
    .trim()}-${normalized.quantity.toFixed(
    4
  )}`;
}

/*
 * Create a shopper-friendly display label.
 *
 * Volume:
 *   64 oz (0.5 gal)
 *   128 oz (1 gal)
 *
 * Weight:
 *   16 oz (1 lb)
 *   48 oz (3 lb)
 *
 * Count:
 *   12 count
 */
export function formatQuantity(
  quantity: number,
  unit: string,
  unitType: string
) {
  const normalized = normalizeQuantity(
    quantity,
    unit,
    unitType
  );

  const value = normalized.quantity;

  const normalizedType =
    unitType.toLowerCase().trim();

  const cleanNumber = (number: number) =>
    Number(number.toFixed(4)).toString();

  /*
   * VOLUME
   *
   * Always display:
   *
   * ounces (gallons)
   */
  if (normalizedType === "volume") {
    const gallons = value / 128;

    return `${cleanNumber(value)} oz (${cleanNumber(
      gallons
    )} gal)`;
  }

  /*
   * WEIGHT
   *
   * Always display:
   *
   * ounces (pounds)
   */
  if (normalizedType === "weight") {
    const pounds = value / 16;

    return `${cleanNumber(value)} oz (${cleanNumber(
      pounds
    )} lb)`;
  }

  /*
   * COUNT
   */
  if (normalizedType === "count") {
    return `${cleanNumber(quantity)} count`;
  }

  return `${cleanNumber(quantity)} ${unit}`;
}

/*
 * Format unit price for display.
 *
 * Example:
 *
 * $0.249 / oz
 */
export function formatUnitPrice(
  pricePerUnit: number,
  unit: string
) {
  return `$${pricePerUnit.toFixed(3)} / ${unit}`;
}

/**
 * Convert a shopping-list quantity into the
 * normalized unit used by the product.
 *
 * Weight:
 *   lb -> oz
 *
 * Volume:
 *   gal -> oz
 *
 * Count:
 *   stays as count
 */
export function normalizeShoppingQuantity(
  quantity: number,
  unit: string,
  unitType: string
) {
  const normalizedUnit =
    unit.toLowerCase().trim();

  const normalizedType =
    unitType.toLowerCase().trim();

  if (normalizedType === "weight") {
    switch (normalizedUnit) {
      case "lb":
      case "lbs":
      case "pound":
      case "pounds":
        return quantity * 16;

      case "oz":
      case "ounce":
      case "ounces":
        return quantity;

      case "kg":
      case "kilogram":
      case "kilograms":
        return quantity * 35.27396;

      case "g":
      case "gram":
      case "grams":
        return quantity * 0.035274;

      default:
        return quantity;
    }
  }

  if (normalizedType === "volume") {
    switch (normalizedUnit) {
      case "gal":
      case "gallon":
      case "gallons":
        return quantity * 128;

      case "oz":
      case "fl oz":
      case "fluid ounce":
      case "fluid ounces":
        return quantity;

      case "qt":
      case "quart":
      case "quarts":
        return quantity * 32;

      case "pt":
      case "pint":
      case "pints":
        return quantity * 16;

      case "cup":
      case "cups":
        return quantity * 8;

      default:
        return quantity;
    }
  }

  return quantity;
}

/**
 * Find the cheapest number of packages needed
 * to satisfy a requested quantity.
 *
 * Example:
 *
 * Need: 2 lb
 * Package: 1 lb @ $3.99
 *
 * Result:
 * 2 packages
 * $7.98
 */
export function getBestPackageCombination({
  requestedQuantity,
  requestedUnit,
  productQuantity,
  productUnit,
  unitType,
  price,
}: {
  requestedQuantity: number;
  requestedUnit: string;
  productQuantity: number;
  productUnit: string;
  unitType: string;
  price: number;
}) {
  const requestedNormalized =
    normalizeShoppingQuantity(
      requestedQuantity,
      requestedUnit,
      unitType
    );

  const packageNormalized =
    normalizeShoppingQuantity(
      productQuantity,
      productUnit,
      unitType
    );

  if (
    requestedNormalized <= 0 ||
    packageNormalized <= 0 ||
    price < 0
  ) {
    return null;
  }

  /*
   * Number of packages required to meet
   * or exceed the requested quantity.
   */
  const packagesNeeded = Math.ceil(
    requestedNormalized /
      packageNormalized
  );

  const totalQuantity =
    packagesNeeded *
    packageNormalized;

  const totalPrice =
    packagesNeeded * price;

  return {
    packagesNeeded,
    totalQuantity,
    totalPrice,
    pricePerNormalizedUnit:
      totalPrice / totalQuantity,
  };
}
