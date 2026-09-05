/**
 * Unit tests for the event coordinator (src/init/event-coordinator.ts)
 *
 * Verifies that each registered qd:* listener dispatches the expected
 * follow-on events, delegates to the correct collaborators, and that
 * cleanup() detaches every listener.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEYS, type SessionData } from '../../../src/types/contracts.js';

const mocks = vi.hoisted(() => ({
  resetQuizTableToNonInteractive: vi.fn(),
  resetAnalysisTableToNonInteractive: vi.fn(),
  upgradeTablesAfterLogin: vi.fn(),
  refreshCacheOnLogin: vi.fn(() => Promise.resolve()),
  getStorageService: vi.fn(),
}));

vi.mock('../../../src/enhancers/quiz-table.js', () => ({
  resetQuizTableToNonInteractive: mocks.resetQuizTableToNonInteractive,
}));
vi.mock('../../../src/enhancers/analysis-table.js', () => ({
  resetAnalysisTableToNonInteractive: mocks.resetAnalysisTableToNonInteractive,
}));
vi.mock('../../../src/enhancers/table-upgrade.js', () => ({
  upgradeTablesAfterLogin: mocks.upgradeTablesAfterLogin,
}));
vi.mock('../../../src/services/storage-service.js', () => ({
  getStorageService: mocks.getStorageService,
}));

import { EventCoordinator } from '../../../src/init/event-coordinator.js';

function makeSession(): SessionData {
  const now = new Date();
  return {
    serviceId: 'RN2344',
    name: 'Alice',
    release: '11-2024',
    loginTime: now.toISOString(),
    lastActivity: now.toISOString(),
    expiresAt: new Date(now.getTime() + 60_000).toISOString(),
    instructorUnlocked: false,
  };
}

function dispatch(name: string, detail: unknown = {}): void {
  document.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
}

/** Flush the async IIFE inside the login handler. */
async function flush(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
}

describe('EventCoordinator', () => {
  let coordinator: EventCoordinator;
  let captured: Record<string, CustomEvent[]>;
  const capturedNames = [
    'qd:cache-rebuild',
    'qd:cache-update',
    'qd:badge-update',
    'qd:cache-clear',
  ];
  const captureHandlers: Record<string, EventListener> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStorageService.mockReturnValue({ refreshCacheOnLogin: mocks.refreshCacheOnLogin });
    sessionStorage.clear();
    document.body.innerHTML = '';

    captured = {};
    for (const name of capturedNames) {
      captured[name] = [];
      captureHandlers[name] = (e) => captured[name]?.push(e as CustomEvent);
      document.addEventListener(name, captureHandlers[name]);
    }

    coordinator = new EventCoordinator();
    coordinator.initialize();
  });

  afterEach(() => {
    coordinator.cleanup();
    for (const name of capturedNames) {
      document.removeEventListener(name, captureHandlers[name] as EventListener);
    }
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  describe('qd:login', () => {
    it('rebuilds the cache, dispatches qd:cache-rebuild and upgrades tables for a student', async () => {
      const session = makeSession();
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

      dispatch('qd:login', {
        serviceId: session.serviceId,
        name: session.name,
        release: session.release,
        loginTime: session.loginTime,
      });
      await flush();

      expect(mocks.refreshCacheOnLogin).toHaveBeenCalledTimes(1);
      expect(mocks.refreshCacheOnLogin).toHaveBeenCalledWith(session);
      expect(captured['qd:cache-rebuild']).toHaveLength(1);
      expect(mocks.upgradeTablesAfterLogin).toHaveBeenCalledTimes(1);
    });

    it('dispatches qd:cache-rebuild only after the cache refresh resolves', async () => {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(makeSession()));
      let resolveRefresh: () => void = () => {};
      mocks.refreshCacheOnLogin.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
      );

      dispatch('qd:login', {
        serviceId: 'RN2344',
        name: 'Alice',
        release: '11-2024',
        loginTime: '',
      });
      await flush();

      expect(captured['qd:cache-rebuild']).toHaveLength(0);
      expect(mocks.upgradeTablesAfterLogin).not.toHaveBeenCalled();

      resolveRefresh();
      await flush();

      expect(captured['qd:cache-rebuild']).toHaveLength(1);
      expect(mocks.upgradeTablesAfterLogin).toHaveBeenCalledTimes(1);
    });

    it('skips student record handling for INSTRUCTOR logins', async () => {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(makeSession()));

      dispatch('qd:login', {
        serviceId: 'INSTRUCTOR',
        name: 'Instructor',
        release: '',
        loginTime: '',
      });
      await flush();

      expect(mocks.getStorageService).not.toHaveBeenCalled();
      expect(mocks.refreshCacheOnLogin).not.toHaveBeenCalled();
      expect(captured['qd:cache-rebuild']).toHaveLength(0);
      expect(mocks.upgradeTablesAfterLogin).not.toHaveBeenCalled();
    });

    it('skips cache rebuild when no session is in sessionStorage', async () => {
      dispatch('qd:login', {
        serviceId: 'RN2344',
        name: 'Alice',
        release: '11-2024',
        loginTime: '',
      });
      await flush();

      expect(mocks.refreshCacheOnLogin).not.toHaveBeenCalled();
      expect(captured['qd:cache-rebuild']).toHaveLength(0);
      expect(mocks.upgradeTablesAfterLogin).not.toHaveBeenCalled();
    });
  });

  describe('qd:logout', () => {
    it('dispatches qd:cache-clear', () => {
      dispatch('qd:logout', { serviceId: 'RN2344' });

      expect(captured['qd:cache-clear']).toHaveLength(1);
    });

    it('resets every quiz and analysis table on the page to non-interactive', () => {
      document.body.innerHTML = `
        <table class="qd-quiz"></table>
        <table class="qd-quiz"></table>
        <table class="qd-analysis"></table>
        <table class="other"></table>`;
      const quizTables = Array.from(document.querySelectorAll('table.qd-quiz'));
      const analysisTable = document.querySelector('table.qd-analysis');

      dispatch('qd:logout', { serviceId: 'RN2344' });

      expect(mocks.resetQuizTableToNonInteractive).toHaveBeenCalledTimes(2);
      expect(mocks.resetQuizTableToNonInteractive).toHaveBeenCalledWith(quizTables[0]);
      expect(mocks.resetQuizTableToNonInteractive).toHaveBeenCalledWith(quizTables[1]);
      expect(mocks.resetAnalysisTableToNonInteractive).toHaveBeenCalledTimes(1);
      expect(mocks.resetAnalysisTableToNonInteractive).toHaveBeenCalledWith(analysisTable);
    });
  });

  describe('qd:answer-saved', () => {
    it('dispatches qd:cache-update carrying the pageId', () => {
      dispatch('qd:answer-saved', {
        pageId: 'gram-1',
        questionIndex: 2,
        answer: 'b',
        success: true,
      });

      expect(captured['qd:cache-update']).toHaveLength(1);
      expect(captured['qd:cache-update']?.[0]?.detail).toEqual({ pageId: 'gram-1' });
    });

    it('dispatches qd:cache-update for incorrect answers too', () => {
      dispatch('qd:answer-saved', {
        pageId: 'gram-2',
        questionIndex: 0,
        answer: 'a',
        success: false,
      });

      expect(captured['qd:cache-update']?.[0]?.detail).toEqual({ pageId: 'gram-2' });
    });
  });

  describe('qd:state-changed', () => {
    it('dispatches qd:badge-update with pageId and state', () => {
      dispatch('qd:state-changed', { pageId: 'gram-1', state: 'complete' });

      expect(captured['qd:badge-update']).toHaveLength(1);
      expect(captured['qd:badge-update']?.[0]?.detail).toEqual({
        pageId: 'gram-1',
        state: 'complete',
      });
    });
  });

  describe('qd:data-cleared', () => {
    it('dispatches qd:cache-clear', () => {
      dispatch('qd:data-cleared', { timestamp: new Date().toISOString() });

      expect(captured['qd:cache-clear']).toHaveLength(1);
    });
  });

  describe('qd:instructor-unlock / qd:instructor-lock', () => {
    it('are handled without dispatching follow-on events', () => {
      dispatch('qd:instructor-unlock', { unlockTime: new Date().toISOString() });
      dispatch('qd:instructor-lock', {});

      for (const name of capturedNames) {
        expect(captured[name]).toHaveLength(0);
      }
    });
  });

  describe('dispatched events', () => {
    it('are bubbling, composed CustomEvents', () => {
      dispatch('qd:state-changed', { pageId: 'p', state: 'incomplete' });

      const event = captured['qd:badge-update']?.[0];
      expect(event).toBeInstanceOf(CustomEvent);
      expect(event?.bubbles).toBe(true);
      expect(event?.composed).toBe(true);
    });
  });

  describe('cleanup()', () => {
    it('removes all registered listeners so events no longer trigger follow-ons', () => {
      coordinator.cleanup();

      dispatch('qd:answer-saved', { pageId: 'p', questionIndex: 0, answer: 'a', success: true });
      dispatch('qd:state-changed', { pageId: 'p', state: 'complete' });
      dispatch('qd:data-cleared', { timestamp: '' });
      dispatch('qd:logout', { serviceId: 'RN2344' });

      for (const name of capturedNames) {
        expect(captured[name]).toHaveLength(0);
      }
      expect(mocks.resetQuizTableToNonInteractive).not.toHaveBeenCalled();
    });

    it('is safe to call twice', () => {
      coordinator.cleanup();
      expect(() => coordinator.cleanup()).not.toThrow();
    });

    it('allows re-initialisation afterwards', () => {
      coordinator.cleanup();
      coordinator.initialize();

      dispatch('qd:state-changed', { pageId: 'p', state: 'complete' });

      expect(captured['qd:badge-update']).toHaveLength(1);
    });
  });

  it('does not register duplicate handlers when initialize() is called once', () => {
    dispatch('qd:data-cleared', { timestamp: '' });
    expect(captured['qd:cache-clear']).toHaveLength(1);
  });
});
