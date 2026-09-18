import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage, getApiFieldErrors } from "../api/errors";
import { deleteProject, getProject, updateProject } from "../api/projectApi";
import { listByProject } from "../api/siteApi";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Modal } from "../components/Modal";
import { PageShell } from "../components/PageShell";
import { ProjectForm } from "../components/ProjectForm";
import { formatAreaSqKm, formatCentroid, formatDate } from "../lib/format";
import type { Project, ProjectWriteRequest } from "../types/project";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "../types/project";
import type { SiteSummary } from "../types/site";

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = Number(id);
  const [project, setProject] = useState<Project | null>(null);
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setError("This project id is not valid.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSitesError(null);

    getProject(projectId)
      .then(async (nextProject) => {
        if (cancelled) {
          return;
        }
        setProject(nextProject);
        try {
          const nextSites = await listByProject(projectId);
          if (!cancelled) {
            setSites(nextSites);
          }
        } catch (cause) {
          if (!cancelled) {
            setSites([]);
            setSitesError(getApiErrorMessage(cause, "Unable to load sites for this project."));
          }
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(getApiErrorMessage(cause, "Unable to load this project."));
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
  }, [projectId]);

  async function handleUpdate(body: ProjectWriteRequest) {
    if (!project) {
      return;
    }
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const updated = await updateProject(project.id, body);
      setProject(updated);
      setEditing(false);
    } catch (cause) {
      setFieldErrors(getApiFieldErrors(cause));
      setFormError(getApiErrorMessage(cause, "Unable to save the project."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!project) {
      return;
    }
    setDeleting(true);
    try {
      await deleteProject(project.id);
      navigate("/projects");
    } catch (cause) {
      setDeleting(false);
      setConfirmDelete(false);
      setError(getApiErrorMessage(cause, "Unable to delete the project."));
    }
  }

  if (loading) {
    return (
      <PageShell eyebrow="Project" title="Project">
        <LoadingSpinner label="Loading project" />
      </PageShell>
    );
  }

  if (error || !project) {
    return (
      <PageShell eyebrow="Project" title="Project">
        <ErrorMessage>{error ?? "Project not found."}</ErrorMessage>
        <Link to="/projects" className="text-link">
          Back to projects
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow={PROJECT_TYPE_LABELS[project.projectType]}
      title={project.name}
      description={project.description || "No description yet."}
      actions={
        <div className="page-actions">
          <Link to={`/map?project=${project.id}`} className="btn-quiet">
            View on map
          </Link>
          <Link to={`/map?project=${project.id}&draw=1`} className="btn-primary btn-compact">
            Add site on map
          </Link>
          <button type="button" className="btn-quiet" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        </div>
      }
    >
      <div className="detail-meta">
        <span className={`status-pill status-${project.status.toLowerCase()}`}>
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
        <span className="muted">
          {formatDate(project.startDate)} – {formatDate(project.endDate)}
        </span>
        <span className="muted">{project.siteCount} sites</span>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>Sites</h2>
          <span className="muted">Drawn on the map · read-only here</span>
        </div>
        {sitesError ? <ErrorMessage>{sitesError}</ErrorMessage> : null}
        {!sitesError && sites.length === 0 ? (
          <EmptyState
            title="No sites yet"
            description="Draw a polygon on the map to create the first site for this project."
            action={
              <Link to={`/map?project=${project.id}&draw=1`} className="btn-primary btn-compact">
                Add site on map
              </Link>
            }
          />
        ) : null}
        {!sitesError && sites.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Area</th>
                  <th scope="col">Centroid</th>
                  <th scope="col">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.id}>
                    <td>
                      <Link to={`/sites/${site.id}`} className="table-name">
                        {site.name}
                      </Link>
                    </td>
                    <td>{formatAreaSqKm(site.areaSqKm)}</td>
                    <td className="muted">
                      {formatCentroid(site.centroidLatitude, site.centroidLongitude)}
                    </td>
                    <td>
                      <Link to={`/sites/${site.id}`} className="text-link table-link">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {editing ? (
        <Modal
          title="Edit project"
          onClose={() => {
            if (!saving) {
              setEditing(false);
              setFormError(null);
              setFieldErrors({});
            }
          }}
        >
          <ProjectForm
            initial={project}
            submitLabel="Save changes"
            submitting={saving}
            error={formError}
            fieldErrors={fieldErrors}
            onSubmit={handleUpdate}
            onCancel={() => {
              if (!saving) {
                setEditing(false);
                setFormError(null);
                setFieldErrors({});
              }
            }}
          />
        </Modal>
      ) : null}

      {confirmDelete ? (
        <Modal
          title="Delete project?"
          onClose={() => (!deleting ? setConfirmDelete(false) : undefined)}
        >
          <p className="muted">
            This removes <strong>{project.name}</strong> and any sites attached to it. This cannot
            be undone.
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-quiet"
              disabled={deleting}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Deleting…" : "Delete project"}
            </button>
          </div>
        </Modal>
      ) : null}
    </PageShell>
  );
}
