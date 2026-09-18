import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import { LoginPage } from "./LoginPage";

const login = vi.fn();

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    login,
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

function axiosError(status: number, message: string): AxiosError<{ message: string }> {
  return new AxiosError("Request failed", String(status), undefined, undefined, {
    status,
    statusText: "Error",
    data: { message },
    headers: {},
    config: { headers: {} } as InternalAxiosRequestConfig,
  });
}

describe("LoginPage", () => {
  beforeEach(() => {
    login.mockReset();
  });

  it("shows an API error when login fails", async () => {
    login.mockRejectedValue(axiosError(401, "Invalid email or password"));
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "ada@darukaa.earth");
    await user.type(screen.getByLabelText("Password"), "password1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password");
    });
    expect(login).toHaveBeenCalledWith("ada@darukaa.earth", "password1");
  });

  it("shows a session expired notice when redirected from a 401", () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/login", state: { sessionExpired: true } }]}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your session expired. Please sign in again.",
    );
  });
});
