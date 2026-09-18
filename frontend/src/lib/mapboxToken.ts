const PLACEHOLDER = "your_mapbox_public_token";

export function readMapboxToken(token: string | undefined): string | null {
  const value = token?.trim();
  if (!value || value === PLACEHOLDER) {
    return null;
  }
  return value;
}

export function hasMapboxToken(
  token: string | undefined = import.meta.env.VITE_MAPBOX_TOKEN,
): boolean {
  return readMapboxToken(token) !== null;
}
