import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from "../api/authApi";
import { setUnauthorizedHandler } from "../api/client";
import type { AuthResponse, AuthUser } from "../types/auth";
import { clearToken, getToken, setToken as persistToken } from "./tokenStorage";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function applySession(response: AuthResponse): { user: AuthUser; token: string } {
  persistToken(response.token);
  return { user: response.user, token: response.token };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getToken());
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        navigate("/login", { replace: true, state: { sessionExpired: true } });
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, navigate]);

  useEffect(() => {
    let cancelled = false;
    const existing = getToken();
    if (!existing) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    fetchCurrentUser()
      .then((profile) => {
        if (!cancelled) {
          setUser(profile);
          setToken(existing);
        }
      })
      .catch(() => {
        clearToken();
        if (!cancelled) {
          setUser(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = applySession(await loginRequest({ email, password }));
    setUser(session.user);
    setToken(session.token);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const session = applySession(await registerRequest({ name, email, password }));
    setUser(session.user);
    setToken(session.token);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
