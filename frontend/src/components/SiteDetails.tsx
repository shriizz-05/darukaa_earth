import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../api/errors";
import { getProject } from "../api/projectApi";
import { formatAreaSqKm, formatCentroid } from "../lib/format";
import type { Project } from "../types/project";
import { PROJECT_STATUS_LABELS } from "../types/project";
import type { SiteView } from "../types/site";

type SiteDetailsProps = {
  site: SiteView;
  onClose?: () => void;
  latestPerformance?: number | null;
};

export function SiteDetails({ site, onClose, latestPerformance }: SiteDetailsProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);

  useEffect(() => {
    if (site.projectId == null) {
      setProject(null);
      setProjectError(null);
      return;
    }

    let cancelled = false;
    setProject(null);
    setProjectError(null);
    getProject(site.projectId)
      .then((next) => {
        if (!cancelled) {
          setProject(next);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setProjectError(getApiErrorMessage(cause, "Unable to load the project for this site."));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [site.projectId]);

  return (
    <aside className="site-details" aria-label="Site details">
      <div className="site-details-header">
        <div>
          <p className="eyebrow">Site</p>
          <h2>{site.name}</h2>
        </div>
        {onClose ? (
          <button
            type="button"
            className="btn-quiet"
            onClick={onClose}
            aria-label="Close site details"
          >
            Close
          </button>
        ) : null}
      </div>

      {site.description ? (
        <p className="muted">{site.description}</p>
      ) : (
        <p className="muted">No description yet.</p>
      )}

      <dl className="detail-list">
        <div>
          <dt>Project</dt>
          <dd>
            {project ? (
              <Link to={`/projects/${project.id}`} className="text-link table-link">
                {project.name}
              </Link>
            ) : projectError ? (
              projectError
            ) : site.projectId != null ? (
              "Loading project…"
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt>Area</dt>
          <dd>{formatAreaSqKm(site.areaSqKm)}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{formatCentroid(site.centroidLatitude, site.centroidLongitude)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{project ? PROJECT_STATUS_LABELS[project.status] : "—"}</dd>
        </div>
        <div>
          <dt>Performance</dt>
          <dd>
            {latestPerformance != null && !Number.isNaN(Number(latestPerformance))
              ? Number(latestPerformance).toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })
              : "—"}
          </dd>
        </div>
      </dl>
      <p className="stat-hint">
        Latest score from the analytics API when a series exists. Seeded values are demo data.
      </p>

      <div className="site-details-links">
        {onClose ? (
          <Link to={`/sites/${site.id}`} className="text-link table-link">
            Open site page
          </Link>
        ) : (
          <Link
            to={site.projectId ? `/projects/${site.projectId}` : "/projects"}
            className="text-link table-link"
          >
            Back to project
          </Link>
        )}
        <Link to={`/map?site=${site.id}`} className="text-link table-link">
          View on map
        </Link>
        <Link to={`/sites/${site.id}#analytics`} className="text-link table-link">
          Site analytics
        </Link>
      </div>
    </aside>
  );
}
