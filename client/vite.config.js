import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@api": path.resolve(__dirname, "./src/api"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@tests": path.resolve(__dirname, "./src/tests"),

      // Area-level
      "@auth": path.resolve(__dirname, "./src/auth-area"),
      "@dashboard": path.resolve(__dirname, "./src/dashboard-area"),
      "@public": path.resolve(__dirname, "./src/public-area"),

      // Feature-level (dashboard)
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
      "@notifications": path.resolve(
        __dirname,
        "./src/dashboard-area/features/notifications"
      ),

      // Deep feature (face recognition inside ViewTrip)
      "@face-recognition": path.resolve(
        __dirname,
        "./src/dashboard-area/features/trips/ViewTrip/features/faceRecognition"
      ),
      "@trip-view": path.resolve(
        __dirname,
        "./src/dashboard-area/features/trips/ViewTrip"
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
});
