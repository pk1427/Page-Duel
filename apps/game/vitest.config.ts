import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Browser E2E specs live in e2e/ and run under Playwright, not Vitest.
    exclude: ["e2e/**", "node_modules/**"],
  },
});
