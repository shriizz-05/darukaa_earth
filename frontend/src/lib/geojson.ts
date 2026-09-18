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
