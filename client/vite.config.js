import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Root-level aliases
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@tests": path.resolve(__dirname, "./src/tests"),

      // Area-level aliases
      "@auth": path.resolve(__dirname, "./src/auth-area"),
      "@dashboard": path.resolve(__dirname, "./src/dashboard-area"),
      "@public": path.resolve(__dirname, "./src/public-area"),

      // Shared components (frequently used across areas)
      "@components": path.resolve(__dirname, "./src/components"),

      // Dashboard features (most complex area)
      "@friends": path.resolve(
        __dirname,
        "./src/dashboard-area/features/friends"
      ),
      "@photos": path.resolve(
        __dirname,
        "./src/dashboard-area/features/photos"
      ),
      "@trips": path.resolve(__dirname, "./src/dashboard-area/features/trips"),
      "@settings": path.resolve(
        __dirname,
        "./src/dashboard-area/features/settings"
      ),

      // Dashboard components and utilities
      "@dashboard/components": path.resolve(
        __dirname,
        "./src/dashboard-area/components"
      ),
      "@dashboard/hooks": path.resolve(__dirname, "./src/dashboard-area/hooks"),
      "@dashboard/utils": path.resolve(__dirname, "./src/dashboard-area/utils"),

      // Trip viewing (complex nested feature)
      "@trip-view": path.resolve(
        __dirname,
        "./src/dashboard-area/features/trips/ViewTrip"
      ),
      "@face-recognition": path.resolve(
        __dirname,
        "./src/dashboard-area/features/trips/ViewTrip/features/faceRecognition"
      ),
      "@gallery": path.resolve(
        __dirname,
        "./src/dashboard-area/features/trips/ViewTrip/features/gallery"
      ),
      "@trip-members": path.resolve(
        __dirname,
        "./src/dashboard-area/features/trips/ViewTrip/features/members"
      ),
      "@trip-statistics": path.resolve(
        __dirname,
        "./src/dashboard-area/features/trips/ViewTrip/features/statistics"
      ),

      // Auth area components
      "@auth/components": path.resolve(__dirname, "./src/auth-area/components"),
      "@auth/hooks": path.resolve(__dirname, "./src/auth-area/hooks"),
      "@auth/services": path.resolve(__dirname, "./src/auth-area/services"),
      "@auth/contexts": path.resolve(__dirname, "./src/auth-area/contexts"),

      // Public area components
      "@public/components": path.resolve(
        __dirname,
        "./src/public-area/components"
      ),
      "@public/hooks": path.resolve(__dirname, "./src/public-area/hooks"),
      "@public/services": path.resolve(__dirname, "./src/public-area/services"),

      // Shared utilities and services
      "@shared/components": path.resolve(__dirname, "./src/shared/components"),
      "@shared/hooks": path.resolve(__dirname, "./src/shared/hooks"),
      "@shared/services": path.resolve(__dirname, "./src/shared/services"),
      "@shared/utils": path.resolve(__dirname, "./src/shared/utils"),
      "@shared/contexts": path.resolve(__dirname, "./src/shared/contexts"),

      // Firebase services (frequently used) - renamed to avoid conflicts
      "@firebase-services": path.resolve(
        __dirname,
        "./src/shared/services/firebase"
      ),
    },
  },

  server: {
    proxy: {
      "/api/openweather": {
        target: "https://api.openweathermap.org",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/openweather/, ""),
      },
    },
  },

  // ✅ OPTIMIZED BUILD CONFIGURATION
  build: {
    target: "es2020", // Enable modern JS features for better tree-shaking

    rollupOptions: {
      output: {
        manualChunks: {
          // Core chunks only
          vendor: ["react", "react-dom", "react-router-dom"],
          firebase: [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/storage",
          ],
          ui: ["@heroicons/react", "lucide-react", "@mui/material"],
          utils: ["uuid", "clsx", "date-fns"],
        },
      },
    },

    chunkSizeWarningLimit: 500,
    sourcemap: false,
    minify: "esbuild",
  },

  // ✅ OPTIMIZED DEPENDENCIES
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "firebase/app",
      "@heroicons/react",
      "react-hot-toast",
    ],
  },

  // ✅ DEVELOPMENT OPTIMIZATIONS
  esbuild: {
    target: "es2020",
    logOverride: { "this-is-undefined-in-esm": "silent" },
  },
});
