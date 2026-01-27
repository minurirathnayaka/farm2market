import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import router from "./app/router.jsx";
import { AuthProvider } from "./state/authStore.jsx";
import Chatbot from "./components/ai/Chatbot.jsx";

/**
 * Global crash fallback
 */
function RootFallback() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Something went wrong</h2>
      <p>Please refresh the page.</p>
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

      <Toaster richColors position="top-right" closeButton duration={4000} />

      {/* GLOBAL CHATBOT */}
      <Chatbot />
    </AuthProvider>
  </React.StrictMode>
);
