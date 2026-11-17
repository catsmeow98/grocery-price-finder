/*
 * Distances.
 *
 * We estimate driving distance as the straight-line distance
 * multiplied by ROAD_FACTOR (roads are rarely a straight line;
 * 1.3 is a common rule of thumb for suburban street grids).
 * This needs no paid map service. A routing API could replace
 * estimateDrivingMiles later without changing anything else.
 */
export const ROAD_FACTOR = 1.3;

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function straightLineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_MILES *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

export function estimateDrivingMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return (
    straightLineMiles(lat1, lng1, lat2, lng2) *
    ROAD_FACTOR
  );
}

/*
 * ZIP code -> coordinates (the middle of the ZIP area),
 * using the free zippopotam.us service.
 */
export async function lookupZip(zip: string): Promise<{
  latitude: number;
  longitude: number;
  place: string;
}> {
  const clean = zip.trim();

  if (!/^\d{5}$/.test(clean)) {
    throw new Error("Enter a 5-digit ZIP code.");
  }

  const response = await fetch(
    `https://api.zippopotam.us/us/${clean}`
  );

  if (response.status === 404) {
    throw new Error("We couldn't find that ZIP code.");
  }

  if (!response.ok) {
    throw new Error("The ZIP lookup is not available right now.");
  }

  const data = (await response.json()) as {
    places?: {
      "place name"?: string;
      latitude?: string;
      longitude?: string;
    }[];
  };

  const place = data.places?.[0];

  const latitude = Number(place?.latitude);
  const longitude = Number(place?.longitude);

  if (
    !place ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error("We couldn't find that ZIP code.");
  }

  return {
    latitude,
    longitude,
    place: place["place name"] ?? clean,
  };
}
