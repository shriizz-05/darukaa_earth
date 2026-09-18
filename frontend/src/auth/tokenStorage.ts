/**
 * Hackathon session store: JWT in localStorage.
 *
 * XSS caveat: any script on this origin can read the token. HttpOnly cookies
 * would be safer in production. Keep all reads/writes in this module.
 */
const TOKEN_KEY = "darukaa.auth.token";

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}
