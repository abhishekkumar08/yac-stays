import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { kasumi } from "@kasumi/ui/vite";

const api = `http://127.0.0.1:${process.env.API_PORT ?? 3111}`;

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react(), kasumi()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.WEB_PORT ?? 3110),
    strictPort: true,
    host: "127.0.0.1",
    proxy: { "/api": api, "/photos": api },
  },
});
