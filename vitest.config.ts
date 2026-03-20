import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
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
