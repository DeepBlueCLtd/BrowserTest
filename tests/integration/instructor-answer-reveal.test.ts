/**
 * Characterization tests for the shared instructor answer-reveal enhancer (T014).
 *
 * Captures the behavior previously duplicated across bootstrap.ts (initial-load
 * path, which adds the instructor class) and event-coordinator.ts (post-login
 * path, which does not): answer/detail columns unhidden and correct answers
 * re-injected into the DOM.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  revealInstructorAnswers,
  hideInstructorAnswers,
} from '../../src/enhancers/instructor-answer-reveal.js';
import {
  enhanceQuizTable,
  getQuizTableMetadata,
  type QuizTableMetadata,
} from '../../src/enhancers/quiz-table.js';
import type { SessionData, StudentRecord } from '../../src/types/contracts.js';
import { STORAGE_KEYS } from '../../src/types/contracts.js';
import { INSTRUCTOR_SHOW_ANSWERS_KEY } from '../../src/utils/storage-helpers.js';
import { getStorageService, resetStorageService } from '../../src/services/storage-service.js';
import { resetStorageAdapter } from '../../src/services/storage/indexeddb.js';

const TEST_DB_NAME = 'BrowserTestDB';
const RELEASE = '11-2024';
const PAGE_ID = 'quiz-mcq';

function createMCQTable(): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'qd-quiz';
  table.innerHTML = `
    <thead><tr><th>Question</th><th>Answer</th><th>Detail</th></tr></thead>
    <tbody>
      <tr><td>What is 2 + 2?</td><td>1</td><td><ol><li>4</li><li>5</li></ol></td></tr>
      <tr><td>What is 3 + 3?</td><td>2</td><td><ol><li>5</li><li>6</li></ol></td></tr>
    </tbody>
  `;
  return table;
}

function enhanceWithMetadata(table: HTMLTableElement): QuizTableMetadata {
  enhanceQuizTable(table, { interactive: false });
  const metadata = getQuizTableMetadata(table);
  if (!metadata) throw new Error('expected quiz metadata');
  metadata.pageId = PAGE_ID;
  return metadata;
}

describe('revealInstructorAnswers', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    sessionStorage.clear();
  });

  afterEach(() => {
    container.remove();
    sessionStorage.clear();
    resetStorageService();
    resetStorageAdapter();
  });

  it('unhides the answer and detail columns', () => {
    const table = createMCQTable();
    container.appendChild(table);
    const metadata = enhanceWithMetadata(table);

    // Enhancement hid columns 2 and 3
    const headerCells = table.querySelectorAll('thead th');
    expect(headerCells[1]?.classList.contains('qd-hidden')).toBe(true);
    expect(headerCells[2]?.classList.contains('qd-hidden')).toBe(true);

    revealInstructorAnswers(table, metadata);

    table.querySelectorAll('td:nth-child(2), th:nth-child(2)').forEach((cell) => {
      expect(cell.classList.contains('qd-hidden')).toBe(false);
    });
    table.querySelectorAll('td:nth-child(3), th:nth-child(3)').forEach((cell) => {
      expect(cell.classList.contains('qd-hidden')).toBe(false);
    });
  });

  it('re-injects the correct answers into the data cells', () => {
    const table = createMCQTable();
    container.appendChild(table);
    const metadata = enhanceWithMetadata(table);

    revealInstructorAnswers(table, metadata);

    const answerCells = table.querySelectorAll('tbody td:nth-child(2)');
    expect(answerCells[0]?.textContent).toBe(metadata.parsed.questions[0]?.correctAnswer);
    expect(answerCells[1]?.textContent).toBe(metadata.parsed.questions[1]?.correctAnswer);
  });

  it('adds the qd-quiz-instructor class only when requested (initial-load path)', () => {
    const table = createMCQTable();
    container.appendChild(table);
    const metadata = enhanceWithMetadata(table);

    revealInstructorAnswers(table, metadata, { addInstructorClass: true });
    expect(table.classList.contains('qd-quiz-instructor')).toBe(true);
  });

  it('does not add the qd-quiz-instructor class by default (post-login path)', () => {
    const table = createMCQTable();
    container.appendChild(table);
    const metadata = enhanceWithMetadata(table);

    revealInstructorAnswers(table, metadata);
    expect(table.classList.contains('qd-quiz-instructor')).toBe(false);
  });

  it('shows the overlay immediately when the toggle is already enabled', async () => {
    sessionStorage.setItem(INSTRUCTOR_SHOW_ANSWERS_KEY, 'true');

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
    const student: StudentRecord = {
      schema: 1,
      docId: RELEASE,
      release: RELEASE,
      serviceId: 'RN2344',
      name: 'Alice',
      attempted: 1,
      correct: 1,
      updated: new Date().toISOString(),
      pages: {
        [PAGE_ID]: {
          state: 'complete',
          answers: [{ answer: '1', success: true, timestamp: '2024-11-01T09:30:00.000Z' }],
        },
      },
    };
    await storageService.saveStudentRecord(student);

    const table = createMCQTable();
    container.appendChild(table);
    const metadata = enhanceWithMetadata(table);

    revealInstructorAnswers(table, metadata);

    // Allow the async overlay render to settle.
    await new Promise((r) => setTimeout(r, 0));
    expect(table.querySelectorAll('.qd-student-answers').length).toBeGreaterThan(0);

    hideInstructorAnswers(table);
    expect(table.querySelectorAll('.qd-student-answers').length).toBe(0);
  });
});
