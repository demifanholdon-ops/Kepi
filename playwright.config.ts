import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Watchable walkthrough: headed browser + slow-mo + video/trace.
      // Run with: pnpm exec playwright test --project=demo --headed
      // Manual takeover: PWPAUSE=1 pnpm exec playwright test --project=demo --headed --debug
      name: "demo",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 900 },
        headless: false,
        launchOptions: {
          slowMo: Number(process.env.PW_SLOWMO ?? 600),
        },
        video: "on",
        trace: "on",
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
