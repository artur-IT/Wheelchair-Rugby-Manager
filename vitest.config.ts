import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 30000,
    server: {
      deps: {
        inline: ["@mui/material", "react-transition-group"],
      },
    },
  },
  resolve: {
    // mirrors tsconfig paths alias @/* -> src/*
    alias: {
      "@": resolve(__dirname, "./src"),
      // MUI v9 imports this path as a directory; Vitest/Node ESM on Windows needs a file target.
      "react-transition-group/TransitionGroupContext": "react-transition-group/cjs/TransitionGroupContext.js",
    },
  },
});
