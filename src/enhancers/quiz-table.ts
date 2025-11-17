/**
 * Quiz Table Enhancer
 *
 * Implements single-phase progressive enhancement for quiz tables.
 * Replaces the old two-phase (prepare/activate) pattern with a simpler
 * conditional approach based on interactive flag.
 *
 * Features:
 * - Non-interactive mode: Hide answer column for security
 * - Interactive mode: Inject input controls, validation, auto-save
 * - Uses WeakMap for metadata (not DOM attributes)
 * - Debounced auto-save to prevent excessive writes
 * - Event emission for state changes
 */

import type {
  ParsedQuizTable,
  QuizQuestion,
  AnswerRecord,
  CompletionState,
  PageId,
  SessionData,
  SessionCache,
} from '../types/contracts.js';
import { parseQuizTable } from '../services/quiz-parser.js';
import { validateAnswer } from '../services/quiz-parser.js';
import { calculateCompletionState } from '../services/state-calculator.js';
import { Debouncer } from '../utils/debouncer.js';
import { createElement, addClass, removeClass } from '../utils/dom-helpers.js';
import { emitCustomEvent } from '../utils/event-helpers.js';
import { getJSON, setJSON } from '../utils/storage-helpers.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import { info, error as logError } from '../utils/logger.js';

/**
 * Enhancement options
 */
export interface EnhanceQuizTableOptions {
  /** Whether to enable interactive controls */
  interactive: boolean;
  /** Current page ID (required for interactive mode) */
  pageId?: PageId;
}

/**
 * Quiz table metadata (stored in WeakMap)
 */
interface QuizTableMetadata {
  /** Parsed quiz data */
  parsed: ParsedQuizTable;
  /** Enhancement mode */
  interactive: boolean;
  /** Page ID (if interactive) */
  pageId?: PageId;
  /** Row input elements (if interactive) - can be text inputs or select dropdowns */
  inputs?: (HTMLInputElement | HTMLSelectElement)[];
  /** Debouncer for auto-save */
  debouncer?: Debouncer;
}

// WeakMap to store table metadata without polluting DOM
const tableMetadata = new WeakMap<HTMLTableElement, QuizTableMetadata>();

/**
 * Enhance a quiz table with single-phase enhancement
 *
 * @param table - The quiz table element
 * @param options - Enhancement options
 * @returns true if enhancement succeeded, false if errors occurred
 *
 * @example
 * ```typescript
 * // Non-interactive mode (hide answers)
 * const table = document.querySelector('table.qd-quiz');
 * if (table) {
 *   enhanceQuizTable(table, { interactive: false });
 * }
 *
 * // Interactive mode (inject controls)
 * enhanceQuizTable(table, { interactive: true, pageId: 'gram-1' });
 * ```
 */
export function enhanceQuizTable(
  table: HTMLTableElement,
  options: EnhanceQuizTableOptions,
): boolean {
  // Parse the table
  const parsed = parseQuizTable(table);

  // Check for parsing errors
  if (parsed.errors && parsed.errors.length > 0) {
    logError('Quiz table has validation errors:', parsed.errors);
    // Still continue enhancement to show errors visually
  }

  // Store metadata in WeakMap
  const metadata: QuizTableMetadata = {
    parsed,
    interactive: options.interactive,
    pageId: options.pageId,
  };

  if (options.interactive) {
    // Validate pageId is provided for interactive mode
    if (!options.pageId) {
      logError('Interactive mode requires pageId option');
      return false;
    }

    // Initialize debouncer for auto-save
    metadata.debouncer = new Debouncer();
    metadata.inputs = [];
  }

  tableMetadata.set(table, metadata);

  // Apply enhancement based on mode
  if (options.interactive) {
    return enhanceInteractive(table, metadata);
  } else {
    return enhanceNonInteractive(table);
  }
}

/**
 * Enhance table in non-interactive mode
 * - Hide answer column (security: don't show correct answers before login)
 * - Hide detail column (security: don't show MCQ options or tolerances before login)
 *
 * @param table - Quiz table element
 * @returns true if successful
 */
function enhanceNonInteractive(table: HTMLTableElement): boolean {
  // Hide answer column (column index 1) - security: hide correct answers before login
  hideAnswerColumn(table);

  // Hide detail column (column index 2) - security: hide MCQ options/tolerances
  hideDetailColumn(table);

  addClass(table, 'qd-quiz-non-interactive');
  info('Quiz table enhanced in non-interactive mode');

  return true;
}

/**
 * Enhance table in interactive mode
 * - Inject input controls for each question
 * - Setup validation and auto-save
 * - Load existing answers from storage
 *
 * @param table - Quiz table element
 * @param metadata - Table metadata
 * @returns true if successful
 */
function enhanceInteractive(table: HTMLTableElement, metadata: QuizTableMetadata): boolean {
  const { parsed, pageId, debouncer } = metadata;

  if (!pageId || !debouncer) {
    logError('Interactive mode requires pageId and debouncer');
    return false;
  }

  // Hide detail column in interactive mode
  // - MCQ options are now in the select dropdown
  // - Numeric tolerance is applied automatically
  hideDetailColumn(table);

  // Get session data
  const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
  if (!session) {
    logError('No active session found');
    return false;
  }

  // Get session cache
  const cache = getJSON<SessionCache>(STORAGE_KEYS.CACHE);
  const pageCache = cache?.pages[pageId];
  const existingAnswers = pageCache?.answers || [];

  // Get all tbody rows
  const tbody = table.querySelector('tbody');
  if (!tbody) {
    logError('Quiz table has no tbody element');
    return false;
  }

  const rows = Array.from(tbody.querySelectorAll('tr'));
  const inputs: (HTMLInputElement | HTMLSelectElement)[] = [];

  // Inject controls for each question
  parsed.questions.forEach((question, index) => {
    const row = rows[index];
    if (!row) return;

    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length !== 3) return;

    const questionCell = cells[0];
    const answerCell = cells[1];

    if (!questionCell || !answerCell) return;

    // Get existing answer for this question
    const existingAnswer = existingAnswers[index];

    // Create input control based on question type
    const input = createQuestionInput(question, existingAnswer);
    inputs.push(input);

    // Clear answer cell and inject input
    answerCell.textContent = '';
    answerCell.appendChild(input);

    // Apply validation styling if answer exists
    if (existingAnswer) {
      applyValidationStyling(answerCell, existingAnswer.success);
    }

    // Setup auto-save on input change
    input.addEventListener('input', () => {
      handleAnswerInput(table, metadata, index, input.value);
    });
  });

  // Store input references
  metadata.inputs = inputs;

  addClass(table, 'qd-quiz-interactive');
  info(`Quiz table enhanced in interactive mode for page ${pageId}`);

  return true;
}

/**
 * Create input control for a question
 *
 * For MCQ questions: Creates a <select> dropdown with options
 * For numeric questions: Creates a text input
 *
 * @param question - Quiz question
 * @param existingAnswer - Existing answer if any
 * @returns Input or select element
 */
function createQuestionInput(
  question: QuizQuestion,
  existingAnswer?: AnswerRecord,
): HTMLInputElement | HTMLSelectElement {
  if (question.kind === 'mcq' && question.options) {
    // Create select dropdown for MCQ
    const select = createElement('select');
    select.className = 'qd-quiz-input';

    // Add placeholder option
    const placeholderOption = createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Select an answer...';
    placeholderOption.disabled = true;
    select.appendChild(placeholderOption);

    // Add options (1-indexed)
    question.options.forEach((optionText, index) => {
      const option = createElement('option');
      option.value = String(index + 1); // 1-indexed
      option.textContent = `${index + 1}. ${optionText}`;
      select.appendChild(option);
    });

    // Pre-fill existing answer
    if (existingAnswer) {
      select.value = existingAnswer.answer;
    } else {
      select.value = ''; // Select placeholder
    }

    return select;
  } else {
    // Create text input for numeric questions
    const input = createElement('input');
    input.type = 'text';
    input.className = 'qd-quiz-input';
    input.placeholder = 'Enter value';

    // Pre-fill existing answer
    if (existingAnswer) {
      input.value = existingAnswer.answer;
    }

    return input;
  }
}

/**
 * Handle user answer input
 *
 * @param table - Quiz table element
 * @param metadata - Table metadata
 * @param questionIndex - Question index
 * @param answer - User's answer
 */
function handleAnswerInput(
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
      saveAnswer(table, metadata, questionIndex, answer);
    },
    200,
  );
}

/**
 * Save answer to storage and update UI
 *
 * @param table - Quiz table element
 * @param metadata - Table metadata
 * @param questionIndex - Question index
 * @param answer - User's answer
 */
function saveAnswer(
  table: HTMLTableElement,
  metadata: QuizTableMetadata,
  questionIndex: number,
  answer: string,
): void {
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
  // TODO: Replace with actual IndexedDB adapter call
  // For now, we'll update sessionStorage cache

  // Get or create cache
  const cache = getJSON<SessionCache>(STORAGE_KEYS.CACHE) || {
    totals: { answered: 0, correct: 0 },
    pages: {},
  };

  // Get or create page data
  const pageData = cache.pages[pageId] || {
    state: 'unstarted' as CompletionState,
    answered: 0,
    correct: 0,
    answers: [],
  };

  // Update answer at index (fill sparse array if needed)
  while (pageData.answers!.length <= questionIndex) {
    pageData.answers!.push({
      answer: '',
      success: false,
      timestamp: new Date().toISOString(),
    });
  }
  pageData.answers![questionIndex] = answerRecord;

  // Recalculate page state
  const totalQuestions = parsed.questions.length;
  pageData.state = calculateCompletionState(pageData.answers!, totalQuestions);
  pageData.answered = pageData.answers!.filter((a) => a.answer.trim() !== '').length;
  pageData.correct = pageData.answers!.filter((a) => a.success).length;

  // Update cache
  cache.pages[pageId] = pageData;

  // Recalculate totals across all pages
  let totalAnswered = 0;
  let totalCorrect = 0;
  for (const page of Object.values(cache.pages)) {
    totalAnswered += page.answered;
    totalCorrect += page.correct;
  }
  cache.totals = { answered: totalAnswered, correct: totalCorrect };

  // Save updated cache
  setJSON(STORAGE_KEYS.CACHE, cache);

  // Apply validation styling
  const row = table.querySelector(`tbody tr:nth-child(${questionIndex + 1})`);
  if (row) {
    const answerCell = row.querySelector('td:nth-child(2)');
    if (answerCell) {
      applyValidationStyling(answerCell, success);
    }
  }

  // Emit events
  emitCustomEvent('qd:answer-saved', {
    pageId,
    answer: answerRecord,
  });

  emitCustomEvent('qd:state-changed', {
    pageId,
    state: pageData.state,
  });

  info(
    `Answer saved for question ${questionIndex + 1} on page ${pageId}: ${success ? 'correct' : 'incorrect'}`,
  );
}

/**
 * Apply validation styling to answer cell
 *
 * @param cell - Answer cell element
 * @param success - Whether answer is correct
 */
function applyValidationStyling(cell: Element, success: boolean): void {
  removeClass(cell, 'qd-answer-correct', 'qd-answer-incorrect');
  addClass(cell, success ? 'qd-answer-correct' : 'qd-answer-incorrect');
}

/**
 * Hide answer column (column index 1)
 *
 * Hides the Answer column which contains the correct answers.
 * This prevents users from seeing correct answers before logging in.
 *
 * @param table - Quiz table element
 */
function hideAnswerColumn(table: HTMLTableElement): void {
  // Hide header cell (Answer is column 1)
  const headerCells = table.querySelectorAll('thead th, thead td');
  if (headerCells[1]) {
    addClass(headerCells[1], 'qd-hidden');
  }

  // Hide answer cells in all rows
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells[1]) {
      addClass(cells[1], 'qd-hidden');
    }
  });
}

/**
 * Hide detail column (column index 2)
 *
 * Hides the Detail column which contains MCQ options or numeric tolerances.
 * This prevents users from seeing answer options before logging in.
 *
 * @param table - Quiz table element
 */
function hideDetailColumn(table: HTMLTableElement): void {
  // Hide header cell (Detail is column 2)
  const headerCells = table.querySelectorAll('thead th, thead td');
  if (headerCells[2]) {
    addClass(headerCells[2], 'qd-hidden');
  }

  // Hide detail cells in all rows
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells[2]) {
      addClass(cells[2], 'qd-hidden');
    }
  });
}

/**
 * Get quiz table metadata
 *
 * @param table - Quiz table element
 * @returns Metadata if table has been enhanced, undefined otherwise
 */
export function getQuizTableMetadata(table: HTMLTableElement): QuizTableMetadata | undefined {
  return tableMetadata.get(table);
}

/**
 * Check if table is enhanced
 *
 * @param table - Quiz table element
 * @returns true if table has been enhanced
 */
export function isQuizTableEnhanced(table: HTMLTableElement): boolean {
  return tableMetadata.has(table);
}
