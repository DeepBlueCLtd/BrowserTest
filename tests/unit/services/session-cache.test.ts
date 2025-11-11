/**
 * Session Cache Rebuilding Tests
 *
 * Tests for building session cache from StudentRecord data.
 * The cache provides quick access to page states and totals without querying IndexedDB.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { StudentRecord, SessionCache } from '../../../src/types/contracts';
import {
  buildCacheFromRecord,
  buildPageCache,
  updateCacheWithAnswer,
} from '../../../src/services/session';

describe('Session Cache Rebuilding', () => {
  describe('buildCacheFromRecord()', () => {
    it('should build cache from empty student record', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      const cache = buildCacheFromRecord(record);

      expect(cache).toEqual({
        totals: {
          answered: 0,
          correct: 0,
        },
        pages: {},
      });
    });

    it('should calculate totals from student record pages', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 4,
        correct: 3,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            answers: [
              { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
              { answer: 'b', success: false, timestamp: '2025-01-15T10:01:00.000Z' },
            ],
            state: 'incomplete',
          },
          'page-2': {
            answers: [
              { answer: 'c', success: true, timestamp: '2025-01-15T10:02:00.000Z' },
              { answer: 'd', success: true, timestamp: '2025-01-15T10:03:00.000Z' },
            ],
            state: 'complete',
          },
        },
      };

      const cache = buildCacheFromRecord(record);

      expect(cache.totals.answered).toBe(4);
      expect(cache.totals.correct).toBe(3);
    });

    it('should build cache entries for all pages', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 5,
        correct: 3,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            answers: [
              { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
              { answer: 'b', success: false, timestamp: '2025-01-15T10:01:00.000Z' },
            ],
            state: 'incomplete',
          },
          'page-2': {
            answers: [
              { answer: 'c', success: true, timestamp: '2025-01-15T10:02:00.000Z' },
              { answer: 'd', success: true, timestamp: '2025-01-15T10:03:00.000Z' },
            ],
            state: 'complete',
          },
        },
      };

      const cache = buildCacheFromRecord(record);

      expect(cache.pages).toHaveProperty('page-1');
      expect(cache.pages).toHaveProperty('page-2');
      expect(Object.keys(cache.pages)).toHaveLength(2);
    });

    it('should set correct state for each page', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 2,
        correct: 2,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            answers: [],
            state: 'unstarted',
          },
          'page-2': {
            answers: [
              { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
            ],
            state: 'incomplete',
          },
          'page-3': {
            answers: [
              { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
              { answer: 'b', success: true, timestamp: '2025-01-15T10:01:00.000Z' },
            ],
            state: 'complete',
          },
        },
      };

      const cache = buildCacheFromRecord(record);

      expect(cache.pages['page-1'].state).toBe('unstarted');
      expect(cache.pages['page-2'].state).toBe('incomplete');
      expect(cache.pages['page-3'].state).toBe('complete');
    });

    it('should count answered and correct per page', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 4,
        correct: 2,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            answers: [
              { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
              { answer: 'b', success: false, timestamp: '2025-01-15T10:01:00.000Z' },
              { answer: 'c', success: true, timestamp: '2025-01-15T10:02:00.000Z' },
              { answer: 'd', success: false, timestamp: '2025-01-15T10:03:00.000Z' },
            ],
            state: 'incomplete',
          },
        },
      };

      const cache = buildCacheFromRecord(record);

      expect(cache.pages['page-1'].answered).toBe(4);
      expect(cache.pages['page-1'].correct).toBe(2);
    });

    it('should include last update timestamp', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 2,
        correct: 1,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            answers: [
              { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
              { answer: 'b', success: false, timestamp: '2025-01-15T10:05:00.000Z' },
            ],
            state: 'incomplete',
            lastAttempted: '2025-01-15T10:05:00.000Z',
          },
        },
      };

      const cache = buildCacheFromRecord(record);

      expect(cache.pages['page-1'].last).toBe('2025-01-15T10:05:00.000Z');
    });
  });

  describe('buildPageCache()', () => {
    it('should build cache for unstarted page', () => {
      const pageData = {
        answers: [],
        state: 'unstarted' as const,
      };

      const cache = buildPageCache('page-1', pageData);

      expect(cache).toEqual({
        state: 'unstarted',
        answered: 0,
        correct: 0,
        last: undefined,
      });
    });

    it('should count answered questions', () => {
      const pageData = {
        answers: [
          { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
          { answer: 'b', success: false, timestamp: '2025-01-15T10:01:00.000Z' },
          { answer: 'c', success: true, timestamp: '2025-01-15T10:02:00.000Z' },
        ],
        state: 'incomplete' as const,
      };

      const cache = buildPageCache('page-1', pageData);

      expect(cache.answered).toBe(3);
    });

    it('should count correct answers', () => {
      const pageData = {
        answers: [
          { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
          { answer: 'b', success: false, timestamp: '2025-01-15T10:01:00.000Z' },
          { answer: 'c', success: true, timestamp: '2025-01-15T10:02:00.000Z' },
        ],
        state: 'incomplete' as const,
      };

      const cache = buildPageCache('page-1', pageData);

      expect(cache.correct).toBe(2);
    });

    it('should include last attempted timestamp', () => {
      const pageData = {
        answers: [
          { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
        ],
        state: 'incomplete' as const,
        lastAttempted: '2025-01-15T10:00:00.000Z',
      };

      const cache = buildPageCache('page-1', pageData);

      expect(cache.last).toBe('2025-01-15T10:00:00.000Z');
    });

    it('should preserve completion state', () => {
      const pageData = {
        answers: [
          { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
          { answer: 'b', success: true, timestamp: '2025-01-15T10:01:00.000Z' },
        ],
        state: 'complete' as const,
      };

      const cache = buildPageCache('page-1', pageData);

      expect(cache.state).toBe('complete');
    });
  });

  describe('updateCacheWithAnswer()', () => {
    let cache: SessionCache;

    beforeEach(() => {
      cache = {
        totals: {
          answered: 2,
          correct: 1,
        },
        pages: {
          'page-1': {
            state: 'incomplete',
            answered: 2,
            correct: 1,
            last: '2025-01-15T10:00:00.000Z',
          },
        },
      };
    });

    it('should increment answered count', () => {
      const updated = updateCacheWithAnswer(cache, 'page-1', true);

      expect(updated.pages['page-1'].answered).toBe(3);
      expect(updated.totals.answered).toBe(3);
    });

    it('should increment correct count for correct answer', () => {
      const updated = updateCacheWithAnswer(cache, 'page-1', true);

      expect(updated.pages['page-1'].correct).toBe(2);
      expect(updated.totals.correct).toBe(2);
    });

    it('should not increment correct count for incorrect answer', () => {
      const updated = updateCacheWithAnswer(cache, 'page-1', false);

      expect(updated.pages['page-1'].correct).toBe(1);
      expect(updated.totals.correct).toBe(1);
    });

    it('should update totals', () => {
      const updated = updateCacheWithAnswer(cache, 'page-1', true);

      expect(updated.totals.answered).toBe(3);
      expect(updated.totals.correct).toBe(2);
    });

    it('should create page entry if not exists', () => {
      const updated = updateCacheWithAnswer(cache, 'page-2', true);

      expect(updated.pages['page-2']).toBeDefined();
      expect(updated.pages['page-2'].answered).toBe(1);
      expect(updated.pages['page-2'].correct).toBe(1);
    });

    it('should update last timestamp', () => {
      const before = new Date('2025-01-15T10:00:00.000Z');
      const updated = updateCacheWithAnswer(cache, 'page-1', true);

      expect(updated.pages['page-1'].last).toBeDefined();
      expect(new Date(updated.pages['page-1'].last!).getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('Cache Consistency', () => {
    it('should match totals with sum of page values', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 6,
        correct: 4,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            answers: [
              { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
              { answer: 'b', success: false, timestamp: '2025-01-15T10:01:00.000Z' },
            ],
            state: 'incomplete',
          },
          'page-2': {
            answers: [
              { answer: 'a', success: true, timestamp: '2025-01-15T10:02:00.000Z' },
              { answer: 'b', success: true, timestamp: '2025-01-15T10:03:00.000Z' },
            ],
            state: 'complete',
          },
          'page-3': {
            answers: [
              { answer: 'a', success: true, timestamp: '2025-01-15T10:04:00.000Z' },
              { answer: 'b', success: false, timestamp: '2025-01-15T10:05:00.000Z' },
            ],
            state: 'incomplete',
          },
        },
      };

      const cache = buildCacheFromRecord(record);

      // Sum of page values should match totals
      const sumAnswered = Object.values(cache.pages).reduce((sum, p) => sum + p.answered, 0);
      const sumCorrect = Object.values(cache.pages).reduce((sum, p) => sum + p.correct, 0);

      expect(cache.totals.answered).toBe(sumAnswered);
      expect(cache.totals.correct).toBe(sumCorrect);
      expect(cache.totals.answered).toBe(6);
      expect(cache.totals.correct).toBe(4);
    });

    it('should handle empty pages object', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      const cache = buildCacheFromRecord(record);

      expect(cache.totals.answered).toBe(0);
      expect(cache.totals.correct).toBe(0);
      expect(cache.pages).toEqual({});
    });
  });
});
