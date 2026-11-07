import { defineConfig, devices } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const WEB_PORT = "3120";
const API_PORT = "3121";
const STAYS_DATA_DIR = join(tmpdir(), "yac-stays-e2e");

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60000,
  use: { baseURL: `http://127.0.0.1:${WEB_PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    {
      command: "node scripts/seed.js --reset && node server/index.js",
      url: `http://127.0.0.1:${API_PORT}/api/me`,
      env: { STAYS_DATA_DIR, API_PORT },
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: "vite --config web/vite.config.js",
      url: `http://127.0.0.1:${WEB_PORT}`,
      env: { WEB_PORT, API_PORT },
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
