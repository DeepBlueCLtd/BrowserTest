/**
 * Quiz Table Parser
 *
 * Parses DITA-generated HTML quiz tables and extracts question data.
 *
 * Table Structure:
 * - Must have class "qd-quiz"
 * - Exactly 3 columns: Question | Answer | Detail
 * - MCQ: Detail column contains <ol> with options
 * - Numeric: Detail column contains tolerance number
 */

import type {
  ParsedQuizTable,
  QuizQuestion,
  QuestionKind,
} from '../types/contracts';

/**
 * Parse a quiz table and extract question data
 *
 * @param table - HTMLTableElement with class "qd-quiz"
 * @returns ParsedQuizTable with questions and any validation errors
 */
export function parseQuizTable(table: HTMLTableElement): ParsedQuizTable {
  const errors: string[] = [];
  const questions: QuizQuestion[] = [];

  // Validate table has correct class
  if (!table.classList.contains('qd-quiz')) {
    errors.push('Table must have class "qd-quiz"');
    return { element: table, questions, errors };
  }

  // Get all rows from tbody (skip thead if present)
  const rows = Array.from(table.querySelectorAll('tbody tr'));

  if (rows.length === 0) {
    errors.push('Quiz table has no data rows');
    return { element: table, questions, errors };
  }

  // Parse each row
  rows.forEach((row, index) => {
    const cells = Array.from(row.querySelectorAll('td'));

    // Validate row has exactly 3 columns
    if (cells.length !== 3) {
      errors.push(
        `Row ${index + 1} has ${cells.length} columns, expected 3 (Question | Answer | Detail)`,
      );
      return;
    }

    const [questionCell, answerCell, detailCell] = cells;

    // Extract question text
    const questionText = questionCell.textContent?.trim() || '';
    if (!questionText) {
      errors.push(`Row ${index + 1} has empty question text`);
      return;
    }

    // Extract correct answer
    const correctAnswer = answerCell.textContent?.trim() || '';
    if (!correctAnswer) {
      errors.push(`Row ${index + 1} has empty answer`);
      return;
    }

    // Determine question kind and extract additional data
    const olElement = detailCell.querySelector('ol');

    if (olElement) {
      // MCQ question - extract options from ordered list
      const options = extractMcqOptions(olElement);

      if (options.length === 0) {
        errors.push(`Row ${index + 1} MCQ has no options in <ol>`);
        return;
      }

      questions.push({
        text: questionText,
        kind: 'mcq',
        correctAnswer,
        options,
      });
    } else {
      // Numeric question - extract tolerance
      const toleranceText = detailCell.textContent?.trim() || '';
      const tolerance = parseFloat(toleranceText);

      if (isNaN(tolerance)) {
        errors.push(
          `Row ${index + 1} appears to be numeric but has invalid tolerance: "${toleranceText}"`,
        );
        return;
      }

      questions.push({
        text: questionText,
        kind: 'numeric',
        correctAnswer,
        tolerance,
      });
    }
  });

  return {
    element: table,
    questions,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Extract option text from MCQ ordered list
 *
 * @param ol - The <ol> element containing options
 * @returns Array of option strings
 */
function extractMcqOptions(ol: HTMLOListElement): string[] {
  const listItems = Array.from(ol.querySelectorAll('li'));
  return listItems
    .map((li) => li.textContent?.trim() || '')
    .filter((text) => text.length > 0);
}

/**
 * Find all quiz tables in the document
 *
 * @param doc - Document to search (defaults to global document)
 * @returns Array of ParsedQuizTable results
 */
export function findQuizTables(doc: Document = document): ParsedQuizTable[] {
  const tables = Array.from(
    doc.querySelectorAll<HTMLTableElement>('table.qd-quiz'),
  );
  return tables.map((table) => parseQuizTable(table));
}

/**
 * Validate answer against question
 *
 * @param question - The quiz question
 * @param answer - The user's answer
 * @returns true if answer is correct
 */
export function validateAnswer(question: QuizQuestion, answer: string): boolean {
  if (!answer || answer.trim() === '') {
    return false;
  }

  const trimmedAnswer = answer.trim();

  if (question.kind === 'mcq') {
    // MCQ: exact match of option number (1-indexed)
    return trimmedAnswer === question.correctAnswer;
  } else {
    // Numeric: within tolerance
    const userValue = parseFloat(trimmedAnswer);
    const correctValue = parseFloat(question.correctAnswer);

    if (isNaN(userValue) || isNaN(correctValue)) {
      return false;
    }

    const tolerance = question.tolerance ?? 0;
    return Math.abs(userValue - correctValue) <= tolerance;
  }
}
