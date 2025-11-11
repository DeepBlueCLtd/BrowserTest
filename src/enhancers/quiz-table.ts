/**
 * Quiz Table Enhancer
 *
 * Progressively enhances static DITA quiz tables with interactive elements.
 * Injects dropdowns for MCQ questions and inputs for numeric questions.
 * Handles auto-save with debouncing and emits custom events.
 *
 * Usage:
 *   const table = document.querySelector('table.qd-quiz');
 *   enhanceQuizTable(table);
 */

import { parseQuizTable, validateAnswer } from '../services/quiz-parser';
import type { AnswerRecord, QuizQuestion } from '../types/contracts';

/**
 * Debounce timeout for auto-save (milliseconds)
 * Must be <200ms per requirements
 */
const AUTOSAVE_DEBOUNCE_MS = 150;

/**
 * CSS classes for visual feedback
 */
const CSS_CLASSES = {
  CORRECT: 'qd-answer-correct',
  INCORRECT: 'qd-answer-incorrect',
  ENHANCED: 'qd-enhanced',
  INPUT_CONTAINER: 'qd-input-container',
} as const;

/**
 * Debounce timer storage
 */
const debounceTimers = new WeakMap<HTMLElement, number>();

/**
 * Enhance a quiz table with interactive elements
 *
 * @param table - The quiz table element to enhance
 * @param savedAnswers - Optional array of previously saved answers
 */
export function enhanceQuizTable(
  table: HTMLTableElement | null,
  savedAnswers?: AnswerRecord[],
): void {
  if (!table) {
    console.warn('Quiz table enhancer: No table provided');
    return;
  }

  // Skip if already enhanced
  if (table.classList.contains(CSS_CLASSES.ENHANCED)) {
    return;
  }

  // Parse the table
  const parsed = parseQuizTable(table);

  // Check for parsing errors
  if (parsed.errors && parsed.errors.length > 0) {
    console.warn('Quiz table has validation errors:', parsed.errors);
    // Continue with partial enhancement if possible
    if (parsed.questions.length === 0) {
      return;
    }
  }

  // Mark as enhanced
  table.classList.add(CSS_CLASSES.ENHANCED);

  // Get all answer cells (second column in tbody)
  const rows = Array.from(table.querySelectorAll('tbody tr'));

  rows.forEach((row, index) => {
    const question = parsed.questions[index];
    if (!question) return;

    const answerCell = row.querySelector('td:nth-child(2)');
    if (!answerCell) return;

    // Get saved answer if available
    const savedAnswer = savedAnswers?.[index];

    // Enhance based on question type
    if (question.kind === 'mcq') {
      enhanceMcqCell(answerCell as HTMLElement, question, index, table, savedAnswer);
    } else {
      enhanceNumericCell(answerCell as HTMLElement, question, index, table, savedAnswer);
    }
  });
}

/**
 * Enhance an MCQ answer cell with a dropdown
 */
function enhanceMcqCell(
  cell: HTMLElement,
  question: QuizQuestion,
  questionIndex: number,
  table: HTMLTableElement,
  savedAnswer?: AnswerRecord,
): void {
  // Create select element
  const select = document.createElement('select');
  select.name = `q${questionIndex}`;
  select.className = CSS_CLASSES.INPUT_CONTAINER;

  // Add blank option
  const blankOption = document.createElement('option');
  blankOption.value = '';
  blankOption.textContent = '-- Select Answer --';
  select.appendChild(blankOption);

  // Add options from question
  question.options?.forEach((optionText, optionIndex) => {
    const option = document.createElement('option');
    option.value = String(optionIndex + 1); // 1-indexed
    option.textContent = `${optionIndex + 1}. ${optionText}`;
    select.appendChild(option);
  });

  // Restore saved answer
  if (savedAnswer) {
    select.value = savedAnswer.answer;
    applyVisualFeedback(cell, savedAnswer.success);
  }

  // Add change event handler with auto-save
  select.addEventListener('change', (e) => {
    handleAnswerChange(
      e.target as HTMLSelectElement,
      question,
      questionIndex,
      table,
      cell,
    );
  });

  // Clear cell and inject select
  cell.textContent = '';
  cell.appendChild(select);
}

/**
 * Enhance a numeric answer cell with an input
 */
function enhanceNumericCell(
  cell: HTMLElement,
  question: QuizQuestion,
  questionIndex: number,
  table: HTMLTableElement,
  savedAnswer?: AnswerRecord,
): void {
  // Create input element
  const input = document.createElement('input');
  input.type = 'number';
  input.name = `q${questionIndex}`;
  input.className = CSS_CLASSES.INPUT_CONTAINER;
  input.step = 'any'; // Allow decimals
  input.placeholder = 'Enter answer';

  // Restore saved answer
  if (savedAnswer) {
    input.value = savedAnswer.answer;
    applyVisualFeedback(cell, savedAnswer.success);
  }

  // Add input event handler with debounced auto-save
  input.addEventListener('input', (e) => {
    handleAnswerChangeDebounced(
      e.target as HTMLInputElement,
      question,
      questionIndex,
      table,
      cell,
    );
  });

  // Clear cell and inject input
  cell.textContent = '';
  cell.appendChild(input);
}

/**
 * Handle answer change with immediate save
 * Used for select elements (discrete choices)
 */
function handleAnswerChange(
  element: HTMLInputElement | HTMLSelectElement,
  question: QuizQuestion,
  questionIndex: number,
  table: HTMLTableElement,
  cell: HTMLElement,
): void {
  const answer = element.value.trim();

  if (!answer) {
    // Clear visual feedback if answer is empty
    cell.classList.remove(CSS_CLASSES.CORRECT, CSS_CLASSES.INCORRECT);
    return;
  }

  // Validate answer
  const success = validateAnswer(question, answer);

  // Apply visual feedback
  applyVisualFeedback(cell, success);

  // Create answer record
  const answerRecord: AnswerRecord = {
    answer,
    success,
    timestamp: new Date().toISOString(),
  };

  // Emit answer-saved event
  emitAnswerSavedEvent(table, questionIndex, answerRecord);
}

/**
 * Handle answer change with debouncing
 * Used for input elements (continuous typing)
 */
function handleAnswerChangeDebounced(
  element: HTMLInputElement,
  question: QuizQuestion,
  questionIndex: number,
  table: HTMLTableElement,
  cell: HTMLElement,
): void {
  // Clear existing timer
  const existingTimer = debounceTimers.get(element);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set new timer
  const timer = window.setTimeout(() => {
    handleAnswerChange(element, question, questionIndex, table, cell);
  }, AUTOSAVE_DEBOUNCE_MS);

  debounceTimers.set(element, timer);
}

/**
 * Apply visual feedback to answer cell
 */
function applyVisualFeedback(cell: HTMLElement, success: boolean): void {
  cell.classList.remove(CSS_CLASSES.CORRECT, CSS_CLASSES.INCORRECT);
  cell.classList.add(success ? CSS_CLASSES.CORRECT : CSS_CLASSES.INCORRECT);
}

/**
 * Emit qd:answer-saved custom event
 */
function emitAnswerSavedEvent(
  table: HTMLTableElement,
  questionIndex: number,
  answer: AnswerRecord,
): void {
  const event = new CustomEvent('qd:answer-saved', {
    detail: {
      questionIndex,
      answer,
      tableElement: table,
    },
    bubbles: true,
    composed: true,
  });

  table.dispatchEvent(event);
  document.dispatchEvent(event);
}

/**
 * Find and enhance all quiz tables in document
 *
 * @param doc - Document to search (defaults to global document)
 * @param answersByPage - Map of pageId to saved answers
 */
export function enhanceAllQuizTables(
  doc: Document = document,
  answersByPage?: Map<string, AnswerRecord[]>,
): void {
  const tables = doc.querySelectorAll<HTMLTableElement>('table.qd-quiz');

  tables.forEach((table) => {
    // Try to determine pageId for answer restoration
    // For now, use table index as fallback
    const pageId = table.getAttribute('data-page-id') || '';
    const savedAnswers = answersByPage?.get(pageId);

    enhanceQuizTable(table, savedAnswers);
  });
}

/**
 * Inject inline styles for visual feedback
 * This provides basic styling until full CSS is loaded
 */
export function injectQuizStyles(doc: Document = document): void {
  // Check if styles already injected
  if (doc.getElementById('qd-quiz-styles')) {
    return;
  }

  const style = doc.createElement('style');
  style.id = 'qd-quiz-styles';
  style.textContent = `
    /* Quiz table input styling */
    .qd-input-container {
      width: 100%;
      padding: 0.5rem;
      font-size: 1rem;
      border: 2px solid #ccc;
      border-radius: 4px;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .qd-input-container:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }

    /* Visual feedback for answers */
    .qd-answer-correct .qd-input-container {
      border-color: #4caf50;
      background-color: #f1f8f4;
    }

    .qd-answer-incorrect .qd-input-container {
      border-color: #d32f2f;
      background-color: #fef5f5;
    }

    .qd-answer-correct {
      background-color: #e8f5e9;
    }

    .qd-answer-incorrect {
      background-color: #ffebee;
    }

    /* Select dropdown styling */
    select.qd-input-container {
      cursor: pointer;
      background-color: white;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3e%3cpath fill='%23333' d='M6 9L1 4h10z'/%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      padding-right: 2.5rem;
      appearance: none;
    }

    /* Input number styling */
    input[type="number"].qd-input-container {
      text-align: right;
    }

    /* Remove spinner arrows for Chrome, Safari, Edge */
    input[type="number"].qd-input-container::-webkit-inner-spin-button,
    input[type="number"].qd-input-container::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Remove spinner arrows for Firefox */
    input[type="number"].qd-input-container {
      -moz-appearance: textfield;
    }

    /* Enhanced table marker */
    table.qd-enhanced {
      position: relative;
    }
  `;

  doc.head.appendChild(style);
}
