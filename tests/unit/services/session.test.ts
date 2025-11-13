/**
 * Session Management Service Tests
 *
 * Tests for session creation, timeout management, and instructor unlock functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SessionData } from '../../../src/types/contracts';
import { STORAGE_KEYS, SESSION_TIMEOUT_MS } from '../../../src/types/contracts';
import { SessionService } from '../../../src/services/session';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    service = new SessionService();
    // Reset timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Session Creation', () => {
    it('should create a new session with login time', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      const session = service.createSession('TEST001', 'John Doe', '01-2025');

      expect(session.serviceId).toBe('TEST001');
      expect(session.name).toBe('John Doe');
      expect(session.release).toBe('01-2025');
      expect(session.loginTime).toBe('2025-01-15T10:00:00.000Z');
    });

    it('should set expiry time to 30 minutes from now', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      const session = service.createSession('TEST001', 'John Doe', '01-2025');

      const expectedExpiry = new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString();
      expect(session.expiresAt).toBe(expectedExpiry);
    });

    it('should store session in sessionStorage', () => {
      service.createSession('TEST001', 'John Doe', '01-2025');

      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!) as SessionData;
      expect(parsed.serviceId).toBe('TEST001');
    });

    it('should initialize instructor mode as locked', () => {
      const session = service.createSession('TEST001', 'John Doe', '01-2025');

      expect(session.instructorUnlocked).toBe(false);
      expect(session.unlockTime).toBeUndefined();
    });

    it('should set lastActivity to current time', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      const session = service.createSession('TEST001', 'John Doe', '01-2025');

      expect(session.lastActivity).toBe('2025-01-15T10:00:00.000Z');
    });
  });

  describe('Session Retrieval', () => {
    it('should return null when no session exists', () => {
      const session = service.getSession();
      expect(session).toBeNull();
    });

    it('should retrieve existing session from sessionStorage', () => {
      service.createSession('TEST001', 'John Doe', '01-2025');

      const retrieved = service.getSession();
      expect(retrieved).toBeDefined();
      expect(retrieved?.serviceId).toBe('TEST001');
    });

    it('should parse session data correctly', () => {
      service.createSession('TEST001', 'John Doe', '01-2025');

      const session = service.getSession();
      expect(session).toMatchObject({
        serviceId: 'TEST001',
        name: 'John Doe',
        release: '01-2025',
        instructorUnlocked: false,
      });
    });
  });

  describe('Activity Tracking', () => {
    beforeEach(() => {
      service.createSession('TEST001', 'John Doe', '01-2025');
    });

    it('should update lastActivity timestamp', () => {
      const start = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(start);

      service.createSession('TEST001', 'John Doe', '01-2025');

      const later = new Date('2025-01-15T10:15:00.000Z');
      vi.setSystemTime(later);

      service.updateActivity();

      const session = service.getSession();
      expect(session?.lastActivity).toBe('2025-01-15T10:15:00.000Z');
    });

    it('should extend expiry time by 30 minutes', () => {
      const start = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(start);

      service.createSession('TEST001', 'John Doe', '01-2025');

      const later = new Date('2025-01-15T10:15:00.000Z');
      vi.setSystemTime(later);

      service.updateActivity();

      const session = service.getSession();
      const expectedExpiry = new Date(later.getTime() + SESSION_TIMEOUT_MS).toISOString();
      expect(session?.expiresAt).toBe(expectedExpiry);
    });

    it('should persist updated session to sessionStorage', () => {
      service.updateActivity();

      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      expect(stored).toBeTruthy();
    });

    it('should handle missing session gracefully', () => {
      sessionStorage.clear();
      expect(() => service.updateActivity()).not.toThrow();
    });
  });

  describe('Session Expiry', () => {
    it('should return false for non-expired session', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      service.createSession('TEST001', 'John Doe', '01-2025');

      expect(service.isExpired()).toBe(false);
    });

    it('should return true when session has expired', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      service.createSession('TEST001', 'John Doe', '01-2025');

      // Advance time by 31 minutes
      const later = new Date(now.getTime() + SESSION_TIMEOUT_MS + 60000);
      vi.setSystemTime(later);

      expect(service.isExpired()).toBe(true);
    });

    it('should return true when no session exists', () => {
      expect(service.isExpired()).toBe(true);
    });

    it('should check expiry based on expiresAt timestamp', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      service.createSession('TEST001', 'John Doe', '01-2025');

      // Just before expiry
      const almostExpired = new Date(now.getTime() + SESSION_TIMEOUT_MS - 1000);
      vi.setSystemTime(almostExpired);
      expect(service.isExpired()).toBe(false);

      // Exactly at expiry
      const expired = new Date(now.getTime() + SESSION_TIMEOUT_MS);
      vi.setSystemTime(expired);
      expect(service.isExpired()).toBe(true);
    });
  });

  describe('Session Timeout', () => {
    it('should expire after 30 minutes of inactivity', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      service.createSession('TEST001', 'John Doe', '01-2025');

      // Advance time by exactly 30 minutes
      vi.advanceTimersByTime(SESSION_TIMEOUT_MS);

      expect(service.isExpired()).toBe(true);
    });

    it('should not expire before 30 minutes', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      service.createSession('TEST001', 'John Doe', '01-2025');

      // Advance time by 29 minutes
      vi.advanceTimersByTime(SESSION_TIMEOUT_MS - 60000);

      expect(service.isExpired()).toBe(false);
    });

    it('should reset timeout when activity is updated', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      service.createSession('TEST001', 'John Doe', '01-2025');

      // Advance time by 15 minutes
      vi.advanceTimersByTime(15 * 60 * 1000);

      service.updateActivity();

      // Advance another 15 minutes (30 min from start, but only 15 from update)
      vi.advanceTimersByTime(15 * 60 * 1000);

      expect(service.isExpired()).toBe(false);
    });
  });

  describe('Session Clearing', () => {
    beforeEach(() => {
      service.createSession('TEST001', 'John Doe', '01-2025');
    });

    it('should remove session from sessionStorage', () => {
      service.clearSession();

      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      expect(stored).toBeNull();
    });

    it('should handle clearing non-existent session', () => {
      sessionStorage.clear();
      expect(() => service.clearSession()).not.toThrow();
    });

    it('should clear cache along with session', () => {
      sessionStorage.setItem(
        STORAGE_KEYS.CACHE,
        JSON.stringify({ totals: { answered: 0, correct: 0 }, pages: {} }),
      );

      service.clearSession();

      const cache = sessionStorage.getItem(STORAGE_KEYS.CACHE);
      expect(cache).toBeNull();
    });
  });

  describe('Instructor Mode', () => {
    beforeEach(() => {
      service.createSession('TEST001', 'John Doe', '01-2025');
    });

    it('should unlock instructor mode', () => {
      service.unlockInstructor();

      const session = service.getSession();
      expect(session?.instructorUnlocked).toBe(true);
    });

    it('should set unlock timestamp', () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      service.unlockInstructor();

      const session = service.getSession();
      expect(session?.unlockTime).toBe('2025-01-15T10:00:00.000Z');
    });

    it('should persist unlock state', () => {
      service.unlockInstructor();

      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      const parsed = JSON.parse(stored!) as SessionData;
      expect(parsed.instructorUnlocked).toBe(true);
    });

    it('should lock instructor mode', () => {
      service.unlockInstructor();
      service.lockInstructor();

      const session = service.getSession();
      expect(session?.instructorUnlocked).toBe(false);
    });

    it('should remove unlock timestamp when locked', () => {
      service.unlockInstructor();
      service.lockInstructor();

      const session = service.getSession();
      expect(session?.unlockTime).toBeUndefined();
    });

    it('should check if instructor is unlocked', () => {
      expect(service.isInstructorUnlocked()).toBe(false);

      service.unlockInstructor();
      expect(service.isInstructorUnlocked()).toBe(true);

      service.lockInstructor();
      expect(service.isInstructorUnlocked()).toBe(false);
    });

    it('should return false when not unlocked', () => {
      expect(service.isInstructorUnlocked()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted session data', () => {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, 'invalid json');

      const session = service.getSession();
      expect(session).toBeNull();
    });

    it('should handle missing required fields', () => {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ serviceId: 'TEST001' }));

      const session = service.getSession();
      expect(session).toBeNull();
    });
  });

  describe('Data Isolation', () => {
    it('should keep session data separate from cache', () => {
      service.createSession('TEST001', 'John Doe', '01-2025');

      const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      const cacheData = sessionStorage.getItem(STORAGE_KEYS.CACHE);

      expect(sessionData).toBeTruthy();
      expect(cacheData).toBeNull(); // Cache is separate and not created by session service
    });

    it('should use correct storage key', () => {
      service.createSession('TEST001', 'John Doe', '01-2025');

      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      expect(stored).toBeTruthy();
      expect(STORAGE_KEYS.SESSION).toBe('qd/session');
    });
  });
});
