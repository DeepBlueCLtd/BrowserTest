/**
 * Unit tests for ScoresService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoresService } from '../../../src/services/scores-service.js';
import type { StudentRecord } from '../../../src/types/contracts.js';

describe('ScoresService', () => {
  let service: ScoresService;
  let mockStudent: StudentRecord;

  beforeEach(() => {
    service = new ScoresService();

    mockStudent = {
      schema: 1,
      docId: 'qd/01-2025/uTEST001',
      serviceId: 'TEST001',
      name: 'John Doe',
      release: '01-2025',
      attempted: 10,
      correct: 8,
      updated: '2025-01-01T10:00:00Z',
      pages: {
        'page-1': {
          state: 'complete',
          answers: [
            { answer: 'a', success: true, timestamp: '2025-01-01T10:00:00Z' },
            { answer: 'b', success: true, timestamp: '2025-01-01T10:01:00Z' },
            { answer: 'c', success: false, timestamp: '2025-01-01T10:02:00Z' },
          ],
        },
        'page-2': {
          state: 'incomplete',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          answers: [
            { answer: '42', success: true, timestamp: '2025-01-01T10:05:00Z' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            null as any,
          ],
        },
      },
    };
  });

  describe('calculateStudentSummary', () => {
    it('should calculate summary with correct percentage', () => {
      const summary = service.calculateStudentSummary(mockStudent);

      expect(summary).toEqual({
        serviceId: 'TEST001',
        name: 'John Doe',
        attempted: 10,
        correct: 8,
        percentage: 80,
      });
    });

    it('should handle zero attempted questions', () => {
      const emptyStudent: StudentRecord = {
        ...mockStudent,
        attempted: 0,
        correct: 0,
      };

      const summary = service.calculateStudentSummary(emptyStudent);

      expect(summary.percentage).toBe(0);
    });

    it('should round percentage to nearest integer', () => {
      const student: StudentRecord = {
        ...mockStudent,
        attempted: 3,
        correct: 2,
      };

      const summary = service.calculateStudentSummary(student);

      expect(summary.percentage).toBe(67);
    });

    it('should handle 100% correct', () => {
      const perfectStudent: StudentRecord = {
        ...mockStudent,
        attempted: 5,
        correct: 5,
      };

      const summary = service.calculateStudentSummary(perfectStudent);

      expect(summary.percentage).toBe(100);
    });
  });

  describe('calculatePageSummary', () => {
    it('should calculate page summary correctly', () => {
      const summary = service.calculatePageSummary('page-1', mockStudent);

      expect(summary).toEqual({
        pageId: 'page-1',
        attempted: 3,
        correct: 2,
        percentage: 67,
      });
    });

    it('should handle page with null answers', () => {
      const summary = service.calculatePageSummary('page-2', mockStudent);

      expect(summary).toEqual({
        pageId: 'page-2',
        attempted: 1,
        correct: 1,
        percentage: 100,
      });
    });

    it('should handle non-existent page', () => {
      const summary = service.calculatePageSummary('page-999', mockStudent);

      expect(summary).toEqual({
        pageId: 'page-999',
        attempted: 0,
        correct: 0,
        percentage: 0,
      });
    });

    it('should handle page with empty answers array', () => {
      const student: StudentRecord = {
        ...mockStudent,
        pages: {
          'empty-page': {
            state: 'unstarted',
            answers: [],
          },
        },
      };

      const summary = service.calculatePageSummary('empty-page', student);

      expect(summary).toEqual({
        pageId: 'empty-page',
        attempted: 0,
        correct: 0,
        percentage: 0,
      });
    });

    it('should handle page with all incorrect answers', () => {
      const student: StudentRecord = {
        ...mockStudent,
        pages: {
          'fail-page': {
            state: 'incomplete',
            answers: [
              { answer: 'wrong1', success: false, timestamp: '2025-01-01T10:00:00Z' },
              { answer: 'wrong2', success: false, timestamp: '2025-01-01T10:01:00Z' },
            ],
          },
        },
      };

      const summary = service.calculatePageSummary('fail-page', student);

      expect(summary).toEqual({
        pageId: 'fail-page',
        attempted: 2,
        correct: 0,
        percentage: 0,
      });
    });
  });

  describe('getPageSummaries', () => {
    it('should return summaries for all pages', () => {
      const summaries = service.getPageSummaries(mockStudent);

      expect(summaries).toHaveLength(2);
      expect(summaries[0]!.pageId).toBe('page-1');
      expect(summaries[1]!.pageId).toBe('page-2');
    });

    it('should handle student with no pages', () => {
      const emptyStudent: StudentRecord = {
        ...mockStudent,
        pages: {},
      };

      const summaries = service.getPageSummaries(emptyStudent);

      expect(summaries).toEqual([]);
    });

    it('should calculate correct statistics for each page', () => {
      const summaries = service.getPageSummaries(mockStudent);

      expect(summaries[0]!).toEqual({
        pageId: 'page-1',
        attempted: 3,
        correct: 2,
        percentage: 67,
      });

      expect(summaries[1]!).toEqual({
        pageId: 'page-2',
        attempted: 1,
        correct: 1,
        percentage: 100,
      });
    });
  });

  describe('sortStudentsByName', () => {
    it('should sort students alphabetically by name', () => {
      const students: StudentRecord[] = [
        { ...mockStudent, name: 'Zoe Smith' },
        { ...mockStudent, name: 'Alice Jones' },
        { ...mockStudent, name: 'Bob Wilson' },
      ];

      const sorted = service.sortStudentsByName(students);

      expect(sorted[0]!.name).toBe('Alice Jones');
      expect(sorted[1]!.name).toBe('Bob Wilson');
      expect(sorted[2]!.name).toBe('Zoe Smith');
    });

    it('should not mutate original array', () => {
      const students: StudentRecord[] = [
        { ...mockStudent, name: 'Zoe Smith' },
        { ...mockStudent, name: 'Alice Jones' },
      ];

      const sorted = service.sortStudentsByName(students);

      expect(students[0]!.name).toBe('Zoe Smith');
      expect(sorted[0]!.name).toBe('Alice Jones');
    });

    it('should handle empty array', () => {
      const sorted = service.sortStudentsByName([]);

      expect(sorted).toEqual([]);
    });

    it('should handle single student', () => {
      const students: StudentRecord[] = [mockStudent];
      const sorted = service.sortStudentsByName(students);

      expect(sorted).toEqual(students);
    });
  });

  describe('sortStudentsByPercentage', () => {
    it('should sort students by percentage descending', () => {
      const students: StudentRecord[] = [
        { ...mockStudent, name: 'Low Score', attempted: 10, correct: 5 },
        { ...mockStudent, name: 'High Score', attempted: 10, correct: 10 },
        { ...mockStudent, name: 'Mid Score', attempted: 10, correct: 8 },
      ];

      const sorted = service.sortStudentsByPercentage(students);

      expect(sorted[0]!.name).toBe('High Score');
      expect(sorted[1]!.name).toBe('Mid Score');
      expect(sorted[2]!.name).toBe('Low Score');
    });

    it('should handle students with zero attempted', () => {
      const students: StudentRecord[] = [
        { ...mockStudent, name: 'Student A', attempted: 10, correct: 8 },
        { ...mockStudent, name: 'Student B', attempted: 0, correct: 0 },
      ];

      const sorted = service.sortStudentsByPercentage(students);

      expect(sorted[0]!.name).toBe('Student A');
      expect(sorted[1]!.name).toBe('Student B');
    });

    it('should not mutate original array', () => {
      const students: StudentRecord[] = [
        { ...mockStudent, name: 'Low', attempted: 10, correct: 5 },
        { ...mockStudent, name: 'High', attempted: 10, correct: 10 },
      ];

      const sorted = service.sortStudentsByPercentage(students);

      expect(students[0]!.name).toBe('Low');
      expect(sorted[0]!.name).toBe('High');
    });

    it('should handle empty array', () => {
      const sorted = service.sortStudentsByPercentage([]);

      expect(sorted).toEqual([]);
    });

    it('should maintain stable sort for equal percentages', () => {
      const students: StudentRecord[] = [
        { ...mockStudent, name: 'Student A', attempted: 10, correct: 8 },
        { ...mockStudent, name: 'Student B', attempted: 5, correct: 4 },
      ];

      const sorted = service.sortStudentsByPercentage(students);

      // Both are 80%, original order should be maintained
      expect(sorted[0]!.name).toBe('Student A');
      expect(sorted[1]!.name).toBe('Student B');
    });
  });
});
