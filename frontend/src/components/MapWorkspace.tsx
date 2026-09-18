import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getApiErrorMessage, getApiFieldErrors } from "../api/errors";
import { listProjects } from "../api/projectApi";
import { create, getAll } from "../api/siteApi";
import { ErrorMessage } from "./ErrorMessage";
import { LoadingSpinner } from "./LoadingSpinner";
import { MapView } from "./MapView";
import { Modal } from "./Modal";
import { SiteDetails } from "./SiteDetails";
import { SiteForm, type SiteFormValues } from "./SiteForm";
import { EMPTY_SITE_COLLECTION, polygonAreaSqKm, siteViewFromFeature } from "../lib/geojson";
import type { Project } from "../types/project";
import type {
  GeoJsonFeatureCollection,
  GeoJsonPolygon,
  SiteFeature,
  SiteView,
} from "../types/site";

type MapWorkspaceProps = {
  token: string;
};

export default function MapWorkspace({ token }: MapWorkspaceProps) {
  const [searchParams] = useSearchParams();
  const projectFromQuery = Number(searchParams.get("project"));
  const siteFromQuery = Number(searchParams.get("site"));
  const startDrawing = searchParams.get("draw") === "1";

  const defaultProjectId =
    Number.isFinite(projectFromQuery) && projectFromQuery > 0 ? projectFromQuery : undefined;

  const [sites, setSites] = useState<GeoJsonFeatureCollection>(EMPTY_SITE_COLLECTION);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawSession, setDrawSession] = useState(0);
  const [draftGeometry, setDraftGeometry] = useState<GeoJsonPolygon | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<SiteView | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const autoStarted = useRef(false);
  const savingRef = useRef(false);

  async function refreshSites() {
    const collection = await getAll();
    setSites({
      type: "FeatureCollection",
      features: collection.features ?? [],
    });
    return collection;
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([refreshSites(), listProjects()])
      .then(([collection, nextProjects]) => {
        if (cancelled) {
          return;
        }
        setProjects(nextProjects);
        if (Number.isFinite(siteFromQuery) && siteFromQuery > 0) {
          const match = (collection.features ?? []).find(
            (feature) => Number(feature.id) === siteFromQuery,
          );
          const view = match ? siteViewFromFeature(match) : null;
          setSelected(view);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(
            getApiErrorMessage(cause, "Unable to load sites. Is the API running with MySQL?"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [siteFromQuery, reloadToken]);

  useEffect(() => {
    if (!startDrawing || autoStarted.current || loading) {
      return;
    }
    if (projects.length === 0) {
      return;
    }
    autoStarted.current = true;
    setDrawing(true);
    setDrawSession((value) => value + 1);
  }, [startDrawing, loading, projects.length]);

  const siteCount = sites.features.length;
  const emptyHint = !loading && !error && siteCount === 0 && !drawing;
  const draftAreaSqKm = useMemo(() => polygonAreaSqKm(draftGeometry), [draftGeometry]);

  function canStartDrawing(): boolean {
    if (projects.length === 0) {
      setError("Create a project before drawing a site.");
      return false;
    }
    setError(null);
    setSelected(null);
    setFormError(null);
    setFieldErrors({});
    return true;
  }

  function beginDraw() {
    if (!canStartDrawing()) {
      return;
    }
    setDraftGeometry(null);
    setDrawing(true);
    setDrawSession((value) => value + 1);
  }

  function handleDrawToolStart() {
    if (drawing) {
      return true;
    }
    if (!canStartDrawing()) {
      return false;
    }
    setDrawing(true);
    return true;
  }

  function cancelDraw() {
    setDrawing(false);
    setDraftGeometry(null);
    setFormError(null);
    setFieldErrors({});
    setSaving(false);
    savingRef.current = false;
  }

  function handleDrawComplete(geometry: GeoJsonPolygon) {
    setDraftGeometry(geometry);
    setFormError(null);
    setFieldErrors({});
  }

  function handleDrawCleared() {
    if (savingRef.current) {
      return;
    }
    setDraftGeometry(null);
    setFormError(null);
    setFieldErrors({});
  }

  function handleSiteClick(feature: SiteFeature | null) {
    if (drawing || draftGeometry) {
      return;
    }
    setSelected(feature ? siteViewFromFeature(feature) : null);
  }

  async function handleCreate(values: SiteFormValues) {
    if (!draftGeometry || savingRef.current) {
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const created = await create(values.projectId, {
        name: values.name,
        description: values.description,
        geometry: draftGeometry,
      });
      const collection = await refreshSites();
      const match = collection.features.find((feature) => Number(feature.id) === created.id);
      setSelected(
        match
          ? siteViewFromFeature(match)
          : {
              id: created.id,
              name: created.name,
              description: created.description,
              projectId: created.projectId,
              areaSqKm: created.areaSqKm,
              centroidLatitude: created.centroidLatitude,
              centroidLongitude: created.centroidLongitude,
            },
      );
      cancelDraw();
    } catch (cause) {
      setFieldErrors(getApiFieldErrors(cause));
      setFormError(
        getApiErrorMessage(cause, "Unable to save this site. Check the polygon and try again."),
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <section className="map-workspace">
      <div className="map-toolbar">
        <div>
          <p className="eyebrow">Geospatial</p>
          <h1>Map</h1>
        </div>
        <div className="map-toolbar-actions">
          {drawing ? (
            <button type="button" className="btn-quiet" onClick={cancelDraw} disabled={saving}>
              Cancel drawing
            </button>
          ) : (
            <button type="button" className="btn-primary btn-compact" onClick={beginDraw}>
              Add Site
            </button>
          )}
        </div>
      </div>

      {drawing && !draftGeometry ? (
        <p className="map-hint" role="status">
          Draw a polygon on the map to define the site boundary.
        </p>
      ) : null}

      {loading ? (
        <div className="map-hint" role="status">
          <LoadingSpinner label="Loading sites" />
        </div>
      ) : null}

      {error ? (
        <div className="map-banner">
          <ErrorMessage>{error}</ErrorMessage>
          <button type="button" className="btn-quiet" onClick={() => setReloadToken((n) => n + 1)}>
            Try again
          </button>
        </div>
      ) : null}

      {mapError ? (
        <div className="map-banner">
          <ErrorMessage>{mapError}</ErrorMessage>
        </div>
      ) : null}

      {emptyHint ? (
        <p className="map-hint" role="status">
          No sites yet. Click Add Site to draw a polygon. Saved shapes load from GET /api/sites.
        </p>
      ) : null}

      {projects.length === 0 && !loading ? (
        <p className="map-hint">
          You need a project first.{" "}
          <Link to="/projects" className="text-link table-link">
            Create a project
          </Link>
        </p>
      ) : null}

      <MapView
        token={token}
        sites={sites}
        drawing={drawing}
        drawSession={drawSession}
        draftLocked={Boolean(draftGeometry)}
        onDrawComplete={handleDrawComplete}
        onDrawCleared={handleDrawCleared}
        onDrawToolStart={handleDrawToolStart}
        onSiteClick={handleSiteClick}
        onError={setMapError}
      />

      {selected && !draftGeometry ? (
        <div className="map-details-slot">
          <SiteDetails site={selected} onClose={() => setSelected(null)} />
        </div>
      ) : null}

      {draftGeometry ? (
        <Modal title="Save Site" onClose={() => (!saving ? cancelDraw() : undefined)}>
          <p className="muted">The polygon is ready. Name it and attach it to a project.</p>
          <SiteForm
            projects={projects}
            defaultProjectId={defaultProjectId}
            submitLabel="Save Site"
            areaSqKm={draftAreaSqKm}
            submitting={saving}
            error={formError}
            fieldErrors={fieldErrors}
            onSubmit={handleCreate}
            onCancel={() => {
              if (!saving) {
                cancelDraw();
              }
            }}
          />
        </Modal>
      ) : null}
    </section>
  );
}
