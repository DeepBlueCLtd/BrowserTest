/**
 * Unit tests for Rate Limiter Service
 *
 * Tests PIN attempt tracking and lockout functionality.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getAttemptState,
  checkLockout,
  recordFailedAttempt,
  clearAttemptState,
  getRemainingAttempts,
} from '../../../../src/services/auth/rate-limiter.js';
import { PIN_CONSTANTS } from '../../../../src/types/contracts.js';

describe('Rate Limiter Service', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getAttemptState', () => {
    it('should return null for no previous attempts', () => {
      const state = getAttemptState('RN1234');
      expect(state).toBeNull();
    });

    it('should return stored state after failed attempt', () => {
      recordFailedAttempt('RN1234');
      const state = getAttemptState('RN1234');
      expect(state).not.toBeNull();
      expect(state?.serviceId).toBe('RN1234');
      expect(state?.attempts).toBe(1);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should increment attempt counter', () => {
      const state1 = recordFailedAttempt('RN1234');
      expect(state1.attempts).toBe(1);

      const state2 = recordFailedAttempt('RN1234');
      expect(state2.attempts).toBe(2);
    });

    it('should set lockout after 3 failed attempts', () => {
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN1234');
      const state3 = recordFailedAttempt('RN1234');

      expect(state3.attempts).toBe(3);
      expect(state3.lockoutUntil).not.toBeNull();
    });

    it('should not set lockout before 3 attempts', () => {
      const state1 = recordFailedAttempt('RN1234');
      expect(state1.lockoutUntil).toBeNull();

      const state2 = recordFailedAttempt('RN1234');
      expect(state2.lockoutUntil).toBeNull();
    });

    it('should isolate attempts per service ID', () => {
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN5678');

      const state1 = getAttemptState('RN1234');
      const state2 = getAttemptState('RN5678');

      expect(state1?.attempts).toBe(2);
      expect(state2?.attempts).toBe(1);
    });
  });

  describe('checkLockout', () => {
    it('should return not locked for no attempts', () => {
      const result = checkLockout('RN1234');
      expect(result.isLocked).toBe(false);
      expect(result.remainingMs).toBe(0);
    });

    it('should return not locked after 2 failures', () => {
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN1234');

      const result = checkLockout('RN1234');
      expect(result.isLocked).toBe(false);
    });

    it('should return locked after 3 failures', () => {
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN1234');

      const result = checkLockout('RN1234');
      expect(result.isLocked).toBe(true);
      expect(result.remainingMs).toBeGreaterThan(0);
      expect(result.remainingMs).toBeLessThanOrEqual(PIN_CONSTANTS.LOCKOUT_MS);
    });

    it('should return unlocked after lockout expires', () => {
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN1234');

      // Advance time past lockout
      vi.advanceTimersByTime(PIN_CONSTANTS.LOCKOUT_MS + 1000);

      const result = checkLockout('RN1234');
      expect(result.isLocked).toBe(false);
    });

    it('should clear state after lockout expires', () => {
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN1234');

      vi.advanceTimersByTime(PIN_CONSTANTS.LOCKOUT_MS + 1000);
      checkLockout('RN1234');

      const state = getAttemptState('RN1234');
      expect(state).toBeNull();
    });
  });

  describe('clearAttemptState', () => {
    it('should remove attempt state', () => {
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN1234');

      clearAttemptState('RN1234');

      const state = getAttemptState('RN1234');
      expect(state).toBeNull();
    });

    it('should not affect other service IDs', () => {
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN5678');

      clearAttemptState('RN1234');

      expect(getAttemptState('RN1234')).toBeNull();
      expect(getAttemptState('RN5678')).not.toBeNull();
    });
  });

  describe('getRemainingAttempts', () => {
    it('should return max attempts for new user', () => {
      const remaining = getRemainingAttempts('RN1234');
      expect(remaining).toBe(PIN_CONSTANTS.MAX_ATTEMPTS);
    });

    it('should decrement remaining attempts', () => {
      recordFailedAttempt('RN1234');
      expect(getRemainingAttempts('RN1234')).toBe(2);

      recordFailedAttempt('RN1234');
      expect(getRemainingAttempts('RN1234')).toBe(1);
    });

    it('should return 0 when locked out', () => {
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN1234');
      recordFailedAttempt('RN1234');

      const remaining = getRemainingAttempts('RN1234');
      expect(remaining).toBe(0);
    });
  });
});
