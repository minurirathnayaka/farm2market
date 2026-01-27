import { Navigate } from "react-router-dom";
import { useAuth } from "../state/authStore";

export default function DashboardRedirect() {
  const { role, loading } = useAuth();

  if (loading) return null;

  if (role === "farmer") {
    return <Navigate to="/dashboard/farmer" replace />;
  }

  if (role === "buyer") {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === "transporter") {
    return <Navigate to="/dashboard/transporter" replace />;
  }

  return <Navigate to="/" replace />;
}
