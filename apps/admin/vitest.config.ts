import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@book-people/book-data": new URL("../../packages/book-data/src", import.meta.url).pathname,
      "@book-people/game-core": new URL("../../packages/game-core/src", import.meta.url).pathname,
    },
  },
  esbuild: {
    target: "es2020",
  },
});