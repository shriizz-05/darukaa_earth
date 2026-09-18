import { Link } from "react-router-dom";
import type { Project } from "../types/project";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "../types/project";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="project-card">
      <p className="eyebrow">{PROJECT_TYPE_LABELS[project.projectType]}</p>
      <h3>
        <Link to={`/projects/${project.id}`}>{project.name}</Link>
      </h3>
      <p className="muted clamp-2">{project.description || "No description yet."}</p>
      <div className="card-meta">
        <span className={`status-pill status-${project.status.toLowerCase()}`}>
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
        <span className="muted">{project.siteCount} sites</span>
      </div>
    </article>
  );
}
