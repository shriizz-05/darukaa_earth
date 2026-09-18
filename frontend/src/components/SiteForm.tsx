import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { blankToNull } from "../lib/format";
import type { Project } from "../types/project";
import { ErrorMessage } from "./ErrorMessage";

export type SiteFormValues = {
  projectId: number;
  name: string;
  description: string | null;
};

type SiteFormProps = {
  projects: Project[];
  defaultProjectId?: number;
  submitLabel?: string;
  submitting: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
  onSubmit: (values: SiteFormValues) => Promise<void>;
  onCancel: () => void;
};

export function SiteForm({
  projects,
  defaultProjectId,
  submitLabel = "Save site",
  submitting,
  error,
  fieldErrors = {},
  onSubmit,
  onCancel,
}: SiteFormProps) {
  const fallbackId =
    defaultProjectId && projects.some((project) => project.id === defaultProjectId)
      ? defaultProjectId
      : (projects[0]?.id ?? 0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(fallbackId);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setLocalError("Enter a site name.");
      return;
    }
    if (!projectId) {
      setLocalError("Select a project for this site.");
      return;
    }
    await onSubmit({
      projectId,
      name: trimmed,
      description: blankToNull(description),
    });
  }

  if (projects.length === 0) {
    return (
      <div>
        <ErrorMessage>Create a project before drawing a site.</ErrorMessage>
        <div className="modal-actions">
          <button type="button" className="btn-quiet" onClick={onCancel}>
            Cancel
          </button>
          <Link to="/projects" className="btn-primary btn-compact">
            Go to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {localError || error ? <ErrorMessage>{localError ?? error}</ErrorMessage> : null}

      <div className="field">
        <label htmlFor="site-name">Name</label>
        <input
          id="site-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={255}
          required
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "site-name-error" : undefined}
        />
        {fieldErrors.name ? (
          <p id="site-name-error" className="field-error">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="site-description">Description</label>
        <textarea
          id="site-description"
          name="description"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={8000}
          disabled={submitting}
        />
        {fieldErrors.description ? <p className="field-error">{fieldErrors.description}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="site-project">Project</label>
        <select
          id="site-project"
          name="projectId"
          value={projectId}
          onChange={(event) => setProjectId(Number(event.target.value))}
          required
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.projectId)}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {fieldErrors.projectId ? <p className="field-error">{fieldErrors.projectId}</p> : null}
        {fieldErrors.geometry ? <p className="field-error">{fieldErrors.geometry}</p> : null}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-quiet" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary btn-compact" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
