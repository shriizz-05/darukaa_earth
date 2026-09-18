import { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { getApiErrorMessage, getApiFieldErrors } from "./errors";

function axiosError(
  status: number,
  data: unknown,
  message = `Request failed with status code ${status}`,
): AxiosError {
  return new AxiosError(message, String(status), undefined, undefined, {
    status,
    statusText: "Error",
    data,
    headers: {},
    config: { headers: {} } as InternalAxiosRequestConfig,
  });
}

describe("getApiErrorMessage", () => {
  it("prefers the backend message over the Axios status dump", () => {
    const error = axiosError(400, {
      message: "name must not be blank",
      fieldErrors: { name: "must not be blank" },
    });
    expect(getApiErrorMessage(error, "Unable to save.")).toBe("name must not be blank");
  });

  it("uses fieldErrors when message is missing", () => {
    const error = axiosError(400, {
      fieldErrors: { email: "must be a well-formed email address" },
    });
    expect(getApiErrorMessage(error, "Unable to save.")).toBe(
      "must be a well-formed email address",
    );
  });

  it("never returns Request failed with status code as the only message", () => {
    const error = axiosError(400, {});
    expect(getApiErrorMessage(error, "Unable to create the project.")).toBe(
      "Unable to create the project.",
    );
    expect(getApiErrorMessage(error, "Unable to create the project.")).not.toMatch(
      /Request failed with status code/,
    );
  });

  it("maps a network failure to a friendly API-down message", () => {
    const error = new AxiosError("Network Error");
    expect(getApiErrorMessage(error, "Unable to load.")).toBe(
      "Unable to reach the API. Is the backend running?",
    );
  });
});

describe("getApiFieldErrors", () => {
  it("returns backend fieldErrors", () => {
    const error = axiosError(400, {
      fieldErrors: { name: "must not be blank", status: "must not be null" },
    });
    expect(getApiFieldErrors(error)).toEqual({
      name: "must not be blank",
      status: "must not be null",
    });
  });

  it("parses details as a fallback", () => {
    const error = axiosError(400, { details: ["email must be a well-formed email address"] });
    expect(getApiFieldErrors(error)).toEqual({ email: "must be a well-formed email address" });
  });
});
