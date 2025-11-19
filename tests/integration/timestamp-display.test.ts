/**
 * Integration tests for timestamp display consistency
 * Verifies timestamps are formatted consistently across all components
 */

import { describe, it, expect } from 'vitest';
import { formatTimestamp, formatStoredTimestamp } from '../../src/utils/date-helpers.js';

describe('Timestamp Display Consistency (FR-007)', () => {
  const testTimestamp = '2024-11-19T14:23:45.123Z';
  const expectedDisplay = 'Nov 19 14:23'; // 24-hour format

  it('should use consistent format across all display contexts', () => {
    // All these should produce the same format
    const fromDate = formatTimestamp(new Date(testTimestamp), 'display');
    const fromString = formatTimestamp(testTimestamp, 'display');
    const fromStored = formatStoredTimestamp(testTimestamp);

    expect(fromDate).toBe(expectedDisplay);
    expect(fromString).toBe(expectedDisplay);
    expect(fromStored).toBe(expectedDisplay);
  });

  it('should always use 24-hour time format (never 12-hour AM/PM)', () => {
    const timestamps = [
      '2024-11-19T00:00:00Z', // Midnight
      '2024-11-19T09:30:00Z', // Morning
      '2024-11-19T12:00:00Z', // Noon
      '2024-11-19T14:30:00Z', // Afternoon
      '2024-11-19T23:59:00Z', // Late night
    ];

    timestamps.forEach((ts) => {
      const result = formatTimestamp(ts, 'display');

      // Should never contain AM/PM
      expect(result).not.toMatch(/AM|PM/i);

      // Should always have HH:MM format (24-hour)
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  it('should use ISO 8601 format for CSV export consistently', () => {
    const csvFormat = formatTimestamp(testTimestamp, 'csv');

    // Should be full ISO 8601
    expect(csvFormat).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(csvFormat).toBe(testTimestamp);
  });

  it('should handle array of timestamps consistently', () => {
    const timestamps = [
      '2024-11-19T10:00:00Z',
      '2024-11-19T11:30:00Z',
      '2024-11-19T14:45:00Z',
    ];

    const formatted = timestamps.map((ts) => formatTimestamp(ts, 'display'));

    // All should match the expected format
    formatted.forEach((result) => {
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2} \d{2}:\d{2}$/);
    });

    // Should be sorted if timestamps are sorted
    expect(formatted[0]).toContain('10:00');
    expect(formatted[1]).toContain('11:30');
    expect(formatted[2]).toContain('14:45');
  });

  describe('Student answer timestamps', () => {
    it('should format answer timestamps for instructor view', () => {
      // Simulate answer record from storage
      const answerRecord = {
        answer: '42',
        success: true,
        timestamp: '2024-11-19T14:23:45.123Z',
      };

      const displayTime = formatStoredTimestamp(answerRecord.timestamp);

      // Should match expected 24-hour format
      expect(displayTime).toBe('Nov 19 14:23');
      expect(displayTime).not.toMatch(/AM|PM/);
    });

    it('should format multiple answer timestamps in chronological order', () => {
      const answers = [
        { timestamp: '2024-11-19T10:00:00Z' },
        { timestamp: '2024-11-19T10:15:00Z' },
        { timestamp: '2024-11-19T10:30:00Z' },
      ];

      const formatted = answers.map((a) => formatStoredTimestamp(a.timestamp));

      expect(formatted[0]).toContain('10:00');
      expect(formatted[1]).toContain('10:15');
      expect(formatted[2]).toContain('10:30');
    });
  });

  describe('CSV export timestamps', () => {
    it('should preserve full precision for CSV export', () => {
      const timestampWithMs = '2024-11-19T14:23:45.789Z';
      const csvFormat = formatTimestamp(timestampWithMs, 'csv');

      // Should include milliseconds
      expect(csvFormat).toContain('.789Z');
      expect(csvFormat).toBe(timestampWithMs);
    });

    it('should be Excel/spreadsheet compatible', () => {
      const timestamp = '2024-11-19T14:23:45.123Z';
      const csvFormat = formatTimestamp(timestamp, 'csv');

      // ISO 8601 is natively supported by Excel and Google Sheets
      expect(csvFormat).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(csvFormat.endsWith('Z')).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid timestamps gracefully', () => {
      const invalid = 'not-a-timestamp';
      const result = formatTimestamp(invalid, 'display');

      expect(result).toBe('Invalid Date');
    });

    it('should handle null/undefined gracefully', () => {
      // TypeScript would catch this, but handle runtime cases
      const resultNull = formatTimestamp(null as unknown as string, 'display');
      const resultUndef = formatTimestamp(undefined as unknown as string, 'display');

      expect(resultNull).toBe('Invalid Date');
      expect(resultUndef).toBe('Invalid Date');
    });
  });
});
