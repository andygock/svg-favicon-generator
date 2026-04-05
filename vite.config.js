import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "./",
  resolve: {
    alias: [
      { find: "react", replacement: "preact/compat" },
      { find: "react-dom/test-utils", replacement: "preact/test-utils" },
      { find: "react-dom", replacement: "preact/compat" },
      { find: "react-dom/client", replacement: "preact/compat" },
      { find: "react/jsx-runtime", replacement: "preact/jsx-runtime" },
      { find: "react/jsx-dev-runtime", replacement: "preact/jsx-dev-runtime" },
    ],
  },
  build: {
    outDir: "dist",
  },
});
