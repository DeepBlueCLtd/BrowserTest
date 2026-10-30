/**
 * Tests for calculation-helpers.ts
 *
 * Feature: 007-lit-component-refactor
 * TDD: These tests are written FIRST, before implementation.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateProgressIndicator,
  formatProgress,
  calculatePercentage,
  recalculateTotalsFromPages,
  isSessionExpired,
  maskServiceId,
} from '../../../src/utils/calculation-helpers';
import type { PageData, PageId } from '../../../src/types/contracts';

describe('calculation-helpers', () => {
  describe('calculateProgressIndicator (SRD 013 SCO-02, SCO-03)', () => {
    it('is red until something is answered', () => {
      expect(calculateProgressIndicator(0, 0, 40)).toBe('red');
      expect(calculateProgressIndicator(0, 0)).toBe('red');
    });

    it('is green only when the known total is all correct', () => {
      expect(calculateProgressIndicator(40, 40, 40)).toBe('green');
      expect(calculateProgressIndicator(40, 39, 40)).toBe('amber');
    });

    it('stays amber when the total is unknown, however many are correct', () => {
      // One right answer used to show green and 100%
      expect(calculateProgressIndicator(1, 1)).toBe('amber');
    });

    it('is amber when answers are started but wrong', () => {
      expect(calculateProgressIndicator(3, 0, 40)).toBe('amber');
    });
  });

  describe('formatProgress', () => {
    it('states answered and correct separately, with the total when known', () => {
      expect(formatProgress(12, 9, 40)).toBe('12 of 40 answered · 9 correct');
      expect(formatProgress(12, 9)).toBe('12 answered · 9 correct');
    });
  });

  describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculatePercentage(7, 10)).toBe(70);
    });

    it('returns 0 when attempted is 0', () => {
      expect(calculatePercentage(5, 0)).toBe(0);
    });

    it('returns 100 for all correct', () => {
      expect(calculatePercentage(10, 10)).toBe(100);
    });

    it('returns 0 for none correct', () => {
      expect(calculatePercentage(0, 10)).toBe(0);
    });

    it('rounds to nearest integer', () => {
      expect(calculatePercentage(1, 3)).toBe(33);
    });

    it('rounds up correctly', () => {
      expect(calculatePercentage(2, 3)).toBe(67);
    });

    it('handles 0 correct with 0 attempted', () => {
      expect(calculatePercentage(0, 0)).toBe(0);
    });
  });

  describe('recalculateTotalsFromPages', () => {
    it('returns zero totals for empty pages', () => {
      const pages: Record<PageId, PageData> = {};
      const result = recalculateTotalsFromPages(pages);
      expect(result).toEqual({ attempted: 0, correct: 0 });
    });

    it('calculates totals from single page', () => {
      const pages: Record<PageId, PageData> = {
        'page-1': {
          state: 'incomplete',
          answers: [
            { answer: '1', success: true, timestamp: '2025-01-01T00:00:00Z' },
            { answer: '2', success: false, timestamp: '2025-01-01T00:00:01Z' },
          ],
        },
      };
      const result = recalculateTotalsFromPages(pages);
      expect(result).toEqual({ attempted: 2, correct: 1 });
    });

    it('calculates totals from multiple pages', () => {
      const pages: Record<PageId, PageData> = {
        'page-1': {
          state: 'complete',
          answers: [
            { answer: '1', success: true, timestamp: '2025-01-01T00:00:00Z' },
            { answer: '2', success: true, timestamp: '2025-01-01T00:00:01Z' },
          ],
        },
        'page-2': {
          state: 'incomplete',
          answers: [{ answer: '3', success: false, timestamp: '2025-01-01T00:00:02Z' }],
        },
      };
      const result = recalculateTotalsFromPages(pages);
      expect(result).toEqual({ attempted: 3, correct: 2 });
    });

    it('handles pages with empty answers array', () => {
      const pages: Record<PageId, PageData> = {
        'page-1': {
          state: 'unstarted',
          answers: [],
        },
      };
      const result = recalculateTotalsFromPages(pages);
      expect(result).toEqual({ attempted: 0, correct: 0 });
    });

    it('excludes empty answer strings from count', () => {
      const pages: Record<PageId, PageData> = {
        'page-1': {
          state: 'incomplete',
          answers: [
            { answer: '1', success: true, timestamp: '2025-01-01T00:00:00Z' },
            { answer: '', success: false, timestamp: '2025-01-01T00:00:01Z' },
            { answer: '  ', success: false, timestamp: '2025-01-01T00:00:02Z' },
          ],
        },
      };
      const result = recalculateTotalsFromPages(pages);
      expect(result).toEqual({ attempted: 1, correct: 1 });
    });
  });

  describe('isSessionExpired', () => {
    it('returns true when session has expired', () => {
      const expiresAt = '2025-01-01T00:00:00Z';
      const now = new Date('2025-01-02T00:00:00Z');
      expect(isSessionExpired(expiresAt, now)).toBe(true);
    });

    it('returns false when session has not expired', () => {
      const expiresAt = '2025-01-02T00:00:00Z';
      const now = new Date('2025-01-01T00:00:00Z');
      expect(isSessionExpired(expiresAt, now)).toBe(false);
    });

    it('returns true when exactly at expiry time', () => {
      const expiresAt = '2025-01-01T00:00:00Z';
      const now = new Date('2025-01-01T00:00:00Z');
      expect(isSessionExpired(expiresAt, now)).toBe(true);
    });

    it('returns false one millisecond before expiry', () => {
      const expiresAt = '2025-01-01T00:00:00.000Z';
      const now = new Date('2024-12-31T23:59:59.999Z');
      expect(isSessionExpired(expiresAt, now)).toBe(false);
    });

    it('handles invalid date string gracefully', () => {
      expect(isSessionExpired('invalid-date', new Date())).toBe(true);
    });
  });

  describe('maskServiceId', () => {
    it('returns last 4 characters with ellipsis prefix', () => {
      expect(maskServiceId('ABCD1234')).toBe('...1234');
    });

    it('returns full ID when 4 or fewer characters', () => {
      expect(maskServiceId('AB12')).toBe('AB12');
    });

    it('returns full ID when exactly 4 characters', () => {
      expect(maskServiceId('1234')).toBe('1234');
    });

    it('handles empty string', () => {
      expect(maskServiceId('')).toBe('');
    });

    it('handles custom visible digits count', () => {
      expect(maskServiceId('ABCD1234', 2)).toBe('...34');
    });

    it('handles visible digits greater than ID length', () => {
      expect(maskServiceId('AB', 4)).toBe('AB');
    });

    it('handles 0 visible digits', () => {
      expect(maskServiceId('ABCD1234', 0)).toBe('...');
    });
  });
});
