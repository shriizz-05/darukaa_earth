import axios from "axios";
import { clearToken, getToken } from "../auth/tokenStorage";
import { isPublicAuthRequest } from "./errors";

const LOCAL_API_ORIGIN = "http://127.0.0.1:8080";

function pageHostname(explicit?: string): string {
  if (explicit != null) {
    return explicit;
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    return window.location.hostname;
  }
  return "";
}

function isLoopbackHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1";
}

function isLoopbackApiOrigin(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (url.protocol === "http:" || url.protocol === "https:") && isLoopbackHost(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Axios paths already start with `/api`. Compose/Railway set VITE_API_BASE_URL=/api
 * (nginx same-origin proxy); that must not become `/api/api`.
 *
 * On the Windows desktop app (localhost / 127.0.0.1) always talk to Spring Boot
 * on 8080 directly. On any other hostname (Cloudflare tunnel, Railway, phone
 * browsers) never use a baked-in localhost URL — that origin is the device, not
 * this PC. Same-origin empty base lets Vite/nginx proxy `/api` to Spring Boot.
 */
export function resolveApiBaseUrl(raw: string | undefined, hostname?: string): string {
  const host = pageHostname(hostname);
  if (isLoopbackHost(host)) {
    return LOCAL_API_ORIGIN;
  }
  const trimmed = (raw ?? "").replace(/\/$/, "");
  if (!trimmed || trimmed === "/api" || isLoopbackApiOrigin(trimmed)) {
    return host ? "" : LOCAL_API_ORIGIN;
  }
  return trimmed;
}

const baseURL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000,
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  const url = `${config.baseURL ?? ""}${config.url ?? ""}`;
  if (token && !isPublicAuthRequest(url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`;
      if (!isPublicAuthRequest(url)) {
        clearToken();
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  },
);
