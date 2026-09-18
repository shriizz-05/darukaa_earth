import { AxiosError } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it } from "vitest";
import { apiClient, resolveApiBaseUrl } from "./client";
import { isPublicAuthRequest } from "./errors";
import { clearToken, getToken, setToken } from "../auth/tokenStorage";

function rejectWithStatus(status: number, data: unknown) {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const error = new AxiosError(`Request failed with status code ${status}`);
    error.config = config;
    error.response = {
      data,
      status,
      statusText: "Error",
      headers: {},
      config,
    };
    throw error;
  };
}

describe("apiClient auth interceptor", () => {
  afterEach(() => {
    clearToken();
  });

  it("does not attach Authorization on login", async () => {
    setToken("stale-token");

    const response = await apiClient.post(
      "/api/auth/login",
      { email: "admin@darukaa.earth", password: "ChangeMe_Admin_123!" },
      {
        adapter: async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => ({
          data: {},
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        }),
      },
    );

    expect(response.config.headers.Authorization).toBeUndefined();
  });

  it("attaches Authorization Bearer from localStorage", async () => {
    setToken("test-token");

    const response = await apiClient.get("/api/projects", {
      adapter: async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => ({
        data: [],
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      }),
    });

    expect(response.config.headers.Authorization).toBe("Bearer test-token");
  });

  it("clears the token on a protected 401", async () => {
    setToken("stale-token");

    await expect(
      apiClient.get("/api/projects", {
        adapter: rejectWithStatus(401, { message: "Authentication is required" }),
      }),
    ).rejects.toBeTruthy();

    expect(getToken()).toBeNull();
  });

  it("does not clear the token or loop on login 401", async () => {
    setToken("keep-me");

    await expect(
      apiClient.post(
        "/api/auth/login",
        { email: "ada@darukaa.earth", password: "wrongpass" },
        { adapter: rejectWithStatus(401, { message: "Invalid email or password" }) },
      ),
    ).rejects.toBeTruthy();

    expect(getToken()).toBe("keep-me");
  });
});

describe("resolveApiBaseUrl", () => {
  it("defaults local Vite to the Spring Boot origin", () => {
    expect(resolveApiBaseUrl(undefined, "")).toBe("http://127.0.0.1:8080");
    expect(resolveApiBaseUrl("", "")).toBe("http://127.0.0.1:8080");
  });

  it("forces the local Spring Boot origin on the desktop hostname", () => {
    expect(resolveApiBaseUrl("/api", "localhost")).toBe("http://127.0.0.1:8080");
    expect(resolveApiBaseUrl("/api", "127.0.0.1")).toBe("http://127.0.0.1:8080");
    expect(resolveApiBaseUrl("http://localhost:8080", "localhost")).toBe("http://127.0.0.1:8080");
  });

  it("treats /api as same-origin so nginx can proxy without /api/api", () => {
    expect(resolveApiBaseUrl("/api", "frontend.up.railway.app")).toBe("");
    expect(resolveApiBaseUrl("/api/", "frontend.up.railway.app")).toBe("");
  });

  it("uses same-origin on public hosts even if env points at localhost", () => {
    expect(
      resolveApiBaseUrl("http://127.0.0.1:8080", "penny-ages-merely-tiger.trycloudflare.com"),
    ).toBe("");
    expect(resolveApiBaseUrl("http://localhost:8080", "localtunnel.me")).toBe("");
    expect(resolveApiBaseUrl(undefined, "frontend.up.railway.app")).toBe("");
    expect(resolveApiBaseUrl("", "example.trycloudflare.com")).toBe("");
  });

  it("keeps an explicit public API origin", () => {
    expect(resolveApiBaseUrl("https://api.example.com", "app.example.com")).toBe(
      "https://api.example.com",
    );
  });
});

describe("isPublicAuthRequest", () => {
  it("skips 401 handling for login and register only", () => {
    expect(isPublicAuthRequest("/api/auth/login")).toBe(true);
    expect(isPublicAuthRequest("http://localhost:8080/api/auth/register")).toBe(true);
    expect(isPublicAuthRequest("/api/auth/me")).toBe(false);
    expect(isPublicAuthRequest("/api/projects")).toBe(false);
  });
});
