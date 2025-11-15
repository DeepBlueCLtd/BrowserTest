/**
 * Session Management Service Tests
 *
 * Tests for session creation, timeout management, and instructor unlock functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
    it('should create a new session with login time', async () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      const session = await service.createSession('TEST001', 'John Doe', '01-2025');

      expect(session.serviceId).toBe('TEST001');
      expect(session.name).toBe('John Doe');
      expect(session.release).toBe('01-2025');
      expect(session.loginTime).toBe('2025-01-15T10:00:00.000Z');
    });

    it('should set expiry time to 30 minutes from now', async () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      const session = await service.createSession('TEST001', 'John Doe', '01-2025');

      const expectedExpiry = new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString();
      expect(session.expiresAt).toBe(expectedExpiry);
    });

    it('should store session in sessionStorage', async () => {
      await service.createSession('TEST001', 'John Doe', '01-2025');

      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      expect(stored).toBeTruthy();

      // Verify encrypted data can be decrypted
      const retrieved = await service.getSession();
      expect(retrieved?.serviceId).toBe('TEST001');
    });

    it('should initialize instructor mode as locked', async () => {
      const session = await service.createSession('TEST001', 'John Doe', '01-2025');

      expect(session.instructorUnlocked).toBe(false);
      expect(session.unlockTime).toBeUndefined();
    });

    it('should set lastActivity to current time', async () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      const session = await service.createSession('TEST001', 'John Doe', '01-2025');

      expect(session.lastActivity).toBe('2025-01-15T10:00:00.000Z');
    });
  });

  describe('Session Retrieval', () => {
    it('should return null when no session exists', async () => {
      const session = await service.getSession();
      expect(session).toBeNull();
    });

    it('should retrieve existing session from sessionStorage', async () => {
      await service.createSession('TEST001', 'John Doe', '01-2025');

      const retrieved = await service.getSession();
      expect(retrieved).toBeDefined();
      expect(retrieved?.serviceId).toBe('TEST001');
    });

    it('should parse session data correctly', async () => {
      await service.createSession('TEST001', 'John Doe', '01-2025');

      const session = await service.getSession();
      expect(session).toMatchObject({
        serviceId: 'TEST001',
        name: 'John Doe',
        release: '01-2025',
        instructorUnlocked: false,
      });
    });
  });

  describe('Activity Tracking', () => {
    beforeEach(async () => {
      await service.createSession('TEST001', 'John Doe', '01-2025');
    });

    it('should update lastActivity timestamp', async () => {
      const start = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(start);

      await service.createSession('TEST001', 'John Doe', '01-2025');

      const later = new Date('2025-01-15T10:15:00.000Z');
      vi.setSystemTime(later);

      await service.updateActivity();

      const session = await service.getSession();
      expect(session?.lastActivity).toBe('2025-01-15T10:15:00.000Z');
    });

    it('should extend expiry time by 30 minutes', async () => {
      const start = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(start);

      await service.createSession('TEST001', 'John Doe', '01-2025');

      const later = new Date('2025-01-15T10:15:00.000Z');
      vi.setSystemTime(later);

      await service.updateActivity();

      const session = await service.getSession();
      const expectedExpiry = new Date(later.getTime() + SESSION_TIMEOUT_MS).toISOString();
      expect(session?.expiresAt).toBe(expectedExpiry);
    });

    it('should persist updated session to sessionStorage', async () => {
      await service.updateActivity();

      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      expect(stored).toBeTruthy();
    });

    it('should handle missing session gracefully', async () => {
      sessionStorage.clear();
      await expect(service.updateActivity()).resolves.not.toThrow();
    });
  });

  describe('Session Expiry', () => {
    it('should return false for non-expired session', async () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      await service.createSession('TEST001', 'John Doe', '01-2025');

      expect(await service.isExpired()).toBe(false);
    });

    it('should return true when session has expired', async () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      await service.createSession('TEST001', 'John Doe', '01-2025');

      // Advance time by 31 minutes
      const later = new Date(now.getTime() + SESSION_TIMEOUT_MS + 60000);
      vi.setSystemTime(later);

      expect(await service.isExpired()).toBe(true);
    });

    it('should return true when no session exists', async () => {
      expect(await service.isExpired()).toBe(true);
    });

    it('should check expiry based on expiresAt timestamp', async () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      await service.createSession('TEST001', 'John Doe', '01-2025');

      // Just before expiry
      const almostExpired = new Date(now.getTime() + SESSION_TIMEOUT_MS - 1000);
      vi.setSystemTime(almostExpired);
      expect(await service.isExpired()).toBe(false);

      // Exactly at expiry
      const expired = new Date(now.getTime() + SESSION_TIMEOUT_MS);
      vi.setSystemTime(expired);
      expect(await service.isExpired()).toBe(true);
    });
  });

  describe('Session Timeout', () => {
    it('should expire after 30 minutes of inactivity', async () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      await service.createSession('TEST001', 'John Doe', '01-2025');

      // Advance time by exactly 30 minutes
      vi.advanceTimersByTime(SESSION_TIMEOUT_MS);

      expect(await service.isExpired()).toBe(true);
    });

    it('should not expire before 30 minutes', async () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      await service.createSession('TEST001', 'John Doe', '01-2025');

      // Advance time by 29 minutes
      vi.advanceTimersByTime(SESSION_TIMEOUT_MS - 60000);

      expect(await service.isExpired()).toBe(false);
    });

    it('should reset timeout when activity is updated', async () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      await service.createSession('TEST001', 'John Doe', '01-2025');

      // Advance time by 15 minutes
      vi.advanceTimersByTime(15 * 60 * 1000);

      await service.updateActivity();

      // Advance another 15 minutes (30 min from start, but only 15 from update)
      vi.advanceTimersByTime(15 * 60 * 1000);

      expect(await service.isExpired()).toBe(false);
    });
  });

  describe('Session Clearing', () => {
    beforeEach(async () => {
      await service.createSession('TEST001', 'John Doe', '01-2025');
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
    beforeEach(async () => {
      await service.createSession('TEST001', 'John Doe', '01-2025');
    });

    it('should unlock instructor mode', async () => {
      await service.unlockInstructor();

      const session = await service.getSession();
      expect(session?.instructorUnlocked).toBe(true);
    });

    it('should set unlock timestamp', async () => {
      const now = new Date('2025-01-15T10:00:00.000Z');
      vi.setSystemTime(now);

      await service.unlockInstructor();

      const session = await service.getSession();
      expect(session?.unlockTime).toBe('2025-01-15T10:00:00.000Z');
    });

    it('should persist unlock state', async () => {
      await service.unlockInstructor();

      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      expect(stored).toBeTruthy();

      // Verify encrypted data can be decrypted and contains unlock state
      const retrieved = await service.getSession();
      expect(retrieved?.instructorUnlocked).toBe(true);
    });

    it('should lock instructor mode', async () => {
      await service.unlockInstructor();
      await service.lockInstructor();

      const session = await service.getSession();
      expect(session?.instructorUnlocked).toBe(false);
    });

    it('should remove unlock timestamp when locked', async () => {
      await service.unlockInstructor();
      await service.lockInstructor();

      const session = await service.getSession();
      expect(session?.unlockTime).toBeUndefined();
    });

    it('should check if instructor is unlocked', async () => {
      expect(await service.isInstructorUnlocked()).toBe(false);

      await service.unlockInstructor();
      expect(await service.isInstructorUnlocked()).toBe(true);

      await service.lockInstructor();
      expect(await service.isInstructorUnlocked()).toBe(false);
    });

    it('should return false when not unlocked', async () => {
      expect(await service.isInstructorUnlocked()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted session data', async () => {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, 'invalid json');

      const session = await service.getSession();
      expect(session).toBeNull();
    });

    it('should handle missing required fields', async () => {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ serviceId: 'TEST001' }));

      const session = await service.getSession();
      expect(session).toBeNull();
    });
  });

  describe('Data Isolation', () => {
    it('should keep session data separate from cache', async () => {
      await service.createSession('TEST001', 'John Doe', '01-2025');

      const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      const cacheData = sessionStorage.getItem(STORAGE_KEYS.CACHE);

      expect(sessionData).toBeTruthy();
      expect(cacheData).toBeNull(); // Cache is separate and not created by session service
    });

    it('should use correct storage key', async () => {
      await service.createSession('TEST001', 'John Doe', '01-2025');

      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      expect(stored).toBeTruthy();
      expect(STORAGE_KEYS.SESSION).toBe('qd/session');
    });
  });
});
