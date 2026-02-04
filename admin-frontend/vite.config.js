import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  // Important when serving behind Fastify with a catch-all route
  appType: "spa",
  server: {
    proxy: {
      // During `vite dev`, forward API calls to the admin Fastify service
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
});
