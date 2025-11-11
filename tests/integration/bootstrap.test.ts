/**
 * Bootstrap Integration Test - Phase 0
 *
 * Verifies that the main entry point initializes correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Bootstrap - Phase 0', () => {
  beforeEach(() => {
    // Clear any previous console logs
    vi.clearAllMocks();
  });

  it('should export init function', async () => {
    const module = await import('../../src/index');
    expect(module.init).toBeDefined();
    expect(typeof module.init).toBe('function');
  });

  it('should initialize without errors when debug is enabled', async () => {
    const module = await import('../../src/index');

    // Should not throw when calling init with debug mode
    // Note: We can't test console.log output easily due to custom element
    // registration conflicts when re-importing the module
    expect(() => module.init({ debug: true })).not.toThrow();
  });
});
