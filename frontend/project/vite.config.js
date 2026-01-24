import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: "/", // IMPORTANT for nginx + route refresh
  plugins: [
    react({
      // Avoid React dev warnings in prod
      jsxRuntime: "automatic"
    })
  ],

  server: {
    port: 5173,
    strictPort: true
  },

  preview: {
    port: 4173,
    strictPort: true
  },

  build: {
    target: "es2018",
    outDir: "dist",
    sourcemap: false, // NEVER true in prod
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        }
      }
    }
  },

  define: {
    __DEV__: mode !== "production"
  }
}));
