import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnalyticsChart } from "./AnalyticsChart";

describe("AnalyticsChart", () => {
  it("shows an empty state when the API series has no points", () => {
    render(
      <AnalyticsChart title="Carbon trend" labels={[]} values={[]} datasetLabel="Carbon (tCO2e)" />,
    );

    expect(screen.getByRole("heading", { name: "Carbon trend" })).toBeInTheDocument();
    expect(screen.getByText("No analytics yet")).toBeInTheDocument();
    expect(screen.getByText(/time-series points/i)).toBeInTheDocument();
  });

  it("treats all-null values as empty", () => {
    render(
      <AnalyticsChart
        title="Biodiversity"
        labels={["Oct 2025"]}
        values={[null]}
        datasetLabel="Biodiversity score"
      />,
    );

    expect(screen.getByText("No analytics yet")).toBeInTheDocument();
  });
});
