import { describe, expect, it } from "vitest";
import { canFinishPolygon, isRepeatVertexClick } from "./drawPolygonMode";
import { polygonAreaSqKm, toPolygonGeometry } from "./geojson";

describe("toPolygonGeometry", () => {
  it("closes an open ring so Spring Boot will accept it", () => {
    const polygon = toPolygonGeometry({
      type: "Polygon",
      coordinates: [
        [
          [77, 11],
          [77.2, 11],
          [77.2, 11.2],
          [77, 11.2],
        ],
      ],
    });

    expect(polygon?.type).toBe("Polygon");
    expect(polygon?.coordinates[0]?.[0]).toEqual([77, 11]);
    expect(polygon?.coordinates[0]?.at(-1)).toEqual([77, 11]);
  });

  it("rejects non-polygon geometry", () => {
    expect(toPolygonGeometry({ type: "Point", coordinates: [77, 11] })).toBeNull();
  });

  it("rejects a ring with fewer than 4 positions after close", () => {
    expect(
      toPolygonGeometry({
        type: "Polygon",
        coordinates: [
          [
            [77, 11],
            [77.2, 11],
          ],
        ],
      }),
    ).toBeNull();
  });
});

describe("polygonAreaSqKm", () => {
  it("returns a positive area for a closed Western Ghats polygon", () => {
    const polygon = toPolygonGeometry({
      type: "Polygon",
      coordinates: [
        [
          [76.4, 10.4],
          [76.6, 10.4],
          [76.6, 10.6],
          [76.4, 10.6],
          [76.4, 10.4],
        ],
      ],
    });

    const area = polygonAreaSqKm(polygon);
    expect(area).toBeGreaterThan(400);
    expect(area).toBeLessThan(600);
  });

  it("returns null for missing geometry", () => {
    expect(polygonAreaSqKm(null)).toBeNull();
  });
});

describe("isRepeatVertexClick", () => {
  it("ignores a second click on the last vertex so double-click does not finish", () => {
    expect(isRepeatVertexClick(1, [76.5, 10.5], 76.5, 10.5)).toBe(true);
    expect(isRepeatVertexClick(2, [76.5, 10.5], 76.6, 10.6)).toBe(false);
    expect(isRepeatVertexClick(0, [76.5, 10.5], 76.5, 10.5)).toBe(false);
  });
});

describe("canFinishPolygon", () => {
  it("requires three placed vertices before the polygon can close", () => {
    expect(canFinishPolygon(2)).toBe(false);
    expect(canFinishPolygon(3)).toBe(true);
  });
});
