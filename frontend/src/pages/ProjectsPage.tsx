import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage, getApiFieldErrors } from "../api/errors";
import { createProject, listProjects } from "../api/projectApi";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Modal } from "../components/Modal";
import { PageShell } from "../components/PageShell";
import { ProjectForm } from "../components/ProjectForm";
import { ProjectTable } from "../components/ProjectTable";
import type { Project, ProjectWriteRequest } from "../types/project";

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [reloadToken, setReloadToken] = useState(0);

  async function refresh() {
    setError(null);
    const data = await listProjects();
    setProjects(data);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listProjects()
      .then((data) => {
        if (!cancelled) {
          setProjects(data);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(getApiErrorMessage(cause, "Unable to load projects."));
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
  }, [reloadToken]);

  async function handleCreate(body: ProjectWriteRequest) {
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const created = await createProject(body);
      setCreating(false);
      await refresh();
      navigate(`/projects/${created.id}`);
    } catch (cause) {
      setFieldErrors(getApiFieldErrors(cause));
      setFormError(getApiErrorMessage(cause, "Unable to create the project."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      eyebrow="Workspaces"
      title="Projects"
      description="Create and manage restoration projects. Site drawing is added in the map phase."
      actions={
        <button type="button" className="btn-primary btn-compact" onClick={() => setCreating(true)}>
          New project
        </button>
      }
    >
      {loading ? <LoadingSpinner label="Loading projects" /> : null}
      {error ? (
        <>
          <ErrorMessage>{error}</ErrorMessage>
          <button type="button" className="btn-quiet" onClick={() => setReloadToken((n) => n + 1)}>
            Try again
          </button>
        </>
      ) : null}
      {!loading && !error ? (
        <ProjectTable
          projects={projects}
          emptyAction={
            <button
              type="button"
              className="btn-primary btn-compact"
              onClick={() => setCreating(true)}
            >
              New project
            </button>
          }
        />
      ) : null}

      {creating ? (
        <Modal
          title="Create project"
          onClose={() => {
            if (!saving) {
              setCreating(false);
              setFormError(null);
              setFieldErrors({});
            }
          }}
        >
          <ProjectForm
            submitLabel="Create project"
            submitting={saving}
            error={formError}
            fieldErrors={fieldErrors}
            onSubmit={handleCreate}
            onCancel={() => {
              if (!saving) {
                setCreating(false);
                setFormError(null);
                setFieldErrors({});
              }
            }}
          />
        </Modal>
      ) : null}
    </PageShell>
  );
}
