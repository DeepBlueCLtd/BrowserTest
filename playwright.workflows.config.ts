import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for workflow E2E tests (file:// protocol only)
 * No Storybook needed for these tests
 */
export default defineConfig({
  testDir: './tests/e2e/workflows',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'html',

  // Global timeout for each test
  timeout: 15000,

  // Assertion timeout
  expect: {
    timeout: 2000,
  },

  use: {
    baseURL: 'file://',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 2000,
    navigationTimeout: 2000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
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

  // No webServer needed for workflow tests (file:// protocol)
});
