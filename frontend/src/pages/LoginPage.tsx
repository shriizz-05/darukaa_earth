import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage, getApiFieldErrors } from "../api/errors";
import { useAuth } from "../auth/AuthContext";
import { ErrorMessage } from "../components/ErrorMessage";

type LoginLocationState = {
  sessionExpired?: boolean;
};

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sessionExpired, setSessionExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const state = location.state as LoginLocationState | null;
    if (!state?.sessionExpired) {
      return;
    }
    setSessionExpired(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSessionExpired(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await login(trimmedEmail, password);
    } catch (cause) {
      setFieldErrors(getApiFieldErrors(cause));
      setError(
        getApiErrorMessage(
          cause,
          "Unable to sign in. Check your credentials and that the API is running.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">Account</p>
      <h1>Sign in</h1>
      <p className="lede">Access restoration workspaces with your Darukaa.Earth account.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {sessionExpired ? (
          <ErrorMessage>Your session expired. Please sign in again.</ErrorMessage>
        ) : null}
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          />
          {fieldErrors.email ? (
            <p id="login-email-error" className="field-error">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
          />
          {fieldErrors.password ? (
            <p id="login-password-error" className="field-error">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth-footer">
        New to the field desk? <Link to="/register">Create an account</Link>
      </p>
    </section>
  );
}
