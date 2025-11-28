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
  PageId,
  SessionData,
  SessionCache,
} from '../types/contracts.js';
import { parseQuizTable } from '../services/quiz-parser.js';
import { validateAnswer } from '../services/quiz-parser.js';
import { registerPageQuestions } from '../services/session.js';
import { getQuestionInputSpec } from '../services/question-input.js';
import { formatStudentAnswersForDisplay } from '../services/answer-display.js';
import { Debouncer } from '../utils/debouncer.js';
import { createElement, addClass, removeClass } from '../utils/dom-helpers.js';
import { emitCustomEvent } from '../utils/event-helpers.js';
import { getJSON, setJSON } from '../utils/storage-helpers.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import { info, error as logError, warn } from '../utils/logger.js';
import { getStorageService } from '../services/storage-service.js';

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
  /** Cleanup function for instructor event listeners */
  cleanupInstructorListeners?: () => void;
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
  // Remove colgroup to allow auto-sizing of columns
  removeColgroup(table);

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
  const showAnswers = sessionStorage.getItem('qd/instructor/showAnswers') === 'true';
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
 * Create input control for a question
 *
 * For MCQ questions: Creates a <select> dropdown with options
 * For numeric questions: Creates a text input
 *
 * Uses getQuestionInputSpec() for pure logic, then creates DOM elements.
 *
 * @param question - Quiz question
 * @param existingAnswer - Existing answer if any
 * @returns Input or select element
 */
function createQuestionInput(
  question: QuizQuestion,
  existingAnswer?: AnswerRecord,
): HTMLInputElement | HTMLSelectElement {
  const spec = getQuestionInputSpec(question, existingAnswer);

  if (spec.type === 'select') {
    // Create select dropdown for MCQ
    const select = createElement('select');
    select.className = spec.className;

    // Add placeholder option
    const placeholderOption = createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = spec.placeholder;
    placeholderOption.disabled = true;
    select.appendChild(placeholderOption);

    // Add options from spec
    if (spec.options) {
      spec.options.forEach((opt) => {
        const option = createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        select.appendChild(option);
      });
    }

    // Set value from spec
    select.value = spec.value;

    return select;
  } else {
    // Create text input for numeric questions
    const input = createElement('input');
    input.type = spec.type;
    input.className = spec.className;
    input.placeholder = spec.placeholder;
    input.value = spec.value;

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
      void saveAnswer(table, metadata, questionIndex, answer);
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
async function saveAnswer(
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

  // Save updated record to IndexedDB
  try {
    await storageService.saveStudentRecord(updatedRecord);
  } catch (err) {
    warn('Failed to save student record to IndexedDB', err);
  }

  // Build cache from updated record
  const cache = storageService.buildCache(updatedRecord);

  // Save cache to sessionStorage for quick access
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

  const pageData = updatedRecord.pages[pageId];
  if (pageData) {
    emitCustomEvent('qd:state-changed', {
      pageId,
      state: pageData.state,
    });
  }

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
 * Remove colgroup element to allow automatic column sizing
 *
 * Fixed column widths (e.g., 40%/10%/50%) don't work well when
 * columns are hidden or contain interactive controls. Removing
 * the colgroup lets the browser auto-size based on content.
 *
 * @param table - Quiz table element
 */
function removeColgroup(table: HTMLTableElement): void {
  const colgroup = table.querySelector('colgroup');
  if (colgroup) {
    colgroup.remove();
  }
}

/**
 * Hide answer column (column index 1)
 *
 * SECURITY: Removes correct answers from DOM to prevent inspection via DevTools/view-source.
 * Answers are already parsed and stored in memory (WeakMap), so they're available for
 * validation when needed but not exposed in the DOM.
 *
 * @param table - Quiz table element
 */
function hideAnswerColumn(table: HTMLTableElement): void {
  // Hide header cell (Answer is column 1)
  const headerCells = table.querySelectorAll('thead th, thead td');
  if (headerCells[1]) {
    addClass(headerCells[1], 'qd-hidden');
  }

  // Hide answer cells and REMOVE content from DOM (security)
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells[1]) {
      addClass(cells[1], 'qd-hidden');
      cells[1].textContent = ''; // Remove answer from DOM
    }
  });
}

/**
 * Show answer column (column index 1) for interactive mode
 *
 * Removes qd-hidden class to reveal answer cells with input controls.
 * Called when upgrading from non-interactive to interactive mode.
 *
 * @param table - Quiz table element
 */
function showAnswerColumn(table: HTMLTableElement): void {
  // Show header cell (Answer is column 1)
  const headerCells = table.querySelectorAll('thead th, thead td');
  if (headerCells[1]) {
    removeClass(headerCells[1], 'qd-hidden');
  }

  // Show answer cells in all rows
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells[1]) {
      removeClass(cells[1], 'qd-hidden');
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

/**
 * Show student answers for all questions in table (instructor mode)
 *
 * @param table - Quiz table element
 * @param metadata - Table metadata
 */
export async function showStudentAnswersForTable(
  table: HTMLTableElement,
  metadata: QuizTableMetadata,
): Promise<void> {
  const { pageId, parsed } = metadata;
  if (!pageId) return;

  const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
  if (!session) return;

  // Get storage service to load all student records
  const storageService = getStorageService();

  try {
    // Load all student records for current release
    const students = await storageService.getStudentsByRelease(session.release);

    // Check if there are any students
    if (students.length === 0) {
      info('No student data available for this release');
      alert(
        'No student data available for this release. Students need to log in and answer questions first.',
      );
      return;
    }

    // Get tbody rows
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));

    // For each question, collect student answers and display using formatStudentAnswersForDisplay
    parsed.questions.forEach((_question, questionIndex) => {
      const row = rows[questionIndex];
      if (!row) return;

      const cells = Array.from(row.querySelectorAll('td'));
      const answerCell = cells[1];
      if (!answerCell) return;

      // Remove any existing student answers display
      const existingDisplay = answerCell.querySelector('.qd-student-answers');
      if (existingDisplay) {
        existingDisplay.remove();
      }

      // Use pure helper function to format student answers
      const studentAnswers = formatStudentAnswersForDisplay(students, pageId, questionIndex);

      // Create display element from formatted data
      if (studentAnswers.length > 0) {
        const display = document.createElement('div');
        display.className = 'qd-student-answers';

        studentAnswers.forEach((sa) => {
          const answerDiv = document.createElement('div');
          answerDiv.className = `qd-student-answer ${sa.cssClass}`;

          // Format: Name (last 4 of serviceId): answer [timestamp] (FR-007: 24-hour format)
          answerDiv.innerHTML = `
            <span class="qd-student-name">${sa.name} (${sa.maskedServiceId})</span>:
            <span class="qd-student-answer-text">${sa.answer}</span>
            <span class="qd-timestamp">${sa.formattedTimestamp}</span>
          `;

          display.appendChild(answerDiv);
        });

        answerCell.appendChild(display);
      }
    });

    info(`Displayed student answers for ${students.length} students on page ${pageId}`);
  } catch (err) {
    logError('Failed to load student answers', err as Error);
  }
}

/**
 * Hide student answers for all questions in table
 *
 * @param table - Quiz table element
 */
export function hideStudentAnswersForTable(table: HTMLTableElement): void {
  const displays = table.querySelectorAll('.qd-student-answers');
  displays.forEach((display) => display.remove());
  info('Hid student answers from quiz table');
}
