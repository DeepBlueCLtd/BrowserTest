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

    // Store correct answer as data attribute before enhancement
    // This allows instructor reveal to work after enhancement
    answerCell.setAttribute('data-correct-answer', question.correctAnswer);

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
    handleAnswerChange(e.target as HTMLSelectElement, question, questionIndex, table, cell);
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
    handleAnswerChangeDebounced(e.target as HTMLInputElement, question, questionIndex, table, cell);
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
 * Reveal correct answers in quiz table (instructor mode)
 *
 * T073: Implements correct answer display for instructors
 *
 * Note: This function parses the ORIGINAL table structure from the detail column (3rd column)
 * rather than trying to re-parse already-enhanced answer cells.
 *
 * @param table - The quiz table element to reveal answers in
 */
export function revealCorrectAnswers(table: HTMLTableElement | null): void {
  if (!table) {
    console.warn('Quiz table reveal: No table provided');
    return;
  }

  // Get all rows from tbody
  const rows = Array.from(table.querySelectorAll('tbody tr'));

  if (rows.length === 0) {
    console.warn('Quiz table reveal: No rows found');
    return;
  }

  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll('td'));

    // Need all 3 columns
    if (cells.length !== 3) {
      return;
    }

    const [, answerCell, detailCell] = cells;

    // Skip if already revealed
    if (answerCell.classList.contains('qd-answer-revealed')) {
      return;
    }

    // Extract correct answer from original cell data attribute or parse detail column
    // The answer cell's original text content is in the 2nd column before enhancement
    // We need to determine question type from detail column (3rd column)
    const olElement = detailCell.querySelector('ol');

    // Get correct answer from data attribute if set, otherwise from text
    const correctAnswer =
      answerCell.getAttribute('data-correct-answer') || answerCell.textContent?.trim() || '';

    if (!correctAnswer) {
      return;
    }

    // Mark cell as having revealed answer
    answerCell.classList.add('qd-answer-revealed');

    // Create reveal element
    const revealDiv = document.createElement('div');
    revealDiv.className = 'qd-correct-answer';

    // Display correct answer based on question type
    if (olElement) {
      // MCQ question
      revealDiv.innerHTML = `<strong>Correct Answer:</strong> ${correctAnswer}`;
    } else {
      // Numeric question - extract tolerance from detail cell
      const toleranceText = detailCell.textContent?.trim() || '';
      const tolerance = parseFloat(toleranceText);

      const toleranceSpan = !isNaN(tolerance)
        ? ` <span class="qd-tolerance">(±${tolerance})</span>`
        : '';
      revealDiv.innerHTML = `<strong>Correct Answer:</strong> ${correctAnswer}${toleranceSpan}`;
    }

    // Prepend to cell (so it appears above student input)
    answerCell.insertBefore(revealDiv, answerCell.firstChild);
  });
}

/**
 * Show student answer comparisons in a table (instructor mode)
 *
 * T074: Implements student answer comparison display
 * T075: Implements success/failure color coding
 *
 * @param table - The quiz table element
 * @param students - Array of student records to display
 * @param pageId - Current page ID to extract answers from
 */
export function showStudentComparisons(
  table: HTMLTableElement | null,
  students: import('../types/contracts').StudentRecord[],
  pageId: string,
): void {
  if (!table || !students || students.length === 0) {
    return;
  }

  // Parse the table to get question count
  const parsed = parseQuizTable(table);
  const questionCount = parsed.questions.length;

  if (questionCount === 0) {
    return;
  }

  // Create comparison table
  const comparisonTable = document.createElement('table');
  comparisonTable.className = 'qd-student-comparison';

  // Create header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Student ID column
  const studentIdHeader = document.createElement('th');
  studentIdHeader.textContent = 'Student';
  studentIdHeader.scope = 'col';
  headerRow.appendChild(studentIdHeader);

  // Question columns
  for (let i = 0; i < questionCount; i++) {
    const questionHeader = document.createElement('th');
    questionHeader.textContent = `Q${i + 1}`;
    questionHeader.scope = 'col';
    headerRow.appendChild(questionHeader);
  }

  thead.appendChild(headerRow);
  comparisonTable.appendChild(thead);

  // Create body rows for each student
  const tbody = document.createElement('tbody');

  students.forEach((student) => {
    const row = document.createElement('tr');
    row.className = 'qd-student-row';

    // Student ID cell (first 4 chars)
    const studentIdCell = document.createElement('td');
    studentIdCell.className = 'qd-student-id';
    studentIdCell.textContent = student.serviceId.substring(0, 4);
    row.appendChild(studentIdCell);

    // Get student's answers for this page
    const pageData = student.pages[pageId];
    const answers = pageData?.answers || [];

    // Add answer cells for each question
    for (let i = 0; i < questionCount; i++) {
      const answerCell = document.createElement('td');
      answerCell.className = 'qd-student-answer';

      const answer = answers[i];

      if (!answer || !answer.answer) {
        // No answer provided
        answerCell.textContent = '—';
        answerCell.classList.add('qd-no-answer');
      } else {
        // Show answer with color coding
        answerCell.textContent = answer.answer;

        // T075: Add success/failure color coding
        if (answer.success) {
          answerCell.classList.add('qd-success');
        } else {
          answerCell.classList.add('qd-failure');
        }
      }

      row.appendChild(answerCell);
    }

    tbody.appendChild(row);
  });

  comparisonTable.appendChild(tbody);

  // Insert comparison table after the quiz table
  if (table.parentElement) {
    table.parentElement.insertBefore(comparisonTable, table.nextSibling);
  }
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

    /* Instructor answer reveal styling */
    .qd-correct-answer {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background-color: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .qd-correct-answer strong {
      color: #1976d2;
    }

    .qd-tolerance {
      color: #666;
      font-size: 0.8rem;
    }

    .qd-answer-revealed {
      background-color: #fafafa;
    }

    /* Student comparison table styling */
    .qd-student-comparison {
      width: 100%;
      margin-top: 1rem;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .qd-student-comparison th,
    .qd-student-comparison td {
      padding: 0.5rem;
      text-align: center;
      border: 1px solid #e0e0e0;
    }

    .qd-student-comparison th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
    }

    .qd-student-comparison thead th:first-child {
      text-align: left;
    }

    .qd-student-id {
      font-weight: 500;
      text-align: left !important;
      font-family: monospace;
    }

    .qd-student-answer.qd-success {
      background-color: #e8f5e9;
      color: #2e7d32;
      font-weight: 600;
    }

    .qd-student-answer.qd-failure {
      background-color: #ffebee;
      color: #c62828;
      font-weight: 600;
    }

    .qd-student-answer.qd-no-answer {
      color: #999;
      font-style: italic;
    }

    .qd-student-row:hover {
      background-color: #fafafa;
    }
  `;

  doc.head.appendChild(style);
}
