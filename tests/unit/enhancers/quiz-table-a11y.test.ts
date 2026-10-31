/**
 * Unit tests for quiz table accessibility and usability (SRD 013 WP2):
 * A11Y-01, A11Y-02, UX-03, UX-04, UX-05.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { handleAnswerInputMock } = vi.hoisted(() => ({ handleAnswerInputMock: vi.fn() }));
vi.mock('../../../src/enhancers/quiz-answer-persistence.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../src/enhancers/quiz-answer-persistence.js')>();
  return { ...actual, handleAnswerInput: handleAnswerInputMock };
});

import {
  enhanceQuizTable,
  getQuizTableMetadata,
  resetQuizTableToNonInteractive,
} from '../../../src/enhancers/quiz-table.js';
import { revealInstructorAnswers } from '../../../src/enhancers/instructor-answer-reveal.js';
import {
  applyValidationStyling,
  clearValidationFeedback,
} from '../../../src/enhancers/quiz-answer-persistence.js';
import { LOGIN_NOTICE_TEXT } from '../../../src/enhancers/quiz-table-columns.js';
import { STORAGE_KEYS, type SessionData } from '../../../src/types/contracts.js';

function numericTable(): HTMLTableElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'simpletable-container';
  wrapper.innerHTML = `
    <table class="qd-quiz">
      <thead><tr><th>Question</th><th>Correct Value</th><th>Tolerance</th></tr></thead>
      <tbody>
        <tr><td>Speed of sound in seawater (m/s)?</td><td>1500</td><td>50</td></tr>
        <tr><td>Beam width (degrees)?</td><td>15</td><td>2</td></tr>
      </tbody>
    </table>`;
  document.body.appendChild(wrapper);
  return wrapper.querySelector('table')!;
}

function mcqTable(): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'qd-quiz';
  table.innerHTML = `
    <thead><tr><th>Question</th><th>Answer</th><th>Options</th></tr></thead>
    <tbody>
      <tr><td>What does SONAR stand for?</td><td>1</td>
        <td><ol><li>Sound Navigation And Ranging</li><li>Other</li></ol></td></tr>
    </tbody>`;
  document.body.appendChild(table);
  return table;
}

function startSession(): void {
  const session: SessionData = {
    serviceId: 'RN2344',
    name: 'Alice',
    release: 'R1',
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
    instructorUnlocked: false,
  };
  sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('quiz table accessibility and usability', () => {
  beforeEach(() => {
    sessionStorage.clear();
    handleAnswerInputMock.mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
  });

  describe('logged-out prompt (UX-05)', () => {
    it('shows a log-in prompt before a non-interactive table, outside the DITA wrapper', () => {
      const table = numericTable();
      enhanceQuizTable(table, { interactive: false });
      const notice = table.parentElement!.previousElementSibling;
      expect(notice?.textContent).toBe(LOGIN_NOTICE_TEXT);
      expect(notice?.getAttribute('role')).toBe('note');
    });

    it('removes the prompt once the student logs in', () => {
      const table = numericTable();
      enhanceQuizTable(table, { interactive: false });
      startSession();
      enhanceQuizTable(table, { interactive: true, pageId: 'quiz-numeric' });
      expect(document.querySelector('.qd-login-notice')).toBeNull();
    });

    it('shows the prompt again after logout', () => {
      const table = numericTable();
      enhanceQuizTable(table, { interactive: false });
      startSession();
      enhanceQuizTable(table, { interactive: true, pageId: 'quiz-numeric' });
      document.dispatchEvent(new CustomEvent('qd:logout'));
      expect(document.querySelector('.qd-login-notice')).not.toBeNull();
      getQuizTableMetadata(table)?.cleanupInstructorListeners?.();
    });

    it('shows the prompt after logout when the coordinator resets the table', () => {
      // On logout the event coordinator resets tables, which removes the
      // table's own logout listener before it can run (found in the walkthrough)
      const table = numericTable();
      enhanceQuizTable(table, { interactive: false });
      startSession();
      enhanceQuizTable(table, { interactive: true, pageId: 'quiz-numeric' });
      resetQuizTableToNonInteractive(table);
      expect(document.querySelector('.qd-login-notice')?.textContent).toBe(LOGIN_NOTICE_TEXT);
    });

    it('removes the prompt and restores the author header for instructors (UX-04)', () => {
      const table = numericTable();
      enhanceQuizTable(table, { interactive: false });
      const metadata = getQuizTableMetadata(table)!;
      revealInstructorAnswers(table, { ...metadata, pageId: 'quiz-numeric' });
      expect(document.querySelector('.qd-login-notice')).toBeNull();
      expect(table.querySelectorAll('thead th')[1]?.textContent).toBe('Correct Value');
    });
  });

  describe('interactive controls', () => {
    beforeEach(() => startSession());

    it('labels every input with its question (A11Y-01)', () => {
      const table = mcqTable();
      enhanceQuizTable(table, { interactive: true, pageId: 'quiz-mcq' });
      const select = table.querySelector('select')!;
      const labelId = select.getAttribute('aria-labelledby')!;
      expect(document.getElementById(labelId)?.textContent).toBe('What does SONAR stand for?');
    });

    it('heads the input column "Your answer" (UX-04)', () => {
      const table = numericTable();
      enhanceQuizTable(table, { interactive: true, pageId: 'quiz-numeric' });
      expect(table.querySelectorAll('thead th')[1]?.textContent).toBe('Your answer');
    });

    it('offers a decimal keypad for numeric answers (UX-03)', () => {
      const table = numericTable();
      enhanceQuizTable(table, { interactive: true, pageId: 'quiz-numeric' });
      expect(table.querySelector('input')!.inputMode).toBe('decimal');
    });

    it('does not save text that is not a number and says why (UX-03)', () => {
      const table = numericTable();
      enhanceQuizTable(table, { interactive: true, pageId: 'quiz-numeric' });
      const input = table.querySelector('input')!;
      type(input, 'abc');
      expect(handleAnswerInputMock).not.toHaveBeenCalled();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      const error = document.getElementById(input.getAttribute('aria-errormessage')!);
      expect(error?.textContent).toBe('Enter a number, for example 1500');
    });

    it('saves valid numbers, including negative and decimal ones', () => {
      const table = numericTable();
      enhanceQuizTable(table, { interactive: true, pageId: 'quiz-numeric' });
      const input = table.querySelector('input')!;
      for (const value of ['1500', '-5', '2.5', '.5']) {
        type(input, value);
      }
      expect(handleAnswerInputMock).toHaveBeenCalledTimes(4);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('waits for blur before flagging an incomplete number such as "-"', () => {
      const table = numericTable();
      enhanceQuizTable(table, { interactive: true, pageId: 'quiz-numeric' });
      const input = table.querySelector('input')!;
      type(input, '-');
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(handleAnswerInputMock).not.toHaveBeenCalled();
      input.dispatchEvent(new Event('blur'));
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('clears the error once the input is a number again', () => {
      const table = numericTable();
      enhanceQuizTable(table, { interactive: true, pageId: 'quiz-numeric' });
      const input = table.querySelector('input')!;
      type(input, 'abc');
      type(input, '1500');
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(table.querySelector('.qd-input-error')).toBeNull();
    });
  });

  describe('correctness feedback (A11Y-02)', () => {
    it('marks a correct answer with text as well as colour', () => {
      const cell = document.createElement('td');
      const select = document.createElement('select');
      cell.appendChild(select);
      applyValidationStyling(cell, true);
      const feedback = cell.querySelector('.qd-answer-feedback')!;
      expect(feedback.textContent).toContain('Correct');
      expect(feedback.querySelector('.qd-sr-only')?.textContent).toBe('Correct');
      expect(select.getAttribute('aria-describedby')).toBe(feedback.id);
    });

    it('replaces the mark when the answer changes and clears it on reset', () => {
      const cell = document.createElement('td');
      cell.appendChild(document.createElement('select'));
      applyValidationStyling(cell, true);
      applyValidationStyling(cell, false);
      expect(cell.querySelectorAll('.qd-answer-feedback')).toHaveLength(1);
      expect(cell.querySelector('.qd-sr-only')?.textContent).toBe('Incorrect');
      clearValidationFeedback(cell);
      expect(cell.querySelector('.qd-answer-feedback')).toBeNull();
      expect(cell.classList.contains('qd-answer-incorrect')).toBe(false);
    });
  });
});
