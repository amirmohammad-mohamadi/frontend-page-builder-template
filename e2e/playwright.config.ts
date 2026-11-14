import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests over both apps against the mock API. `npm run e2e` starts the
 * three servers itself; CI does the same after `npx playwright install chromium`.
 *
 * The mock keeps its state in `e2e/.mock-state` (gitignored), wiped before every
 * start, so a run never reads or writes the dev data in `tools/mock-api/data`.
 * It is never reused: an already-running mock would carry foreign state, so stop
 * `npm run dev` before `npm run e2e` (port 4000 must be free). The Next.js
 * servers are reused because they hold no state of their own.
 */
const MOCK_STATE_DIR = "e2e/.mock-state";
export default defineConfig({
  testDir: ".",
  globalSetup: "./global-setup.ts",
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  webServer: [
    {
      command: `node -e "require('fs').rmSync('${MOCK_STATE_DIR}',{recursive:true,force:true})" && node tools/mock-api/server.mjs`,
      url: "http://localhost:4000/health",
      cwd: "..",
      env: { MOCK_API_STATE_DIR: MOCK_STATE_DIR, MOCK_API_PORT: "4000" },
      reuseExistingServer: false,
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
