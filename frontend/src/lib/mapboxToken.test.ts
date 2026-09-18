import { describe, expect, it } from "vitest";
import { DEFAULT_MAPBOX_TOKEN, hasMapboxToken, readMapboxToken } from "./mapboxToken";

describe("readMapboxToken", () => {
  it("falls back to the default public token when env is missing, blank, or placeholder", () => {
    expect(readMapboxToken(undefined)).toBe(DEFAULT_MAPBOX_TOKEN);
    expect(readMapboxToken("")).toBe(DEFAULT_MAPBOX_TOKEN);
    expect(readMapboxToken("   ")).toBe(DEFAULT_MAPBOX_TOKEN);
    expect(readMapboxToken("your_mapbox_public_token")).toBe(DEFAULT_MAPBOX_TOKEN);
    expect(hasMapboxToken(undefined)).toBe(true);
    expect(hasMapboxToken("your_mapbox_public_token")).toBe(true);
  });

  it("prefers a real env token over the default", () => {
    expect(readMapboxToken(" pk.example-token ")).toBe("pk.example-token");
    expect(hasMapboxToken("pk.example-token")).toBe(true);
  });

  it("accepts the default public pk token as configured", () => {
    expect(readMapboxToken(DEFAULT_MAPBOX_TOKEN)).toBe(DEFAULT_MAPBOX_TOKEN);
    expect(hasMapboxToken(DEFAULT_MAPBOX_TOKEN)).toBe(true);
    expect(DEFAULT_MAPBOX_TOKEN.startsWith("pk.")).toBe(true);
    expect(DEFAULT_MAPBOX_TOKEN).not.toBe("your_mapbox_public_token");
  });
});
