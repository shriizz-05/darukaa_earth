import axios from "axios";
import { clearToken, getToken } from "../auth/tokenStorage";
import { isPublicAuthRequest } from "./errors";

/**
 * Axios paths already start with `/api`. Compose sets VITE_API_BASE_URL=/api
 * (nginx same-origin proxy); that must not become `/api/api`.
 */
export function resolveApiBaseUrl(raw: string | undefined): string {
  if (raw == null || raw === "") {
    return "http://localhost:8080";
  }
  const trimmed = raw.replace(/\/$/, "");
  if (trimmed === "/api") {
    return "";
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
  if (token) {
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
