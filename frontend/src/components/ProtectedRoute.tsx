import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";

function SessionGate({ label }: { label: string }) {
  return (
    <div className="session-gate">
      <LoadingSpinner label={label} />
    </div>
  );
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SessionGate label="Restoring session" />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SessionGate label="Restoring session" />;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
