/**
 * Unit tests for the bootstrap sequencer (src/init/bootstrap.ts)
 *
 * Heavy collaborators (storage service, table enhancers, component injector)
 * are mocked so these tests exercise only the sequencing/guard logic.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEYS, type SessionData, type SessionCache } from '../../../src/types/contracts.js';

const mocks = vi.hoisted(() => {
  const storage = {
    init: vi.fn(() => Promise.resolve()),
    loadStudentRecord: vi.fn(),
    buildCache: vi.fn(),
    refreshCacheOnLogin: vi.fn(() => Promise.resolve()),
  };
  return {
    storage,
    getStorageService: vi.fn(() => storage),
    enhanceQuizTable: vi.fn(),
    getQuizTableMetadata: vi.fn(),
    resetQuizTableToNonInteractive: vi.fn(),
    enhanceAnalysisTable: vi.fn(),
    resetAnalysisTableToNonInteractive: vi.fn(),
    enhanceHomeBadges: vi.fn(),
    revealInstructorAnswers: vi.fn(),
    injectComponents: vi.fn(),
    upgradeTablesAfterLogin: vi.fn(),
  };
});

vi.mock('../../../src/services/storage-service.js', () => ({
  getStorageService: mocks.getStorageService,
}));
vi.mock('../../../src/enhancers/quiz-table.js', () => ({
  enhanceQuizTable: mocks.enhanceQuizTable,
  getQuizTableMetadata: mocks.getQuizTableMetadata,
  resetQuizTableToNonInteractive: mocks.resetQuizTableToNonInteractive,
}));
vi.mock('../../../src/enhancers/analysis-table.js', () => ({
  enhanceAnalysisTable: mocks.enhanceAnalysisTable,
  resetAnalysisTableToNonInteractive: mocks.resetAnalysisTableToNonInteractive,
}));
vi.mock('../../../src/enhancers/home-badges.js', () => ({
  enhanceHomeBadges: mocks.enhanceHomeBadges,
}));
vi.mock('../../../src/enhancers/instructor-answer-reveal.js', () => ({
  revealInstructorAnswers: mocks.revealInstructorAnswers,
}));
vi.mock('../../../src/enhancers/table-upgrade.js', () => ({
  upgradeTablesAfterLogin: mocks.upgradeTablesAfterLogin,
}));
vi.mock('../../../src/init/component-injector.js', () => ({
  injectComponents: mocks.injectComponents,
}));

import {
  bootstrap,
  cleanup,
  isInitialized,
  getEventCoordinator,
  getSessionCoordinator,
} from '../../../src/init/bootstrap.js';
import { EventCoordinator } from '../../../src/init/event-coordinator.js';
import { SessionCoordinator } from '../../../src/init/session-coordinator.js';

const DB_NAME = 'unit-bootstrap-db';
const FATAL_MSG = 'FATAL: dbName not provided in bootstrap config. Processing stopped.';

function addTable(className: 'qd-quiz' | 'qd-analysis'): HTMLTableElement {
  const table = document.createElement('table');
  table.className = className;
  table.innerHTML = '<tbody><tr><td>q</td><td>1</td><td>d</td></tr></tbody>';
  document.body.appendChild(table);
  return table;
}

function storeSession(): SessionData {
  const now = new Date();
  const session: SessionData = {
    serviceId: 'RN2344',
    name: 'Alice',
    release: '11-2024',
    loginTime: now.toISOString(),
    lastActivity: now.toISOString(),
    expiresAt: new Date(now.getTime() + 60_000).toISOString(),
    instructorUnlocked: false,
  };
  sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  return session;
}

function readCache(): SessionCache | null {
  const raw = sessionStorage.getItem(STORAGE_KEYS.CACHE);
  return raw ? (JSON.parse(raw) as SessionCache) : null;
}

describe('bootstrap', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStorageService.mockReturnValue(mocks.storage);
    mocks.storage.init.mockResolvedValue(undefined);
    sessionStorage.clear();
    document.body.innerHTML = '';
    document.getElementById('qd-global-styles')?.remove();
    window.history.pushState({}, '', '/');
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (isInitialized()) {
      cleanup();
    }
    vi.restoreAllMocks();
    sessionStorage.clear();
    document.body.innerHTML = '';
    document.getElementById('qd-global-styles')?.remove();
    window.history.pushState({}, '', '/');
  });

  describe('dbName guard', () => {
    it('rejects with the documented FATAL error when dbName is missing', async () => {
      await expect(bootstrap()).rejects.toThrow(FATAL_MSG);

      expect(errorSpy).toHaveBeenCalledWith(FATAL_MSG);
      expect(isInitialized()).toBe(false);
      expect(mocks.getStorageService).not.toHaveBeenCalled();
      expect(mocks.injectComponents).not.toHaveBeenCalled();
    });

    it('rejects when dbName is an empty string', async () => {
      await expect(bootstrap({ dbName: '' })).rejects.toThrow(FATAL_MSG);
      expect(isInitialized()).toBe(false);
    });

    it('still injects global styles before aborting (step 0 runs first)', async () => {
      await expect(bootstrap({})).rejects.toThrow();
      expect(document.getElementById('qd-global-styles')).not.toBeNull();
    });

    it('propagates storage init failures and stays uninitialised', async () => {
      mocks.storage.init.mockRejectedValueOnce(new Error('idb unavailable'));

      await expect(bootstrap({ dbName: DB_NAME })).rejects.toThrow('idb unavailable');
      expect(isInitialized()).toBe(false);
    });
  });

  describe('happy path sequencing', () => {
    it('initialises storage with the configured dbName', async () => {
      await bootstrap({ dbName: DB_NAME });

      expect(mocks.getStorageService).toHaveBeenCalledWith(DB_NAME);
      expect(mocks.storage.init).toHaveBeenCalledTimes(1);
    });

    it('injects global styles', async () => {
      await bootstrap({ dbName: DB_NAME });
      expect(document.getElementById('qd-global-styles')).not.toBeNull();
    });

    it('creates event and session coordinators', async () => {
      expect(getEventCoordinator()).toBeUndefined();
      expect(getSessionCoordinator()).toBeUndefined();

      await bootstrap({ dbName: DB_NAME });

      expect(getEventCoordinator()).toBeInstanceOf(EventCoordinator);
      expect(getSessionCoordinator()).toBeInstanceOf(SessionCoordinator);
    });

    it('injects UI components with the container selector and dbName', async () => {
      await bootstrap({ dbName: DB_NAME, statusPanelContainer: '.my-nav' });

      expect(mocks.injectComponents).toHaveBeenCalledTimes(1);
      expect(mocks.injectComponents).toHaveBeenCalledWith({
        statusPanelContainer: '.my-nav',
        dbName: DB_NAME,
      });
    });

    it('passes an undefined container selector through when not configured', async () => {
      await bootstrap({ dbName: DB_NAME });

      expect(mocks.injectComponents).toHaveBeenCalledWith({
        statusPanelContainer: undefined,
        dbName: DB_NAME,
      });
    });
  });

  describe('isInitialized() / cleanup() state transitions', () => {
    it('starts uninitialised', () => {
      expect(isInitialized()).toBe(false);
    });

    it('becomes initialised after a successful bootstrap', async () => {
      await bootstrap({ dbName: DB_NAME });
      expect(isInitialized()).toBe(true);
    });

    it('second bootstrap() call is a no-op that warns', async () => {
      await bootstrap({ dbName: DB_NAME });
      vi.clearAllMocks();

      await bootstrap({ dbName: 'another-db' });

      expect(warnSpy).toHaveBeenCalledWith('[WARN] Bootstrap already initialized, skipping');
      expect(mocks.getStorageService).not.toHaveBeenCalled();
      expect(mocks.storage.init).not.toHaveBeenCalled();
      expect(mocks.injectComponents).not.toHaveBeenCalled();
      expect(isInitialized()).toBe(true);
    });

    it('cleanup() resets state and drops the coordinators', async () => {
      await bootstrap({ dbName: DB_NAME });
      const ec = getEventCoordinator();
      const sc = getSessionCoordinator();
      const ecCleanup = vi.spyOn(ec as EventCoordinator, 'cleanup');
      const scCleanup = vi.spyOn(sc as SessionCoordinator, 'cleanup');

      cleanup();

      expect(isInitialized()).toBe(false);
      expect(getEventCoordinator()).toBeUndefined();
      expect(getSessionCoordinator()).toBeUndefined();
      expect(ecCleanup).toHaveBeenCalledTimes(1);
      expect(scCleanup).toHaveBeenCalledTimes(1);
    });

    it('cleanup() before bootstrap warns and does nothing', () => {
      cleanup();

      expect(warnSpy).toHaveBeenCalledWith('[WARN] Bootstrap not initialized, nothing to cleanup');
      expect(isInitialized()).toBe(false);
    });

    it('can be bootstrapped again after cleanup()', async () => {
      await bootstrap({ dbName: DB_NAME });
      cleanup();
      vi.clearAllMocks();

      await bootstrap({ dbName: DB_NAME });

      expect(isInitialized()).toBe(true);
      expect(mocks.storage.init).toHaveBeenCalledTimes(1);
    });
  });

  describe('table enhancement (no session)', () => {
    it('enhances every table.qd-quiz in non-interactive mode', async () => {
      const t1 = addTable('qd-quiz');
      const t2 = addTable('qd-quiz');

      await bootstrap({ dbName: DB_NAME });

      expect(mocks.enhanceQuizTable).toHaveBeenCalledTimes(2);
      expect(mocks.enhanceQuizTable).toHaveBeenCalledWith(t1, { interactive: false });
      expect(mocks.enhanceQuizTable).toHaveBeenCalledWith(t2, { interactive: false });
    });

    it('enhances every table.qd-analysis in non-interactive mode', async () => {
      const t = addTable('qd-analysis');

      await bootstrap({ dbName: DB_NAME });

      expect(mocks.enhanceAnalysisTable).toHaveBeenCalledTimes(1);
      expect(mocks.enhanceAnalysisTable).toHaveBeenCalledWith(t, { interactive: false });
    });

    it('does not call the enhancers when no matching tables exist', async () => {
      document.body.innerHTML = '<table class="plain"></table>';

      await bootstrap({ dbName: DB_NAME });

      expect(mocks.enhanceQuizTable).not.toHaveBeenCalled();
      expect(mocks.enhanceAnalysisTable).not.toHaveBeenCalled();
    });

    it('skips quiz enhancement when autoEnhanceQuizTables is false', async () => {
      addTable('qd-quiz');
      addTable('qd-analysis');

      await bootstrap({ dbName: DB_NAME, autoEnhanceQuizTables: false });

      expect(mocks.enhanceQuizTable).not.toHaveBeenCalled();
      expect(mocks.enhanceAnalysisTable).toHaveBeenCalledTimes(1);
    });

    it('skips analysis enhancement when autoEnhanceAnalysisTables is false', async () => {
      addTable('qd-quiz');
      addTable('qd-analysis');

      await bootstrap({ dbName: DB_NAME, autoEnhanceAnalysisTables: false });

      expect(mocks.enhanceQuizTable).toHaveBeenCalledTimes(1);
      expect(mocks.enhanceAnalysisTable).not.toHaveBeenCalled();
    });

    it('catches a failing enhancer, warns, and continues with the remaining tables', async () => {
      addTable('qd-quiz');
      const t2 = addTable('qd-quiz');
      mocks.enhanceQuizTable.mockImplementationOnce(() => {
        throw new Error('bad table');
      });

      await bootstrap({ dbName: DB_NAME });

      expect(mocks.enhanceQuizTable).toHaveBeenCalledTimes(2);
      expect(mocks.enhanceQuizTable).toHaveBeenLastCalledWith(t2, { interactive: false });
      expect(warnSpy).toHaveBeenCalledWith('[WARN] Failed to enhance quiz table: bad table');
      expect(isInitialized()).toBe(true);
    });
  });

  describe('home page badges', () => {
    it('enhances badges when .quizPageBtn links are present', async () => {
      document.body.innerHTML = '<a class="quizPageBtn" href="gram-1.html">Gram 1</a>';

      await bootstrap({ dbName: DB_NAME });

      expect(mocks.enhanceHomeBadges).toHaveBeenCalledTimes(1);
    });

    it('skips badge enhancement when no .quizPageBtn links exist', async () => {
      await bootstrap({ dbName: DB_NAME });
      expect(mocks.enhanceHomeBadges).not.toHaveBeenCalled();
    });

    it('skips badge enhancement when autoEnhanceHomeBadges is false', async () => {
      document.body.innerHTML = '<a class="quizPageBtn" href="gram-1.html">Gram 1</a>';

      await bootstrap({ dbName: DB_NAME, autoEnhanceHomeBadges: false });

      expect(mocks.enhanceHomeBadges).not.toHaveBeenCalled();
    });

    it('catches a badge enhancement failure and warns', async () => {
      document.body.innerHTML = '<a class="quizPageBtn" href="gram-1.html">Gram 1</a>';
      mocks.enhanceHomeBadges.mockImplementationOnce(() => {
        throw new Error('no badges');
      });

      await bootstrap({ dbName: DB_NAME });

      expect(warnSpy).toHaveBeenCalledWith('[WARN] Failed to enhance home badges: no badges');
      expect(isInitialized()).toBe(true);
    });
  });

  describe('existing student session', () => {
    const record = { schema: 1, serviceId: 'RN2344', pages: {} };
    const builtCache: SessionCache = {
      totals: { total: 7, answered: 2, correct: 1 },
      pages: {},
    };

    beforeEach(() => {
      mocks.storage.loadStudentRecord.mockResolvedValue(record);
      mocks.storage.buildCache.mockReturnValue(builtCache);
    });

    it('rebuilds the cache from IndexedDB when none is present', async () => {
      const session = storeSession();
      window.history.pushState({}, '', '/gram-1.html');

      await bootstrap({ dbName: DB_NAME });

      expect(mocks.storage.loadStudentRecord).toHaveBeenCalledWith(session);
      expect(mocks.storage.buildCache).toHaveBeenCalledWith(record);
      expect(readCache()).toEqual(builtCache);
    });

    it('re-uses an existing cache without touching IndexedDB', async () => {
      storeSession();
      const existing: SessionCache = { totals: { total: 1, answered: 1, correct: 1 }, pages: {} };
      sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(existing));
      window.history.pushState({}, '', '/gram-1.html');

      await bootstrap({ dbName: DB_NAME });

      expect(mocks.storage.loadStudentRecord).not.toHaveBeenCalled();
      expect(readCache()).toEqual(existing);
    });

    it('falls back to an empty cache when IndexedDB read fails', async () => {
      storeSession();
      mocks.storage.loadStudentRecord.mockRejectedValueOnce(new Error('boom'));
      window.history.pushState({}, '', '/gram-1.html');

      await bootstrap({ dbName: DB_NAME });

      expect(warnSpy).toHaveBeenCalledWith(
        '[WARN] Failed to rebuild cache from IndexedDB, using empty cache',
      );
      expect(readCache()).toEqual({ totals: { total: 0, answered: 0, correct: 0 }, pages: {} });
      expect(isInitialized()).toBe(true);
    });

    it('upgrades quiz and analysis tables to interactive mode with the pageId', async () => {
      storeSession();
      window.history.pushState({}, '', '/docs/gram-1.html');
      const quiz = addTable('qd-quiz');
      const analysis = addTable('qd-analysis');

      await bootstrap({ dbName: DB_NAME });

      // First non-interactive, then interactive upgrade
      expect(mocks.enhanceQuizTable).toHaveBeenNthCalledWith(1, quiz, { interactive: false });
      expect(mocks.enhanceQuizTable).toHaveBeenNthCalledWith(2, quiz, {
        interactive: true,
        pageId: 'gram-1',
      });
      expect(mocks.enhanceAnalysisTable).toHaveBeenNthCalledWith(1, analysis, {
        interactive: false,
      });
      expect(mocks.enhanceAnalysisTable).toHaveBeenNthCalledWith(2, analysis, {
        interactive: true,
        pageId: 'gram-1',
      });
    });

    it('skips the interactive upgrade when no pageId can be derived from the URL', async () => {
      storeSession();
      window.history.pushState({}, '', '/');
      addTable('qd-quiz');

      await bootstrap({ dbName: DB_NAME });

      expect(mocks.enhanceQuizTable).toHaveBeenCalledTimes(1);
      expect(mocks.enhanceQuizTable).toHaveBeenCalledWith(expect.any(HTMLTableElement), {
        interactive: false,
      });
    });

    it('leaves tables non-interactive when there is no session', async () => {
      window.history.pushState({}, '', '/gram-1.html');
      addTable('qd-quiz');

      await bootstrap({ dbName: DB_NAME });

      expect(mocks.storage.loadStudentRecord).not.toHaveBeenCalled();
      expect(mocks.enhanceQuizTable).toHaveBeenCalledTimes(1);
      expect(readCache()).toBeNull();
    });
  });

  describe('instructor session', () => {
    it('reveals quiz answers instead of loading a student record', async () => {
      sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');
      storeSession();
      window.history.pushState({}, '', '/gram-2.html');
      const quiz = addTable('qd-quiz');
      const metadata = { pageId: '', questions: [] };
      mocks.getQuizTableMetadata.mockReturnValue(metadata);

      await bootstrap({ dbName: DB_NAME });

      expect(mocks.storage.loadStudentRecord).not.toHaveBeenCalled();
      expect(mocks.getQuizTableMetadata).toHaveBeenCalledWith(quiz);
      expect(mocks.revealInstructorAnswers).toHaveBeenCalledTimes(1);
      expect(mocks.revealInstructorAnswers).toHaveBeenCalledWith(
        quiz,
        expect.objectContaining({ pageId: 'gram-2' }),
        { addInstructorClass: true },
      );
      // Tables are NOT upgraded to student interactive mode
      expect(mocks.enhanceQuizTable).toHaveBeenCalledTimes(1);
    });

    it('skips tables without parsed metadata', async () => {
      sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');
      addTable('qd-quiz');
      mocks.getQuizTableMetadata.mockReturnValue(undefined);

      await bootstrap({ dbName: DB_NAME });

      expect(mocks.revealInstructorAnswers).not.toHaveBeenCalled();
    });

    it('does nothing when the page has no quiz tables', async () => {
      sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');

      await bootstrap({ dbName: DB_NAME });

      expect(mocks.getQuizTableMetadata).not.toHaveBeenCalled();
      expect(mocks.revealInstructorAnswers).not.toHaveBeenCalled();
    });

    it('reveals answers dynamically on a qd:login event with role=instructor', async () => {
      const quiz = addTable('qd-quiz');
      mocks.getQuizTableMetadata.mockReturnValue({ pageId: '', questions: [] });
      await bootstrap({ dbName: DB_NAME });
      expect(mocks.revealInstructorAnswers).not.toHaveBeenCalled();

      document.dispatchEvent(
        new CustomEvent('qd:login', { detail: { role: 'instructor' }, bubbles: true }),
      );

      expect(mocks.revealInstructorAnswers).toHaveBeenCalled();
      expect(mocks.revealInstructorAnswers).toHaveBeenCalledWith(quiz, expect.anything(), {
        addInstructorClass: true,
      });
    });

    it('ignores qd:login events for students', async () => {
      addTable('qd-quiz');
      await bootstrap({ dbName: DB_NAME });

      document.dispatchEvent(
        new CustomEvent('qd:login', {
          detail: { serviceId: 'RN2344', name: 'Alice', release: '11-2024', loginTime: '' },
          bubbles: true,
        }),
      );

      expect(mocks.revealInstructorAnswers).not.toHaveBeenCalled();
    });
  });
});
