import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      "/auth": "http://localhost:8000",
      "/catalog": "http://localhost:8000",
      "/inventory": "http://localhost:8000",
      "/cart": "http://localhost:8000",
      "/orders": "http://localhost:8000",
      "/payments": "http://localhost:8000",
      "/shipping": "http://localhost:8000",
      "/notifications": "http://localhost:8000",
    },
  },
});
