/**
 * Instructor answer-reveal enhancer (single shared, security-sensitive).
 *
 * For a non-interactive quiz table, restores the answer/detail columns that are
 * hidden from students and re-injects the correct answers into the DOM, then
 * wires the instructor "show/hide student answers" toggle listeners.
 *
 * This is the ONLY place correct answers are re-injected into the DOM. It
 * consolidates the previously duplicated instructor branches in `bootstrap.ts`
 * (`revealQuizAnswersForInstructor`) and `event-coordinator.ts`
 * (`upgradeTablesAfterLogin`).
 */

import {
  showStudentAnswersForTable,
  hideStudentAnswersForTable,
  type QuizTableMetadata,
} from './quiz-table.js';
import { INSTRUCTOR_SHOW_ANSWERS_KEY } from '../utils/storage-helpers.js';

/**
 * Options controlling reveal behavior. Defaults preserve the historical
 * per-caller behavior exactly.
 */
export interface RevealInstructorAnswersOptions {
  /**
   * When true, adds the `qd-quiz-instructor` CSS class to the table (the
   * bootstrap/initial-load path did this; the post-login path did not).
   */
  addInstructorClass?: boolean;
}

/**
 * Reveal correct answers and wire instructor toggles for a single quiz table.
 *
 * @param table - The quiz table to reveal
 * @param metadata - Parsed metadata for the table (must include `pageId`)
 * @param options - Behavior toggles (see {@link RevealInstructorAnswersOptions})
 */
export function revealInstructorAnswers(
  table: HTMLTableElement,
  metadata: QuizTableMetadata,
  options: RevealInstructorAnswersOptions = {},
): void {
  if (options.addInstructorClass) {
    // Add instructor class for CSS visibility override
    table.classList.add('qd-quiz-instructor');
  }

  // Remove qd-hidden class from answer column (column 1)
  const answerCells = table.querySelectorAll('td:nth-child(2), th:nth-child(2)');
  answerCells.forEach((cell) => {
    cell.classList.remove('qd-hidden');
  });

  // Restore answer text to data cells only (not header)
  const answerDataCells = table.querySelectorAll('tbody td:nth-child(2)');
  answerDataCells.forEach((cell, index) => {
    const question = metadata.parsed.questions[index];
    if (question && cell instanceof HTMLTableCellElement) {
      cell.textContent = question.correctAnswer;
    }
  });

  // Remove qd-hidden class from detail column (column 2)
  const detailCells = table.querySelectorAll('td:nth-child(3), th:nth-child(3)');
  detailCells.forEach((cell) => cell.classList.remove('qd-hidden'));

  // Set up instructor toggle event listeners (since table is non-interactive)
  const showAnswersHandler = (): void => {
    void showStudentAnswersForTable(table, metadata);
  };
  const hideAnswersHandler = (): void => {
    hideStudentAnswersForTable(table);
  };

  document.addEventListener('qd:instructor-show-answers', showAnswersHandler);
  document.addEventListener('qd:instructor-hide-answers', hideAnswersHandler);

  // Check if toggle already enabled
  const showAnswers = sessionStorage.getItem(INSTRUCTOR_SHOW_ANSWERS_KEY) === 'true';
  if (showAnswers) {
    void showAnswersHandler();
  }
}

/**
 * Remove any rendered student-answer overlays from a quiz table.
 *
 * Inverse of the toggle's "show" action; provided for callers that need to
 * tear the overlay down without re-hiding the answer columns.
 *
 * @param table - The quiz table to clear overlays from
 */
export function hideInstructorAnswers(table: HTMLTableElement): void {
  hideStudentAnswersForTable(table);
}
