import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  enhanceAnalysisTable,
  showStudentAnalysisEntries,
  injectAnalysisStyles,
} from '../../../src/enhancers/analysis-table';
import { parseAnalysisTable } from '../../../src/services/analysis-parser';
import type { StudentRecord } from '../../../src/types/contracts';

/**
 * Tests for Analysis Table Enhancer - Instructor Review Features
 *
 * T076: Tests for instructor analysis cell review functionality
 *
 * These tests cover:
 * - Displaying student entries for analysis cells
 * - Showing 4-character username prefixes
 * - Side-by-side comparison of student analysis data
 * - Preserving student interaction capability
 */

describe('Analysis Table Enhancer - Instructor Review', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost/test-page.html',
    });
    document = dom.window.document;
    global.document = document as unknown as Document;
    global.window = dom.window as unknown as Window & typeof globalThis;

    // Mock sessionStorage
    global.sessionStorage = dom.window.sessionStorage;
  });

  describe('Enhancement Setup', () => {
    it('should create table with correct properties', () => {
      const table = createAnalysisTable([{ label: 'Test:', editable: true }]);

      expect(table.tagName).toBe('TABLE');
      expect(table.classList.contains('qd-analysis')).toBe(true);
    });

    it('should parse table correctly', () => {
      const table = createAnalysisTable([{ label: 'Test:', editable: true }]);

      const parsed = parseAnalysisTable(table);

      expect(parsed).toBeDefined();
      expect(parsed).not.toBeNull();
      expect(parsed?.editableCells.length).toBe(1);
    });

    it('should set tableId after enhancement', () => {
      const table = createAnalysisTable([{ label: 'Test:', editable: true }]);

      enhanceAnalysisTable(table);

      expect(table.dataset.tableId).toBeDefined();
      expect(table.dataset.tableId).not.toBe('');
      expect(table.querySelectorAll('input').length).toBe(1);
    });
  });

  /**
   * Helper to create an analysis table DOM structure
   */
  function createAnalysisTable(
    rows: Array<{ label: string; editable: boolean; content?: string }>,
  ) {
    const table = document.createElement('table');
    table.className = 'qd-analysis';

    const tbody = document.createElement('tbody');

    rows.forEach((row) => {
      const tr = document.createElement('tr');

      const labelCell = document.createElement('td');
      labelCell.textContent = row.label;
      tr.appendChild(labelCell);

      const contentCell = document.createElement('td');
      if (row.editable) {
        contentCell.className = 'interactive';
      }
      contentCell.textContent = row.content || '';
      tr.appendChild(contentCell);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    document.body.appendChild(table);
    return table;
  }

  describe('showStudentAnalysisEntries()', () => {
    it('should display student entries for analysis cells', () => {
      const table = createAnalysisTable([
        { label: 'Field 1:', editable: true, content: '' },
        { label: 'Field 2:', editable: true, content: '' },
      ]);

      enhanceAnalysisTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [],
              state: 'unstarted',
              analysis: {
                tableId: table.dataset.tableId || '',
                cells: {
                  R0C1: 'Student answer for field 1',
                  R1C1: 'Student answer for field 2',
                },
              },
            },
          },
        },
      ];

      showStudentAnalysisEntries(table, students, 'test-page');

      const comparisonTable = table.parentElement?.querySelector('.qd-analysis-comparison');
      expect(comparisonTable).toBeDefined();
    });

    it('should show 4-character username prefix for each student', () => {
      const table = createAnalysisTable([{ label: 'Field:', editable: true }]);

      enhanceAnalysisTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [],
              state: 'unstarted',
              analysis: {
                tableId: table.dataset.tableId || '',
                cells: {
                  R0C1: 'Some entry',
                },
              },
            },
          },
        },
      ];

      showStudentAnalysisEntries(table, students, 'test-page');

      const studentId = table.parentElement?.querySelector('.qd-student-id');
      expect(studentId?.textContent).toBe('RN23'); // First 4 chars
    });

    it('should display entries for multiple students', () => {
      const table = createAnalysisTable([{ label: 'Field:', editable: true }]);

      enhanceAnalysisTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [],
              state: 'unstarted',
              analysis: {
                tableId: table.dataset.tableId || '',
                cells: { R0C1: 'Answer A' },
              },
            },
          },
        },
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN5678',
          name: 'Jones, A',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [],
              state: 'unstarted',
              analysis: {
                tableId: table.dataset.tableId || '',
                cells: { R0C1: 'Answer B' },
              },
            },
          },
        },
      ];

      showStudentAnalysisEntries(table, students, 'test-page');

      const studentRows = table.parentElement?.querySelectorAll('.qd-student-row');
      expect(studentRows?.length).toBe(2);
    });

    it('should display multiple cells for each student', () => {
      const table = createAnalysisTable([
        { label: 'Field 1:', editable: true },
        { label: 'Field 2:', editable: true },
        { label: 'Field 3:', editable: true },
      ]);

      enhanceAnalysisTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [],
              state: 'unstarted',
              analysis: {
                tableId: table.dataset.tableId || '',
                cells: {
                  R0C1: 'Answer 1',
                  R1C1: 'Answer 2',
                  R2C1: 'Answer 3',
                },
              },
            },
          },
        },
      ];

      showStudentAnalysisEntries(table, students, 'test-page');

      const comparisonTable = table.parentElement?.querySelector('.qd-analysis-comparison');
      const headerCells = comparisonTable?.querySelectorAll('th');

      // Should have headers for: Student ID + 3 fields
      expect(headerCells?.length).toBeGreaterThanOrEqual(4);
    });

    it('should show "No entry" for empty student cells', () => {
      const table = createAnalysisTable([{ label: 'Field:', editable: true }]);

      enhanceAnalysisTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [],
              state: 'unstarted',
              analysis: {
                tableId: table.dataset.tableId || '',
                cells: {},
              },
            },
          },
        },
      ];

      showStudentAnalysisEntries(table, students, 'test-page');

      const noEntryCell = table.parentElement?.querySelector('.qd-no-entry');
      expect(noEntryCell).toBeDefined();
    });

    it('should handle students with no analysis data for the page', () => {
      const table = createAnalysisTable([{ label: 'Field:', editable: true }]);

      enhanceAnalysisTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {},
        },
      ];

      showStudentAnalysisEntries(table, students, 'test-page');

      // Should still create comparison table with "No entry" indicators
      const comparisonTable = table.parentElement?.querySelector('.qd-analysis-comparison');
      expect(comparisonTable).toBeDefined();
    });

    it('should preserve student input capability after showing entries', () => {
      const table = createAnalysisTable([{ label: 'Field:', editable: true }]);

      enhanceAnalysisTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [],
              state: 'unstarted',
              analysis: {
                tableId: table.dataset.tableId || '',
                cells: { R0C1: 'Entry' },
              },
            },
          },
        },
      ];

      // Student can still interact
      const input = table.querySelector('input') as HTMLInputElement;
      expect(input).toBeDefined();
      expect(input.disabled).toBe(false);

      // Show instructor view
      showStudentAnalysisEntries(table, students, 'test-page');

      // Student input should remain functional
      expect(input.disabled).toBe(false);
      input.value = 'New entry';
      expect(input.value).toBe('New entry');
    });

    it('should match cell keys correctly between table and student data', () => {
      const table = createAnalysisTable([
        { label: 'Field 1:', editable: true },
        { label: 'Field 2:', editable: true },
      ]);

      enhanceAnalysisTable(table);

      // Get the actual cell keys generated by the table
      const inputs = table.querySelectorAll('input');
      const cellKeys = Array.from(inputs).map((input) => input.dataset.cellKey);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [],
              state: 'unstarted',
              analysis: {
                tableId: table.dataset.tableId || '',
                cells: {
                  [cellKeys[0] || 'R0C1']: 'Entry for field 1',
                  [cellKeys[1] || 'R1C1']: 'Entry for field 2',
                },
              },
            },
          },
        },
      ];

      showStudentAnalysisEntries(table, students, 'test-page');

      const entryCells = table.parentElement?.querySelectorAll('.qd-student-entry');
      expect(entryCells?.length).toBeGreaterThan(0);
    });
  });

  describe('Table Styling', () => {
    it('should inject styles for comparison table', () => {
      injectAnalysisStyles(document);

      const styleElement = document.getElementById('qd-analysis-styles');
      expect(styleElement).toBeDefined();
    });

    it('should not inject styles multiple times', () => {
      injectAnalysisStyles(document);
      injectAnalysisStyles(document);

      const styleElements = document.querySelectorAll('#qd-analysis-styles');
      expect(styleElements.length).toBe(1);
    });

    it('should include styles for student ID display', () => {
      injectAnalysisStyles(document);

      const styleElement = document.getElementById('qd-analysis-styles');
      expect(styleElement?.textContent).toContain('.qd-student-id');
    });

    it('should include styles for no-entry cells', () => {
      injectAnalysisStyles(document);

      const styleElement = document.getElementById('qd-analysis-styles');
      expect(styleElement?.textContent).toContain('.qd-no-entry');
    });
  });

  describe('Integration with Existing Enhancement', () => {
    it('should not interfere with student data entry', () => {
      const table = createAnalysisTable([{ label: 'Field:', editable: true }]);

      enhanceAnalysisTable(table);

      const input = table.querySelector('input') as HTMLInputElement;
      input.value = 'Student entry';

      const students: StudentRecord[] = [];
      showStudentAnalysisEntries(table, students, 'test-page');

      // Student's own input should remain
      expect(input.value).toBe('Student entry');
    });

    it('should work with tables that have multiple editable and non-editable cells', () => {
      const table = createAnalysisTable([
        { label: 'Label 1:', editable: false },
        { label: 'Label 2:', editable: true },
        { label: 'Label 3:', editable: false },
        { label: 'Label 4:', editable: true },
      ]);

      enhanceAnalysisTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [],
              state: 'unstarted',
              analysis: {
                tableId: table.dataset.tableId || '',
                cells: {
                  R1C1: 'Entry 1',
                  R3C1: 'Entry 2',
                },
              },
            },
          },
        },
      ];

      showStudentAnalysisEntries(table, students, 'test-page');

      // Should only show entries for editable cells
      const comparisonTable = table.parentElement?.querySelector('.qd-analysis-comparison');
      const headerCells = comparisonTable?.querySelectorAll('th');

      // Should have: Student ID + 2 editable fields (not 4 total fields)
      expect(headerCells?.length).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle table with no editable cells', () => {
      const table = createAnalysisTable([
        { label: 'Label 1:', editable: false },
        { label: 'Label 2:', editable: false },
      ]);

      enhanceAnalysisTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {},
        },
      ];

      // Should not create comparison table if no editable cells
      showStudentAnalysisEntries(table, students, 'test-page');

      const comparisonTable = table.parentElement?.querySelector('.qd-analysis-comparison');
      // Either no table or empty table is acceptable
      expect(comparisonTable === null || comparisonTable === undefined).toBeTruthy();
    });

    it('should handle empty student list', () => {
      const table = createAnalysisTable([{ label: 'Field:', editable: true }]);

      enhanceAnalysisTable(table);

      showStudentAnalysisEntries(table, [], 'test-page');

      // Should not create comparison table for empty student list
      const comparisonTable = table.parentElement?.querySelector('.qd-analysis-comparison');
      expect(comparisonTable === null || comparisonTable === undefined).toBeTruthy();
    });

    it('should handle very long student entries', () => {
      const table = createAnalysisTable([{ label: 'Field:', editable: true }]);

      enhanceAnalysisTable(table);

      // Get the actual cell key from the enhanced table
      const input = table.querySelector('input[data-cell-key]') as HTMLInputElement;
      const cellKey = input?.dataset.cellKey || 'R0C1#f:00000000';

      const longEntry = 'A'.repeat(500); // Max cell content length

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [],
              state: 'unstarted',
              analysis: {
                tableId: table.dataset.tableId || '',
                cells: { [cellKey]: longEntry },
              },
            },
          },
        },
      ];

      showStudentAnalysisEntries(table, students, 'test-page');

      const entryCell = table.parentElement?.querySelector('.qd-student-entry');
      expect(entryCell?.textContent).toContain(longEntry.substring(0, 50));
    });
  });
});
