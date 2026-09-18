import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { MapTokenMissing } from "./MapTokenMissing";

describe("MapTokenMissing", () => {
  it("explains how to create a Mapbox public token without crashing", () => {
    render(
      <MemoryRouter>
        <MapTokenMissing />
      </MemoryRouter>,
    );

    expect(screen.getByText("Mapbox token is not configured")).toBeInTheDocument();
    expect(screen.getByText(/account.mapbox.com/i)).toBeInTheDocument();
    expect(screen.getAllByText(/VITE_MAPBOX_TOKEN/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Open Mapbox tokens" })).toHaveAttribute(
      "href",
      "https://account.mapbox.com/access-tokens/",
    );
  });
});
