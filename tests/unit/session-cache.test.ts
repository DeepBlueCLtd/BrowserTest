/**
 * Characterization tests for session cache math (T025).
 *
 * Pure cache-building helpers extracted from session.ts into session-cache.ts.
 * These capture the existing behavior of buildCacheFromRecord, buildPageCache,
 * and updateCacheWithAnswer before/after the extraction.
 */

import { describe, it, expect } from 'vitest';
import {
  buildCacheFromRecord,
  buildPageCache,
  updateCacheWithAnswer,
} from '../../src/services/session-cache.js';
import type { StudentRecord, SessionCache, PageData } from '../../src/types/contracts.js';

describe('Cache Building Utilities', () => {
  describe('buildCacheFromRecord()', () => {
    it('should build empty cache for record with no pages', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Alice',
        attempted: 0,
        correct: 0,
        updated: '2024-11-16T10:00:00Z',
        pages: {},
      };

      const cache = buildCacheFromRecord(record);

      expect(cache.totals.answered).toBe(0);
      expect(cache.totals.correct).toBe(0);
      expect(Object.keys(cache.pages)).toHaveLength(0);
    });

    it('should build cache with correct totals for single page', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Alice',
        attempted: 3,
        correct: 2,
        updated: '2024-11-16T10:00:00Z',
        pages: {
          'page-1': {
            state: 'complete',
            answers: [
              { answer: 'a', success: true, timestamp: '2024-11-16T10:00:00Z' },
              { answer: 'b', success: false, timestamp: '2024-11-16T10:01:00Z' },
              { answer: 'c', success: true, timestamp: '2024-11-16T10:02:00Z' },
            ],
            lastAttempted: '2024-11-16T10:02:00Z',
          },
        },
      };

      const cache = buildCacheFromRecord(record);

      expect(cache.totals.answered).toBe(3);
      expect(cache.totals.correct).toBe(2);
      expect(cache.pages['page-1']).toBeDefined();
      expect(cache.pages['page-1']?.answered).toBe(3);
      expect(cache.pages['page-1']?.correct).toBe(2);
    });

    it('should build cache with correct totals for multiple pages', () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Alice',
        attempted: 5,
        correct: 4,
        updated: '2024-11-16T10:00:00Z',
        pages: {
          'page-1': {
            state: 'complete',
            answers: [
              { answer: 'a', success: true, timestamp: '2024-11-16T10:00:00Z' },
              { answer: 'b', success: true, timestamp: '2024-11-16T10:01:00Z' },
            ],
            lastAttempted: '2024-11-16T10:01:00Z',
          },
          'page-2': {
            state: 'incomplete',
            answers: [
              { answer: 'c', success: true, timestamp: '2024-11-16T10:05:00Z' },
              { answer: 'd', success: false, timestamp: '2024-11-16T10:06:00Z' },
              { answer: 'e', success: true, timestamp: '2024-11-16T10:07:00Z' },
            ],
            lastAttempted: '2024-11-16T10:07:00Z',
          },
        },
      };

      const cache = buildCacheFromRecord(record);

      expect(cache.totals.answered).toBe(5);
      expect(cache.totals.correct).toBe(4);
      expect(Object.keys(cache.pages)).toHaveLength(2);
    });
  });

  describe('buildPageCache()', () => {
    it('should build page cache with correct counts', () => {
      const pageData: PageData = {
        state: 'complete',
        answers: [
          { answer: 'a', success: true, timestamp: '2024-11-16T10:00:00Z' },
          { answer: 'b', success: false, timestamp: '2024-11-16T10:01:00Z' },
          { answer: 'c', success: true, timestamp: '2024-11-16T10:02:00Z' },
        ],
        lastAttempted: '2024-11-16T10:02:00Z',
      };

      const cache = buildPageCache('page-1', pageData);

      expect(cache.answered).toBe(3);
      expect(cache.correct).toBe(2);
      expect(cache.state).toBe('complete');
      expect(cache.last).toBe('2024-11-16T10:02:00Z');
    });

    it('should handle empty answers', () => {
      const pageData: PageData = {
        state: 'unstarted',
        answers: [],
      };

      const cache = buildPageCache('page-1', pageData);

      expect(cache.answered).toBe(0);
      expect(cache.correct).toBe(0);
      expect(cache.state).toBe('unstarted');
    });
  });

  describe('updateCacheWithAnswer()', () => {
    it('should increment answered count', () => {
      const cache: SessionCache = {
        totals: { total: 5, answered: 5, correct: 3 },
        pages: {
          'page-1': {
            state: 'incomplete',
            total: 5,
            answered: 2,
            correct: 1,
          },
        },
      };

      const updated = updateCacheWithAnswer(cache, 'page-1', true, 'complete');

      expect(updated.totals.answered).toBe(6);
      expect(updated.pages['page-1']?.answered).toBe(3);
    });

    it('should increment correct count for correct answer', () => {
      const cache: SessionCache = {
        totals: { total: 5, answered: 5, correct: 3 },
        pages: {
          'page-1': {
            state: 'incomplete',
            total: 5,
            answered: 2,
            correct: 1,
          },
        },
      };

      const updated = updateCacheWithAnswer(cache, 'page-1', true, 'complete');

      expect(updated.totals.correct).toBe(4);
      expect(updated.pages['page-1']?.correct).toBe(2);
    });

    it('should not increment correct count for incorrect answer', () => {
      const cache: SessionCache = {
        totals: { total: 5, answered: 5, correct: 3 },
        pages: {
          'page-1': {
            state: 'incomplete',
            total: 5,
            answered: 2,
            correct: 1,
          },
        },
      };

      const updated = updateCacheWithAnswer(cache, 'page-1', false, 'incomplete');

      expect(updated.totals.correct).toBe(3);
      expect(updated.pages['page-1']?.correct).toBe(1);
    });

    it('should update state', () => {
      const cache: SessionCache = {
        totals: { total: 5, answered: 5, correct: 3 },
        pages: {
          'page-1': {
            state: 'incomplete',
            total: 5,
            answered: 2,
            correct: 1,
          },
        },
      };

      const updated = updateCacheWithAnswer(cache, 'page-1', true, 'complete');

      expect(updated.pages['page-1']?.state).toBe('complete');
    });

    it('should create new page entry if it does not exist', () => {
      const cache: SessionCache = {
        totals: { total: 0, answered: 0, correct: 0 },
        pages: {},
      };

      const updated = updateCacheWithAnswer(cache, 'page-new', true, 'incomplete');

      expect(updated.pages['page-new']).toBeDefined();
      expect(updated.pages['page-new']?.answered).toBe(1);
      expect(updated.pages['page-new']?.correct).toBe(1);
    });

    it('should not mutate original cache', () => {
      const cache: SessionCache = {
        totals: { total: 5, answered: 5, correct: 3 },
        pages: {
          'page-1': {
            state: 'incomplete',
            total: 5,
            answered: 2,
            correct: 1,
          },
        },
      };

      const original = JSON.parse(JSON.stringify(cache)) as SessionCache;
      updateCacheWithAnswer(cache, 'page-1', true, 'complete');

      expect(cache).toEqual(original);
    });
  });
});
