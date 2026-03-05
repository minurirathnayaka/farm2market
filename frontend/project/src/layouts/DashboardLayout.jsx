import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../state/authStore";
import NotificationInbox from "../components/ui/NotificationInbox";
import { APP_ENV } from "../js/env";

import "../styles/layout.css";

/**
 * DashboardLayout
 * - Owns layout + navigation chrome only
 * - Role-aware sidebar
 * - Common dashboard for buyer + transporter
 */
export default function DashboardLayout() {
  const { role, loading, user } = useAuth();
  const dashboardHome = role === "transporter" ? "/dashboard/transporter" : "/dashboard";

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
        {APP_ENV.FEATURE_ORDER_THREADS && <NotificationInbox />}

        {/* =========================
           Common Dashboard
           buyer + transporter
        ========================= */}
        {(role === "buyer" || role === "transporter") && (
          <>
            <NavLink
              to={dashboardHome}
              end
              className={({ isActive }) =>
                isActive ? "active" : undefined
              }
            >
              Dashboard
            </NavLink>

            {APP_ENV.FEATURE_ORDER_THREADS && (
              <NavLink
                to="/dashboard/orders"
                className={({ isActive }) =>
                  isActive ? "active" : undefined
                }
              >
                Orders
              </NavLink>
            )}

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
              Market Predictions
            </NavLink>

            {APP_ENV.FEATURE_ORDER_THREADS && (
              <NavLink
                to="/dashboard/orders"
                className={({ isActive }) =>
                  isActive ? "active" : undefined
                }
              >
                Orders
              </NavLink>
            )}
          </>
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
