/**
 * Integration tests for the quiz instructor answer overlay.
 *
 * T012: Characterization of the current rendered student-answer overlay
 *       (structure + content) — the baseline the XSS fix must preserve.
 * T013: XSS regression — student-supplied name/answer containing HTML must
 *       render as literal text, never as live markup (FR-004, SC-003).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { enhanceQuizTable, getQuizTableMetadata } from '../../src/enhancers/quiz-table.js';
import {
  showStudentAnswersForTable,
  hideStudentAnswersForTable,
} from '../../src/enhancers/quiz-instructor-overlay.js';
import type { SessionData, StudentRecord } from '../../src/types/contracts.js';

type QuizMetadata = NonNullable<ReturnType<typeof getQuizTableMetadata>>;
import { STORAGE_KEYS } from '../../src/types/contracts.js';
import { getStorageService, resetStorageService } from '../../src/services/storage-service.js';
import { resetStorageAdapter } from '../../src/services/storage/indexeddb.js';

const TEST_DB_NAME = 'BrowserTestDB';
const RELEASE = '11-2024';
const PAGE_ID = 'quiz-mcq';

function createMCQTable(): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'qd-quiz';
  table.innerHTML = `
    <thead>
      <tr><th>Question</th><th>Answer</th><th>Detail</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>What is 2 + 2?</td>
        <td>1</td>
        <td><ol><li>4</li><li>5</li><li>6</li></ol></td>
      </tr>
    </tbody>
  `;
  return table;
}

function makeStudent(
  name: string,
  serviceId: string,
  answer: string,
  success: boolean,
): StudentRecord {
  return {
    schema: 1,
    docId: RELEASE,
    release: RELEASE,
    serviceId,
    name,
    attempted: 1,
    correct: success ? 1 : 0,
    updated: new Date().toISOString(),
    pages: {
      [PAGE_ID]: {
        state: success ? 'complete' : 'incomplete',
        answers: [{ answer, success, timestamp: '2024-11-01T09:30:00.000Z' }],
      },
    },
  };
}

/** Enhance the table and return metadata wired with the page id under test. */
function enhanceWithMetadata(table: HTMLTableElement): QuizMetadata {
  enhanceQuizTable(table, { interactive: false });
  const metadata = getQuizTableMetadata(table);
  if (!metadata) throw new Error('expected quiz metadata');
  metadata.pageId = PAGE_ID;
  return metadata;
}

describe('Quiz instructor answer overlay', () => {
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    sessionStorage.clear();

    const session: SessionData = {
      serviceId: 'INSTRUCTOR',
      name: 'Instructor',
      release: RELEASE,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      instructorUnlocked: true,
    };
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

    const storageService = getStorageService(TEST_DB_NAME);
    await storageService.init();
  });

  afterEach(() => {
    container.remove();
    sessionStorage.clear();
    resetStorageService();
    resetStorageAdapter();
  });

  it('renders a student-answer overlay with name, masked id, answer and timestamp (T012)', async () => {
    const storageService = getStorageService();
    await storageService.saveStudentRecord(makeStudent('Alice Smith', 'RN2344', '1', true));
    await storageService.saveStudentRecord(makeStudent('Bob Jones', 'RN9876', '2', false));

    const table = createMCQTable();
    container.appendChild(table);
    const metadata = enhanceWithMetadata(table);

    await showStudentAnswersForTable(table, metadata);

    const answerCell = table.querySelector('tbody tr:first-child td:nth-child(2)');
    const overlay = answerCell?.querySelector('.qd-student-answers');
    expect(overlay).toBeTruthy();

    const entries = overlay?.querySelectorAll('.qd-student-answer');
    expect(entries?.length).toBe(2);

    // Correct/incorrect css classes preserved
    expect(entries?.[0]?.classList.contains('qd-correct')).toBe(true);
    expect(entries?.[1]?.classList.contains('qd-incorrect')).toBe(true);

    // Structural spans + content
    const first = entries?.[0];
    expect(first?.querySelector('.qd-student-name')?.textContent).toContain('Alice Smith');
    expect(first?.querySelector('.qd-student-name')?.textContent).toContain('2344');
    expect(first?.querySelector('.qd-student-answer-text')?.textContent).toBe('1');
    expect(first?.querySelector('.qd-timestamp')?.textContent?.trim()).toBeTruthy();
  });

  it('removes the overlay on hide', async () => {
    const storageService = getStorageService();
    await storageService.saveStudentRecord(makeStudent('Alice Smith', 'RN2344', '1', true));

    const table = createMCQTable();
    container.appendChild(table);
    const metadata = enhanceWithMetadata(table);

    await showStudentAnswersForTable(table, metadata);
    expect(table.querySelectorAll('.qd-student-answers').length).toBe(1);

    hideStudentAnswersForTable(table);
    expect(table.querySelectorAll('.qd-student-answers').length).toBe(0);
  });

  it('renders student-supplied markup as inert text, not live HTML (T013, XSS)', async () => {
    const storageService = getStorageService();
    const maliciousName = '<img src=x onerror="window.__xss=1">Mallory';
    const maliciousAnswer = '<script>window.__xss=1</script>';
    await storageService.saveStudentRecord(
      makeStudent(maliciousName, 'RN0001', maliciousAnswer, false),
    );

    const table = createMCQTable();
    container.appendChild(table);
    const metadata = enhanceWithMetadata(table);

    await showStudentAnswersForTable(table, metadata);

    const overlay = table.querySelector('.qd-student-answers');
    expect(overlay).toBeTruthy();

    // No live elements were created from the student-controlled strings.
    expect(overlay?.querySelector('img')).toBeNull();
    expect(overlay?.querySelector('script')).toBeNull();

    // The raw markup survives verbatim as text content.
    const nameSpan = overlay?.querySelector('.qd-student-name');
    const answerSpan = overlay?.querySelector('.qd-student-answer-text');
    expect(nameSpan?.textContent).toContain(maliciousName);
    expect(answerSpan?.textContent).toBe(maliciousAnswer);
  });
});
