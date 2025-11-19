/**
 * Unit tests for date formatting utilities
 */

import { describe, it, expect } from 'vitest';
import { formatTimestamp, formatStoredTimestamp, getCurrentTimestamp } from '../../../src/utils/date-helpers.js';

describe('Date Helpers', () => {
  describe('formatTimestamp() - display format', () => {
    it('should format date in "Nov 19 14:23" format with 24-hour time (FR-007)', () => {
      const date = new Date('2024-11-19T14:23:45Z');
      const result = formatTimestamp(date, 'display');

      // Should be "Nov 19 14:23" (24-hour format)
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2} \d{2}:\d{2}$/);
      expect(result).toContain('Nov');
      expect(result).toContain('19');
    });

    it('should use 24-hour time format (not 12-hour with AM/PM)', () => {
      // 2 PM should be "14", not "2 PM"
      const afternoon = new Date('2024-11-19T14:00:00Z');
      const result = formatTimestamp(afternoon, 'display');

      expect(result).not.toMatch(/AM|PM/);
      expect(result).toMatch(/14:/);
    });

    it('should pad hours and minutes with leading zeros', () => {
      // 9:05 should be "09:05", not "9:5"
      const date = new Date('2024-11-19T09:05:00Z');
      const result = formatTimestamp(date, 'display');

      expect(result).toMatch(/09:05/);
    });

    it('should handle midnight (00:00) correctly', () => {
      const midnight = new Date('2024-11-19T00:00:00Z');
      const result = formatTimestamp(midnight, 'display');

      expect(result).toMatch(/00:00/);
    });

    it('should handle ISO string input', () => {
      const isoString = '2024-11-19T14:23:45.123Z';
      const result = formatTimestamp(isoString, 'display');

      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2} \d{2}:\d{2}$/);
    });

    it('should handle invalid date gracefully', () => {
      const result = formatTimestamp('invalid-date', 'display');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('formatTimestamp() - CSV format', () => {
    it('should format date in ISO 8601 format for CSV export (FR-007)', () => {
      const date = new Date('2024-11-19T14:23:45.123Z');
      const result = formatTimestamp(date, 'csv');

      // Should be full ISO 8601: "2024-11-19T14:23:45.123Z"
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result).toBe('2024-11-19T14:23:45.123Z');
    });

    it('should preserve milliseconds in CSV format', () => {
      const date = new Date('2024-11-19T14:23:45.789Z');
      const result = formatTimestamp(date, 'csv');

      expect(result).toContain('.789Z');
    });

    it('should handle ISO string input for CSV', () => {
      const isoString = '2024-11-19T14:23:45.123Z';
      const result = formatTimestamp(isoString, 'csv');

      expect(result).toBe(isoString);
    });
  });

  describe('formatStoredTimestamp()', () => {
    it('should convert stored ISO string to display format', () => {
      const stored = '2024-11-19T14:23:45.123Z';
      const result = formatStoredTimestamp(stored);

      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2} \d{2}:\d{2}$/);
      expect(result).not.toContain('Z');
      expect(result).not.toContain('T');
    });

    it('should be equivalent to formatTimestamp(date, "display")', () => {
      const stored = '2024-11-19T14:23:45.123Z';
      const viaHelper = formatStoredTimestamp(stored);
      const viaFormat = formatTimestamp(stored, 'display');

      expect(viaHelper).toBe(viaFormat);
    });
  });

  describe('getCurrentTimestamp()', () => {
    it('should return valid ISO 8601 timestamp', () => {
      const result = getCurrentTimestamp();

      // Should match ISO 8601 format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return a timestamp close to current time', () => {
      const before = Date.now();
      const result = getCurrentTimestamp();
      const after = Date.now();

      const timestamp = new Date(result).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should be parseable by Date constructor', () => {
      const result = getCurrentTimestamp();
      const parsed = new Date(result);

      expect(isNaN(parsed.getTime())).toBe(false);
    });
  });

  describe('Timestamp consistency', () => {
    it('should produce consistent results for same input', () => {
      const date = new Date('2024-11-19T14:23:45.123Z');
      const result1 = formatTimestamp(date, 'display');
      const result2 = formatTimestamp(date, 'display');

      expect(result1).toBe(result2);
    });

    it('should handle timezone conversion consistently', () => {
      // All timestamps should be in UTC/local time consistently
      const utc = new Date('2024-11-19T14:23:45.123Z');
      const result = formatTimestamp(utc, 'display');

      // Result should be deterministic for same input
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });
});
