import { lazy, Suspense } from "react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { MapTokenMissing } from "../components/MapTokenMissing";
import { readMapboxToken } from "../lib/mapboxToken";

const MapWorkspace = lazy(() => import("../components/MapWorkspace"));

export function MapPage() {
  const token = readMapboxToken(import.meta.env.VITE_MAPBOX_TOKEN);
  if (!token) {
    return <MapTokenMissing />;
  }

  return (
    <Suspense fallback={<LoadingSpinner label="Loading map" />}>
      <MapWorkspace token={token} />
    </Suspense>
  );
}
