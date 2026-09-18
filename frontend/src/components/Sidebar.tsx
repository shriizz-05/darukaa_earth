import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/projects", label: "Projects" },
  { to: "/map", label: "Map" },
  { to: "/analytics", label: "Analytics" },
];

type SidebarProps = {
  open: boolean;
  onNavigate: () => void;
  onLogout: () => void;
};

export function Sidebar({ open, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside id="app-sidebar" className={open ? "sidebar is-open" : "sidebar"}>
      <nav className="sidebar-nav" aria-label="Primary">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? "sidebar-link is-active" : "sidebar-link")}
            onClick={onNavigate}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <button type="button" className="sidebar-link sidebar-logout" onClick={onLogout}>
        Logout
      </button>
    </aside>
  );
}
