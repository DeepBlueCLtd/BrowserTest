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

  it('should log initialization message when init is called', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const module = await import('../../src/index');
    module.init();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SonarQuiz] Initializing...'));
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SonarQuiz] Phase 0 - Bootstrap complete'),
    );

    consoleSpy.mockRestore();
  });
});
