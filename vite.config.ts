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
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
