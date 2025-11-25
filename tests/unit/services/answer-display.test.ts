/**
 * Tests for answer-display.ts service
 *
 * Feature: 007-lit-component-refactor
 * TDD: These tests are written FIRST, before implementation.
 */
import { describe, it, expect } from 'vitest';
import { formatStudentAnswersForDisplay } from '../../../src/services/answer-display';
import type { StudentRecord, PageId } from '../../../src/types/contracts';

describe('answer-display service', () => {
  describe('formatStudentAnswersForDisplay', () => {
    const pageId: PageId = 'quiz-page-1';
    const questionIndex = 0;

    it('returns empty array when no students', () => {
      const students: StudentRecord[] = [];

      const result = formatStudentAnswersForDisplay(students, pageId, questionIndex);

      expect(result).toEqual([]);
    });

    it('formats student answer with masked service ID', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-1',
          release: '2025-01',
          serviceId: 'ABCD1234',
          name: 'John Doe',
          attempted: 1,
          correct: 1,
          updated: '2025-01-01T00:00:00Z',
          pages: {
            [pageId]: {
              state: 'complete',
              answers: [
                { answer: '2', success: true, timestamp: '2025-01-01T12:30:00Z' },
              ],
            },
          },
        },
      ];

      const result = formatStudentAnswersForDisplay(students, pageId, questionIndex);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('John Doe');
      expect(result[0]!.maskedServiceId).toBe('1234');
      expect(result[0]!.answer).toBe('2');
      expect(result[0]!.success).toBe(true);
    });

    it('formats timestamp for display (24-hour format)', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-1',
          release: '2025-01',
          serviceId: 'TEST1234',
          name: 'Jane',
          attempted: 1,
          correct: 0,
          updated: '2025-01-01T00:00:00Z',
          pages: {
            [pageId]: {
              state: 'incomplete',
              answers: [
                { answer: 'wrong', success: false, timestamp: '2025-01-15T14:30:45Z' },
              ],
            },
          },
        },
      ];

      const result = formatStudentAnswersForDisplay(students, pageId, questionIndex);

      // Should include formatted timestamp (implementation will use formatStoredTimestamp)
      expect(result[0]!.formattedTimestamp).toMatch(/\d{1,2}:\d{2}/);
    });

    it('skips students without page data', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-1',
          release: '2025-01',
          serviceId: 'TEST1234',
          name: 'No Page Data',
          attempted: 0,
          correct: 0,
          updated: '2025-01-01T00:00:00Z',
          pages: {},
        },
      ];

      const result = formatStudentAnswersForDisplay(students, pageId, questionIndex);

      expect(result).toEqual([]);
    });

    it('skips students without answers array', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-1',
          release: '2025-01',
          serviceId: 'TEST1234',
          name: 'No Answers',
          attempted: 0,
          correct: 0,
          updated: '2025-01-01T00:00:00Z',
          pages: {
            [pageId]: {
              state: 'unstarted',
              answers: [],
            },
          },
        },
      ];

      const result = formatStudentAnswersForDisplay(students, pageId, questionIndex);

      expect(result).toEqual([]);
    });

    it('skips students without answer at question index', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-1',
          release: '2025-01',
          serviceId: 'TEST1234',
          name: 'Wrong Index',
          attempted: 1,
          correct: 1,
          updated: '2025-01-01T00:00:00Z',
          pages: {
            [pageId]: {
              state: 'incomplete',
              answers: [
                { answer: '1', success: true, timestamp: '2025-01-01T00:00:00Z' },
              ],
            },
          },
        },
      ];

      // Question index 5 - out of bounds
      const result = formatStudentAnswersForDisplay(students, pageId, 5);

      expect(result).toEqual([]);
    });

    it('handles multiple students', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-1',
          release: '2025-01',
          serviceId: 'AAAA1111',
          name: 'Alice',
          attempted: 1,
          correct: 1,
          updated: '2025-01-01T00:00:00Z',
          pages: {
            [pageId]: {
              state: 'complete',
              answers: [
                { answer: '1', success: true, timestamp: '2025-01-01T10:00:00Z' },
              ],
            },
          },
        },
        {
          schema: 1,
          docId: 'doc-2',
          release: '2025-01',
          serviceId: 'BBBB2222',
          name: 'Bob',
          attempted: 1,
          correct: 0,
          updated: '2025-01-01T00:00:00Z',
          pages: {
            [pageId]: {
              state: 'incomplete',
              answers: [
                { answer: '3', success: false, timestamp: '2025-01-01T11:00:00Z' },
              ],
            },
          },
        },
      ];

      const result = formatStudentAnswersForDisplay(students, pageId, questionIndex);

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe('Alice');
      expect(result[0]!.success).toBe(true);
      expect(result[1]!.name).toBe('Bob');
      expect(result[1]!.success).toBe(false);
    });

    it('returns CSS class based on success', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-1',
          release: '2025-01',
          serviceId: 'TEST1234',
          name: 'Correct',
          attempted: 1,
          correct: 1,
          updated: '2025-01-01T00:00:00Z',
          pages: {
            [pageId]: {
              state: 'complete',
              answers: [
                { answer: '2', success: true, timestamp: '2025-01-01T00:00:00Z' },
              ],
            },
          },
        },
        {
          schema: 1,
          docId: 'doc-2',
          release: '2025-01',
          serviceId: 'TEST5678',
          name: 'Incorrect',
          attempted: 1,
          correct: 0,
          updated: '2025-01-01T00:00:00Z',
          pages: {
            [pageId]: {
              state: 'incomplete',
              answers: [
                { answer: '1', success: false, timestamp: '2025-01-01T00:00:00Z' },
              ],
            },
          },
        },
      ];

      const result = formatStudentAnswersForDisplay(students, pageId, questionIndex);

      expect(result[0]!.cssClass).toBe('qd-correct');
      expect(result[1]!.cssClass).toBe('qd-incorrect');
    });
  });
});
