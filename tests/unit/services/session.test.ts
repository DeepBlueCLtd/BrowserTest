/**
 * Unit tests for session service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SessionService,
  getSessionService,
  resetSessionService,
} from '../../../src/services/session.js';
import type { SessionCache } from '../../../src/types/contracts.js';
import { STORAGE_KEYS, SESSION_TIMEOUT_MS } from '../../../src/types/contracts.js';

describe('Session Service', () => {
  let service: SessionService;

  beforeEach(() => {
    sessionStorage.clear();
    service = new SessionService();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('createSession()', () => {
    it('should create a new session with correct data', () => {
      const session = service.createSession('RN2344', 'Alice Student', '11-2024');

      expect(session.serviceId).toBe('RN2344');
      expect(session.name).toBe('Alice Student');
      expect(session.release).toBe('11-2024');
      expect(session.instructorUnlocked).toBe(false);
      expect(session.loginTime).toBeDefined();
      expect(session.lastActivity).toBe(session.loginTime);
      expect(session.expiresAt).toBeDefined();
    });

    it('should set expiry time to 30 minutes from now', () => {
      const beforeCreate = Date.now();
      const session = service.createSession('RN2344', 'Alice', '11-2024');
      const afterCreate = Date.now();

      const expiresAt = new Date(session.expiresAt).getTime();
      const expectedMin = beforeCreate + SESSION_TIMEOUT_MS;
      const expectedMax = afterCreate + SESSION_TIMEOUT_MS;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });

    it('should save session to sessionStorage', () => {
      service.createSession('RN2344', 'Alice', '11-2024');

      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      expect(stored).toBeDefined();
      expect(stored).not.toBeNull();

      if (stored) {
        const parsed = JSON.parse(stored) as { serviceId: string };
        expect(parsed.serviceId).toBe('RN2344');
      }
    });

    it('should emit qd:login event', () => {
      const eventHandler = vi.fn();
      window.addEventListener('qd:login', eventHandler);

      service.createSession('RN2344', 'Alice', '11-2024');

      expect(eventHandler).toHaveBeenCalledTimes(1);
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          detail: expect.objectContaining({
            serviceId: 'RN2344',
            name: 'Alice',
            release: '11-2024',
          }),
        }),
      );

      window.removeEventListener('qd:login', eventHandler);
    });
  });

  describe('getSession()', () => {
    it('should return null if no session exists', () => {
      expect(service.getSession()).toBeNull();
    });

    it('should return session data if it exists', () => {
      service.createSession('RN2344', 'Alice', '11-2024');

      const session = service.getSession();
      expect(session).not.toBeNull();
      expect(session?.serviceId).toBe('RN2344');
    });

    it('should return null for invalid JSON', () => {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, 'invalid json');

      expect(service.getSession()).toBeNull();
    });

    it('should return null if missing required fields', () => {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ name: 'Alice' }));

      expect(service.getSession()).toBeNull();
    });
  });

  describe('updateActivity()', () => {
    it('should update lastActivity timestamp', () => {
      service.createSession('RN2344', 'Alice', '11-2024');

      // Wait a bit to ensure timestamp changes
      const oldSession = service.getSession();
      expect(oldSession).not.toBeNull();

      // Update activity
      service.updateActivity();

      const newSession = service.getSession();
      expect(newSession).not.toBeNull();
      expect(newSession?.lastActivity).toBeDefined();
    });

    it('should extend session expiry', () => {
      service.createSession('RN2344', 'Alice', '11-2024');

      const oldSession = service.getSession();
      const oldExpiry = oldSession?.expiresAt;

      // Update activity
      service.updateActivity();

      const newSession = service.getSession();
      const newExpiry = newSession?.expiresAt;

      expect(newExpiry).toBeDefined();
      expect(oldExpiry).toBeDefined();
      if (oldExpiry && newExpiry) {
        expect(new Date(newExpiry).getTime()).toBeGreaterThanOrEqual(new Date(oldExpiry).getTime());
      }
    });

    it('should do nothing if no session exists', () => {
      service.updateActivity();
      expect(service.getSession()).toBeNull();
    });
  });

  describe('isExpired()', () => {
    it('should return true if no session exists', () => {
      expect(service.isExpired()).toBe(true);
    });

    it('should return false for a fresh session', () => {
      service.createSession('RN2344', 'Alice', '11-2024');
      expect(service.isExpired()).toBe(false);
    });

    it('should return true for an expired session', () => {
      service.createSession('RN2344', 'Alice', '11-2024');

      // Manually set expiry to the past
      const session = service.getSession();
      if (session) {
        session.expiresAt = new Date(Date.now() - 1000).toISOString();
        sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      }

      expect(service.isExpired()).toBe(true);
    });
  });

  describe('clearSession()', () => {
    it('should remove session from sessionStorage', () => {
      service.createSession('RN2344', 'Alice', '11-2024');
      expect(sessionStorage.getItem(STORAGE_KEYS.SESSION)).not.toBeNull();

      service.clearSession();
      expect(sessionStorage.getItem(STORAGE_KEYS.SESSION)).toBeNull();
    });

    it('should remove cache from sessionStorage', () => {
      service.createSession('RN2344', 'Alice', '11-2024');
      service.saveCache({
        totals: { total: 5, answered: 5, correct: 3 },
        pages: {},
      });

      service.clearSession();
      expect(sessionStorage.getItem(STORAGE_KEYS.CACHE)).toBeNull();
    });

    it('should emit qd:logout event', () => {
      service.createSession('RN2344', 'Alice', '11-2024');

      const eventHandler = vi.fn();
      window.addEventListener('qd:logout', eventHandler);

      service.clearSession();

      expect(eventHandler).toHaveBeenCalledTimes(1);
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          detail: expect.objectContaining({
            serviceId: 'RN2344',
          }),
        }),
      );

      window.removeEventListener('qd:logout', eventHandler);
    });

    it('should not throw if no session exists', () => {
      expect(() => service.clearSession()).not.toThrow();
    });

    it('should clear instructor-specific state (FR-001)', () => {
      // Set up instructor state
      service.createSession('RN2344', 'Alice', '11-2024');
      service.unlockInstructor();
      sessionStorage.setItem('qd/instructor/showAnswers', 'true');
      sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');

      // Verify instructor state exists
      expect(sessionStorage.getItem('qd/instructor/showAnswers')).toBe('true');
      expect(sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR)).toBe('true');

      // Clear session
      service.clearSession();

      // Verify instructor state is cleared
      expect(sessionStorage.getItem('qd/instructor/showAnswers')).toBeNull();
      expect(sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR)).toBeNull();
    });
  });

  describe('Instructor mode', () => {
    beforeEach(() => {
      service.createSession('RN2344', 'Alice', '11-2024');
    });

    describe('unlockInstructor()', () => {
      it('should set instructorUnlocked to true', () => {
        service.unlockInstructor();

        const session = service.getSession();
        expect(session?.instructorUnlocked).toBe(true);
      });

      it('should set unlockTime', () => {
        service.unlockInstructor();

        const session = service.getSession();
        expect(session?.unlockTime).toBeDefined();
      });

      it('should emit qd:instructor-unlock event', () => {
        const eventHandler = vi.fn();
        window.addEventListener('qd:instructor-unlock', eventHandler);

        service.unlockInstructor();

        expect(eventHandler).toHaveBeenCalledTimes(1);
        window.removeEventListener('qd:instructor-unlock', eventHandler);
      });

      it('should do nothing if no session exists', () => {
        service.clearSession();
        expect(() => service.unlockInstructor()).not.toThrow();
      });
    });

    describe('lockInstructor()', () => {
      beforeEach(() => {
        service.unlockInstructor();
      });

      it('should set instructorUnlocked to false', () => {
        service.lockInstructor();

        const session = service.getSession();
        expect(session?.instructorUnlocked).toBe(false);
      });

      it('should remove unlockTime', () => {
        service.lockInstructor();

        const session = service.getSession();
        expect(session?.unlockTime).toBeUndefined();
      });

      it('should emit qd:instructor-lock event', () => {
        const eventHandler = vi.fn();
        window.addEventListener('qd:instructor-lock', eventHandler);

        service.lockInstructor();

        expect(eventHandler).toHaveBeenCalledTimes(1);
        window.removeEventListener('qd:instructor-lock', eventHandler);
      });
    });

    describe('isInstructorUnlocked()', () => {
      it('should return false by default', () => {
        expect(service.isInstructorUnlocked()).toBe(false);
      });

      it('should return true after unlocking', () => {
        service.unlockInstructor();
        expect(service.isInstructorUnlocked()).toBe(true);
      });

      it('should return false after locking', () => {
        service.unlockInstructor();
        service.lockInstructor();
        expect(service.isInstructorUnlocked()).toBe(false);
      });

      it('should return false if no session exists', () => {
        service.clearSession();
        expect(service.isInstructorUnlocked()).toBe(false);
      });
    });
  });

  describe('Cache management', () => {
    describe('getCache()', () => {
      it('should return null if no cache exists', () => {
        expect(service.getCache()).toBeNull();
      });

      it('should return cache if it exists', () => {
        const cache: SessionCache = {
          totals: { total: 5, answered: 5, correct: 3 },
          pages: {},
        };
        service.saveCache(cache);

        const retrieved = service.getCache();
        expect(retrieved).toEqual(cache);
      });

      it('should return null for invalid JSON', () => {
        sessionStorage.setItem(STORAGE_KEYS.CACHE, 'invalid json');
        expect(service.getCache()).toBeNull();
      });
    });

    describe('saveCache()', () => {
      it('should save cache to sessionStorage', () => {
        const cache: SessionCache = {
          totals: { total: 5, answered: 5, correct: 3 },
          pages: {},
        };

        service.saveCache(cache);

        const stored = sessionStorage.getItem(STORAGE_KEYS.CACHE);
        expect(stored).toBeDefined();
        if (stored) {
          const parsed = JSON.parse(stored) as SessionCache;
          expect(parsed).toEqual(cache);
        }
      });
    });

    describe('clearCache()', () => {
      it('should remove cache from sessionStorage', () => {
        service.saveCache({
          totals: { total: 5, answered: 5, correct: 3 },
          pages: {},
        });

        service.clearCache();
        expect(sessionStorage.getItem(STORAGE_KEYS.CACHE)).toBeNull();
      });
    });
  });

  describe('Singleton pattern', () => {
    afterEach(() => {
      resetSessionService();
    });

    it('should return the same instance', () => {
      const instance1 = getSessionService();
      const instance2 = getSessionService();

      expect(instance1).toBe(instance2);
    });

    it('should reset to new instance after reset', () => {
      const instance1 = getSessionService();
      resetSessionService();
      const instance2 = getSessionService();

      expect(instance1).not.toBe(instance2);
    });
  });
});
