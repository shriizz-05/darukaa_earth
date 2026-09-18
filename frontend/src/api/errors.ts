import axios from "axios";
import type { ApiErrorBody } from "../types/auth";

const AXIOS_STATUS_DUMP = /^Request failed with status code \d+$/;

function asApiErrorBody(data: unknown): ApiErrorBody | undefined {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as ApiErrorBody;
  }
  return undefined;
}

function fieldErrorsFromDetails(details: string[] | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  for (const detail of details ?? []) {
    const match = detail.trim().match(/^([A-Za-z][\w.]*)\s+(.+)$/);
    if (match) {
      const field = match[1].includes(".")
        ? match[1].slice(match[1].lastIndexOf(".") + 1)
        : match[1];
      if (!result[field]) {
        result[field] = match[2];
      }
    }
  }
  return result;
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) {
    return {};
  }
  const data = asApiErrorBody(error.response?.data);
  const fromBody = data?.fieldErrors ?? {};
  const cleaned: Record<string, string> = {};
  for (const [field, message] of Object.entries(fromBody)) {
    if (field && message?.trim()) {
      cleaned[field] = message.trim();
    }
  }
  if (Object.keys(cleaned).length > 0) {
    return cleaned;
  }
  return fieldErrorsFromDetails(data?.details);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = asApiErrorBody(error.response?.data);
    if (data?.message && data.message.trim() && !AXIOS_STATUS_DUMP.test(data.message.trim())) {
      return data.message.trim();
    }
    const fieldErrors = getApiFieldErrors(error);
    const firstField = Object.values(fieldErrors)[0];
    if (firstField) {
      return firstField;
    }
    const firstDetail = data?.details?.find((item) => item?.trim());
    if (firstDetail) {
      return firstDetail.trim();
    }
    const status = error.response?.status;
    if (status === 401) {
      return "Invalid email or password";
    }
    const rawBody = typeof error.response?.data === "string" ? error.response.data.trim() : "";
    if (status === 403 && /cors/i.test(rawBody || data?.error || "")) {
      return "This website is blocked from calling the API (CORS). The backend must allow this origin.";
    }
    if (status === 403) {
      return fallback || "You do not have permission to perform this action";
    }
    if (status === 404) {
      return "The requested resource was not found";
    }
    if (status === 409) {
      return "An account with this email already exists";
    }
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return "The request timed out. Try again.";
      }
      return "Unable to reach the API. Is the backend running?";
    }
    return fallback;
  }
  if (error instanceof Error && error.message && !AXIOS_STATUS_DUMP.test(error.message)) {
    return error.message;
  }
  return fallback;
}

export function isPublicAuthRequest(url = ""): boolean {
  return url.includes("/api/auth/login") || url.includes("/api/auth/register");
}
