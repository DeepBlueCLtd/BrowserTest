/**
 * Unit tests for session service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SessionService,
  getSessionService,
  resetSessionService,
  buildCacheFromRecord,
  buildPageCache,
  updateCacheWithAnswer,
} from '../../../src/services/session.js';
import type { StudentRecord, SessionCache, PageData } from '../../../src/types/contracts.js';
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
        expect(new Date(newExpiry).getTime()).toBeGreaterThanOrEqual(
          new Date(oldExpiry).getTime(),
        );
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
        totals: { answered: 5, correct: 3 },
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
          totals: { answered: 5, correct: 3 },
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
          totals: { answered: 5, correct: 3 },
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
          totals: { answered: 5, correct: 3 },
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

describe('Cache Building Utilities', () => {
  describe('buildCacheFromRecord()', () => {
    it('should build empty cache for record with no pages', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Alice',
        attempted: 0,
        correct: 0,
        updated: '2024-11-16T10:00:00Z',
        pages: {},
      };

      const cache = buildCacheFromRecord(record);

      expect(cache.totals.answered).toBe(0);
      expect(cache.totals.correct).toBe(0);
      expect(Object.keys(cache.pages)).toHaveLength(0);
    });

    it('should build cache with correct totals for single page', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Alice',
        attempted: 3,
        correct: 2,
        updated: '2024-11-16T10:00:00Z',
        pages: {
          'page-1': {
            state: 'complete',
            answers: [
              { answer: 'a', success: true, timestamp: '2024-11-16T10:00:00Z' },
              { answer: 'b', success: false, timestamp: '2024-11-16T10:01:00Z' },
              { answer: 'c', success: true, timestamp: '2024-11-16T10:02:00Z' },
            ],
            lastAttempted: '2024-11-16T10:02:00Z',
          },
        },
      };

      const cache = buildCacheFromRecord(record);

      expect(cache.totals.answered).toBe(3);
      expect(cache.totals.correct).toBe(2);
      expect(cache.pages['page-1']).toBeDefined();
      expect(cache.pages['page-1']?.answered).toBe(3);
      expect(cache.pages['page-1']?.correct).toBe(2);
    });

    it('should build cache with correct totals for multiple pages', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Alice',
        attempted: 5,
        correct: 4,
        updated: '2024-11-16T10:00:00Z',
        pages: {
          'page-1': {
            state: 'complete',
            answers: [
              { answer: 'a', success: true, timestamp: '2024-11-16T10:00:00Z' },
              { answer: 'b', success: true, timestamp: '2024-11-16T10:01:00Z' },
            ],
            lastAttempted: '2024-11-16T10:01:00Z',
          },
          'page-2': {
            state: 'incomplete',
            answers: [
              { answer: 'c', success: true, timestamp: '2024-11-16T10:05:00Z' },
              { answer: 'd', success: false, timestamp: '2024-11-16T10:06:00Z' },
              { answer: 'e', success: true, timestamp: '2024-11-16T10:07:00Z' },
            ],
            lastAttempted: '2024-11-16T10:07:00Z',
          },
        },
      };

      const cache = buildCacheFromRecord(record);

      expect(cache.totals.answered).toBe(5);
      expect(cache.totals.correct).toBe(4);
      expect(Object.keys(cache.pages)).toHaveLength(2);
    });
  });

  describe('buildPageCache()', () => {
    it('should build page cache with correct counts', () => {
      const pageData: PageData = {
        state: 'complete',
        answers: [
          { answer: 'a', success: true, timestamp: '2024-11-16T10:00:00Z' },
          { answer: 'b', success: false, timestamp: '2024-11-16T10:01:00Z' },
          { answer: 'c', success: true, timestamp: '2024-11-16T10:02:00Z' },
        ],
        lastAttempted: '2024-11-16T10:02:00Z',
      };

      const cache = buildPageCache('page-1', pageData);

      expect(cache.answered).toBe(3);
      expect(cache.correct).toBe(2);
      expect(cache.state).toBe('complete');
      expect(cache.last).toBe('2024-11-16T10:02:00Z');
    });

    it('should handle empty answers', () => {
      const pageData: PageData = {
        state: 'unstarted',
        answers: [],
      };

      const cache = buildPageCache('page-1', pageData);

      expect(cache.answered).toBe(0);
      expect(cache.correct).toBe(0);
      expect(cache.state).toBe('unstarted');
    });
  });

  describe('updateCacheWithAnswer()', () => {
    it('should increment answered count', () => {
      const cache: SessionCache = {
        totals: { answered: 5, correct: 3 },
        pages: {
          'page-1': {
            state: 'incomplete',
            answered: 2,
            correct: 1,
          },
        },
      };

      const updated = updateCacheWithAnswer(cache, 'page-1', true, 'complete');

      expect(updated.totals.answered).toBe(6);
      expect(updated.pages['page-1']?.answered).toBe(3);
    });

    it('should increment correct count for correct answer', () => {
      const cache: SessionCache = {
        totals: { answered: 5, correct: 3 },
        pages: {
          'page-1': {
            state: 'incomplete',
            answered: 2,
            correct: 1,
          },
        },
      };

      const updated = updateCacheWithAnswer(cache, 'page-1', true, 'complete');

      expect(updated.totals.correct).toBe(4);
      expect(updated.pages['page-1']?.correct).toBe(2);
    });

    it('should not increment correct count for incorrect answer', () => {
      const cache: SessionCache = {
        totals: { answered: 5, correct: 3 },
        pages: {
          'page-1': {
            state: 'incomplete',
            answered: 2,
            correct: 1,
          },
        },
      };

      const updated = updateCacheWithAnswer(cache, 'page-1', false, 'incomplete');

      expect(updated.totals.correct).toBe(3);
      expect(updated.pages['page-1']?.correct).toBe(1);
    });

    it('should update state', () => {
      const cache: SessionCache = {
        totals: { answered: 5, correct: 3 },
        pages: {
          'page-1': {
            state: 'incomplete',
            answered: 2,
            correct: 1,
          },
        },
      };

      const updated = updateCacheWithAnswer(cache, 'page-1', true, 'complete');

      expect(updated.pages['page-1']?.state).toBe('complete');
    });

    it('should create new page entry if it does not exist', () => {
      const cache: SessionCache = {
        totals: { answered: 0, correct: 0 },
        pages: {},
      };

      const updated = updateCacheWithAnswer(cache, 'page-new', true, 'incomplete');

      expect(updated.pages['page-new']).toBeDefined();
      expect(updated.pages['page-new']?.answered).toBe(1);
      expect(updated.pages['page-new']?.correct).toBe(1);
    });

    it('should not mutate original cache', () => {
      const cache: SessionCache = {
        totals: { answered: 5, correct: 3 },
        pages: {
          'page-1': {
            state: 'incomplete',
            answered: 2,
            correct: 1,
          },
        },
      };

      const original = JSON.parse(JSON.stringify(cache)) as SessionCache;
      updateCacheWithAnswer(cache, 'page-1', true, 'complete');

      expect(cache).toEqual(original);
    });
  });
});
