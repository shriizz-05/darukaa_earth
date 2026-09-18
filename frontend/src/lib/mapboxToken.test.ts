import { describe, expect, it } from "vitest";
import { hasMapboxToken, readMapboxToken } from "./mapboxToken";

describe("readMapboxToken", () => {
  it("treats missing, blank, and placeholder tokens as absent", () => {
    expect(readMapboxToken(undefined)).toBeNull();
    expect(readMapboxToken("")).toBeNull();
    expect(readMapboxToken("   ")).toBeNull();
    expect(readMapboxToken("your_mapbox_public_token")).toBeNull();
  });

  it("accepts a real public token", () => {
    expect(readMapboxToken(" pk.example-token ")).toBe("pk.example-token");
    expect(hasMapboxToken("pk.example-token")).toBe(true);
  });
});
