/**
 * Comparison Table Builder Tests
 *
 * Tests for the generic comparison table builder utility that displays
 * student answers/entries in a side-by-side comparison format.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { buildComparisonTable } from '../../../src/utils/comparison-table-builder';
import type { StudentRecord } from '../../../src/types/contracts';

describe('buildComparisonTable', () => {
  let mockStudents: StudentRecord[];

  beforeEach(() => {
    mockStudents = [
      {
        schema: 1,
        docId: 'test-doc',
        serviceId: 'TEST001',
        name: 'Alice',
        release: '01-2025',
        attempted: 3,
        correct: 2,
        updated: '2025-01-15T10:00:00.000Z',
        pages: {
          'page-1': {
            answers: [
              { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
              { answer: 'b', success: false, timestamp: '2025-01-15T10:00:00.000Z' },
              { answer: 'c', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
            ],
            state: 'incomplete',
          },
        },
      },
      {
        schema: 1,
        docId: 'test-doc',
        serviceId: 'TEST002',
        name: 'Bob',
        release: '01-2025',
        attempted: 2,
        correct: 1,
        updated: '2025-01-15T10:00:00.000Z',
        pages: {
          'page-1': {
            answers: [
              { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
              { answer: 'wrong', success: false, timestamp: '2025-01-15T10:00:00.000Z' },
            ],
            state: 'incomplete',
          },
        },
      },
    ];
  });

  describe('Table Structure', () => {
    it('should create a table element with correct class', () => {
      const table = buildComparisonTable({
        students: mockStudents,
        pageId: 'page-1',
        columns: [{ key: '0', label: 'Q1' }],
        className: 'test-comparison',
        getCellValue: (student, pageId, key) => {
          const answer = student.pages[pageId]?.answers[parseInt(key)];
          return answer ? { value: answer.answer } : null;
        },
      });

      expect(table.tagName).toBe('TABLE');
      expect(table.className).toBe('test-comparison');
    });

    it('should create thead with correct headers', () => {
      const table = buildComparisonTable({
        students: mockStudents,
        pageId: 'page-1',
        columns: [
          { key: '0', label: 'Q1' },
          { key: '1', label: 'Q2' },
          { key: '2', label: 'Q3' },
        ],
        className: 'test-comparison',
        getCellValue: (student, pageId, key) => {
          const answer = student.pages[pageId]?.answers[parseInt(key)];
          return answer ? { value: answer.answer } : null;
        },
      });

      const thead = table.querySelector('thead');
      expect(thead).toBeTruthy();

      const headers = Array.from(thead!.querySelectorAll('th'));
      expect(headers).toHaveLength(4); // Student + 3 questions

      expect(headers[0].textContent).toBe('Student');
      expect(headers[0].scope).toBe('col');
      expect(headers[1].textContent).toBe('Q1');
      expect(headers[2].textContent).toBe('Q2');
      expect(headers[3].textContent).toBe('Q3');
    });

    it('should create tbody with student rows', () => {
      const table = buildComparisonTable({
        students: mockStudents,
        pageId: 'page-1',
        columns: [{ key: '0', label: 'Q1' }],
        className: 'test-comparison',
        getCellValue: (student, pageId, key) => {
          const answer = student.pages[pageId]?.answers[parseInt(key)];
          return answer ? { value: answer.answer } : null;
        },
      });

      const tbody = table.querySelector('tbody');
      expect(tbody).toBeTruthy();

      const rows = Array.from(tbody!.querySelectorAll('tr.qd-student-row'));
      expect(rows).toHaveLength(2); // 2 students
    });
  });

  describe('Student ID Column', () => {
    it('should show first 4 characters of serviceId', () => {
      const table = buildComparisonTable({
        students: mockStudents,
        pageId: 'page-1',
        columns: [{ key: '0', label: 'Q1' }],
        className: 'test-comparison',
        getCellValue: (student, pageId, key) => {
          const answer = student.pages[pageId]?.answers[parseInt(key)];
          return answer ? { value: answer.answer } : null;
        },
      });

      const studentIds = Array.from(table.querySelectorAll('td.qd-student-id'));
      expect(studentIds).toHaveLength(2);
      expect(studentIds[0].textContent).toBe('TEST');
      expect(studentIds[1].textContent).toBe('TEST');
    });
  });

  describe('Data Cells', () => {
    it('should display cell values returned by getCellValue', () => {
      const table = buildComparisonTable({
        students: mockStudents,
        pageId: 'page-1',
        columns: [
          { key: '0', label: 'Q1' },
          { key: '1', label: 'Q2' },
        ],
        className: 'test-comparison',
        getCellValue: (student, pageId, key) => {
          const answer = student.pages[pageId]?.answers[parseInt(key)];
          return answer ? { value: answer.answer } : null;
        },
      });

      const rows = Array.from(table.querySelectorAll('tbody tr'));

      // First student: answers 'a' and 'b'
      const row1Cells = Array.from(rows[0].querySelectorAll('td'));
      expect(row1Cells[1].textContent).toBe('a'); // Q1
      expect(row1Cells[2].textContent).toBe('b'); // Q2

      // Second student: answers 'a' and 'wrong'
      const row2Cells = Array.from(rows[1].querySelectorAll('td'));
      expect(row2Cells[1].textContent).toBe('a'); // Q1
      expect(row2Cells[2].textContent).toBe('wrong'); // Q2
    });

    it('should show "—" for missing values', () => {
      const table = buildComparisonTable({
        students: mockStudents,
        pageId: 'page-1',
        columns: [
          { key: '0', label: 'Q1' },
          { key: '1', label: 'Q2' },
          { key: '2', label: 'Q3' },
        ],
        className: 'test-comparison',
        getCellValue: (student, pageId, key) => {
          const answer = student.pages[pageId]?.answers[parseInt(key)];
          return answer ? { value: answer.answer } : null;
        },
      });

      const rows = Array.from(table.querySelectorAll('tbody tr'));

      // Second student has no Q3 answer
      const row2Cells = Array.from(rows[1].querySelectorAll('td'));
      expect(row2Cells[3].textContent).toBe('—');
      expect(row2Cells[3].classList.contains('qd-no-answer')).toBe(true);
    });

    it('should apply CSS classes from getCellValue result', () => {
      const table = buildComparisonTable({
        students: mockStudents,
        pageId: 'page-1',
        columns: [
          { key: '0', label: 'Q1' },
          { key: '1', label: 'Q2' },
        ],
        className: 'test-comparison',
        getCellValue: (student, pageId, key) => {
          const answer = student.pages[pageId]?.answers[parseInt(key)];
          if (!answer) return null;
          return {
            value: answer.answer,
            cssClass: answer.success ? 'qd-success' : 'qd-failure',
          };
        },
      });

      const rows = Array.from(table.querySelectorAll('tbody tr'));

      // First student: Q1 success, Q2 failure
      const row1Cells = Array.from(rows[0].querySelectorAll('td'));
      expect(row1Cells[1].classList.contains('qd-success')).toBe(true);
      expect(row1Cells[2].classList.contains('qd-failure')).toBe(true);

      // Second student: Q1 success, Q2 failure
      const row2Cells = Array.from(rows[1].querySelectorAll('td'));
      expect(row2Cells[1].classList.contains('qd-success')).toBe(true);
      expect(row2Cells[2].classList.contains('qd-failure')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty students array', () => {
      const table = buildComparisonTable({
        students: [],
        pageId: 'page-1',
        columns: [{ key: '0', label: 'Q1' }],
        className: 'test-comparison',
        getCellValue: () => null,
      });

      const tbody = table.querySelector('tbody');
      expect(tbody).toBeTruthy();
      expect(tbody!.children.length).toBe(0);
    });

    it('should handle student with no page data', () => {
      const studentsWithMissingPage: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test-doc',
          serviceId: 'TEST003',
          name: 'Charlie',
          release: '01-2025',
          attempted: 0,
          correct: 0,
          updated: '2025-01-15T10:00:00.000Z',
          pages: {}, // No page data
        },
      ];

      const table = buildComparisonTable({
        students: studentsWithMissingPage,
        pageId: 'page-1',
        columns: [{ key: '0', label: 'Q1' }],
        className: 'test-comparison',
        getCellValue: (student, pageId, key) => {
          const answer = student.pages[pageId]?.answers[parseInt(key)];
          return answer ? { value: answer.answer } : null;
        },
      });

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      expect(rows).toHaveLength(1);

      const cells = Array.from(rows[0].querySelectorAll('td'));
      expect(cells[1].textContent).toBe('—'); // No answer
    });

    it('should handle empty columns array', () => {
      const table = buildComparisonTable({
        students: mockStudents,
        pageId: 'page-1',
        columns: [],
        className: 'test-comparison',
        getCellValue: () => null,
      });

      const headers = Array.from(table.querySelectorAll('thead th'));
      expect(headers).toHaveLength(1); // Only "Student" header

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      expect(rows).toHaveLength(2); // Still show students

      const firstRowCells = Array.from(rows[0].querySelectorAll('td'));
      expect(firstRowCells).toHaveLength(1); // Only student ID cell
    });
  });
});
