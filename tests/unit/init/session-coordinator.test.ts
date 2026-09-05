/**
 * Unit tests for the session coordinator (src/init/session-coordinator.ts)
 *
 * Uses fake timers to verify expiry scheduling, activity-based extension and
 * the 5-second activity debounce.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionCoordinator } from '../../../src/init/session-coordinator.js';
import { SessionService } from '../../../src/services/session.js';
import {
  STORAGE_KEYS,
  SESSION_TIMEOUT_MS,
  type SessionData,
} from '../../../src/types/contracts.js';

const DEBOUNCE_MS = 5000;

function storeSession(msUntilExpiry: number, overrides: Partial<SessionData> = {}): SessionData {
  const now = new Date();
  const session: SessionData = {
    serviceId: 'RN2344',
    name: 'Alice',
    release: '11-2024',
    loginTime: now.toISOString(),
    lastActivity: now.toISOString(),
    expiresAt: new Date(now.getTime() + msUntilExpiry).toISOString(),
    instructorUnlocked: false,
    ...overrides,
  };
  sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  return session;
}

function readSession(): SessionData | null {
  const raw = sessionStorage.getItem(STORAGE_KEYS.SESSION);
  return raw ? (JSON.parse(raw) as SessionData) : null;
}

function fireActivity(type = 'click'): void {
  document.dispatchEvent(new Event(type, { bubbles: true }));
}

describe('SessionCoordinator', () => {
  let coordinator: SessionCoordinator;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    sessionStorage.clear();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    coordinator = new SessionCoordinator();
  });

  afterEach(() => {
    coordinator.cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('construction', () => {
    it('exposes a SessionService instance', () => {
      expect(coordinator.getSessionService()).toBeInstanceOf(SessionService);
    });

    it('returns the same SessionService on repeated calls', () => {
      expect(coordinator.getSessionService()).toBe(coordinator.getSessionService());
    });
  });

  describe('initialize() without a session', () => {
    it('does nothing and leaves storage empty', () => {
      coordinator.initialize();

      expect(readSession()).toBeNull();
      // No expiry timer scheduled: advancing time has no effect on storage
      vi.advanceTimersByTime(SESSION_TIMEOUT_MS * 2);
      expect(readSession()).toBeNull();
    });

    it('does not register activity tracking (activity does not create a session)', () => {
      const updateSpy = vi.spyOn(coordinator.getSessionService(), 'updateActivity');
      coordinator.initialize();

      fireActivity();
      vi.advanceTimersByTime(DEBOUNCE_MS + 1);

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('initialize() with an already-expired session', () => {
    it('clears the session immediately and warns', () => {
      storeSession(-1000);
      sessionStorage.setItem(STORAGE_KEYS.CACHE, '{}');

      coordinator.initialize();

      expect(readSession()).toBeNull();
      expect(sessionStorage.getItem(STORAGE_KEYS.CACHE)).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('[WARN] Session expired, clearing');
    });

    it('emits qd:logout when clearing the expired session', () => {
      storeSession(-1);
      const logoutHandler = vi.fn();
      document.addEventListener('qd:logout', logoutHandler);

      coordinator.initialize();

      expect(logoutHandler).toHaveBeenCalledTimes(1);
      document.removeEventListener('qd:logout', logoutHandler);
    });
  });

  describe('expiry scheduling', () => {
    it('keeps the session until the expiry time is reached', () => {
      storeSession(60_000);
      coordinator.initialize();

      vi.advanceTimersByTime(59_999);

      expect(readSession()).not.toBeNull();
    });

    it('clears the session once the timeout elapses', () => {
      storeSession(60_000);
      coordinator.initialize();

      vi.advanceTimersByTime(60_000);

      expect(readSession()).toBeNull();
      expect(sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR)).toBeNull();
    });

    it('emits qd:logout when the timeout fires', () => {
      storeSession(30_000);
      const logoutHandler = vi.fn();
      document.addEventListener('qd:logout', logoutHandler);
      coordinator.initialize();

      vi.advanceTimersByTime(30_000);

      expect(logoutHandler).toHaveBeenCalledTimes(1);
      document.removeEventListener('qd:logout', logoutHandler);
    });

    it('cleanup() cancels the pending expiry timer', () => {
      storeSession(60_000);
      coordinator.initialize();

      coordinator.cleanup();
      vi.advanceTimersByTime(120_000);

      expect(readSession()).not.toBeNull();
    });

    it('cleanup() is a no-op when nothing was scheduled', () => {
      expect(() => coordinator.cleanup()).not.toThrow();
    });
  });

  describe('activity tracking', () => {
    it('extends the session expiry after user activity (debounced)', () => {
      const original = storeSession(60_000);
      coordinator.initialize();

      vi.advanceTimersByTime(10_000);
      fireActivity('click');
      vi.advanceTimersByTime(DEBOUNCE_MS);

      const updated = readSession();
      expect(updated).not.toBeNull();
      const expectedExpiry = Date.now() + SESSION_TIMEOUT_MS;
      expect(new Date(updated?.expiresAt ?? '').getTime()).toBe(expectedExpiry);
      expect(new Date(updated?.expiresAt ?? '').getTime()).toBeGreaterThan(
        new Date(original.expiresAt).getTime(),
      );
      expect(new Date(updated?.lastActivity ?? '').getTime()).toBe(Date.now());
    });

    it('reschedules expiry so the original timeout no longer clears the session', () => {
      storeSession(60_000);
      coordinator.initialize();

      // Activity at t+10s, applied at t+15s => new expiry at t+15s+30min
      vi.advanceTimersByTime(10_000);
      fireActivity('keydown');
      vi.advanceTimersByTime(DEBOUNCE_MS);

      // Pass the original expiry (t+60s)
      vi.advanceTimersByTime(60_000);
      expect(readSession()).not.toBeNull();

      // Reach the new expiry
      vi.advanceTimersByTime(SESSION_TIMEOUT_MS - 60_000);
      expect(readSession()).toBeNull();
    });

    it.each(['click', 'keydown', 'scroll', 'mousemove'])('tracks %s events', (eventType) => {
      storeSession(60_000);
      coordinator.initialize();
      const updateSpy = vi.spyOn(coordinator.getSessionService(), 'updateActivity');

      fireActivity(eventType);
      vi.advanceTimersByTime(DEBOUNCE_MS);

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it('ignores unrelated events', () => {
      storeSession(60_000);
      coordinator.initialize();
      const updateSpy = vi.spyOn(coordinator.getSessionService(), 'updateActivity');

      fireActivity('focus');
      fireActivity('touchstart');
      vi.advanceTimersByTime(DEBOUNCE_MS);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('does not update activity before the debounce window elapses', () => {
      storeSession(60_000);
      coordinator.initialize();
      const updateSpy = vi.spyOn(coordinator.getSessionService(), 'updateActivity');

      fireActivity();
      vi.advanceTimersByTime(DEBOUNCE_MS - 1);

      expect(updateSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it('debounces a burst of activity into a single update', () => {
      storeSession(60_000);
      coordinator.initialize();
      const updateSpy = vi.spyOn(coordinator.getSessionService(), 'updateActivity');

      for (let i = 0; i < 20; i++) {
        fireActivity('mousemove');
        vi.advanceTimersByTime(100);
      }
      expect(updateSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(DEBOUNCE_MS);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it('resets the debounce timer on each new activity (trailing edge)', () => {
      storeSession(60_000);
      coordinator.initialize();
      const updateSpy = vi.spyOn(coordinator.getSessionService(), 'updateActivity');

      fireActivity();
      vi.advanceTimersByTime(4000);
      fireActivity(); // restarts the 5s window
      vi.advanceTimersByTime(4000);

      expect(updateSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it('applies separate updates for activity bursts separated by the debounce window', () => {
      storeSession(60_000);
      coordinator.initialize();
      const updateSpy = vi.spyOn(coordinator.getSessionService(), 'updateActivity');

      fireActivity();
      vi.advanceTimersByTime(DEBOUNCE_MS);
      fireActivity();
      vi.advanceTimersByTime(DEBOUNCE_MS);

      expect(updateSpy).toHaveBeenCalledTimes(2);
    });

    it('does nothing on activity if the session was cleared in the meantime', () => {
      storeSession(60_000);
      coordinator.initialize();
      const updateSpy = vi.spyOn(coordinator.getSessionService(), 'updateActivity');

      coordinator.getSessionService().clearSession();
      fireActivity();
      vi.advanceTimersByTime(DEBOUNCE_MS);

      expect(updateSpy).not.toHaveBeenCalled();
      expect(readSession()).toBeNull();
    });
  });
});
