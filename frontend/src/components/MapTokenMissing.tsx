import { Link } from "react-router-dom";
import { EmptyState } from "./EmptyState";
import { PageShell } from "./PageShell";

export function MapTokenMissing() {
  return (
    <PageShell
      eyebrow="Geospatial"
      title="Map"
      description="A Mapbox public token is required before polygons can be drawn or displayed."
    >
      <EmptyState
        title="Mapbox token is not configured"
        description="Create a public access token at account.mapbox.com (Tokens), then add it to frontend/.env as VITE_MAPBOX_TOKEN and restart the Vite dev server. The placeholder your_mapbox_public_token is not a real token."
        action={
          <a
            className="btn-primary btn-compact"
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noreferrer"
          >
            Open Mapbox tokens
          </a>
        }
      />
      <p className="muted map-token-hint">
        Example line in <code>frontend/.env</code>:{" "}
        <code>VITE_MAPBOX_TOKEN=pk.your_public_token</code>. Then return to{" "}
        <Link to="/map" className="text-link table-link">
          /map
        </Link>
        .
      </p>
    </PageShell>
  );
}
