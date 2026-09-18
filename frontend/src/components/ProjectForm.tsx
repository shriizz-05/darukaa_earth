import { FormEvent, useEffect, useState } from "react";
import { blankToNull } from "../lib/format";
import type { Project, ProjectStatus, ProjectType, ProjectWriteRequest } from "../types/project";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
} from "../types/project";
import { ErrorMessage } from "./ErrorMessage";

type ProjectFormProps = {
  initial?: Project | null;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
  onSubmit: (body: ProjectWriteRequest) => Promise<void>;
  onCancel: () => void;
};

type FormState = {
  name: string;
  description: string;
  projectType: ProjectType;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
};

function fromProject(project?: Project | null): FormState {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    projectType: project?.projectType ?? "BIODIVERSITY",
    status: project?.status ?? "PLANNING",
    startDate: project?.startDate ?? "",
    endDate: project?.endDate ?? "",
  };
}

export function ProjectForm({
  initial,
  submitLabel,
  submitting,
  error,
  fieldErrors = {},
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const [form, setForm] = useState<FormState>(() => fromProject(initial));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setForm(fromProject(initial));
  }, [initial]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    const name = form.name.trim();
    if (!name) {
      setLocalError("Enter a project name.");
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setLocalError("End date must be on or after the start date.");
      return;
    }
    await onSubmit({
      name,
      description: blankToNull(form.description),
      projectType: form.projectType,
      status: form.status,
      startDate: blankToNull(form.startDate),
      endDate: blankToNull(form.endDate),
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {localError || error ? <ErrorMessage>{localError ?? error}</ErrorMessage> : null}

      <div className="field">
        <label htmlFor="project-name">Name</label>
        <input
          id="project-name"
          name="name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          maxLength={255}
          required
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "project-name-error" : undefined}
        />
        {fieldErrors.name ? (
          <p id="project-name-error" className="field-error">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="project-description">Description</label>
        <textarea
          id="project-description"
          name="description"
          rows={4}
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          maxLength={8000}
          disabled={submitting}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="project-type">Type</label>
          <select
            id="project-type"
            name="projectType"
            value={form.projectType}
            onChange={(event) =>
              setForm((current) => ({ ...current, projectType: event.target.value as ProjectType }))
            }
            required
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.projectType)}
          >
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {PROJECT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          {fieldErrors.projectType ? (
            <p className="field-error">{fieldErrors.projectType}</p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="project-status">Status</label>
          <select
            id="project-status"
            name="status"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value as ProjectStatus }))
            }
            required
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.status)}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {fieldErrors.status ? <p className="field-error">{fieldErrors.status}</p> : null}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="project-start">Start date</label>
          <input
            id="project-start"
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, startDate: event.target.value }))
            }
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.startDate)}
          />
          {fieldErrors.startDate ? <p className="field-error">{fieldErrors.startDate}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="project-end">End date</label>
          <input
            id="project-end"
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, endDate: event.target.value }))
            }
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.endDate)}
          />
          {fieldErrors.endDate ? <p className="field-error">{fieldErrors.endDate}</p> : null}
        </div>
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
