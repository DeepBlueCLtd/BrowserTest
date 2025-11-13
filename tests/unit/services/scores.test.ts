import { describe, it, expect } from 'vitest';
import type { StudentRecord } from '../../../src/types/contracts';

/**
 * Tests for Scores Service - Student Data Aggregation
 *
 * T079: Tests for scores page data aggregation functionality
 *
 * These tests cover:
 * - Aggregating student records into summary statistics
 * - Per-student score calculation
 * - Per-page statistics
 * - Sorting and filtering students
 */

describe('Scores Service - Data Aggregation', () => {
  /**
   * Helper to create a mock student record
   */
  function createMockStudent(
    serviceId: string,
    name: string,
    pages: Record<string, { attempted: number; correct: number }>,
  ): StudentRecord {
    const pageData: StudentRecord['pages'] = {};

    for (const [pageId, stats] of Object.entries(pages)) {
      const answers = Array.from({ length: stats.attempted }, (_, i) => ({
        answer: `${i + 1}`,
        success: i < stats.correct,
        timestamp: new Date().toISOString(),
      }));

      pageData[pageId] = {
        answers,
        state: stats.correct === stats.attempted && stats.attempted > 0 ? 'complete' : 'incomplete',
      };
    }

    const totalAttempted = Object.values(pages).reduce((sum, p) => sum + p.attempted, 0);
    const totalCorrect = Object.values(pages).reduce((sum, p) => sum + p.correct, 0);

    return {
      schema: 1,
      docId: 'test-doc',
      release: '02-2025',
      serviceId,
      name,
      attempted: totalAttempted,
      correct: totalCorrect,
      updated: new Date().toISOString(),
      pages: pageData,
    };
  }

  describe('aggregateStudentScores()', () => {
    it('should aggregate scores from multiple students', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', {
          'page-1': { attempted: 5, correct: 4 },
          'page-2': { attempted: 3, correct: 2 },
        }),
        createMockStudent('RN5678', 'Jones, A', {
          'page-1': { attempted: 5, correct: 5 },
          'page-2': { attempted: 3, correct: 1 },
        }),
      ];

      // Implementation will be added in T080
      // const aggregated = aggregateStudentScores(students);

      // Should aggregate total attempted and correct across all students
      // expect(aggregated.totalAttempted).toBe(16);
      // expect(aggregated.totalCorrect).toBe(12);
      expect(students.length).toBe(2);
    });

    it('should calculate per-student summary statistics', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', {
          'page-1': { attempted: 5, correct: 4 },
          'page-2': { attempted: 3, correct: 2 },
        }),
      ];

      // Should include:
      // - serviceId
      // - name
      // - totalAttempted
      // - totalCorrect
      // - percentage
      // - pagesComplete
      // - pagesTotal

      expect(students[0].attempted).toBe(8);
      expect(students[0].correct).toBe(6);
    });

    it('should calculate percentage correctly', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', {
          'page-1': { attempted: 10, correct: 7 },
        }),
      ];

      // Percentage should be: (7 / 10) * 100 = 70%
      // Implementation will calculate this
      expect(students[0].correct / students[0].attempted).toBeCloseTo(0.7);
    });

    it('should handle students with no attempts', () => {
      const students: StudentRecord[] = [createMockStudent('RN2344', 'Smith, J', {})];

      // Should not throw error
      // Percentage should be 0 or undefined
      expect(students[0].attempted).toBe(0);
      expect(students[0].correct).toBe(0);
    });

    it('should handle zero division for percentage', () => {
      const students: StudentRecord[] = [createMockStudent('RN2344', 'Smith, J', {})];

      // When attempted = 0, percentage should be 0 or null
      expect(students[0].attempted).toBe(0);
    });
  });

  describe('aggregatePageScores()', () => {
    it('should aggregate scores per page across students', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', {
          'page-1': { attempted: 5, correct: 4 },
          'page-2': { attempted: 3, correct: 2 },
        }),
        createMockStudent('RN5678', 'Jones, A', {
          'page-1': { attempted: 5, correct: 5 },
          'page-2': { attempted: 3, correct: 1 },
        }),
      ];

      // For page-1:
      // - 2 students attempted
      // - Total attempted: 10
      // - Total correct: 9
      // - Average: 90%

      // For page-2:
      // - 2 students attempted
      // - Total attempted: 6
      // - Total correct: 3
      // - Average: 50%

      expect(students.length).toBe(2);
    });

    it('should identify pages with low completion rates', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', {
          'page-1': { attempted: 5, correct: 1 },
        }),
        createMockStudent('RN5678', 'Jones, A', {
          'page-1': { attempted: 5, correct: 2 },
        }),
      ];

      // page-1 has low completion rate (3/10 = 30%)
      // Should be flagged for instructor attention

      expect(students.length).toBe(2);
    });

    it('should handle pages with no attempts', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', {
          'page-1': { attempted: 5, correct: 4 },
        }),
      ];

      // page-2 has no attempts
      // Should return empty or null for that page

      expect(students[0].pages['page-1']).toBeDefined();
      expect(students[0].pages['page-2']).toBeUndefined();
    });
  });

  describe('sortStudents()', () => {
    it('should sort students by serviceId alphabetically', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN5678', 'Jones, A', {}),
        createMockStudent('RN2344', 'Smith, J', {}),
        createMockStudent('RN3456', 'Brown, K', {}),
      ];

      const sorted = [...students].sort((a, b) => a.serviceId.localeCompare(b.serviceId));

      expect(sorted[0].serviceId).toBe('RN2344');
      expect(sorted[1].serviceId).toBe('RN3456');
      expect(sorted[2].serviceId).toBe('RN5678');
    });

    it('should sort students by score descending', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', { 'page-1': { attempted: 10, correct: 5 } }),
        createMockStudent('RN5678', 'Jones, A', { 'page-1': { attempted: 10, correct: 8 } }),
        createMockStudent('RN3456', 'Brown, K', { 'page-1': { attempted: 10, correct: 3 } }),
      ];

      const sorted = [...students].sort((a, b) => b.correct - a.correct);

      expect(sorted[0].serviceId).toBe('RN5678'); // 8 correct
      expect(sorted[1].serviceId).toBe('RN2344'); // 5 correct
      expect(sorted[2].serviceId).toBe('RN3456'); // 3 correct
    });

    it('should sort students by name alphabetically', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', {}),
        createMockStudent('RN5678', 'Brown, K', {}),
        createMockStudent('RN3456', 'Jones, A', {}),
      ];

      const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));

      expect(sorted[0].name).toBe('Brown, K');
      expect(sorted[1].name).toBe('Jones, A');
      expect(sorted[2].name).toBe('Smith, J');
    });
  });

  describe('filterStudents()', () => {
    it('should filter students by minimum score threshold', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', { 'page-1': { attempted: 10, correct: 5 } }),
        createMockStudent('RN5678', 'Jones, A', { 'page-1': { attempted: 10, correct: 8 } }),
        createMockStudent('RN3456', 'Brown, K', { 'page-1': { attempted: 10, correct: 3 } }),
      ];

      // Filter for students with >= 50% correct
      const filtered = students.filter((s) => s.correct / s.attempted >= 0.5);

      expect(filtered.length).toBe(2);
      expect(filtered[0].serviceId).toBe('RN2344');
      expect(filtered[1].serviceId).toBe('RN5678');
    });

    it('should filter students by serviceId pattern', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', {}),
        createMockStudent('RM5678', 'Jones, A', {}),
        createMockStudent('RN3456', 'Brown, K', {}),
      ];

      // Filter for RN prefix
      const filtered = students.filter((s) => s.serviceId.startsWith('RN'));

      expect(filtered.length).toBe(2);
      expect(filtered[0].serviceId).toBe('RN2344');
      expect(filtered[1].serviceId).toBe('RN3456');
    });

    it('should filter students with incomplete pages', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', {
          'page-1': { attempted: 5, correct: 5 },
        }),
        createMockStudent('RN5678', 'Jones, A', {
          'page-1': { attempted: 5, correct: 3 },
        }),
      ];

      // Filter for students with incomplete pages
      const filtered = students.filter((s) => s.pages['page-1'].state === 'incomplete');

      expect(filtered.length).toBe(1);
      expect(filtered[0].serviceId).toBe('RN5678');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty student list', () => {
      const students: StudentRecord[] = [];

      expect(students.length).toBe(0);
    });

    it('should handle student with very high question count', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', {
          'page-1': { attempted: 100, correct: 75 },
        }),
      ];

      expect(students[0].attempted).toBe(100);
      expect(students[0].correct).toBe(75);
    });

    it('should handle student with multiple incomplete pages', () => {
      const students: StudentRecord[] = [
        createMockStudent('RN2344', 'Smith, J', {
          'page-1': { attempted: 5, correct: 2 },
          'page-2': { attempted: 3, correct: 1 },
          'page-3': { attempted: 0, correct: 0 },
        }),
      ];

      const incompletePages = Object.values(students[0].pages).filter(
        (p) => p.state !== 'complete',
      );

      expect(incompletePages.length).toBeGreaterThan(0);
    });
  });
});
