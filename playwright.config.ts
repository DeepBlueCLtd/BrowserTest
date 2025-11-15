import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing
 * Special configuration for file:// protocol support
 *
 * Note: Tests run slowly (~4-7 minutes for 79 tests) due to:
 * - workers: 1 (sequential execution to prevent crashes)
 * - --single-process Chromium (required for stability in CI)
 * This is a trade-off between speed and stability.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Disable parallel execution to reduce crashes
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Use single worker to prevent resource exhaustion
  reporter: 'html',
  timeout: 30000, // 30 seconds per test

  use: {
    baseURL: 'file://',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000, // 10 seconds for actions like click, fill
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable file:// protocol access
        launchOptions: {
          args: [
            '--allow-file-access-from-files',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-gpu',
            '--single-process',
          ],
        },
      },
    },
  ],

  webServer: undefined, // No web server needed for file:// protocol
});
