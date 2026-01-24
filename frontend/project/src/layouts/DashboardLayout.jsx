import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../state/authStore";

import "../styles/layout.css";

/**
 * DashboardLayout
 * - Owns layout + navigation chrome only
 * - Does NOT fetch data
 * - Safe for auth delays and edge cases
 */
export default function DashboardLayout() {
  const { role, loading, user } = useAuth();

  // Never return null in prod – show skeleton instead
  if (loading) {
    return (
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar" />
        <main className="dashboard-content">
          Loading dashboard…
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        {/* =========================
           Guest
        ========================= */}
        {!user && (
          <NavLink
            to="/dashboard/guest"
            className={({ isActive }) =>
              isActive ? "active" : undefined
            }
          >
            Guest Dashboard
          </NavLink>
        )}

        {/* =========================
           Buyer
        ========================= */}
        {role === "buyer" && (
          <>
            <NavLink
              to="/dashboard/buyer"
              className={({ isActive }) =>
                isActive ? "active" : undefined
              }
            >
              Buyer Dashboard
            </NavLink>

            <NavLink
              to="/dashboard/predictions"
              className={({ isActive }) =>
                isActive ? "active" : undefined
              }
            >
              Market Predictions
            </NavLink>
          </>
        )}

        {/* =========================
           Farmer
        ========================= */}
        {role === "farmer" && (
          <>
            <NavLink
              to="/dashboard/farmer"
              className={({ isActive }) =>
                isActive ? "active" : undefined
              }
            >
              Farmer Dashboard
            </NavLink>

            <NavLink
              to="/dashboard/stock"
              className={({ isActive }) =>
                isActive ? "active" : undefined
              }
            >
              Submit Stock
            </NavLink>

            <NavLink
              to="/dashboard/predictions"
              className={({ isActive }) =>
                isActive ? "active" : undefined
              }
            >
              Predictions
            </NavLink>
          </>
        )}

        {/* =========================
           Transporter
        ========================= */}
        {role === "transporter" && (
          <NavLink
            to="/dashboard/transporter"
            className={({ isActive }) =>
              isActive ? "active" : undefined
            }
          >
            Transporter Dashboard
          </NavLink>
        )}

        {/* =========================
           Safety fallback
        ========================= */}
        {user && !role && (
          <span style={{ opacity: 0.6 }}>
            No dashboard available
          </span>
        )}
      </aside>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
