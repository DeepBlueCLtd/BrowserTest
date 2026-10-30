/**
 * Quiz answer persistence.
 *
 * Handles user input → validation → IndexedDB save → cache update → events,
 * plus the DOM-only validation styling. Extracted from `quiz-table.ts` so the
 * persistence path is independently testable from the table lifecycle.
 */

import type { AnswerRecord, SessionData } from '../types/contracts.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import type { QuizTableMetadata } from './quiz-table.js';
import { validateAnswer } from '../services/quiz-parser.js';
import { getStorageService } from '../services/storage-service.js';
import { getJSON } from '../utils/storage-helpers.js';
import { addClass, removeClass } from '../utils/dom-helpers.js';
import { persistAndNotify } from './persist-and-notify.js';
import { announce, ensureId, SR_ONLY_CLASS } from '../utils/a11y.js';
import { info, error as logError, warn } from '../utils/logger.js';

/**
 * Handle user answer input (debounced save).
 *
 * @param table - Quiz table element
 * @param metadata - Table metadata
 * @param questionIndex - Question index
 * @param answer - User's answer
 */
export function handleAnswerInput(
  table: HTMLTableElement,
  metadata: QuizTableMetadata,
  questionIndex: number,
  answer: string,
): void {
  const { debouncer, pageId, parsed } = metadata;

  if (!debouncer || !pageId) {
    return;
  }

  const question = parsed.questions[questionIndex];
  if (!question) {
    return;
  }

  // Debounce the save operation (200ms delay)
  debouncer.debounce(
    `save-answer-${questionIndex}`,
    () => {
      void saveAnswer(table, metadata, questionIndex, answer);
    },
    200,
  );
}

/**
 * Save answer to storage and update the UI.
 *
 * @param table - Quiz table element
 * @param metadata - Table metadata
 * @param questionIndex - Question index
 * @param answer - User's answer
 */
export async function saveAnswer(
  table: HTMLTableElement,
  metadata: QuizTableMetadata,
  questionIndex: number,
  answer: string,
): Promise<void> {
  const { pageId, parsed, inputs } = metadata;

  if (!pageId || !inputs) {
    return;
  }

  const question = parsed.questions[questionIndex];
  if (!question) {
    return;
  }

  // Get session
  const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
  if (!session) {
    logError('No active session found');
    return;
  }

  // Validate answer
  const success = validateAnswer(question, answer);

  // Create answer record
  const answerRecord: AnswerRecord = {
    answer: answer.trim(),
    success,
    timestamp: new Date().toISOString(),
  };

  // Load student record from IndexedDB
  const storageService = getStorageService();
  let studentRecord;
  try {
    studentRecord = await storageService.loadStudentRecord(session);
  } catch (err) {
    warn('Failed to load student record, answer not saved', err);
    return;
  }

  // Update record with new answer
  const totalQuestions = parsed.questions.length;
  const updatedRecord = storageService.updateRecordWithAnswer(
    studentRecord,
    pageId,
    questionIndex,
    answerRecord,
    totalQuestions,
  );

  // Persist, refresh cache, apply validation styling, then emit events
  const pageData = updatedRecord.pages[pageId];
  await persistAndNotify(updatedRecord, {
    onSavedDom: () => {
      const row = table.querySelector(`tbody tr:nth-child(${questionIndex + 1})`);
      const answerCell = row?.querySelector('td:nth-child(2)');
      if (answerCell) {
        applyValidationStyling(answerCell, success);
      }
      // Say the result as well as colouring it (SRD 013 A11Y-02)
      announce(`Question ${questionIndex + 1}: ${success ? 'correct' : 'incorrect'}`);
    },
    events: [
      { name: 'qd:answer-saved', detail: { pageId, answer: answerRecord } },
      ...(pageData
        ? [{ name: 'qd:state-changed' as const, detail: { pageId, state: pageData.state } }]
        : []),
    ],
  });

  info(
    `Answer saved for question ${questionIndex + 1} on page ${pageId}: ${success ? 'correct' : 'incorrect'}`,
  );
}

/**
 * Apply validation styling to an answer cell (DOM-only).
 *
 * Colour alone fails WCAG 1.4.1, so the cell also gets a visible mark (✓ or
 * ✗) with hidden "Correct"/"Incorrect" text, and the input is described by it
 * (SRD 013 A11Y-02).
 *
 * @param cell - Answer cell element
 * @param success - Whether the answer is correct
 */
export function applyValidationStyling(cell: Element, success: boolean): void {
  removeClass(cell, 'qd-answer-correct', 'qd-answer-incorrect');
  addClass(cell, success ? 'qd-answer-correct' : 'qd-answer-incorrect');

  let feedback = cell.querySelector<HTMLElement>('.qd-answer-feedback');
  if (!feedback) {
    feedback = document.createElement('span');
    feedback.className = 'qd-answer-feedback';
    cell.appendChild(feedback);
  }
  feedback.replaceChildren();
  const mark = document.createElement('span');
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = success ? '✓ Correct' : '✗ Incorrect';
  const text = document.createElement('span');
  text.className = SR_ONLY_CLASS;
  text.textContent = success ? 'Correct' : 'Incorrect';
  feedback.append(mark, text);

  const control = cell.querySelector('select, input');
  if (control) {
    control.setAttribute('aria-describedby', ensureId(feedback, 'qd-feedback'));
  }
}

/**
 * Remove correctness styling and the feedback mark from an answer cell.
 *
 * @param cell - Answer cell element
 */
export function clearValidationFeedback(cell: Element): void {
  removeClass(cell, 'qd-answer-correct', 'qd-answer-incorrect');
  cell.querySelector('.qd-answer-feedback')?.remove();
  cell.querySelector('select, input')?.removeAttribute('aria-describedby');
}

/**
 * Show an inline error under an answer input and mark it invalid
 * (SRD 013 UX-03).
 *
 * @param cell - Answer cell element
 * @param input - The input to mark
 * @param message - Error text
 */
export function showInputError(cell: Element, input: HTMLElement, message: string): void {
  let error = cell.querySelector<HTMLElement>('.qd-input-error');
  if (!error) {
    error = document.createElement('span');
    error.className = 'qd-input-error';
    error.setAttribute('role', 'alert');
    input.insertAdjacentElement('afterend', error);
  }
  error.textContent = message;
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-errormessage', ensureId(error, 'qd-input-error'));
}

/**
 * Remove an inline input error.
 *
 * @param cell - Answer cell element
 * @param input - The input to unmark
 */
export function clearInputError(cell: Element, input: HTMLElement): void {
  cell.querySelector('.qd-input-error')?.remove();
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-errormessage');
}
