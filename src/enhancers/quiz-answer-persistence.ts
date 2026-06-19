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
 * @param cell - Answer cell element
 * @param success - Whether the answer is correct
 */
export function applyValidationStyling(cell: Element, success: boolean): void {
  removeClass(cell, 'qd-answer-correct', 'qd-answer-incorrect');
  addClass(cell, success ? 'qd-answer-correct' : 'qd-answer-incorrect');
}
