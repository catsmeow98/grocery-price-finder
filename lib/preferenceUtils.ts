import type {
  Preference,
  PreferenceMap,
} from "@/types/shopping";

/*
 * One preference applies to a product NAME + BRAND
 * (e.g. "2% Milk" + "Sunny Meadow"). Case-insensitive.
 */
export function preferenceKey(
  productName: string,
  brand: string | null | undefined
): string {
  return `${productName.trim().toLowerCase()}|${(
    brand ?? ""
  )
    .trim()
    .toLowerCase()}`;
}

export function getPreference(
  preferences: PreferenceMap | undefined,
  productName: string,
  brand: string | null | undefined
): Preference | undefined {
  if (!preferences || !brand) return undefined;

  return preferences[preferenceKey(productName, brand)];
}
