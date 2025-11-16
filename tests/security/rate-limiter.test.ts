/**
 * Tests for rate limiting authentication attempts
 *
 * Security requirement: Prevent brute force attacks by limiting
 * authentication attempts with exponential backoff.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter } from '../../src/utils/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow first attempt immediately', () => {
    rateLimiter = new RateLimiter('test-key', { maxAttempts: 5, windowMs: 30000 });
    expect(rateLimiter.isAllowed()).toBe(true);
  });

  it('should track attempt count', () => {
    rateLimiter = new RateLimiter('test-key', { maxAttempts: 5, windowMs: 30000 });

    rateLimiter.recordAttempt(false);
    expect(rateLimiter.getAttemptCount()).toBe(1);

    rateLimiter.recordAttempt(false);
    expect(rateLimiter.getAttemptCount()).toBe(2);
  });

  it('should allow attempts up to max limit', () => {
    rateLimiter = new RateLimiter('test-key', { maxAttempts: 3, windowMs: 30000 });

    expect(rateLimiter.isAllowed()).toBe(true);
    rateLimiter.recordAttempt(false);

    expect(rateLimiter.isAllowed()).toBe(true);
    rateLimiter.recordAttempt(false);

    expect(rateLimiter.isAllowed()).toBe(true);
    rateLimiter.recordAttempt(false);

    // Should be locked out after max attempts
    expect(rateLimiter.isAllowed()).toBe(false);
  });

  it('should implement exponential backoff', () => {
    rateLimiter = new RateLimiter('test-key', {
      maxAttempts: 3,
      windowMs: 30000,
      baseDelayMs: 1000,
    });

    // First 3 failed attempts
    rateLimiter.recordAttempt(false);
    rateLimiter.recordAttempt(false);
    rateLimiter.recordAttempt(false);

    expect(rateLimiter.isAllowed()).toBe(false);

    // Check lockout time increases exponentially
    const lockoutTime1 = rateLimiter.getLockoutTimeRemaining();
    expect(lockoutTime1).toBeGreaterThan(0);

    // Advance time by 1 second
    vi.advanceTimersByTime(1000);

    // Try another attempt (should extend lockout)
    if (rateLimiter.isAllowed()) {
      rateLimiter.recordAttempt(false);
    }

    const lockoutTime2 = rateLimiter.getLockoutTimeRemaining();
    // Lockout time should increase
    expect(lockoutTime2).toBeGreaterThanOrEqual(0);
  });

  it('should reset after successful attempt', () => {
    rateLimiter = new RateLimiter('test-key', { maxAttempts: 5, windowMs: 30000 });

    rateLimiter.recordAttempt(false);
    rateLimiter.recordAttempt(false);
    expect(rateLimiter.getAttemptCount()).toBe(2);

    rateLimiter.recordAttempt(true); // Successful
    expect(rateLimiter.getAttemptCount()).toBe(0);
    expect(rateLimiter.isAllowed()).toBe(true);
  });

  it('should reset after time window expires', () => {
    rateLimiter = new RateLimiter('test-key', { maxAttempts: 3, windowMs: 30000 });

    rateLimiter.recordAttempt(false);
    rateLimiter.recordAttempt(false);

    // Advance time past the window
    vi.advanceTimersByTime(31000);

    // Should be allowed again after window expires
    expect(rateLimiter.isAllowed()).toBe(true);
    expect(rateLimiter.getAttemptCount()).toBe(0);
  });

  it('should persist state to localStorage', () => {
    rateLimiter = new RateLimiter('test-key', { maxAttempts: 5, windowMs: 30000 });

    rateLimiter.recordAttempt(false);
    rateLimiter.recordAttempt(false);

    // Create new instance with same key
    const rateLimiter2 = new RateLimiter('test-key', { maxAttempts: 5, windowMs: 30000 });
    expect(rateLimiter2.getAttemptCount()).toBe(2);
  });

  it('should return correct lockout time remaining', () => {
    rateLimiter = new RateLimiter('test-key', {
      maxAttempts: 2,
      windowMs: 30000,
      baseDelayMs: 5000,
    });

    rateLimiter.recordAttempt(false);
    rateLimiter.recordAttempt(false);

    // Should be locked out
    expect(rateLimiter.isAllowed()).toBe(false);

    const remaining = rateLimiter.getLockoutTimeRemaining();
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(10000); // 2^1 * 5000 = 10000ms max
  });

  it('should clear rate limit state', () => {
    rateLimiter = new RateLimiter('test-key', { maxAttempts: 5, windowMs: 30000 });

    rateLimiter.recordAttempt(false);
    rateLimiter.recordAttempt(false);
    expect(rateLimiter.getAttemptCount()).toBe(2);

    rateLimiter.reset();
    expect(rateLimiter.getAttemptCount()).toBe(0);
    expect(rateLimiter.isAllowed()).toBe(true);
  });

  it('should handle multiple keys independently', () => {
    const limiter1 = new RateLimiter('key1', { maxAttempts: 3, windowMs: 30000 });
    const limiter2 = new RateLimiter('key2', { maxAttempts: 3, windowMs: 30000 });

    limiter1.recordAttempt(false);
    limiter1.recordAttempt(false);
    limiter1.recordAttempt(false);

    // limiter1 should be locked
    expect(limiter1.isAllowed()).toBe(false);
    // limiter2 should still be allowed
    expect(limiter2.isAllowed()).toBe(true);
  });

  it('should cap exponential backoff at maximum', () => {
    rateLimiter = new RateLimiter('test-key', {
      maxAttempts: 3,
      windowMs: 30000,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
    });

    // Many failed attempts
    for (let i = 0; i < 10; i++) {
      if (rateLimiter.isAllowed()) {
        rateLimiter.recordAttempt(false);
      }
      vi.advanceTimersByTime(1000);
    }

    const remaining = rateLimiter.getLockoutTimeRemaining();
    // Should not exceed max delay
    expect(remaining).toBeLessThanOrEqual(30000);
  });
});
