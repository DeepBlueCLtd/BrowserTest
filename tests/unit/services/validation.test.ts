/**
 * Table Validation Tests
 *
 * Tests for validating quiz and analysis table structure at runtime.
 * Ensures authoring rules are enforced (FR-007, FR-017).
 *
 * Rules:
 * - Quiz tables: Exactly 3 columns, class "qd-quiz qd-page", max ONE per page
 * - Analysis tables: Class "qd-analysis", max ONE per page
 * - MCQ questions: Detail column contains <ol> tag
 * - Numeric questions: Detail column contains tolerance number
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  validateQuizTable,
  validateAnalysisTable,
  validatePageTables,
  hasCorrectQuizColumns,
  hasQuizTableClass,
  hasAnalysisTableClass,
} from '../../../src/services/validation';

describe('Table Validation', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document as unknown as Document;
  });

  describe('hasQuizTableClass()', () => {
    it('should return true for table with qd-quiz and qd-page classes', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz qd-page';

      expect(hasQuizTableClass(table)).toBe(true);
    });

    it('should return false for table with only qd-quiz', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';

      expect(hasQuizTableClass(table)).toBe(false);
    });

    it('should return false for table with only qd-page', () => {
      const table = document.createElement('table');
      table.className = 'qd-page';

      expect(hasQuizTableClass(table)).toBe(false);
    });

    it('should return true for table with additional classes', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz qd-page other-class';

      expect(hasQuizTableClass(table)).toBe(true);
    });

    it('should return false for table with no classes', () => {
      const table = document.createElement('table');

      expect(hasQuizTableClass(table)).toBe(false);
    });
  });

  describe('hasAnalysisTableClass()', () => {
    it('should return true for table with qd-analysis class', () => {
      const table = document.createElement('table');
      table.className = 'qd-analysis';

      expect(hasAnalysisTableClass(table)).toBe(true);
    });

    it('should return true for table with qd-analysis and other classes', () => {
      const table = document.createElement('table');
      table.className = 'qd-analysis other-class';

      expect(hasAnalysisTableClass(table)).toBe(true);
    });

    it('should return false for table with no classes', () => {
      const table = document.createElement('table');

      expect(hasAnalysisTableClass(table)).toBe(false);
    });

    it('should return false for table with only other classes', () => {
      const table = document.createElement('table');
      table.className = 'other-class';

      expect(hasAnalysisTableClass(table)).toBe(false);
    });
  });

  describe('hasCorrectQuizColumns()', () => {
    it('should return true for table with exactly 3 columns', () => {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');

      tr.innerHTML = '<th>Question</th><th>Answer</th><th>Detail</th>';
      thead.appendChild(tr);
      table.appendChild(thead);

      expect(hasCorrectQuizColumns(table)).toBe(true);
    });

    it('should return false for table with 2 columns', () => {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');

      tr.innerHTML = '<th>Question</th><th>Answer</th>';
      thead.appendChild(tr);
      table.appendChild(thead);

      expect(hasCorrectQuizColumns(table)).toBe(false);
    });

    it('should return false for table with 4 columns', () => {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');

      tr.innerHTML = '<th>Q</th><th>A</th><th>D</th><th>Extra</th>';
      thead.appendChild(tr);
      table.appendChild(thead);

      expect(hasCorrectQuizColumns(table)).toBe(false);
    });

    it('should return true for table with 3 columns in tbody', () => {
      const table = document.createElement('table');
      const tbody = document.createElement('tbody');
      const tr = document.createElement('tr');

      tr.innerHTML = '<td>Q1</td><td>A1</td><td>D1</td>';
      tbody.appendChild(tr);
      table.appendChild(tbody);

      expect(hasCorrectQuizColumns(table)).toBe(true);
    });

    it('should return false for empty table', () => {
      const table = document.createElement('table');

      expect(hasCorrectQuizColumns(table)).toBe(false);
    });

    it('should return false for table with no rows', () => {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      table.appendChild(thead);

      expect(hasCorrectQuizColumns(table)).toBe(false);
    });
  });

  describe('validateQuizTable()', () => {
    it('should pass validation for valid quiz table', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz qd-page';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = '<th>Question</th><th>Answer</th><th>Detail</th>';
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      row.innerHTML = '<td>What is 2+2?</td><td>4</td><td><ol><li>3</li><li>4</li></ol></td>';
      tbody.appendChild(row);
      table.appendChild(tbody);

      const result = validateQuizTable(table);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation if missing qd-quiz class', () => {
      const table = document.createElement('table');
      table.className = 'qd-page';

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_QUIZ_CLASS',
          message: expect.stringContaining('qd-quiz'),
        }),
      );
    });

    it('should fail validation if not exactly 3 columns', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz qd-page';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = '<th>Question</th><th>Answer</th>';
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_COLUMN_COUNT',
          message: expect.stringContaining('3 columns'),
        }),
      );
    });

    it('should fail validation if table has no rows', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz qd-page';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = '<th>Question</th><th>Answer</th><th>Detail</th>';
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'NO_QUESTIONS',
          message: expect.stringContaining('no questions'),
        }),
      );
    });

    it('should fail validation if answer column contains non-numeric value for MCQ', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz qd-page';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = '<th>Question</th><th>Answer</th><th>Detail</th>';
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      row.innerHTML = '<td>Q1</td><td>invalid</td><td><ol><li>A</li><li>B</li></ol></td>';
      tbody.appendChild(row);
      table.appendChild(tbody);

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_ANSWER_FORMAT',
          row: 1,
        }),
      );
    });

    it('should fail validation if numeric question has no tolerance', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz qd-page';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = '<th>Question</th><th>Answer</th><th>Detail</th>';
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      row.innerHTML = '<td>What is pi?</td><td>3.14</td><td>No tolerance given</td>';
      tbody.appendChild(row);
      table.appendChild(tbody);

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_TOLERANCE',
          row: 1,
        }),
      );
    });

    it('should pass validation for numeric question with tolerance', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz qd-page';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = '<th>Question</th><th>Answer</th><th>Detail</th>';
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      row.innerHTML = '<td>What is pi?</td><td>3.14</td><td>0.1</td>';
      tbody.appendChild(row);
      table.appendChild(tbody);

      const result = validateQuizTable(table);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation if question has neither <ol> nor numeric tolerance', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz qd-page';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = '<th>Question</th><th>Answer</th><th>Detail</th>';
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      row.innerHTML = '<td>Q1</td><td>1</td><td>Plain text options</td>';
      tbody.appendChild(row);
      table.appendChild(tbody);

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      // Without <ol>, treated as numeric question, so expects numeric tolerance
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_TOLERANCE',
          row: 1,
        }),
      );
    });
  });

  describe('validateAnalysisTable()', () => {
    it('should pass validation for valid analysis table', () => {
      const table = document.createElement('table');
      table.className = 'qd-analysis';

      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      row.innerHTML = '<td style="background-color: #eee;">Read-only</td><td>Editable</td>';
      tbody.appendChild(row);
      table.appendChild(tbody);

      const result = validateAnalysisTable(table);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation if missing qd-analysis class', () => {
      const table = document.createElement('table');
      table.className = 'other-class';

      const result = validateAnalysisTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_ANALYSIS_CLASS',
          message: expect.stringContaining('qd-analysis'),
        }),
      );
    });

    it('should fail validation if table has no cells', () => {
      const table = document.createElement('table');
      table.className = 'qd-analysis';

      const result = validateAnalysisTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'NO_CELLS',
          message: expect.stringContaining('no cells'),
        }),
      );
    });

    it('should pass validation if all cells have background-color', () => {
      const table = document.createElement('table');
      table.className = 'qd-analysis';

      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      row.innerHTML =
        '<td style="background-color: #eee;">Cell 1</td><td style="background-color: #fff;">Cell 2</td>';
      tbody.appendChild(row);
      table.appendChild(tbody);

      const result = validateAnalysisTable(table);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass validation if no cells have background-color', () => {
      const table = document.createElement('table');
      table.className = 'qd-analysis';

      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      row.innerHTML = '<td>Cell 1</td><td>Cell 2</td>';
      tbody.appendChild(row);
      table.appendChild(tbody);

      const result = validateAnalysisTable(table);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validatePageTables()', () => {
    it('should pass validation for page with one quiz table', () => {
      document.body.innerHTML = `
        <table class="qd-quiz qd-page">
          <thead><tr><th>Q</th><th>A</th><th>D</th></tr></thead>
          <tbody><tr><td>Q1</td><td>1</td><td><ol><li>A</li></ol></td></tr></tbody>
        </table>
      `;

      const result = validatePageTables(document);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass validation for page with one analysis table', () => {
      document.body.innerHTML = `
        <table class="qd-analysis">
          <tbody><tr><td>Cell 1</td></tr></tbody>
        </table>
      `;

      const result = validatePageTables(document);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass validation for page with one quiz and one analysis table', () => {
      document.body.innerHTML = `
        <table class="qd-quiz qd-page">
          <thead><tr><th>Q</th><th>A</th><th>D</th></tr></thead>
          <tbody><tr><td>Q1</td><td>1</td><td><ol><li>A</li></ol></td></tr></tbody>
        </table>
        <table class="qd-analysis">
          <tbody><tr><td>Cell 1</td></tr></tbody>
        </table>
      `;

      const result = validatePageTables(document);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for page with TWO quiz tables', () => {
      document.body.innerHTML = `
        <table class="qd-quiz qd-page">
          <thead><tr><th>Q</th><th>A</th><th>D</th></tr></thead>
          <tbody><tr><td>Q1</td><td>1</td><td><ol><li>A</li></ol></td></tr></tbody>
        </table>
        <table class="qd-quiz qd-page">
          <thead><tr><th>Q</th><th>A</th><th>D</th></tr></thead>
          <tbody><tr><td>Q2</td><td>2</td><td><ol><li>B</li></ol></td></tr></tbody>
        </table>
      `;

      const result = validatePageTables(document);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MULTIPLE_QUIZ_TABLES',
          message: expect.stringContaining('maximum ONE quiz table'),
        }),
      );
    });

    it('should fail validation for page with TWO analysis tables', () => {
      document.body.innerHTML = `
        <table class="qd-analysis">
          <tbody><tr><td>Table 1</td></tr></tbody>
        </table>
        <table class="qd-analysis">
          <tbody><tr><td>Table 2</td></tr></tbody>
        </table>
      `;

      const result = validatePageTables(document);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MULTIPLE_ANALYSIS_TABLES',
          message: expect.stringContaining('maximum ONE analysis table'),
        }),
      );
    });

    it('should pass validation for page with no quiz or analysis tables', () => {
      document.body.innerHTML = `
        <p>Just regular content</p>
        <table class="regular-table">
          <tr><td>Not a quiz or analysis table</td></tr>
        </table>
      `;

      const result = validatePageTables(document);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accumulate multiple validation errors', () => {
      document.body.innerHTML = `
        <table class="qd-quiz qd-page">
          <thead><tr><th>Q</th><th>A</th></tr></thead>
        </table>
        <table class="qd-quiz qd-page">
          <thead><tr><th>Q</th><th>A</th><th>D</th></tr></thead>
          <tbody><tr><td>Q2</td><td>2</td><td><ol><li>B</li></ol></td></tr></tbody>
        </table>
      `;

      const result = validatePageTables(document);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2); // At least 2 errors

      // Should have error for wrong column count
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_COLUMN_COUNT' }),
      );

      // Should have error for multiple quiz tables
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MULTIPLE_QUIZ_TABLES' }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle table with mixed valid and invalid rows', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz qd-page';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = '<th>Question</th><th>Answer</th><th>Detail</th>';
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      tbody.innerHTML = `
        <tr><td>Valid Q</td><td>1</td><td><ol><li>A</li></ol></td></tr>
        <tr><td>Invalid Q</td><td>bad</td><td><ol><li>B</li></ol></td></tr>
        <tr><td>Valid Q2</td><td>2</td><td>0.5</td></tr>
      `;
      table.appendChild(tbody);

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.row === 2)).toBe(true);
    });

    it('should handle table with empty cells', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz qd-page';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = '<th>Question</th><th>Answer</th><th>Detail</th>';
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      tbody.innerHTML = '<tr><td></td><td></td><td></td></tr>';
      table.appendChild(tbody);

      const result = validateQuizTable(table);
      expect(result.valid).toBe(false);
    });

    it('should handle document with no body', () => {
      const emptyDom = new JSDOM('<!DOCTYPE html><html></html>');
      const emptyDoc = emptyDom.window.document as unknown as Document;

      const result = validatePageTables(emptyDoc);
      expect(result.valid).toBe(true); // No tables = valid
      expect(result.errors).toHaveLength(0);
    });

    it('should handle table with colspan in header', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz qd-page';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = '<th colspan="2">Question</th><th>Detail</th>';
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const result = validateQuizTable(table);
      // This should fail because column count detection may be affected by colspan
      expect(result.valid).toBe(false);
    });
  });
});
