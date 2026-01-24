import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";

/* ======================================================
   Layouts
   These define the chrome of the app
====================================================== */
import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

/* ======================================================
   Guards
   AuthGuard -> logged in
   RoleGuard -> role-based access
====================================================== */
import AuthGuard from "../js/auth-guard.jsx";
import RoleGuard from "../js/role-guard.jsx";

/* ======================================================
   Public pages (eager-loaded)
   These are light and needed immediately
====================================================== */
import Landing from "../pages/Landing/Landing";
import About from "../pages/About/About";
import Contact from "../pages/Contact/Contact";
import Profile from "../pages/Profile/Profile";

/* ======================================================
   Dashboard pages (lazy-loaded)
   Heavy pages → load only when needed
====================================================== */
const GuestDashboard = lazy(() =>
  import("../pages/Dashboards/GuestDashboard")
);
const BuyerDashboard = lazy(() =>
  import("../pages/Dashboards/BuyerDashboard")
);
const FarmerDashboard = lazy(() =>
  import("../pages/Dashboards/Farmer/FarmerDashboard")
);
const TransporterDashboard = lazy(() =>
  import("../pages/Dashboards/Transporter/TransporterDashboard")
);
const PredictionDashboard = lazy(() =>
  import("../pages/Dashboards/PredictionDashboard")
);
const StockDashboard = lazy(() =>
  import("../pages/Dashboards/Stock/StockDashboard")
);

/* ======================================================
   Shared fallbacks
====================================================== */
function PageLoader() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      Loading...
    </div>
  );
}

function RouteError() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Page unavailable</h2>
      <p>Please refresh or try again later.</p>
    </div>
  );
}

/* ======================================================
   Router definition
====================================================== */
const router = createBrowserRouter([
  /* =========================
     Public routes
  ========================= */
  {
    path: "/",
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Landing /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },

      // Profile is public-layout but auth-protected
      {
        path: "profile",
        element: (
          <AuthGuard>
            <Profile />
          </AuthGuard>
        ),
      },
    ],
  },

  /* =========================
     Dashboard routes
     Everything here lives under /dashboard
  ========================= */
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    errorElement: <RouteError />,
    children: [
      // Guest dashboard (no auth, read-only style)
      {
        path: "guest",
        element: (
          <Suspense fallback={<PageLoader />}>
            <GuestDashboard />
          </Suspense>
        ),
      },

      // Buyer dashboard
      {
        path: "buyer",
        element: (
          <AuthGuard>
            <RoleGuard allow={["buyer"]}>
              <Suspense fallback={<PageLoader />}>
                <BuyerDashboard />
              </Suspense>
            </RoleGuard>
          </AuthGuard>
        ),
      },

      // Farmer dashboard
      {
        path: "farmer",
        element: (
          <AuthGuard>
            <RoleGuard allow={["farmer"]}>
              <Suspense fallback={<PageLoader />}>
                <FarmerDashboard />
              </Suspense>
            </RoleGuard>
          </AuthGuard>
        ),
      },

      // Transporter dashboard
      {
        path: "transporter",
        element: (
          <AuthGuard>
            <RoleGuard allow={["transporter"]}>
              <Suspense fallback={<PageLoader />}>
                <TransporterDashboard />
              </Suspense>
            </RoleGuard>
          </AuthGuard>
        ),
      },

      // Shared predictions page (buyer + farmer)
      {
        path: "predictions",
        element: (
          <AuthGuard>
            <RoleGuard allow={["buyer", "farmer"]}>
              <Suspense fallback={<PageLoader />}>
                <PredictionDashboard />
              </Suspense>
            </RoleGuard>
          </AuthGuard>
        ),
      },

      // Farmer-only stock management
      {
        path: "stock",
        element: (
          <AuthGuard>
            <RoleGuard allow={["farmer"]}>
              <Suspense fallback={<PageLoader />}>
                <StockDashboard />
              </Suspense>
            </RoleGuard>
          </AuthGuard>
        ),
      },
    ],
  },

  /* =========================
     Catch-all 404
  ========================= */
  {
    path: "*",
    element: <RouteError />,
  },
]);

export default router;
