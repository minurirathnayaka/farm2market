import { Navigate } from "react-router-dom";
import { useAuth } from "../state/authStore";

export default function RoleGuard({ allow, children }) {
  const { role, loading, user } = useAuth();

  // Still resolving auth / role
  if (loading) return null;

  // Not logged in at all
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Logged in but role not allowed
  if (!allow.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
