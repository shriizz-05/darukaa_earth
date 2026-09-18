import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="auth-shell">
      <header className="auth-topbar">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            Darukaa<span className="brand-dot">.</span>Earth
          </span>
        </span>
      </header>
      <main className="auth-main">
        <Outlet />
      </main>
    </div>
  );
}
