import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 30000,
  },
  resolve: {
    // mirrors tsconfig paths alias @/* -> src/*
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
