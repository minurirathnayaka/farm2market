import { createBrowserRouter } from "react-router-dom";

/* layouts */
import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

/* public pages */
import Landing from "../pages/Landing/Landing";
import About from "../pages/About/About";
import Contact from "../pages/Contact/Contact";
import Profile from "../pages/Profile/Profile";

/* dashboards */
import GuestDashboard from "../pages/Dashboards/GuestDashboard";
import BuyerDashboard from "../pages/Dashboards/BuyerDashboard";
import FarmerDashboard from "../pages/Dashboards/Farmer/FarmerDashboard";
import TransporterDashboard from "../pages/Dashboards/Transporter/TransporterDashboard";

/* shared dashboard pages */
import PredictionDashboard from "../pages/Dashboards/PredictionDashboard";
import StockDashboard from "../pages/Dashboards/Stock/StockDashboard";

/* guards */
import AuthGuard from "../js/auth-guard.jsx";
import RoleGuard from "../js/role-guard.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
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

  /* DASHBOARDS */
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      /* guest dashboard (no auth) */
      {
        path: "guest",
        element: <GuestDashboard />,
      },

      /* buyer dashboard */
      {
        path: "buyer",
        element: (
          <AuthGuard>
            <RoleGuard allow={["buyer"]}>
              <BuyerDashboard />
            </RoleGuard>
          </AuthGuard>
        ),
      },

      /* farmer dashboard */
      {
        path: "farmer",
        element: (
          <AuthGuard>
            <RoleGuard allow={["farmer"]}>
              <FarmerDashboard />
            </RoleGuard>
          </AuthGuard>
        ),
      },

      /* transporter dashboard */
      {
        path: "transporter",
        element: (
          <AuthGuard>
            <RoleGuard allow={["transporter"]}>
              <TransporterDashboard />
            </RoleGuard>
          </AuthGuard>
        ),
      },

      /* shared prediction page */
      {
        path: "predictions",
        element: (
          <AuthGuard>
            <RoleGuard allow={["buyer", "farmer"]}>
              <PredictionDashboard />
            </RoleGuard>
          </AuthGuard>
        ),
      },

      /* farmer-only stock */
      {
        path: "stock",
        element: (
          <AuthGuard>
            <RoleGuard allow={["farmer"]}>
              <StockDashboard />
            </RoleGuard>
          </AuthGuard>
        ),
      },
    ],
  },
]);

export default router;
