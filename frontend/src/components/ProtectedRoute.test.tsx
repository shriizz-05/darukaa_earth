import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GuestRoute, ProtectedRoute } from "./ProtectedRoute";

const useAuth = vi.fn();

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => useAuth(),
}));

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Secret dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuth.mockReset();
  });

  it("redirects to login when there is no session", () => {
    useAuth.mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected();
    expect(screen.getByText("Login screen")).toBeInTheDocument();
    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument();
  });

  it("renders the protected page when authenticated", () => {
    useAuth.mockReturnValue({
      user: { id: 1, name: "Ada", email: "ada@darukaa.earth", role: "ADMIN" },
      token: "jwt",
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected();
    expect(screen.getByText("Secret dashboard")).toBeInTheDocument();
  });
});

describe("GuestRoute", () => {
  it("sends authenticated users to the dashboard", () => {
    useAuth.mockReturnValue({
      user: { id: 1, name: "Ada", email: "ada@darukaa.earth", role: "ADMIN" },
      token: "jwt",
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<div>Guest login</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Signed-in home</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Signed-in home")).toBeInTheDocument();
    expect(screen.queryByText("Guest login")).not.toBeInTheDocument();
  });
});
