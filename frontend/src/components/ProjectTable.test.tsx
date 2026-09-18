import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Project } from "../types/project";
import { ProjectTable } from "./ProjectTable";

describe("ProjectTable", () => {
  it("shows an empty state when there are no projects", () => {
    render(
      <MemoryRouter>
        <ProjectTable
          projects={[]}
          emptyAction={
            <button type="button" className="btn-primary btn-compact">
              New project
            </button>
          }
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("No projects yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New project" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders project rows from API data", () => {
    const project: Project = {
      id: 12,
      name: "Western Ghats restoration",
      description: "Canopy recovery",
      projectType: "REFORESTATION",
      status: "ACTIVE",
      startDate: "2026-01-01",
      endDate: null,
      createdAt: "2026-01-02T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
      siteCount: 3,
    };

    render(
      <MemoryRouter>
        <ProjectTable projects={[project]} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Western Ghats restoration" })).toHaveAttribute(
      "href",
      "/projects/12",
    );
    expect(screen.getByText("Reforestation")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
