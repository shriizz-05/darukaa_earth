import type {
  GeoJsonFeatureCollection,
  GeoJsonPolygon,
  SiteFeature,
  SiteView,
} from "../types/site";

export const EMPTY_SITE_COLLECTION: GeoJsonFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function asNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function asText(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  const text = String(value).trim();
  return text.length === 0 ? null : text;
}

export function closePolygonRing(coordinates: number[][][]): number[][][] {
  return coordinates.map((ring) => {
    if (!Array.isArray(ring) || ring.length === 0) {
      return ring;
    }
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (
      first &&
      last &&
      (first[0] !== last[0] || first[1] !== last[1] || first.length !== last.length)
    ) {
      return [...ring, [...first]];
    }
    return ring;
  });
}

export function toPolygonGeometry(
  geometry: { type?: string; coordinates?: unknown } | null | undefined,
): GeoJsonPolygon | null {
  if (!geometry || geometry.type !== "Polygon" || !Array.isArray(geometry.coordinates)) {
    return null;
  }
  const coordinates = closePolygonRing(geometry.coordinates as number[][][]);
  const ring = coordinates[0];
  if (!ring || ring.length < 4) {
    return null;
  }
  return { type: "Polygon", coordinates };
}

const EARTH_RADIUS_M = 6378137;

function ringAreaSqM(ring: number[][]): number {
  const length = ring.length;
  if (length < 3) {
    return 0;
  }
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  let area = 0;
  for (let i = 0; i < length; i += 1) {
    let lowerIndex: number;
    let middleIndex: number;
    let upperIndex: number;
    if (i === length - 2) {
      lowerIndex = length - 2;
      middleIndex = length - 1;
      upperIndex = 0;
    } else if (i === length - 1) {
      lowerIndex = length - 1;
      middleIndex = 0;
      upperIndex = 1;
    } else {
      lowerIndex = i;
      middleIndex = i + 1;
      upperIndex = i + 2;
    }
    const p1 = ring[lowerIndex];
    const p2 = ring[middleIndex];
    const p3 = ring[upperIndex];
    if (!p1 || !p2 || !p3) {
      continue;
    }
    area += (rad(p3[0]) - rad(p1[0])) * Math.sin(rad(p2[1]));
  }
  return (area * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2;
}

/** Approximate geodesic area in km² from a closed GeoJSON polygon (outer ring minus holes). */
export function polygonAreaSqKm(geometry: GeoJsonPolygon | null | undefined): number | null {
  if (!geometry || geometry.type !== "Polygon" || !Array.isArray(geometry.coordinates)) {
    return null;
  }
  const rings = geometry.coordinates;
  if (!rings[0] || rings[0].length < 4) {
    return null;
  }
  let areaM2 = 0;
  rings.forEach((ring, index) => {
    const ringArea = ringAreaSqM(ring);
    areaM2 += index === 0 ? Math.abs(ringArea) : -Math.abs(ringArea);
  });
  const sqKm = areaM2 / 1_000_000;
  if (!Number.isFinite(sqKm) || sqKm <= 0) {
    return null;
  }
  return sqKm;
}

export function siteViewFromFeature(feature: SiteFeature): SiteView | null {
  const rawId = feature.id ?? feature.properties?.id;
  const id = asNumber(rawId);
  if (id == null) {
    return null;
  }
  const properties = feature.properties ?? {};
  return {
    id,
    name: asText(properties.name) ?? `Site ${id}`,
    description: asText(properties.description),
    projectId: asNumber(properties.projectId),
    areaSqKm: asNumber(properties.areaSqKm),
    centroidLatitude: asNumber(properties.centroidLatitude),
    centroidLongitude: asNumber(properties.centroidLongitude),
  };
}

export function collectLngLats(collection: GeoJsonFeatureCollection): [number, number][] {
  const points: [number, number][] = [];
  for (const feature of collection.features) {
    const coordinates = feature.geometry?.coordinates;
    if (!Array.isArray(coordinates)) {
      continue;
    }
    for (const ring of coordinates as number[][][]) {
      if (!Array.isArray(ring)) {
        continue;
      }
      for (const position of ring) {
        if (Array.isArray(position) && position.length >= 2) {
          const lng = Number(position[0]);
          const lat = Number(position[1]);
          if (Number.isFinite(lng) && Number.isFinite(lat)) {
            points.push([lng, lat]);
          }
        }
      }
    }
  }
  return points;
}
