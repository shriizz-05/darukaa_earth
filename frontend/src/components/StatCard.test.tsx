import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders a live count with its label", () => {
    render(<StatCard label="Total Projects" value={4} hint="GET /api/projects" />);

    expect(screen.getByText("Total Projects")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("GET /api/projects")).toBeInTheDocument();
  });

  it("shows a computed average with a demo-data caption", () => {
    render(<StatCard label="Average Performance" value="72.4" hint="Demo data" />);

    expect(screen.getByText("Average Performance")).toBeInTheDocument();
    expect(screen.getByText("72.4")).toBeInTheDocument();
    expect(screen.getByText("Demo data")).toBeInTheDocument();
  });
});
