import MapboxDraw from "@mapbox/mapbox-gl-draw";

/**
 * Mapbox Draw's default polygon mode treats a second click at the last vertex
 * as "finish". A double-click is exactly that, so it often completes (or
 * deletes, if there are fewer than 3 vertices) the draft by accident.
 */
export function isRepeatVertexClick(
  currentVertexPosition: number,
  lastVertex: number[] | undefined,
  lng: number,
  lat: number,
): boolean {
  if (currentVertexPosition <= 0 || !lastVertex || lastVertex.length < 2) {
    return false;
  }
  return lastVertex[0] === lng && lastVertex[1] === lat;
}

/** Rubber-band index after three placed vertices — the minimum closed polygon. */
export function canFinishPolygon(currentVertexPosition: number): boolean {
  return currentVertexPosition >= 3;
}

type DrawPolygonState = {
  currentVertexPosition: number;
  polygon: {
    id: string | number;
    coordinates: number[][][];
    updateCoordinate: (path: string, lng: number, lat: number) => void;
  };
};

const DrawPolygon = MapboxDraw.modes.draw_polygon;

export const drawPolygonMode = {
  ...DrawPolygon,
  clickAnywhere(
    this: MapboxDraw.DrawCustomModeThis,
    state: DrawPolygonState,
    event: { lngLat: { lng: number; lat: number } },
  ) {
    const lastVertex = state.polygon.coordinates[0]?.[state.currentVertexPosition - 1];
    if (
      isRepeatVertexClick(
        state.currentVertexPosition,
        lastVertex,
        event.lngLat.lng,
        event.lngLat.lat,
      )
    ) {
      return;
    }
    this.updateUIClasses({ mouse: "add" });
    state.polygon.updateCoordinate(
      `0.${state.currentVertexPosition}`,
      event.lngLat.lng,
      event.lngLat.lat,
    );
    state.currentVertexPosition += 1;
    state.polygon.updateCoordinate(
      `0.${state.currentVertexPosition}`,
      event.lngLat.lng,
      event.lngLat.lat,
    );
  },
  clickOnVertex(this: MapboxDraw.DrawCustomModeThis, state: DrawPolygonState) {
    if (!canFinishPolygon(state.currentVertexPosition)) {
      return;
    }
    return this.changeMode("simple_select", { featureIds: [String(state.polygon.id)] });
  },
  onKeyUp(this: MapboxDraw.DrawCustomModeThis, state: DrawPolygonState, event: KeyboardEvent) {
    if (event.key === "Escape" || event.keyCode === 27) {
      this.deleteFeature(String(state.polygon.id), { silent: true });
      this.changeMode("simple_select");
      return;
    }
    if (
      (event.key === "Enter" || event.keyCode === 13) &&
      canFinishPolygon(state.currentVertexPosition)
    ) {
      this.changeMode("simple_select", { featureIds: [String(state.polygon.id)] });
    }
  },
} as typeof MapboxDraw.modes.draw_polygon;
