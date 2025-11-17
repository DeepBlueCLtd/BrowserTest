/**
 * Integration Tests for Quiz Table Enhancement
 *
 * Tests the single-phase enhancement pattern for quiz tables.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  enhanceQuizTable,
  getQuizTableMetadata,
  isQuizTableEnhanced,
} from '../../src/enhancers/quiz-table.js';
import type { SessionData, SessionCache } from '../../src/types/contracts.js';
import { STORAGE_KEYS } from '../../src/types/contracts.js';

describe('Quiz Table Enhancement', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create container for tests
    container = document.createElement('div');
    document.body.appendChild(container);

    // Clear sessionStorage
    sessionStorage.clear();
  });

  afterEach(() => {
    // Cleanup
    container.remove();
    sessionStorage.clear();
  });

  describe('Non-Interactive Mode', () => {
    it('should hide answer column when enhanced in non-interactive mode', () => {
      // Create quiz table
      const table = createMCQTable();
      container.appendChild(table);

      // Enhance in non-interactive mode
      const result = enhanceQuizTable(table, { interactive: false });

      expect(result).toBe(true);
      expect(isQuizTableEnhanced(table)).toBe(true);

      // Check that answer column is hidden
      const headerCells = table.querySelectorAll('thead th');
      expect(headerCells[1]?.classList.contains('qd-hidden')).toBe(true);

      // Check that answer cells are hidden
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        expect(cells[1]?.classList.contains('qd-hidden')).toBe(true);
      });

      // Check that table has non-interactive class
      expect(table.classList.contains('qd-quiz-non-interactive')).toBe(true);
    });

    it('should store metadata in WeakMap', () => {
      const table = createMCQTable();
      container.appendChild(table);

      enhanceQuizTable(table, { interactive: false });

      const metadata = getQuizTableMetadata(table);
      expect(metadata).toBeDefined();
      expect(metadata?.interactive).toBe(false);
      expect(metadata?.parsed).toBeDefined();
      expect(metadata?.parsed.questions.length).toBe(2);
    });
  });

  describe('Interactive Mode', () => {
    beforeEach(() => {
      // Setup session data
      const session: SessionData = {
        serviceId: 'RN2344',
        name: 'Test User',
        release: '11-2024',
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        instructorUnlocked: false,
      };

      const cache: SessionCache = {
        totals: { answered: 0, correct: 0 },
        pages: {},
      };

      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));
    });

    it('should inject input controls when enhanced in interactive mode', () => {
      const table = createMCQTable();
      container.appendChild(table);

      const result = enhanceQuizTable(table, {
        interactive: true,
        pageId: 'test-page-1',
      });

      expect(result).toBe(true);
      expect(isQuizTableEnhanced(table)).toBe(true);

      // Check that input controls are injected
      const inputs = table.querySelectorAll('input.qd-quiz-input');
      expect(inputs.length).toBe(2); // 2 questions

      // Check that table has interactive class
      expect(table.classList.contains('qd-quiz-interactive')).toBe(true);
    });

    it('should require pageId in interactive mode', () => {
      const table = createMCQTable();
      container.appendChild(table);

      const result = enhanceQuizTable(table, { interactive: true });

      expect(result).toBe(false);
    });

    it('should load existing answers into inputs', () => {
      const table = createMCQTable();
      container.appendChild(table);

      // Setup existing answers in cache
      const cache: SessionCache = {
        totals: { answered: 1, correct: 1 },
        pages: {
          'test-page-1': {
            state: 'incomplete',
            answered: 1,
            correct: 1,
            answers: [{ answer: '1', success: true, timestamp: new Date().toISOString() }],
          },
        },
      };
      sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));

      enhanceQuizTable(table, {
        interactive: true,
        pageId: 'test-page-1',
      });

      // Check that first input has existing answer
      const inputs = table.querySelectorAll<HTMLInputElement>('input.qd-quiz-input');
      expect(inputs[0]?.value).toBe('1');
      expect(inputs[1]?.value).toBe(''); // Second question not answered yet

      // Check validation styling
      const answerCell = table.querySelector('tbody tr:first-child td:nth-child(2)');
      expect(answerCell?.classList.contains('qd-answer-correct')).toBe(true);
    });

    it('should save answer and emit events on user input', async () => {
      const table = createMCQTable();
      container.appendChild(table);

      // Spy on events
      const answerSavedSpy = vi.fn();
      const stateChangedSpy = vi.fn();

      document.addEventListener('qd:answer-saved', answerSavedSpy);
      document.addEventListener('qd:state-changed', stateChangedSpy);

      enhanceQuizTable(table, {
        interactive: true,
        pageId: 'test-page-1',
      });

      // Get first input and enter answer
      const input = table.querySelector<HTMLInputElement>('input.qd-quiz-input');
      expect(input).toBeDefined();

      // Simulate user input
      input!.value = '1';
      input!.dispatchEvent(new Event('input'));

      // Wait for debounced save (200ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Check that events were emitted
      expect(answerSavedSpy).toHaveBeenCalled();
      expect(stateChangedSpy).toHaveBeenCalled();

      // Check that answer was saved to cache
      const cache = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.CACHE) || '{}') as SessionCache;
      expect(cache.pages['test-page-1']).toBeDefined();
      expect(cache.pages['test-page-1']?.answers?.[0]?.answer).toBe('1');
      expect(cache.pages['test-page-1']?.answers?.[0]?.success).toBe(true);

      // Cleanup
      document.removeEventListener('qd:answer-saved', answerSavedSpy);
      document.removeEventListener('qd:state-changed', stateChangedSpy);
    });

    it('should validate MCQ answers correctly', async () => {
      const table = createMCQTable();
      container.appendChild(table);

      enhanceQuizTable(table, {
        interactive: true,
        pageId: 'test-page-1',
      });

      const input = table.querySelector<HTMLInputElement>('input.qd-quiz-input');
      expect(input).toBeDefined();

      // Test correct answer
      input!.value = '1';
      input!.dispatchEvent(new Event('input'));
      await new Promise((resolve) => setTimeout(resolve, 300));

      let cache = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.CACHE) || '{}') as SessionCache;
      expect(cache.pages['test-page-1']?.answers?.[0]?.success).toBe(true);

      // Test incorrect answer
      input!.value = '2';
      input!.dispatchEvent(new Event('input'));
      await new Promise((resolve) => setTimeout(resolve, 300));

      cache = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.CACHE) || '{}') as SessionCache;
      expect(cache.pages['test-page-1']?.answers?.[0]?.success).toBe(false);
    });

    it('should validate numeric answers correctly', async () => {
      const table = createNumericTable();
      container.appendChild(table);

      enhanceQuizTable(table, {
        interactive: true,
        pageId: 'test-page-2',
      });

      const input = table.querySelector<HTMLInputElement>('input.qd-quiz-input');
      expect(input).toBeDefined();

      // Test correct answer (within tolerance)
      input!.value = '42';
      input!.dispatchEvent(new Event('input'));
      await new Promise((resolve) => setTimeout(resolve, 300));

      let cache = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.CACHE) || '{}') as SessionCache;
      expect(cache.pages['test-page-2']?.answers?.[0]?.success).toBe(true);

      // Test answer within tolerance (42 ± 0.5)
      input!.value = '42.3';
      input!.dispatchEvent(new Event('input'));
      await new Promise((resolve) => setTimeout(resolve, 300));

      cache = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.CACHE) || '{}') as SessionCache;
      expect(cache.pages['test-page-2']?.answers?.[0]?.success).toBe(true);

      // Test answer outside tolerance
      input!.value = '43';
      input!.dispatchEvent(new Event('input'));
      await new Promise((resolve) => setTimeout(resolve, 300));

      cache = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.CACHE) || '{}') as SessionCache;
      expect(cache.pages['test-page-2']?.answers?.[0]?.success).toBe(false);
    });

    it('should update state to complete when all answers are correct', async () => {
      const table = createMCQTable();
      container.appendChild(table);

      enhanceQuizTable(table, {
        interactive: true,
        pageId: 'test-page-1',
      });

      const inputs = table.querySelectorAll<HTMLInputElement>('input.qd-quiz-input');

      // Answer first question correctly
      inputs[0]!.value = '1';
      inputs[0]!.dispatchEvent(new Event('input'));
      await new Promise((resolve) => setTimeout(resolve, 300));

      let cache = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.CACHE) || '{}') as SessionCache;
      expect(cache.pages['test-page-1']?.state).toBe('incomplete');

      // Answer second question correctly
      inputs[1]!.value = '2';
      inputs[1]!.dispatchEvent(new Event('input'));
      await new Promise((resolve) => setTimeout(resolve, 300));

      cache = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.CACHE) || '{}') as SessionCache;
      expect(cache.pages['test-page-1']?.state).toBe('complete');
      expect(cache.pages['test-page-1']?.answered).toBe(2);
      expect(cache.pages['test-page-1']?.correct).toBe(2);
    });
  });
});

/**
 * Helper: Create MCQ quiz table
 */
function createMCQTable(): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'qd-quiz';

  table.innerHTML = `
    <thead>
      <tr>
        <th>Question</th>
        <th>Answer</th>
        <th>Detail</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>What is 2 + 2?</td>
        <td>1</td>
        <td>
          <ol>
            <li>4</li>
            <li>5</li>
            <li>6</li>
          </ol>
        </td>
      </tr>
      <tr>
        <td>What is 3 + 3?</td>
        <td>2</td>
        <td>
          <ol>
            <li>5</li>
            <li>6</li>
            <li>7</li>
          </ol>
        </td>
      </tr>
    </tbody>
  `;

  return table;
}

/**
 * Helper: Create numeric quiz table
 */
function createNumericTable(): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'qd-quiz';

  table.innerHTML = `
    <thead>
      <tr>
        <th>Question</th>
        <th>Answer</th>
        <th>Tolerance</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>What is the answer to life, the universe, and everything?</td>
        <td>42</td>
        <td>0.5</td>
      </tr>
    </tbody>
  `;

  return table;
}
