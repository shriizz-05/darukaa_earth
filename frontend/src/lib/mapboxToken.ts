const PLACEHOLDER = "your_mapbox_public_token";

/** Public Mapbox pk token used when VITE_MAPBOX_TOKEN is unset or the placeholder. */
export const DEFAULT_MAPBOX_TOKEN =
  "pk.eyJ1IjoibXV0aHVzaHJpNzg2IiwiYSI6ImNtdTZ1eGcwZTBnM2UzMXF4bW02eGY3cm4ifQ.i008sawBdvqC266psI_0NA";

export function readMapboxToken(token: string | undefined): string | null {
  const value = token?.trim();
  if (!value || value === PLACEHOLDER) {
    return DEFAULT_MAPBOX_TOKEN;
  }
  return value;
}

export function hasMapboxToken(
  token: string | undefined = import.meta.env.VITE_MAPBOX_TOKEN,
): boolean {
  return readMapboxToken(token) !== null;
}
