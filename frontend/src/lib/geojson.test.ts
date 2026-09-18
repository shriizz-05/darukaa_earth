import { describe, expect, it } from "vitest";
import { toPolygonGeometry } from "./geojson";

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
});
