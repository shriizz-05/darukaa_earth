import MapboxDraw from "@mapbox/mapbox-gl-draw";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import { collectLngLats, toPolygonGeometry } from "../lib/geojson";
import type { GeoJsonFeatureCollection, GeoJsonPolygon, SiteFeature } from "../types/site";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

const SOURCE_ID = "sites";
const FILL_LAYER = "sites-fill";
const LINE_LAYER = "sites-outline";
const INDIA_CENTER: [number, number] = [78.96, 20.59];

type MapViewProps = {
  token: string;
  sites: GeoJsonFeatureCollection;
  drawing: boolean;
  drawSession: number;
  onDrawComplete: (geometry: GeoJsonPolygon) => void;
  onSiteClick: (feature: SiteFeature | null) => void;
  onError: (message: string) => void;
};

function isAuthError(event: unknown): string | null {
  if (!event || typeof event !== "object") {
    return null;
  }
  const record = event as { error?: { message?: string; status?: number }; message?: string };
  const status = record.error?.status;
  const message = record.error?.message ?? record.message ?? "";
  if (
    status === 401 ||
    status === 403 ||
    /access token|unauthorized|forbidden|not authorized/i.test(message)
  ) {
    return "This Mapbox token was rejected. Create a public token at account.mapbox.com, set VITE_MAPBOX_TOKEN in frontend/.env, and restart Vite.";
  }
  return null;
}

export function MapView({
  token,
  sites,
  drawing,
  drawSession,
  onDrawComplete,
  onSiteClick,
  onError,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const fittedRef = useRef(false);
  const drawingRef = useRef(drawing);
  const sitesRef = useRef(sites);
  const onDrawCompleteRef = useRef(onDrawComplete);
  const onSiteClickRef = useRef(onSiteClick);
  const onErrorRef = useRef(onError);

  drawingRef.current = drawing;
  sitesRef.current = sites;
  onDrawCompleteRef.current = onDrawComplete;
  onSiteClickRef.current = onSiteClick;
  onErrorRef.current = onError;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    mapboxgl.accessToken = token;
    fittedRef.current = false;
    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/dark-v11",
      center: INDIA_CENTER,
      zoom: 4.2,
      attributionControl: true,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: "simple_select",
    });
    drawRef.current = draw;
    map.addControl(draw);

    function addSiteLayers() {
      if (map.getSource(SOURCE_ID)) {
        return;
      }
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: sitesRef.current as unknown as GeoJSON.FeatureCollection,
      });
      map.addLayer({
        id: FILL_LAYER,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": "#4f8f72",
          "fill-opacity": 0.38,
        },
      });
      map.addLayer({
        id: LINE_LAYER,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": "#9ad0b4",
          "line-width": 2,
        },
      });
    }

    function fitToSites(collection: GeoJsonFeatureCollection) {
      const points = collectLngLats(collection);
      if (points.length === 0) {
        return;
      }
      const bounds = new mapboxgl.LngLatBounds(points[0], points[0]);
      for (const point of points) {
        bounds.extend(point);
      }
      map.fitBounds(bounds, { padding: 56, maxZoom: 12, duration: 600 });
      fittedRef.current = true;
    }

    map.on("load", () => {
      addSiteLayers();
      if (!fittedRef.current) {
        fitToSites(sitesRef.current);
      }
      map.resize();
      map.on("mouseenter", FILL_LAYER, () => {
        map.getCanvas().style.cursor = drawingRef.current ? "crosshair" : "pointer";
      });
      map.on("mouseleave", FILL_LAYER, () => {
        map.getCanvas().style.cursor = drawingRef.current ? "crosshair" : "";
      });
    });

    map.on("error", (event) => {
      const message = isAuthError(event);
      if (message) {
        onErrorRef.current(message);
      }
    });

    map.on("click", (event) => {
      if (drawingRef.current || !map.getLayer(FILL_LAYER)) {
        return;
      }
      const hits = map.queryRenderedFeatures(event.point, { layers: [FILL_LAYER] });
      const feature = hits[0] as SiteFeature | undefined;
      onSiteClickRef.current(feature ?? null);
    });

    map.on("draw.create", (event: MapboxDraw.DrawCreateEvent) => {
      const created = event.features[0];
      const geometry = toPolygonGeometry(created?.geometry);
      if (!geometry) {
        draw.deleteAll();
        onErrorRef.current("Draw a closed polygon with at least three vertices.");
        return;
      }
      onDrawCompleteRef.current(geometry);
    });

    const observer = new ResizeObserver(() => {
      map.resize();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      drawRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(sites as unknown as GeoJSON.FeatureCollection);
    if (map && !fittedRef.current && collectLngLats(sites).length > 0 && map.isStyleLoaded()) {
      const points = collectLngLats(sites);
      const bounds = new mapboxgl.LngLatBounds(points[0], points[0]);
      for (const point of points) {
        bounds.extend(point);
      }
      map.fitBounds(bounds, { padding: 56, maxZoom: 12, duration: 600 });
      fittedRef.current = true;
    }
  }, [sites]);

  useEffect(() => {
    const draw = drawRef.current;
    const map = mapRef.current;
    if (!draw || !map) {
      return;
    }
    if (drawing) {
      draw.deleteAll();
      draw.changeMode("draw_polygon");
      map.getCanvas().style.cursor = "crosshair";
    } else {
      draw.deleteAll();
      if (draw.getMode() !== "simple_select") {
        draw.changeMode("simple_select");
      }
      map.getCanvas().style.cursor = "";
    }
  }, [drawing, drawSession]);

  return <div ref={containerRef} className="map-canvas" role="presentation" />;
}
