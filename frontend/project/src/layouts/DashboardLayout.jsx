import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../state/authStore";

import "../styles/layout.css";

export default function DashboardLayout() {
  const { role, loading, user } = useAuth();

  if (loading) return null;

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        {/* Guest */}
        {!user && (
          <NavLink to="/dashboard/guest">
            Guest Dashboard
          </NavLink>
        )}

        {/* Buyer */}
        {role === "buyer" && (
          <>
            <NavLink to="/dashboard/buyer">
              Buyer Dashboard
            </NavLink>
            <NavLink to="/dashboard/predictions">
              Market Predictions
            </NavLink>
          </>
        )}

        {/* Farmer */}
        {role === "farmer" && (
          <>
            <NavLink to="/dashboard/farmer">
              Farmer Dashboard
            </NavLink>
            <NavLink to="/dashboard/stock">
              Submit Stock
            </NavLink>
            <NavLink to="/dashboard/predictions">
              Predictions
            </NavLink>
          </>
        )}

        {/* Transporter */}
        {role === "transporter" && (
          <NavLink to="/dashboard/transporter">
            Transporter Dashboard
          </NavLink>
        )}
      </aside>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
