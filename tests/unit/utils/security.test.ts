/**
 * Unit tests for security utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, constantTimeCompare, hashPassword } from '../../../src/utils/security.js';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
    vi.useFakeTimers();
  });

  it('should allow first attempt', () => {
    const result = limiter.attempt();
    expect(result).toBe(true);
  });

  it('should not be locked out initially', () => {
    expect(limiter.isLockedOut()).toBe(false);
    expect(limiter.getRemainingSeconds()).toBe(0);
  });

  it('should lock out after first failure (2s delay)', () => {
    limiter.recordFailure();

    expect(limiter.isLockedOut()).toBe(true);
    expect(limiter.attempt()).toBe(false);
    expect(limiter.getRemainingSeconds()).toBe(2);
  });

  it('should enforce exponential backoff delays', () => {
    const expectedDelays = [2, 4, 8, 16, 30];

    for (const expectedDelay of expectedDelays) {
      limiter.recordFailure();
      expect(limiter.getRemainingSeconds()).toBe(expectedDelay);

      // Fast-forward time
      vi.advanceTimersByTime(expectedDelay * 1000);
    }
  });

  it('should cap delay at 30 seconds', () => {
    // Record 10 failures (more than 5)
    for (let i = 0; i < 10; i++) {
      limiter.recordFailure();
    }

    // Should still be 30s max
    expect(limiter.getRemainingSeconds()).toBeLessThanOrEqual(30);
  });

  it('should allow attempt after lockout expires', () => {
    limiter.recordFailure(); // 2s lockout

    expect(limiter.attempt()).toBe(false);

    // Fast-forward 2 seconds
    vi.advanceTimersByTime(2000);

    expect(limiter.attempt()).toBe(true);
  });

  it('should reset failure count on reset()', () => {
    limiter.recordFailure();
    limiter.recordFailure();
    limiter.recordFailure();

    expect(limiter.isLockedOut()).toBe(true);

    limiter.reset();

    expect(limiter.isLockedOut()).toBe(false);
    expect(limiter.getRemainingSeconds()).toBe(0);
  });

  it('should decrement remaining seconds as time passes', () => {
    limiter.recordFailure(); // 2s lockout

    expect(limiter.getRemainingSeconds()).toBe(2);

    vi.advanceTimersByTime(500);
    expect(limiter.getRemainingSeconds()).toBe(2); // Still rounds up to 2

    vi.advanceTimersByTime(500);
    expect(limiter.getRemainingSeconds()).toBe(1);

    vi.advanceTimersByTime(500);
    expect(limiter.getRemainingSeconds()).toBe(1); // Rounds up

    vi.advanceTimersByTime(500);
    expect(limiter.getRemainingSeconds()).toBe(0);
  });
});

describe('constantTimeCompare', () => {
  it('should return true for identical strings', async () => {
    const result = await constantTimeCompare('hello', 'hello');
    expect(result).toBe(true);
  });

  it('should return false for different strings', async () => {
    const result = await constantTimeCompare('hello', 'world');
    expect(result).toBe(false);
  });

  it('should return false for different length strings', async () => {
    const result = await constantTimeCompare('short', 'longer string');
    expect(result).toBe(false);
  });

  it('should handle empty strings', async () => {
    const result = await constantTimeCompare('', '');
    expect(result).toBe(true);
  });

  it('should handle long strings (password hashes)', async () => {
    const hash1 = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
    const hash2 = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
    const hash3 = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d9'; // Different last char

    expect(await constantTimeCompare(hash1, hash2)).toBe(true);
    expect(await constantTimeCompare(hash1, hash3)).toBe(false);
  });

  it('should be constant-time (basic smoke test)', async () => {
    // This is a basic smoke test - true constant-time analysis requires
    // specialized tools and statistical analysis
    const iterations = 100;

    // Test matching strings
    const start1 = performance.now();
    for (let i = 0; i < iterations; i++) {
      await constantTimeCompare('password123', 'password123');
    }
    const time1 = performance.now() - start1;

    // Test non-matching strings (differ at end)
    const start2 = performance.now();
    for (let i = 0; i < iterations; i++) {
      await constantTimeCompare('password123', 'password124');
    }
    const time2 = performance.now() - start2;

    // Test non-matching strings (differ at start)
    const start3 = performance.now();
    for (let i = 0; i < iterations; i++) {
      await constantTimeCompare('password123', 'xassword123');
    }
    const time3 = performance.now() - start3;

    // Timing should be similar regardless of where difference occurs
    // Allow 50% variance (very generous for statistical noise)
    const avgTime = (time1 + time2 + time3) / 3;
    expect(Math.abs(time1 - avgTime)).toBeLessThan(avgTime * 0.5);
    expect(Math.abs(time2 - avgTime)).toBeLessThan(avgTime * 0.5);
    expect(Math.abs(time3 - avgTime)).toBeLessThan(avgTime * 0.5);
  });
});

describe('hashPassword', () => {
  it('should hash password to SHA-256', async () => {
    const hash = await hashPassword('password');
    expect(hash).toBe('5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');
  });

  it('should produce consistent hashes', async () => {
    const hash1 = await hashPassword('test123');
    const hash2 = await hashPassword('test123');
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different inputs', async () => {
    const hash1 = await hashPassword('password1');
    const hash2 = await hashPassword('password2');
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty string', async () => {
    const hash = await hashPassword('');
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should produce 64-character hex string', async () => {
    const hash = await hashPassword('test');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash.length).toBe(64);
  });
});
