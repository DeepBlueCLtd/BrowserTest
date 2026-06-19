/**
 * Characterization tests for the bootstrap sequencer (T026).
 *
 * Covers global-style injection, the non-interactive table-enhancement loops,
 * and the existing-session upgrade-to-interactive path.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { bootstrap, cleanup } from '../../src/init/bootstrap.js';
import { resetStorageService } from '../../src/services/storage-service.js';
import { resetStorageAdapter } from '../../src/services/storage/indexeddb.js';
import { STORAGE_KEYS, type SessionData } from '../../src/types/contracts.js';

const DB_NAME = 'bootstrap-test-db';

function addTitle(): void {
  const wrap = document.createElement('div');
  wrap.className = 'wh_publication_title';
  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = 'TEST-2026';
  wrap.appendChild(title);
  document.body.appendChild(wrap);
}

function makeQuizTable(): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'qd-quiz';
  table.innerHTML = `
    <thead><tr><th>Question</th><th>Answer</th><th>Detail</th></tr></thead>
    <tbody>
      <tr><td>2 + 2?</td><td>1</td><td><ol><li>4</li><li>5</li></ol></td></tr>
    </tbody>`;
  return table;
}

describe('bootstrap (characterization)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.body.innerHTML = '';
    document.getElementById('qd-global-styles')?.remove();
    resetStorageService();
    resetStorageAdapter();
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    document.body.innerHTML = '';
    document.getElementById('qd-global-styles')?.remove();
    resetStorageService();
    resetStorageAdapter();
    window.history.pushState({}, '', '/');
  });

  it('injects global styles and enhances tables non-interactively (no session)', async () => {
    addTitle();
    const table = makeQuizTable();
    document.body.appendChild(table);

    await bootstrap({ dbName: DB_NAME });

    expect(document.getElementById('qd-global-styles')).not.toBeNull();
    expect(table.classList.contains('qd-quiz-non-interactive')).toBe(true);
    expect(table.classList.contains('qd-quiz-interactive')).toBe(false);
  });

  it('upgrades tables to interactive mode when a session exists', async () => {
    window.history.pushState({}, '', '/gram-1.html');
    addTitle();

    const session: SessionData = {
      serviceId: '30012345',
      name: 'J Smith',
      release: 'TEST-2026',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      instructorUnlocked: false,
    };
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

    const table = makeQuizTable();
    document.body.appendChild(table);

    await bootstrap({ dbName: DB_NAME });

    expect(table.classList.contains('qd-quiz-interactive')).toBe(true);
  });
});
