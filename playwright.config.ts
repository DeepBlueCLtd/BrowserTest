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

  use: {
    baseURL: 'file://',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable file:// protocol access
        launchOptions: {
          args: ['--allow-file-access-from-files'],
        },
      },
    },
  ],

  webServer: undefined, // No web server needed for file:// protocol
});
