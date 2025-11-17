/**
 * Unit tests for table validation service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  hasQuizTableClass,
  hasAnalysisTableClass,
  hasCorrectQuizColumns,
  validateQuizTable,
  validateAnalysisTable,
  validatePageTables,
  formatValidationErrors,
  hasValidTables,
  type ValidationError,
} from '../../../src/services/validation.js';

describe('Table Validation Service', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('hasQuizTableClass()', () => {
    it('should return true for table with qd-quiz class', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      expect(hasQuizTableClass(table)).toBe(true);
    });

    it('should return false for table without qd-quiz class', () => {
      const table = document.createElement('table');
      expect(hasQuizTableClass(table)).toBe(false);
    });

    it('should return true when qd-quiz is one of multiple classes', () => {
      const table = document.createElement('table');
      table.className = 'table qd-quiz qd-page';
      expect(hasQuizTableClass(table)).toBe(true);
    });
  });

  describe('hasAnalysisTableClass()', () => {
    it('should return true for table with qd-analysis class', () => {
      const table = document.createElement('table');
      table.className = 'qd-analysis';
      expect(hasAnalysisTableClass(table)).toBe(true);
    });

    it('should return false for table without qd-analysis class', () => {
      const table = document.createElement('table');
      expect(hasAnalysisTableClass(table)).toBe(false);
    });
  });

  describe('hasCorrectQuizColumns()', () => {
    it('should return true for table with 3 columns', () => {
      const table = document.createElement('table');
      const row = document.createElement('tr');
      row.innerHTML = '<td>Q</td><td>A</td><td>D</td>';
      table.appendChild(row);

      expect(hasCorrectQuizColumns(table)).toBe(true);
    });

    it('should return false for table with 2 columns', () => {
      const table = document.createElement('table');
      const row = document.createElement('tr');
      row.innerHTML = '<td>Q</td><td>A</td>';
      table.appendChild(row);

      expect(hasCorrectQuizColumns(table)).toBe(false);
    });

    it('should return false for table with 4 columns', () => {
      const table = document.createElement('table');
      const row = document.createElement('tr');
      row.innerHTML = '<td>1</td><td>2</td><td>3</td><td>4</td>';
      table.appendChild(row);

      expect(hasCorrectQuizColumns(table)).toBe(false);
    });

    it('should check thead if present', () => {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const row = document.createElement('tr');
      row.innerHTML = '<th>Question</th><th>Answer</th><th>Detail</th>';
      thead.appendChild(row);
      table.appendChild(thead);

      expect(hasCorrectQuizColumns(table)).toBe(true);
    });

    it('should return false for empty table', () => {
      const table = document.createElement('table');
      expect(hasCorrectQuizColumns(table)).toBe(false);
    });
  });

  describe('validateQuizTable()', () => {
    it('should return valid for correctly formatted MCQ table', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <thead><tr><th>Question</th><th>Answer</th><th>Detail</th></tr></thead>
        <tbody>
          <tr>
            <td>What is 2+2?</td>
            <td>2</td>
            <td><ol><li>3</li><li>4</li><li>5</li></ol></td>
          </tr>
        </tbody>
      `;

      const result = validateQuizTable(table);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for correctly formatted numeric table', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <thead><tr><th>Question</th><th>Answer</th><th>Detail</th></tr></thead>
        <tbody>
          <tr>
            <td>What is pi?</td>
            <td>3.14</td>
            <td>0.01</td>
          </tr>
        </tbody>
      `;

      const result = validateQuizTable(table);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if table missing qd-quiz class', () => {
      const table = document.createElement('table');
      table.innerHTML = `
        <tbody>
          <tr><td>Q</td><td>1</td><td>D</td></tr>
        </tbody>
      `;

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_QUIZ_CLASS',
        }),
      );
    });

    it('should fail if table has wrong number of columns', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr><td>Q</td><td>A</td></tr>
        </tbody>
      `;

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_COLUMN_COUNT',
        }),
      );
    });

    it('should fail if table has no data rows', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = '<thead><tr><th>Q</th><th>A</th><th>D</th></tr></thead><tbody></tbody>';

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'NO_QUESTIONS',
        }),
      );
    });

    it('should fail if answer is not numeric', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>Question</td>
            <td>not-a-number</td>
            <td><ol><li>A</li></ol></td>
          </tr>
        </tbody>
      `;

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_ANSWER_FORMAT',

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          message: expect.stringContaining('must be numeric'),
        }),
      );
    });

    it('should fail if question is empty', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td></td>
            <td>1</td>
            <td><ol><li>A</li></ol></td>
          </tr>
        </tbody>
      `;

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_ANSWER_FORMAT',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          message: expect.stringContaining('cannot be empty'),
        }),
      );
    });

    it('should fail if MCQ answer is less than 1', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>Question</td>
            <td>0</td>
            <td><ol><li>A</li><li>B</li></ol></td>
          </tr>
        </tbody>
      `;

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_ANSWER_FORMAT',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          message: expect.stringContaining('1-indexed'),
        }),
      );
    });

    it('should fail if MCQ answer is out of range', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>Question</td>
            <td>5</td>
            <td><ol><li>A</li><li>B</li></ol></td>
          </tr>
        </tbody>
      `;

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_ANSWER_FORMAT',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          message: expect.stringContaining('out of range'),
        }),
      );
    });

    it('should fail if numeric question has no tolerance', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>Question</td>
            <td>3.14</td>
            <td>not-a-number</td>
          </tr>
        </tbody>
      `;

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_TOLERANCE',
        }),
      );
    });

    it('should include row numbers in errors', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr><td>Q1</td><td>1</td><td><ol><li>A</li></ol></td></tr>
          <tr><td></td><td>2</td><td><ol><li>B</li></ol></td></tr>
          <tr><td>Q3</td><td>3</td><td><ol><li>C</li></ol></td></tr>
        </tbody>
      `;

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      const errorWithRow = result.errors.find((e) => e.row === 2);
      expect(errorWithRow).toBeDefined();
    });
  });

  describe('validateAnalysisTable()', () => {
    it('should return valid for correctly formatted table', () => {
      const table = document.createElement('table');
      table.className = 'qd-analysis';
      table.innerHTML = '<tbody><tr><td>Cell 1</td><td>Cell 2</td></tr></tbody>';

      const result = validateAnalysisTable(table);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if table missing qd-analysis class', () => {
      const table = document.createElement('table');
      table.innerHTML = '<tbody><tr><td>Cell 1</td></tr></tbody>';

      const result = validateAnalysisTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_ANALYSIS_CLASS',
        }),
      );
    });

    it('should fail if table has no cells', () => {
      const table = document.createElement('table');
      table.className = 'qd-analysis';

      const result = validateAnalysisTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'NO_CELLS',
        }),
      );
    });
  });

  describe('validatePageTables()', () => {
    it('should return valid for page with one quiz and one analysis table', () => {
      container.innerHTML = `
        <table class="qd-quiz">
          <tbody><tr><td>Q</td><td>1</td><td><ol><li>A</li></ol></td></tr></tbody>
        </table>
        <table class="qd-analysis">
          <tbody><tr><td>Cell</td></tr></tbody>
        </table>
      `;

      const result = validatePageTables(document);
      expect(result.valid).toBe(true);
    });

    it('should fail if page has multiple quiz tables', () => {
      container.innerHTML = `
        <table class="qd-quiz">
          <tbody><tr><td>Q1</td><td>1</td><td><ol><li>A</li></ol></td></tr></tbody>
        </table>
        <table class="qd-quiz">
          <tbody><tr><td>Q2</td><td>2</td><td><ol><li>B</li></ol></td></tr></tbody>
        </table>
      `;

      const result = validatePageTables(document);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MULTIPLE_QUIZ_TABLES',
        }),
      );
    });

    it('should fail if page has multiple analysis tables', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody><tr><td>Cell 1</td></tr></tbody>
        </table>
        <table class="qd-analysis">
          <tbody><tr><td>Cell 2</td></tr></tbody>
        </table>
      `;

      const result = validatePageTables(document);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MULTIPLE_ANALYSIS_TABLES',
        }),
      );
    });

    it('should include individual table validation errors', () => {
      container.innerHTML = `
        <table class="qd-quiz">
          <tbody><tr><td></td><td>1</td><td><ol><li>A</li></ol></td></tr></tbody>
        </table>
      `;

      const result = validatePageTables(document);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_ANSWER_FORMAT',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          message: expect.stringContaining('cannot be empty'),
        }),
      );
    });
  });

  describe('formatValidationErrors()', () => {
    it('should return empty string for no errors', () => {
      expect(formatValidationErrors([])).toBe('');
    });

    it('should format single error', () => {
      const errors: ValidationError[] = [
        {
          code: 'MISSING_QUIZ_CLASS',
          message: 'Table must have "qd-quiz" class',
        },
      ];

      const formatted = formatValidationErrors(errors);
      expect(formatted).toContain('Table Validation Errors:');
      expect(formatted).toContain('[MISSING_QUIZ_CLASS]');
      expect(formatted).toContain('Table must have "qd-quiz" class');
    });

    it('should format multiple errors', () => {
      const errors: ValidationError[] = [
        {
          code: 'MISSING_QUIZ_CLASS',
          message: 'Error 1',
        },
        {
          code: 'INVALID_COLUMN_COUNT',
          message: 'Error 2',
        },
      ];

      const formatted = formatValidationErrors(errors);
      expect(formatted).toContain('1. [MISSING_QUIZ_CLASS] Error 1');
      expect(formatted).toContain('2. [INVALID_COLUMN_COUNT] Error 2');
    });

    it('should include row numbers in formatted output', () => {
      const errors: ValidationError[] = [
        {
          code: 'INVALID_ANSWER_FORMAT',
          message: 'Question cannot be empty',
          row: 3,
        },
      ];

      const formatted = formatValidationErrors(errors);
      expect(formatted).toContain('(row 3)');
    });
  });

  describe('hasValidTables()', () => {
    it('should return true for valid page', () => {
      container.innerHTML = `
        <table class="qd-quiz">
          <tbody><tr><td>Q</td><td>1</td><td><ol><li>A</li></ol></td></tr></tbody>
        </table>
      `;

      expect(hasValidTables(document)).toBe(true);
    });

    it('should return false for invalid page', () => {
      container.innerHTML = `
        <table class="qd-quiz">
          <tbody><tr><td></td><td>1</td><td><ol><li>A</li></ol></td></tr></tbody>
        </table>
      `;

      expect(hasValidTables(document)).toBe(false);
    });
  });
});
