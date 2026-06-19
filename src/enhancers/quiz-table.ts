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

import type { ParsedQuizTable, PageId, SessionData, SessionCache } from '../types/contracts.js';
import { parseQuizTable } from '../services/quiz-parser.js';
import { registerPageQuestions } from '../services/session-cache.js';
import { Debouncer } from '../utils/debouncer.js';
import { addClass, removeClass } from '../utils/dom-helpers.js';
import { getJSON, setJSON, INSTRUCTOR_SHOW_ANSWERS_KEY } from '../utils/storage-helpers.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import { info, error as logError } from '../utils/logger.js';
import {
  removeColgroup,
  hideAnswerColumn,
  showAnswerColumn,
  hideDetailColumn,
} from './quiz-table-columns.js';
import { createQuestionInput } from './quiz-input-factory.js';
import { handleAnswerInput, applyValidationStyling } from './quiz-answer-persistence.js';
import {
  showStudentAnswersForTable,
  hideStudentAnswersForTable,
} from './quiz-instructor-overlay.js';

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
export interface QuizTableMetadata {
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
  /** Cleanup function for instructor event listeners */
  cleanupInstructorListeners?: () => void;
}

// WeakMap to store table metadata without polluting DOM
const tableMetadata = new WeakMap<HTMLTableElement, QuizTableMetadata>();

/**
 * Enhance a quiz table with single-phase enhancement.
 *
 * Non-interactive mode hides the answer/detail columns; interactive mode
 * (requires `pageId`) injects input controls, validation, and auto-save.
 *
 * @param table - The quiz table element
 * @param options - Enhancement options
 * @returns true if enhancement succeeded, false if errors occurred
 */
export function enhanceQuizTable(
  table: HTMLTableElement,
  options: EnhanceQuizTableOptions,
): boolean {
  // Check if already enhanced
  const existing = tableMetadata.get(table);
  let parsed: ParsedQuizTable;

  if (existing) {
    // If upgrading from non-interactive to interactive, proceed
    if (!existing.interactive && options.interactive) {
      info('Upgrading quiz table from non-interactive to interactive mode');
      // Reuse existing parsed data (answers already extracted before clearing DOM)
      parsed = existing.parsed;
    } else {
      // Already enhanced in same or higher mode, skip
      info('Quiz table already enhanced, skipping');
      return true;
    }
  } else {
    // Parse the table (first enhancement)
    parsed = parseQuizTable(table);

    // Check for parsing errors
    if (parsed.errors && parsed.errors.length > 0) {
      logError('Quiz table has validation errors:', parsed.errors);
      // Still continue enhancement to show errors visually
    }
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

    info(`Preparing interactive enhancement for pageId: ${options.pageId}`);

    // Initialize debouncer for auto-save
    metadata.debouncer = new Debouncer();
    metadata.inputs = [];
  }

  tableMetadata.set(table, metadata);

  // Apply enhancement based on mode
  if (options.interactive) {
    const result = enhanceInteractive(table, metadata);
    if (result) {
      info(`Interactive enhancement succeeded for table with ${parsed.questions.length} questions`);
    } else {
      logError('Interactive enhancement failed');
    }
    return result;
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
  // Remove colgroup (auto-size), then hide answer + detail columns for security
  removeColgroup(table);
  hideAnswerColumn(table);
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

  // Show answer column (remove qd-hidden class from non-interactive mode)
  showAnswerColumn(table);

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
  let cache = getJSON<SessionCache>(STORAGE_KEYS.CACHE);
  if (!cache) {
    info('No cache found, creating empty cache');
    cache = {
      totals: { total: 0, answered: 0, correct: 0 },
      pages: {},
    };
  } else {
    info(
      `Cache loaded: ${cache.totals.total} total questions, ${Object.keys(cache.pages).length} pages`,
    );
  }

  // Register page questions (updates total count in cache)
  const totalQuestions = parsed.questions.length;
  cache = registerPageQuestions(cache, pageId, totalQuestions);
  setJSON(STORAGE_KEYS.CACHE, cache);

  const pageCache = cache?.pages[pageId];
  const existingAnswers = pageCache?.answers || [];
  info(
    `Page ${pageId}: ${existingAnswers.length} existing answers, state: ${pageCache?.state || 'none'}`,
  );

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
    if (existingAnswer && existingAnswer.answer) {
      info(
        `Q${index + 1}: Pre-filling with "${existingAnswer.answer}" (${existingAnswer.success ? 'correct' : 'incorrect'})`,
      );
    }

    // Create input control based on question type
    const input = createQuestionInput(question, existingAnswer);
    inputs.push(input);

    // Clear answer cell styling from any previous user session
    removeClass(answerCell, 'qd-answer-correct', 'qd-answer-incorrect');

    // Clear answer cell and inject input
    answerCell.textContent = '';
    answerCell.appendChild(input);

    // Apply validation styling if answer exists
    if (existingAnswer) {
      applyValidationStyling(answerCell, existingAnswer.success);
    }

    // Setup auto-save on input change
    // Use 'change' for select elements (MCQ), 'input' for text inputs (numeric)
    const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
    input.addEventListener(eventType, () => {
      handleAnswerInput(table, metadata, index, input.value);
    });
  });

  // Store input references
  metadata.inputs = inputs;

  // Setup instructor answer display listeners
  const showAnswersHandler = () => {
    void showStudentAnswersForTable(table, metadata);
  };
  const hideAnswersHandler = () => {
    hideStudentAnswersForTable(table);
  };

  document.addEventListener('qd:instructor-show-answers', showAnswersHandler);
  document.addEventListener('qd:instructor-hide-answers', hideAnswersHandler);

  // Check if instructor mode with toggle already enabled
  const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === 'true';
  const showAnswers = sessionStorage.getItem(INSTRUCTOR_SHOW_ANSWERS_KEY) === 'true';
  if (isInstructor && showAnswers) {
    void showStudentAnswersForTable(table, metadata);
  }

  // Reset UI state - used on both logout and login (new user)
  const resetUIState = () => {
    // Clear student-specific color-coded feedback
    const answerCells = table.querySelectorAll('td.qd-answer-correct, td.qd-answer-incorrect');
    answerCells.forEach((cell) => {
      removeClass(cell, 'qd-answer-correct', 'qd-answer-incorrect');
    });

    // Reset input values to default state
    if (metadata.inputs) {
      for (const input of metadata.inputs) {
        if (input instanceof HTMLSelectElement) {
          // Reset select to first option ("Select an answer...")
          input.selectedIndex = 0;
        } else if (input instanceof HTMLInputElement) {
          // Clear text input
          input.value = '';
        }
      }
    }

    // Clear any displayed student answers
    hideStudentAnswersForTable(table);
  };

  // Add logout listener to clear student-specific UI state (FR-001, FR-002)
  const logoutHandler = () => {
    resetUIState();
    info('Cleared student UI state from quiz table on logout');
  };

  // Add login listener to reset UI for new user (handles migration retry case)
  const loginHandler = () => {
    resetUIState();
    info('Reset quiz table UI on login');
  };

  document.addEventListener('qd:logout', logoutHandler);
  document.addEventListener('qd:login', loginHandler);

  // Store cleanup function in metadata
  metadata.cleanupInstructorListeners = () => {
    document.removeEventListener('qd:instructor-show-answers', showAnswersHandler);
    document.removeEventListener('qd:instructor-hide-answers', hideAnswersHandler);
    document.removeEventListener('qd:logout', logoutHandler);
    document.removeEventListener('qd:login', loginHandler);
  };

  addClass(table, 'qd-quiz-interactive');
  info(`Quiz table enhanced in interactive mode for page ${pageId}`);

  return true;
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

/**
 * Reset quiz table to non-interactive mode
 * Called on logout to allow re-enhancement on next login
 *
 * @param table - Quiz table element
 */
export function resetQuizTableToNonInteractive(table: HTMLTableElement): void {
  const metadata = tableMetadata.get(table);
  if (!metadata) return;

  // Update metadata to mark as non-interactive
  metadata.interactive = false;
  metadata.pageId = undefined;
  metadata.inputs = undefined;

  // Cleanup event listeners if they exist
  metadata.cleanupInstructorListeners?.();
  metadata.cleanupInstructorListeners = undefined;

  // Hide answer and detail columns
  hideAnswerColumn(table);
  hideDetailColumn(table);

  // Remove interactive class
  removeClass(table, 'qd-quiz-interactive');

  info('Quiz table reset to non-interactive mode');
}
