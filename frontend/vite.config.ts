import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// `vite build --mode artifact` produces a self-contained preview build (relative paths,
// in-memory routing, demo notice) for sharing as a private Claude artifact link.
export default defineConfig(({ mode }) => ({
  base: mode === "artifact" ? "./" : "/",
  build: mode === "artifact" ? { outDir: "dist-artifact", emptyOutDir: true } : undefined,
  server: {
    host: "::",
    port: 8080,
    // En desarrollo la API corre en Docker. Dentro de compose (frontend-dev) el destino es
    // http://backend:8000; desde la máquina, localhost:8000.
    proxy: {
      "/v1": process.env.VITE_PROXY_TARGET ?? "http://localhost:8000",
      "/health": process.env.VITE_PROXY_TARGET ?? "http://localhost:8000",
    },
    watch: process.env.VITE_USE_POLLING ? { usePolling: true, interval: 300 } : undefined,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
