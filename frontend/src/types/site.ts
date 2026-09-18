export type SiteGeometry = {
  type: string;
  coordinates?: unknown;
};

export type GeoJsonPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export type SiteSummary = {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  centroidLatitude: number | null;
  centroidLongitude: number | null;
  areaSqKm: number | null;
  geometry?: SiteGeometry | GeoJsonPolygon | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSiteRequest = {
  name: string;
  description: string | null;
  geometry: GeoJsonPolygon;
};

export type SiteFeatureProperties = {
  id?: number | string;
  name?: string | null;
  description?: string | null;
  projectId?: number | null;
  areaSqKm?: number | string | null;
  centroidLatitude?: number | string | null;
  centroidLongitude?: number | string | null;
  [key: string]: unknown;
};

export type SiteFeature = {
  type: "Feature";
  id?: number | string;
  properties?: SiteFeatureProperties;
  geometry?: SiteGeometry | GeoJsonPolygon | null;
};

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: SiteFeature[];
};

export type SiteView = {
  id: number;
  name: string;
  description: string | null;
  projectId: number | null;
  areaSqKm: number | null;
  centroidLatitude: number | null;
  centroidLongitude: number | null;
};
