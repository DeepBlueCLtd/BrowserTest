/**
 * Table Validation Service
 *
 * Runtime validation of quiz and analysis table structure per authoring rules.
 * Implements FR-007 (runtime validation) and FR-017 (one table per page).
 *
 * Authoring Rules:
 * - Quiz tables: Must have class "qd-quiz qd-page", exactly 3 columns, max ONE per page
 * - Analysis tables: Must have class "qd-analysis", max ONE per page
 * - MCQ questions: Detail column must contain <ol> tag
 * - Numeric questions: Detail column must contain tolerance (numeric value)
 */

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | 'MISSING_QUIZ_CLASS'
  | 'MISSING_ANALYSIS_CLASS'
  | 'INVALID_COLUMN_COUNT'
  | 'NO_QUESTIONS'
  | 'NO_CELLS'
  | 'INVALID_ANSWER_FORMAT'
  | 'MISSING_TOLERANCE'
  | 'MISSING_OPTIONS_LIST'
  | 'MULTIPLE_QUIZ_TABLES'
  | 'MULTIPLE_ANALYSIS_TABLES';

/**
 * Validation error details
 */
export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  row?: number; // Row number if error is row-specific (1-indexed)
  element?: HTMLElement; // The problematic element if applicable
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Check if a table has the required quiz classes
 *
 * @param table - Table element to check
 * @returns True if table has "qd-quiz" and "qd-page" classes
 */
export function hasQuizTableClass(table: HTMLTableElement): boolean {
  return table.classList.contains('qd-quiz') && table.classList.contains('qd-page');
}

/**
 * Check if a table has the required analysis class
 *
 * @param table - Table element to check
 * @returns True if table has "qd-analysis" class
 */
export function hasAnalysisTableClass(table: HTMLTableElement): boolean {
  return table.classList.contains('qd-analysis');
}

/**
 * Check if a quiz table has exactly 3 columns
 *
 * @param table - Table element to check
 * @returns True if table has exactly 3 columns
 */
export function hasCorrectQuizColumns(table: HTMLTableElement): boolean {
  // Check first row in thead or tbody
  const firstRow =
    table.querySelector('thead tr') ||
    table.querySelector('tbody tr') ||
    table.querySelector('tr');

  if (!firstRow) {
    return false;
  }

  // Count cells (th or td)
  const cellCount = firstRow.querySelectorAll('th, td').length;
  return cellCount === 3;
}

/**
 * Check if a cell has a numeric value
 *
 * @param text - Text content to check
 * @returns True if text is a valid number
 */
function isNumeric(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === '') {
    return false;
  }
  return !isNaN(Number(trimmed));
}

/**
 * Check if detail column contains an ordered list (MCQ)
 *
 * @param cell - Table cell element
 * @returns True if cell contains <ol> tag
 */
function hasOrderedList(cell: HTMLTableCellElement): boolean {
  return cell.querySelector('ol') !== null;
}

/**
 * Check if detail column contains a tolerance value (numeric question)
 *
 * @param cell - Table cell element
 * @returns True if cell contains only a numeric value
 */
function hasTolerance(cell: HTMLTableCellElement): boolean {
  const text = cell.textContent || '';
  return isNumeric(text);
}

/**
 * Validate a quiz table structure
 *
 * @param table - Quiz table element to validate
 * @returns Validation result with any errors found
 */
export function validateQuizTable(table: HTMLTableElement): ValidationResult {
  const errors: ValidationError[] = [];

  // Check for required classes
  if (!hasQuizTableClass(table)) {
    errors.push({
      code: 'MISSING_QUIZ_CLASS',
      message: 'Quiz table must have both "qd-quiz" and "qd-page" classes',
      element: table,
    });
  }

  // Check column count
  if (!hasCorrectQuizColumns(table)) {
    errors.push({
      code: 'INVALID_COLUMN_COUNT',
      message: 'Quiz table must have exactly 3 columns: Question, Answer, Detail',
      element: table,
    });
  }

  // Get tbody rows (skip header)
  const rows = Array.from(table.querySelectorAll('tbody tr'));

  if (rows.length === 0) {
    errors.push({
      code: 'NO_QUESTIONS',
      message: 'Quiz table has no questions (no rows in tbody)',
      element: table,
    });
    return { valid: false, errors };
  }

  // Validate each question row
  rows.forEach((row, index) => {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length !== 3) {
      return; // Skip rows with wrong cell count (already reported)
    }

    const questionCell = cells[0];
    const answerCell = cells[1];
    const detailCell = cells[2];

    const questionText = questionCell.textContent?.trim() || '';
    const answerText = answerCell.textContent?.trim() || '';

    // Check if answer is numeric (required for both MCQ and numeric questions)
    if (!isNumeric(answerText)) {
      errors.push({
        code: 'INVALID_ANSWER_FORMAT',
        message: `Answer must be numeric (row ${index + 1})`,
        row: index + 1,
        element: answerCell,
      });
    }

    // Check if question is empty
    if (questionText === '') {
      errors.push({
        code: 'INVALID_ANSWER_FORMAT',
        message: `Question cannot be empty (row ${index + 1})`,
        row: index + 1,
        element: questionCell,
      });
    }

    // Determine question type and validate accordingly
    const isMCQ = hasOrderedList(detailCell);

    if (isMCQ) {
      // MCQ validation: ensure <ol> exists
      // (Already checked by hasOrderedList)
    } else {
      // No <ol> means this is a numeric question
      // Numeric question must have a numeric tolerance in detail column
      if (!hasTolerance(detailCell)) {
        errors.push({
          code: 'MISSING_TOLERANCE',
          message: `Numeric question must have tolerance value in detail column (row ${index + 1})`,
          row: index + 1,
          element: detailCell,
        });
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an analysis table structure
 *
 * @param table - Analysis table element to validate
 * @returns Validation result with any errors found
 */
export function validateAnalysisTable(table: HTMLTableElement): ValidationResult {
  const errors: ValidationError[] = [];

  // Check for required class
  if (!hasAnalysisTableClass(table)) {
    errors.push({
      code: 'MISSING_ANALYSIS_CLASS',
      message: 'Analysis table must have "qd-analysis" class',
      element: table,
    });
  }

  // Check if table has any cells
  const cells = table.querySelectorAll('td, th');
  if (cells.length === 0) {
    errors.push({
      code: 'NO_CELLS',
      message: 'Analysis table has no cells',
      element: table,
    });
  }

  // Note: Editable cell detection (cells with class="interactive") is done
  // during enhancement, not validation. All analysis tables are valid
  // regardless of which cells are editable.

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all tables on a page
 *
 * Enforces the "one quiz table and one analysis table per page" rule (FR-017).
 *
 * @param document - Document to validate
 * @returns Validation result with any errors found
 */
export function validatePageTables(document: Document): ValidationResult {
  const errors: ValidationError[] = [];

  // Find all quiz and analysis tables
  const quizTables = Array.from(
    document.querySelectorAll<HTMLTableElement>('table.qd-quiz.qd-page')
  );
  const analysisTables = Array.from(
    document.querySelectorAll<HTMLTableElement>('table.qd-analysis')
  );

  // Check for multiple quiz tables
  if (quizTables.length > 1) {
    errors.push({
      code: 'MULTIPLE_QUIZ_TABLES',
      message: `Page has ${quizTables.length} quiz tables but maximum ONE quiz table is allowed per page`,
    });
  }

  // Check for multiple analysis tables
  if (analysisTables.length > 1) {
    errors.push({
      code: 'MULTIPLE_ANALYSIS_TABLES',
      message: `Page has ${analysisTables.length} analysis tables but maximum ONE analysis table is allowed per page`,
    });
  }

  // Validate each quiz table
  quizTables.forEach(table => {
    const result = validateQuizTable(table);
    errors.push(...result.errors);
  });

  // Validate each analysis table
  analysisTables.forEach(table => {
    const result = validateAnalysisTable(table);
    errors.push(...result.errors);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format validation errors for display
 *
 * @param errors - Array of validation errors
 * @returns Formatted error message string
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  const lines = ['Table Validation Errors:'];

  errors.forEach((error, index) => {
    const rowInfo = error.row ? ` (row ${error.row})` : '';
    lines.push(`${index + 1}. [${error.code}] ${error.message}${rowInfo}`);
  });

  return lines.join('\n');
}

/**
 * Check if a page has valid tables
 *
 * Convenience function that returns boolean result.
 *
 * @param document - Document to validate
 * @returns True if all tables on page are valid
 */
export function hasValidTables(document: Document): boolean {
  const result = validatePageTables(document);
  return result.valid;
}
