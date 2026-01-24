import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import router from "./app/router.jsx";
import { AuthProvider } from "./state/authStore.jsx";

/**
 * Global crash fallback
 * Prevents white screen of death in prod
 */
function RootFallback() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Something went wrong</h2>
      <p>Please refresh the page. If the issue persists, try again later.</p>
    </div>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <React.Suspense fallback={<RootFallback />}>
        <RouterProvider router={router} />
      </React.Suspense>

      <Toaster
        richColors
        position="top-right"
        closeButton
        duration={4000}
      />
    </AuthProvider>
  </React.StrictMode>
);
