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

      // Feature-specific aliases for cleaner imports
      "@auth": path.resolve(__dirname, "./src/features/auth"),
      "@dashboard": path.resolve(__dirname, "./src/features/dashboard"),
      "@face-recognition": path.resolve(
        __dirname,
        "./src/features/face-recognition"
      ),
      "@friends": path.resolve(__dirname, "./src/features/friends"),
      "@photos": path.resolve(__dirname, "./src/features/photos"),
      "@trips": path.resolve(__dirname, "./src/features/trips"),
      "@settings": path.resolve(__dirname, "./src/features/settings"),
      "@notifications": path.resolve(__dirname, "./src/features/notifications"),
    },
  },
});
