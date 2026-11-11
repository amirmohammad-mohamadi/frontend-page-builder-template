import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests over both apps against the mock API. `npm run e2e` starts the
 * three servers itself; CI does the same after `npx playwright install chromium`.
 */
export default defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  webServer: [
    {
      command: "node tools/mock-api/server.mjs",
      url: "http://localhost:4000/health",
      cwd: "..",
      reuseExistingServer: true,
    },
    {
      command: "npx next dev -p 3000",
      url: "http://localhost:3000/api/health",
      cwd: "../apps/web",
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: "npx next dev -p 3001",
      url: "http://localhost:3001/api/health",
      cwd: "../apps/admin",
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
