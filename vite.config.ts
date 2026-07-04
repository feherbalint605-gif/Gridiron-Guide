import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Replit-only dev tooling. These packages are dynamically imported and only
// loaded when running inside a Replit workspace (REPL_ID is set), so this
// config works unchanged when building/running on other platforms (e.g.
// Vercel), even if these optional dev dependencies aren't installed there.
const isReplitDev =
  process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined;

const replitPlugins = isReplitDev
  ? await Promise.all([
      import("@replit/vite-plugin-runtime-error-modal").then((m) =>
        m.default(),
      ),
      import("@replit/vite-plugin-cartographer").then((m) => m.cartographer()),
      import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
    ]).catch(() => [])
  : [];

export default defineConfig({
  plugins: [react(), ...replitPlugins],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
