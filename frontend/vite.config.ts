/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    // Public tunnels (trycloudflare.com, localtunnel) send a non-localhost Host header.
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        timeout: 30_000,
      },
    },
  },
  optimizeDeps: {
    include: ["mapbox-gl", "@mapbox/mapbox-gl-draw", "chart.js", "react-chartjs-2"],
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
