import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage, getApiFieldErrors } from "../api/errors";
import { useAuth } from "../auth/AuthContext";
import { ErrorMessage } from "../components/ErrorMessage";

export function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setError("Enter your name.");
      return;
    }
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
      await register(trimmedName, trimmedEmail, password);
    } catch (cause) {
      setFieldErrors(getApiFieldErrors(cause));
      setError(getApiErrorMessage(cause, "Unable to create the account. Try a different email."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">Account</p>
      <h1>Create an account</h1>
      <p className="lede">
        Register to manage restoration projects. New accounts are ADMIN for this demo.
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        <div className="field">
          <label htmlFor="register-name">Name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={255}
            required
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "register-name-error" : undefined}
          />
          {fieldErrors.name ? (
            <p id="register-name-error" className="field-error">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
          />
          {fieldErrors.email ? (
            <p id="register-email-error" className="field-error">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "register-password-error" : undefined}
          />
          {fieldErrors.password ? (
            <p id="register-password-error" className="field-error">
              {fieldErrors.password}
            </p>
          ) : (
            <p className="field-hint">At least 8 characters.</p>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-footer">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </section>
  );
}
