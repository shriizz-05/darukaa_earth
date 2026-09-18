import MapboxDraw from "@mapbox/mapbox-gl-draw";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { drawPolygonMode } from "../lib/drawPolygonMode";
import { collectLngLats, toPolygonGeometry } from "../lib/geojson";
import type { GeoJsonFeatureCollection, GeoJsonPolygon, SiteFeature } from "../types/site";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

const SOURCE_ID = "sites";
const FILL_LAYER = "sites-fill";
const LINE_LAYER = "sites-outline";
const WESTERN_GHATS_CENTER: [number, number] = [76.5, 10.5];
const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";

type MapViewProps = {
  token: string;
  sites: GeoJsonFeatureCollection;
  drawing: boolean;
  drawSession: number;
  draftLocked: boolean;
  onDrawComplete: (geometry: GeoJsonPolygon) => void;
  onDrawCleared: () => void;
  onDrawToolStart: () => boolean;
  onSiteClick: (feature: SiteFeature | null) => void;
  onError: (message: string) => void;
};

function featureIdOf(feature: { id?: string | number } | undefined): string | null {
  if (feature?.id == null) {
    return null;
  }
  return String(feature.id);
}

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
    /access token|unauthorized|forbidden|not authorized|url restriction/i.test(message)
  ) {
    return "This Mapbox token was rejected. Create a public token at account.mapbox.com, set VITE_MAPBOX_TOKEN in frontend/.env, and restart Vite.";
  }
  return null;
}

function isStyleError(event: unknown): string | null {
  if (!event || typeof event !== "object") {
    return null;
  }
  const record = event as { error?: { message?: string; status?: number }; message?: string };
  const message = record.error?.message ?? record.message ?? "";
  if (
    /failed to load style|could not load.*style|style.*not found|error loading style/i.test(message)
  ) {
    return "Map style failed to load. Check the Mapbox token, URL restrictions for localhost, and your network, then refresh.";
  }
  return null;
}

function syncDrawInteraction(
  draw: MapboxDraw,
  map: mapboxgl.Map,
  options: {
    drawing: boolean;
    drawSession: number;
    draftLocked: boolean;
    lastSessionRef: { current: number | null };
    acceptedCreateIds: Set<string>;
  },
) {
  const { drawing, drawSession, draftLocked, lastSessionRef, acceptedCreateIds } = options;

  if (!drawing) {
    lastSessionRef.current = null;
    acceptedCreateIds.clear();
    draw.deleteAll();
    if (draw.getMode() !== "simple_select") {
      draw.changeMode("simple_select");
    }
    map.doubleClickZoom.enable();
    map.getCanvas().style.cursor = "";
    return;
  }

  map.doubleClickZoom.disable();

  if (draftLocked) {
    lastSessionRef.current = drawSession;
    if (draw.getMode() === "draw_polygon") {
      draw.changeMode("simple_select");
    }
    map.getCanvas().style.cursor = "";
    return;
  }

  const alreadyDrawing = draw.getMode() === "draw_polygon";
  const isNewSession = lastSessionRef.current !== drawSession;
  lastSessionRef.current = drawSession;

  if (isNewSession && !alreadyDrawing) {
    acceptedCreateIds.clear();
    draw.deleteAll();
    draw.changeMode("draw_polygon");
  } else if (!alreadyDrawing) {
    draw.changeMode("draw_polygon");
  }
  map.getCanvas().style.cursor = "crosshair";
}

export function MapView({
  token,
  sites,
  drawing,
  drawSession,
  draftLocked,
  onDrawComplete,
  onDrawCleared,
  onDrawToolStart,
  onSiteClick,
  onError,
}: MapViewProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const fittedRef = useRef(false);
  const lastSessionRef = useRef<number | null>(null);
  const acceptedCreateIdsRef = useRef(new Set<string>());
  const drawingRef = useRef(drawing);
  const drawSessionRef = useRef(drawSession);
  const draftLockedRef = useRef(draftLocked);
  const sitesRef = useRef(sites);
  const onDrawCompleteRef = useRef(onDrawComplete);
  const onDrawClearedRef = useRef(onDrawCleared);
  const onDrawToolStartRef = useRef(onDrawToolStart);
  const onSiteClickRef = useRef(onSiteClick);
  const onErrorRef = useRef(onError);

  drawingRef.current = drawing;
  drawSessionRef.current = drawSession;
  draftLockedRef.current = draftLocked;
  sitesRef.current = sites;
  onDrawCompleteRef.current = onDrawComplete;
  onDrawClearedRef.current = onDrawCleared;
  onDrawToolStartRef.current = onDrawToolStart;
  onSiteClickRef.current = onSiteClick;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!container) {
      return;
    }
    if (!token) {
      onErrorRef.current(
        "Mapbox token is missing. Set VITE_MAPBOX_TOKEN in frontend/.env and restart Vite.",
      );
      return;
    }
    if (!mapboxgl.supported()) {
      onErrorRef.current(
        "This browser cannot display the map (WebGL is required). Try another browser or enable hardware acceleration.",
      );
      return;
    }

    mapboxgl.accessToken = token;
    fittedRef.current = false;
    lastSessionRef.current = null;
    acceptedCreateIdsRef.current.clear();

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container,
        style: MAP_STYLE,
        center: WESTERN_GHATS_CENTER,
        zoom: 5.5,
        attributionControl: true,
      });
    } catch (cause) {
      onErrorRef.current(
        cause instanceof Error
          ? cause.message
          : "Unable to create the Mapbox map. Check the token and refresh.",
      );
      return;
    }

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    function resizeMap() {
      if (!mapRef.current) {
        return;
      }
      map.resize();
    }

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
          "line-color": "#2f6b52",
          "line-width": 2,
        },
      });
    }

    function applyCurrentDrawState() {
      const draw = drawRef.current;
      if (!draw) {
        return;
      }
      syncDrawInteraction(draw, map, {
        drawing: drawingRef.current,
        drawSession: drawSessionRef.current,
        draftLocked: draftLockedRef.current,
        lastSessionRef,
        acceptedCreateIds: acceptedCreateIdsRef.current,
      });
    }

    function addDrawControl() {
      if (drawRef.current) {
        return;
      }
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: "simple_select",
        boxSelect: false,
        clickBuffer: 12,
        touchBuffer: 24,
        modes: {
          ...MapboxDraw.modes,
          draw_polygon: drawPolygonMode,
        },
      });
      drawRef.current = draw;
      map.addControl(draw, "top-right");
      applyCurrentDrawState();
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

    let styleReady = false;
    map.on("load", () => {
      styleReady = true;
      addSiteLayers();
      addDrawControl();
      if (!fittedRef.current) {
        fitToSites(sitesRef.current);
      }
      resizeMap();
      requestAnimationFrame(() => {
        resizeMap();
      });
      map.on("mouseenter", FILL_LAYER, () => {
        map.getCanvas().style.cursor = drawingRef.current ? "crosshair" : "pointer";
      });
      map.on("mouseleave", FILL_LAYER, () => {
        map.getCanvas().style.cursor = drawingRef.current ? "crosshair" : "";
      });
    });

    map.on("error", (event) => {
      const authMessage = isAuthError(event);
      if (authMessage) {
        onErrorRef.current(authMessage);
        return;
      }
      if (styleReady) {
        return;
      }
      const styleMessage = isStyleError(event);
      if (styleMessage) {
        onErrorRef.current(styleMessage);
      }
    });

    map.on("click", (event) => {
      if (drawingRef.current || draftLockedRef.current || !map.getLayer(FILL_LAYER)) {
        return;
      }
      const hits = map.queryRenderedFeatures(event.point, { layers: [FILL_LAYER] });
      const feature = hits[0] as SiteFeature | undefined;
      onSiteClickRef.current(feature ?? null);
    });

    map.on("draw.create", (event: MapboxDraw.DrawCreateEvent) => {
      const draw = drawRef.current;
      const created = event.features[0];
      const id = featureIdOf(created);

      if (!drawingRef.current) {
        const allowed = onDrawToolStartRef.current();
        if (!allowed) {
          draw?.deleteAll();
          return;
        }
      }

      if (draftLockedRef.current || (id && acceptedCreateIdsRef.current.has(id))) {
        if (id && draw && !acceptedCreateIdsRef.current.has(id)) {
          draw.delete(id);
        }
        return;
      }

      const geometry = toPolygonGeometry(created?.geometry);
      if (!geometry) {
        if (id) {
          draw?.delete(id);
        }
        onErrorRef.current("Draw a closed polygon with at least three vertices.");
        if (drawingRef.current) {
          draw?.changeMode("draw_polygon");
          map.getCanvas().style.cursor = "crosshair";
        }
        return;
      }

      if (id) {
        acceptedCreateIdsRef.current.add(id);
      }
      draftLockedRef.current = true;
      if (draw && draw.getMode() !== "simple_select") {
        draw.changeMode("simple_select");
      }
      map.getCanvas().style.cursor = "";
      onDrawCompleteRef.current(geometry);
    });

    map.on("draw.update", (event: MapboxDraw.DrawUpdateEvent) => {
      if (!drawingRef.current && !draftLockedRef.current) {
        return;
      }
      const updated = event.features[0];
      const geometry = toPolygonGeometry(updated?.geometry);
      if (geometry) {
        onDrawCompleteRef.current(geometry);
      }
    });

    map.on("draw.delete", () => {
      acceptedCreateIdsRef.current.clear();
      onDrawClearedRef.current();
      if (drawingRef.current && !draftLockedRef.current) {
        drawRef.current?.changeMode("draw_polygon");
        map.getCanvas().style.cursor = "crosshair";
        map.doubleClickZoom.disable();
      }
    });

    map.on("draw.modechange", (event: MapboxDraw.DrawModeChangeEvent) => {
      const draw = drawRef.current;
      if (!draw) {
        return;
      }

      if (event.mode === "draw_polygon") {
        if (draftLockedRef.current) {
          draw.changeMode("simple_select");
          map.getCanvas().style.cursor = "";
          return;
        }
        const allowed = drawingRef.current || onDrawToolStartRef.current();
        if (!allowed) {
          draw.deleteAll();
          draw.changeMode("simple_select");
          map.doubleClickZoom.enable();
          map.getCanvas().style.cursor = "";
          return;
        }
        map.doubleClickZoom.disable();
        map.getCanvas().style.cursor = "crosshair";
        return;
      }

      map.getCanvas().style.cursor = "";

      if (
        drawingRef.current &&
        !draftLockedRef.current &&
        (event.mode === "simple_select" || event.mode === "direct_select")
      ) {
        const remaining = draw
          .getAll()
          .features.filter((feature) => feature.geometry?.type === "Polygon");
        if (remaining.length === 0) {
          draw.changeMode("draw_polygon");
          map.doubleClickZoom.disable();
          map.getCanvas().style.cursor = "crosshair";
          return;
        }
      }

      if (!drawingRef.current) {
        map.doubleClickZoom.enable();
      }
    });

    const observer = new ResizeObserver(() => {
      resizeMap();
    });
    observer.observe(container);
    requestAnimationFrame(() => {
      resizeMap();
    });

    return () => {
      observer.disconnect();
      drawRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [container, token]);

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
    syncDrawInteraction(draw, map, {
      drawing,
      drawSession,
      draftLocked,
      lastSessionRef,
      acceptedCreateIds: acceptedCreateIdsRef.current,
    });
  }, [drawing, drawSession, draftLocked]);

  return <div ref={setContainer} className="map-canvas" role="presentation" />;
}
