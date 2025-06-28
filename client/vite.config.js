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

      // Updated aliases for new folder structure
      "@auth": path.resolve(__dirname, "./src/auth-area"),
      "@dashboard": path.resolve(__dirname, "./src/dashboard-area"), // Fixed this line
      "@public": path.resolve(__dirname, "./src/public-area"),

      // Keep feature-specific aliases for dashboard features
      "@face-recognition": path.resolve(
        __dirname,
        "./src/dashboard-area/features/face-recognition"
      ),
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
    },
  },
});
