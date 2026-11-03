import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 8000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.CI ? {} : { channel: "chrome" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run preview -- --port 5173 --strictPort",
        url: "http://localhost:5173",
        reuseExistingServer: true,
        timeout: 120000,
      },
});
