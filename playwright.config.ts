import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing
 * Special configuration for file:// protocol support
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined, // Use 2 workers in CI for faster execution
  reporter: 'html',

  // Global timeout for each test (2 seconds max)
  timeout: 2000,

  // Assertion timeout (2 seconds max for expect() calls)
  expect: {
    timeout: 2000,
  },

  use: {
    baseURL: 'file://',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Action timeout (clicks, fills, etc.) - 2 seconds max
    actionTimeout: 2000,
    // Navigation timeout (page.goto) - 2 seconds max
    navigationTimeout: 2000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable file:// protocol access AND disable web security for Storybook testing
        launchOptions: {
          args: [
            '--allow-file-access-from-files',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
        },
      },
    },
  ],

  webServer: undefined, // No web server needed for file:// protocol
});
