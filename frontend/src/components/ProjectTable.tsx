import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../lib/format";
import type { Project } from "../types/project";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "../types/project";
import { EmptyState } from "./EmptyState";

type ProjectTableProps = {
  projects: Project[];
  emptyAction?: ReactNode;
};

export function ProjectTable({ projects, emptyAction }: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create a restoration workspace to start tracking sites and field work."
        action={emptyAction}
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col">Sites</th>
            <th scope="col">Dates</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>
                <Link to={`/projects/${project.id}`} className="table-name">
                  {project.name}
                </Link>
              </td>
              <td>{PROJECT_TYPE_LABELS[project.projectType]}</td>
              <td>
                <span className={`status-pill status-${project.status.toLowerCase()}`}>
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
              </td>
              <td>{project.siteCount}</td>
              <td className="muted">
                {formatDate(project.startDate)} – {formatDate(project.endDate)}
              </td>
              <td>
                <Link to={`/projects/${project.id}`} className="text-link table-link">
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
