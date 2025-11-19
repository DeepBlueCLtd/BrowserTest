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
  if (existing) {
    // If upgrading from non-interactive to interactive, proceed
    if (!existing.interactive && options.interactive) {
      info('Upgrading quiz table from non-interactive to interactive mode');
    } else {
      // Already enhanced in same or higher mode, skip
      info('Quiz table already enhanced, skipping');
      return true;
    }
  }

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

  // Setup logout handler to clear all input values and validation styling
  const logoutHandler = () => {
    clearQuizTableInputs(table, metadata);
  };

  document.addEventListener('qd:logout', logoutHandler);

  // Store cleanup function in metadata
  metadata.cleanupInstructorListeners = () => {
    document.removeEventListener('qd:instructor-show-answers', showAnswersHandler);
    document.removeEventListener('qd:instructor-hide-answers', hideAnswersHandler);
    document.removeEventListener('qd:logout', logoutHandler);
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
 * Clear all quiz table inputs and validation styling (called on logout)
 *
 * @param table - Quiz table element
 * @param metadata - Table metadata
 */
function clearQuizTableInputs(table: HTMLTableElement, metadata: QuizTableMetadata): void {
  const { inputs } = metadata;
  if (!inputs) return;

  // Clear all input values
  inputs.forEach((input) => {
    if (input.tagName === 'SELECT') {
      // Reset select to placeholder
      input.value = '';
    } else {
      // Clear text input
      input.value = '';
    }
  });

  // Remove validation styling from all answer cells
  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.forEach((row) => {
    const answerCell = row.querySelector('td:nth-child(2)');
    if (answerCell) {
      removeClass(answerCell, 'qd-answer-correct', 'qd-answer-incorrect');
    }
  });

  info('Cleared all quiz table inputs and validation styling');
}

/**
 * Show student answers for all questions in table (instructor mode)
 *
 * @param table - Quiz table element
 * @param metadata - Table metadata
 */
async function showStudentAnswersForTable(
  table: HTMLTableElement,
  metadata: QuizTableMetadata,
): Promise<void> {
  const { pageId, parsed } = metadata;
  if (!pageId) return;

  const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
  if (!session) return;

  // Get storage service to load all student records
  const { getStorageService } = await import('../services/storage-service.js');
  const storageService = getStorageService();

  try {
    // Load all student records for current release
    const students = await storageService.getStudentsByRelease(session.release);

    // Get tbody rows
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));

    // For each question, collect student answers and display
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

      // Collect answers from all students for this question
      const studentAnswers: Array<{
        name: string;
        serviceId: string;
        answer: string;
        success: boolean;
        timestamp: string;
      }> = [];

      students.forEach((student) => {
        const pageData = student.pages[pageId];
        if (!pageData || !pageData.answers) return;

        const answerRecord = pageData.answers[questionIndex];
        if (!answerRecord) return;

        studentAnswers.push({
          name: student.name,
          serviceId: student.serviceId,
          answer: answerRecord.answer,
          success: answerRecord.success,
          timestamp: answerRecord.timestamp,
        });
      });

      // Create display element
      if (studentAnswers.length > 0) {
        const display = document.createElement('div');
        display.className = 'qd-student-answers';

        studentAnswers.forEach((sa) => {
          const answerDiv = document.createElement('div');
          answerDiv.className = `qd-student-answer ${sa.success ? 'qd-correct' : 'qd-incorrect'}`;

          // Format: Name (last 4 of serviceId): answer [timestamp]
          const last4 = sa.serviceId.slice(-4);
          const timestamp = new Date(sa.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          answerDiv.innerHTML = `
            <span class="qd-student-name">${sa.name} (${last4})</span>:
            <span class="qd-student-answer-text">${sa.answer}</span>
            <span class="qd-timestamp">${timestamp}</span>
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
function hideStudentAnswersForTable(table: HTMLTableElement): void {
  const displays = table.querySelectorAll('.qd-student-answers');
  displays.forEach((display) => display.remove());
  info('Hid student answers from quiz table');
}
