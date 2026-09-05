import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.storybook'],
    testTimeout: 10000, // Integration tests may take longer
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/integration',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/types/**'],
      // Ratchet: set at the measured level (2026-09-05). Raise these when you add tests;
      // never lower them. Enforced in CI via test:coverage:* (see .github/workflows/ci.yml).
      thresholds: {
        lines: 42,
        functions: 43,
        branches: 70,
        statements: 42,
      },
    },
  },
});
