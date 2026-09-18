import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const mapLayout = location.pathname === "/map";

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className={mapLayout ? "app-shell app-shell-map" : "app-shell"}>
      <header className="topbar">
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>
        <NavLink to="/dashboard" className="brand" onClick={closeMenu}>
          <span className="brand-mark" aria-hidden="true" />
          <span>
            Darukaa<span className="brand-dot">.</span>Earth
          </span>
        </NavLink>
        <div className="topbar-user">
          {user ? (
            <>
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </>
          ) : null}
        </div>
      </header>
      <div className="app-body">
        {menuOpen ? (
          <button
            type="button"
            className="sidebar-scrim"
            aria-label="Close menu"
            onClick={closeMenu}
          />
        ) : null}
        <Sidebar open={menuOpen} onNavigate={closeMenu} onLogout={logout} />
        <main className={mapLayout ? "content content-map" : "content"}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
