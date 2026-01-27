import { Navigate } from "react-router-dom";
import { useAuth } from "../state/authStore";

export default function RoleGuard({ allow, children }) {
  const { role, loading, user } = useAuth();

  // Still resolving auth / role
  if (loading) return null;

  // Not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Role not allowed → send to correct dashboard
  if (!allow.includes(role)) {
    if (role === "farmer") {
      return <Navigate to="/dashboard/farmer" replace />;
    }

    if (role === "transporter") {
      return <Navigate to="/dashboard/transporter" replace />;
    }

    // buyer fallback
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
