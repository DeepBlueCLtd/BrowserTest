/**
 * Tests for constant-time comparison functions
 *
 * Security requirement: Password comparison must be timing-safe to prevent timing attacks
 * where attackers measure response times to guess password characters.
 */

import { describe, it, expect } from 'vitest';
import { constantTimeCompare } from '../../src/utils/security';

describe('constantTimeCompare', () => {
  it('should return true for identical strings', () => {
    const a = 'test-password-hash-12345';
    const b = 'test-password-hash-12345';
    expect(constantTimeCompare(a, b)).toBe(true);
  });

  it('should return false for different strings of same length', () => {
    const a = 'test-password-hash-12345';
    const b = 'test-password-hash-54321';
    expect(constantTimeCompare(a, b)).toBe(false);
  });

  it('should return false for different strings of different lengths', () => {
    const a = 'short';
    const b = 'much-longer-string';
    expect(constantTimeCompare(a, b)).toBe(false);
  });

  it('should return false for empty string vs non-empty', () => {
    expect(constantTimeCompare('', 'test')).toBe(false);
    expect(constantTimeCompare('test', '')).toBe(false);
  });

  it('should return true for two empty strings', () => {
    expect(constantTimeCompare('', '')).toBe(true);
  });

  it('should handle unicode characters', () => {
    const a = 'test-🔒-password';
    const b = 'test-🔒-password';
    expect(constantTimeCompare(a, b)).toBe(true);
  });

  it('should return false for strings differing only in case', () => {
    const a = 'Test-Password';
    const b = 'test-password';
    expect(constantTimeCompare(a, b)).toBe(false);
  });

  /**
   * Timing attack resistance test
   * This test verifies that comparison time is constant regardless of where strings differ.
   * Note: This is a basic check - true timing attack resistance requires statistical analysis.
   */
  it('should take similar time regardless of difference position', () => {
    const baseString = 'x'.repeat(1000);
    const earlyDiff = 'y' + 'x'.repeat(999); // Differs at position 0
    const lateDiff = 'x'.repeat(999) + 'y'; // Differs at position 999

    // Warm up to avoid JIT compilation affecting timing
    for (let i = 0; i < 100; i++) {
      constantTimeCompare(baseString, earlyDiff);
      constantTimeCompare(baseString, lateDiff);
    }

    // Measure timing for early difference
    const earlyStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      constantTimeCompare(baseString, earlyDiff);
    }
    const earlyTime = performance.now() - earlyStart;

    // Measure timing for late difference
    const lateStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      constantTimeCompare(baseString, lateDiff);
    }
    const lateTime = performance.now() - lateStart;

    // Times should be within 20% of each other (allowing for measurement noise)
    const ratio = Math.max(earlyTime, lateTime) / Math.min(earlyTime, lateTime);
    expect(ratio).toBeLessThan(1.2);
  });

  it('should handle very long strings efficiently', () => {
    const a = 'x'.repeat(10000);
    const b = 'x'.repeat(10000);
    const start = performance.now();
    expect(constantTimeCompare(a, b)).toBe(true);
    const duration = performance.now() - start;

    // Should complete in reasonable time (< 100ms for 10K chars)
    expect(duration).toBeLessThan(100);
  });
});
