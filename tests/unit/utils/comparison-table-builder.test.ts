/**
 * Unit tests for comparison table builder
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildComparisonTable,
  insertAfterTable,
  removeComparisonTables,
  type ComparisonTableConfig,
} from '../../../src/utils/comparison-table-builder.js';
import type { StudentRecord } from '../../../src/types/contracts.js';

describe('Comparison Table Builder', () => {
  // Sample student data for testing
  const students: StudentRecord[] = [
    {
      schema: 1,
      docId: 'doc-alice',
      serviceId: 'RN2344',
      name: 'Alice Student',
      release: '11-2024',
      attempted: 10,
      correct: 8,
      updated: '2024-11-16T10:02:00Z',
      pages: {
        'gram-1': {
          state: 'complete',
          answers: [
            { answer: 'a', success: true, timestamp: '2024-11-16T10:00:00Z' },
            { answer: 'b', success: false, timestamp: '2024-11-16T10:01:00Z' },
            { answer: 'c', success: true, timestamp: '2024-11-16T10:02:00Z' },
          ],
        },
      },
    },
    {
      schema: 1,
      docId: 'doc-bob',
      serviceId: 'RN5678',
      name: 'Bob Student',
      release: '11-2024',
      attempted: 10,
      correct: 9,
      updated: '2024-11-16T11:02:00Z',
      pages: {
        'gram-1': {
          state: 'complete',
          answers: [
            { answer: 'a', success: true, timestamp: '2024-11-16T11:00:00Z' },
            { answer: 'a', success: true, timestamp: '2024-11-16T11:01:00Z' },
            { answer: 'c', success: true, timestamp: '2024-11-16T11:02:00Z' },
          ],
        },
      },
    },
    {
      schema: 1,
      docId: 'doc-charlie',
      serviceId: 'RN9999',
      name: 'Charlie Student',
      release: '11-2024',
      attempted: 2,
      correct: 1,
      updated: '2024-11-16T12:00:00Z',
      pages: {
        'gram-1': {
          state: 'incomplete',
          answers: [
            { answer: 'b', success: false, timestamp: '2024-11-16T12:00:00Z' },
            // No second or third answer
          ],
        },
      },
    },
  ];

  describe('buildComparisonTable()', () => {
    it('should build basic comparison table with correct structure', () => {
      const config: ComparisonTableConfig = {
        tableClass: 'qd-test-comparison',
        columns: [{ label: 'Q1' }, { label: 'Q2' }, { label: 'Q3' }],
        cellExtractor: (student, colIndex, pageId) => {
          const answers = student.pages[pageId]?.answers || [];
          const answer = answers[colIndex];

          if (!answer?.answer) {
            return { text: '—', classes: ['qd-no-answer'] };
          }

          return {
            text: answer.answer,
            classes: [answer.success ? 'qd-success' : 'qd-failure'],
          };
        },
      };

      const table = buildComparisonTable(students, 'gram-1', config);

      // Check table class
      expect(table.className).toBe('qd-test-comparison');
      expect(table.tagName.toLowerCase()).toBe('table');

      // Check header structure
      const thead = table.querySelector('thead');
      expect(thead).toBeTruthy();

      const headerCells = thead?.querySelectorAll('th');
      expect(headerCells).toHaveLength(4); // Student + Q1 + Q2 + Q3

      if (headerCells) {
        expect(headerCells[0]?.textContent).toBe('Student');
        expect(headerCells[1]?.textContent).toBe('Q1');
        expect(headerCells[2]?.textContent).toBe('Q2');
        expect(headerCells[3]?.textContent).toBe('Q3');
      }

      // Check body structure
      const tbody = table.querySelector('tbody');
      expect(tbody).toBeTruthy();

      const rows = tbody?.querySelectorAll('tr');
      expect(rows).toHaveLength(3); // One row per student
    });

    it('should truncate student IDs to specified length', () => {
      const config: ComparisonTableConfig = {
        tableClass: 'qd-test',
        columns: [{ label: 'Q1' }],
        cellExtractor: () => ({ text: 'test' }),
        studentIdLength: 4,
      };

      const table = buildComparisonTable(students, 'gram-1', config);

      const studentCells = table.querySelectorAll('.qd-student-id');
      expect(studentCells).toHaveLength(3);
      expect(studentCells[0]?.textContent).toBe('RN23'); // First 4 chars of RN2344
      expect(studentCells[1]?.textContent).toBe('RN56'); // First 4 chars of RN5678
      expect(studentCells[2]?.textContent).toBe('RN99'); // First 4 chars of RN9999
    });

    it('should apply custom student ID length', () => {
      const config: ComparisonTableConfig = {
        tableClass: 'qd-test',
        columns: [{ label: 'Q1' }],
        cellExtractor: () => ({ text: 'test' }),
        studentIdLength: 6,
      };

      const table = buildComparisonTable(students, 'gram-1', config);

      const studentCells = table.querySelectorAll('.qd-student-id');
      expect(studentCells[0]?.textContent).toBe('RN2344'); // First 6 chars
      expect(studentCells[1]?.textContent).toBe('RN5678');
      expect(studentCells[2]?.textContent).toBe('RN9999');
    });

    it('should apply success/failure classes based on cell extractor', () => {
      const config: ComparisonTableConfig = {
        tableClass: 'qd-test',
        columns: [{ label: 'Q1' }],
        cellExtractor: (student, colIndex, pageId) => {
          const answers = student.pages[pageId]?.answers || [];
          const answer = answers[colIndex];

          if (!answer?.answer) {
            return { text: '—', classes: ['qd-no-answer'] };
          }

          return {
            text: answer.answer,
            classes: [answer.success ? 'qd-success' : 'qd-failure'],
          };
        },
      };

      const table = buildComparisonTable(students, 'gram-1', config);

      const tbody = table.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');

      if (rows) {
        // First student (Alice): Q1 is correct
        const alice = rows[0]?.querySelectorAll('td')[1];
        expect(alice?.classList.contains('qd-success')).toBe(true);
        expect(alice?.textContent).toBe('a');

        // Second student (Bob): Q1 is correct
        const bob = rows[1]?.querySelectorAll('td')[1];
        expect(bob?.classList.contains('qd-success')).toBe(true);
        expect(bob?.textContent).toBe('a');

        // Third student (Charlie): Q1 is incorrect
        const charlie = rows[2]?.querySelectorAll('td')[1];
        expect(charlie?.classList.contains('qd-failure')).toBe(true);
        expect(charlie?.textContent).toBe('b');
      }
    });

    it('should handle missing answers with no-answer class', () => {
      const config: ComparisonTableConfig = {
        tableClass: 'qd-test',
        columns: [{ label: 'Q1' }, { label: 'Q2' }, { label: 'Q3' }],
        cellExtractor: (student, colIndex, pageId) => {
          const answers = student.pages[pageId]?.answers || [];
          const answer = answers[colIndex];

          if (!answer?.answer) {
            return { text: '—', classes: ['qd-no-answer'] };
          }

          return { text: answer.answer };
        },
      };

      const table = buildComparisonTable(students, 'gram-1', config);

      const tbody = table.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');

      if (rows) {
        // Third student (Charlie) has no answers for Q2 and Q3
        const charlieCells = rows[2]?.querySelectorAll('td');
        if (charlieCells) {
          expect(charlieCells[2]?.classList.contains('qd-no-answer')).toBe(true);
          expect(charlieCells[2]?.textContent).toBe('—');
          expect(charlieCells[3]?.classList.contains('qd-no-answer')).toBe(true);
          expect(charlieCells[3]?.textContent).toBe('—');
        }
      }
    });

    it('should handle null cell extractor return value', () => {
      const config: ComparisonTableConfig = {
        tableClass: 'qd-test',
        columns: [{ label: 'Q1' }],
        cellExtractor: () => null, // Always return null
      };

      const table = buildComparisonTable(students, 'gram-1', config);

      const tbody = table.querySelector('tbody');
      const cells = tbody?.querySelectorAll('td:not(.qd-student-id)');

      if (cells) {
        // All data cells should have 'qd-no-data' class and '—' text
        for (const cell of cells) {
          expect(cell.classList.contains('qd-no-data')).toBe(true);
          expect(cell.textContent).toBe('—');
        }
      }
    });

    it('should apply custom CSS classes', () => {
      const config: ComparisonTableConfig = {
        tableClass: 'qd-test',
        columns: [{ label: 'Q1' }],
        cellExtractor: () => ({
          text: 'test',
          classes: ['custom-class-1', 'custom-class-2'],
        }),
        studentIdClass: 'custom-student-id',
        dataCellClass: 'custom-data-cell',
      };

      const table = buildComparisonTable(students, 'gram-1', config);

      // Check student ID class
      const studentCells = table.querySelectorAll('.custom-student-id');
      expect(studentCells).toHaveLength(3);

      // Check data cell classes
      const dataCells = table.querySelectorAll('.custom-data-cell');
      expect(dataCells.length).toBeGreaterThan(0);

      if (dataCells[0]) {
        expect(dataCells[0].classList.contains('custom-class-1')).toBe(true);
        expect(dataCells[0].classList.contains('custom-class-2')).toBe(true);
      }
    });

    it('should handle students with missing page data', () => {
      const studentsWithMissingPage: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-test',
          serviceId: 'TEST01',
          name: 'Test Student',
          release: '11-2024',
          attempted: 0,
          correct: 0,
          updated: '2024-11-16T00:00:00Z',
          pages: {}, // No page data
        },
      ];

      const config: ComparisonTableConfig = {
        tableClass: 'qd-test',
        columns: [{ label: 'Q1' }],
        cellExtractor: (student, colIndex, pageId) => {
          const answers = student.pages[pageId]?.answers || [];
          const answer = answers[colIndex];

          if (!answer?.answer) {
            return { text: '—', classes: ['qd-no-answer'] };
          }

          return { text: answer.answer };
        },
      };

      const table = buildComparisonTable(studentsWithMissingPage, 'gram-1', config);

      const tbody = table.querySelector('tbody');
      const cells = tbody?.querySelectorAll('td:not(.qd-student-id)');

      if (cells && cells[0]) {
        expect(cells[0].textContent).toBe('—');
        expect(cells[0].classList.contains('qd-no-answer')).toBe(true);
      }
    });

    it('should create table with zero students', () => {
      const config: ComparisonTableConfig = {
        tableClass: 'qd-test',
        columns: [{ label: 'Q1' }],
        cellExtractor: () => ({ text: 'test' }),
      };

      const table = buildComparisonTable([], 'gram-1', config);

      // Should still create table structure
      expect(table.tagName.toLowerCase()).toBe('table');

      // Header should exist
      const thead = table.querySelector('thead');
      expect(thead).toBeTruthy();

      // Body should exist but be empty
      const tbody = table.querySelector('tbody');
      expect(tbody).toBeTruthy();

      const rows = tbody?.querySelectorAll('tr');
      expect(rows).toHaveLength(0);
    });
  });

  describe('insertAfterTable()', () => {
    let container: HTMLDivElement;
    let sourceTable: HTMLTableElement;

    beforeEach(() => {
      container = document.createElement('div');
      sourceTable = document.createElement('table');
      sourceTable.className = 'source-table';
      container.appendChild(sourceTable);
    });

    it('should insert comparison table after source table', () => {
      const comparisonTable = document.createElement('table');
      comparisonTable.className = 'comparison-table';

      const result = insertAfterTable(sourceTable, comparisonTable);

      expect(result).toBe(true);
      expect(container.children).toHaveLength(2);
      expect(container.children[0]).toBe(sourceTable);
      expect(container.children[1]).toBe(comparisonTable);
    });

    it('should return false when source table has no parent', () => {
      const orphanTable = document.createElement('table');
      const comparisonTable = document.createElement('table');

      const result = insertAfterTable(orphanTable, comparisonTable);

      expect(result).toBe(false);
    });

    it('should insert between existing siblings', () => {
      const nextSibling = document.createElement('div');
      nextSibling.className = 'next-sibling';
      container.appendChild(nextSibling);

      const comparisonTable = document.createElement('table');
      comparisonTable.className = 'comparison-table';

      insertAfterTable(sourceTable, comparisonTable);

      expect(container.children).toHaveLength(3);
      expect(container.children[0]).toBe(sourceTable);
      expect(container.children[1]).toBe(comparisonTable);
      expect(container.children[2]).toBe(nextSibling);
    });
  });

  describe('removeComparisonTables()', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
    });

    it('should remove all tables with specified class', () => {
      const table1 = document.createElement('table');
      table1.className = 'qd-comparison';
      container.appendChild(table1);

      const table2 = document.createElement('table');
      table2.className = 'qd-comparison';
      container.appendChild(table2);

      const table3 = document.createElement('table');
      table3.className = 'other-table';
      container.appendChild(table3);

      const removed = removeComparisonTables(container, 'qd-comparison');

      expect(removed).toBe(2);
      expect(container.querySelectorAll('.qd-comparison')).toHaveLength(0);
      expect(container.querySelectorAll('.other-table')).toHaveLength(1);
    });

    it('should return zero when no tables found', () => {
      const removed = removeComparisonTables(container, 'qd-comparison');

      expect(removed).toBe(0);
    });

    it('should not affect other elements', () => {
      const div = document.createElement('div');
      div.className = 'qd-comparison'; // Same class but not a table
      container.appendChild(div);

      const table = document.createElement('table');
      table.className = 'qd-comparison';
      container.appendChild(table);

      const removed = removeComparisonTables(container, 'qd-comparison');

      expect(removed).toBe(1);
      expect(container.querySelector('div.qd-comparison')).toBeTruthy(); // Div still there
      expect(container.querySelector('table.qd-comparison')).toBeNull(); // Table removed
    });
  });
});
