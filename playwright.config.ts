import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end suite — the product loop no unit test can prove:
 * sign in → create project → generate diagram → canvas → export.
 *
 * Local: needs Postgres reachable (same contract as the DB integration
 * tests) — `npm run db:migrate` first, then `npx playwright test`.
 * CI runs this as a separate job with the postgres service.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    // NOTE: wait on /login, not /api/health — health returns 503 when the
    // database is down, and the app's offline fallback is a supported path
    // the e2e must tolerate (CI always has Postgres, so it tests db mode).
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXTAUTH_SECRET: "e2e-only-not-a-real-secret",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
