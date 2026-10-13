import { defineConfig, devices } from "@playwright/test";

/**
 * Browser E2E suite for Book People (Expo web + local Supabase + local assets).
 *
 * Prerequisites (all local, never production):
 *   1. Supabase local stack:  `supabase start`            (http://127.0.0.1:54321)
 *   2. Asset server from repo root: `python3 -m http.server 8000 --directory .local`
 *   3. Expo web: `pnpm --filter game exec expo start --web --port 8081`
 *      (with EXPO_PUBLIC_SUPABASE_URL/ANON_KEY + per-book asset bases in
 *      apps/game/.env.local — see docs/backend-setup.md and docs/playtesting.md)
 *
 * The webServer entry below reuses the already-running Expo instance
 * (reuseExistingServer) and only starts one when the port is free, so the
 * suite never kills or duplicates a developer's process.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report" }]],
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8081",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "pnpm --filter game exec expo start --web --port 8081",
    url: "http://localhost:8081",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
