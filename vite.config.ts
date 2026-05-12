import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    build: {
      outDir: "docs",
      emptyOutDir: true,
    },
  },
  tanstackStart: {
    server: { entry: "server", output: "index.js" },
  },
});
