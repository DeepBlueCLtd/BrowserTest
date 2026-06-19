/**
 * Unit tests for the pure analysis-display helpers (T037).
 *
 * Covers grouping student entries by cell (FR-012) and descending-timestamp
 * ordering, moved out of analysis-table.ts into services/analysis-display.ts.
 */

import { describe, it, expect } from 'vitest';
import {
  groupEntriesByCell,
  sortByTimestamp,
  type CellEntry,
} from '../../src/services/analysis-display.js';
import type { StudentRecord } from '../../src/types/contracts.js';

function student(
  serviceId: string,
  cells: Record<string, string>,
  lastEdited: string,
): StudentRecord {
  return {
    schema: 2,
    docId: '',
    release: '06-2026',
    serviceId,
    name: `Name ${serviceId}`,
    attempted: 0,
    correct: 0,
    updated: lastEdited,
    pages: {
      'page-1': {
        answers: [],
        state: 'incomplete',
        analysis: { tableId: 't1', cells, lastEdited },
      },
    },
  };
}

describe('analysis-display', () => {
  describe('groupEntriesByCell', () => {
    it('groups each student cell value under its cell key', () => {
      const students = [
        student('A1', { 'R1C1#f:aaa': 'alpha' }, '2026-06-01T10:00:00Z'),
        student('A2', { 'R1C1#f:aaa': 'beta', 'R2C1#f:bbb': 'gamma' }, '2026-06-01T11:00:00Z'),
      ];

      const grouped = groupEntriesByCell(students, 'page-1');

      expect(grouped['R1C1#f:aaa']).toHaveLength(2);
      expect(grouped['R2C1#f:bbb']).toHaveLength(1);
      expect(grouped['R2C1#f:bbb']?.[0]?.content).toBe('gamma');
    });

    it('skips students with no analysis for the page', () => {
      const students = [student('A1', { 'R1C1#f:aaa': 'alpha' }, '2026-06-01T10:00:00Z')];
      const grouped = groupEntriesByCell(students, 'page-other');
      expect(Object.keys(grouped)).toHaveLength(0);
    });
  });

  describe('sortByTimestamp', () => {
    it('orders entries newest first without mutating the input', () => {
      const entries: CellEntry[] = [
        { serviceId: 'A1', name: 'A', content: 'old', timestamp: '2026-06-01T09:00:00Z' },
        { serviceId: 'A2', name: 'B', content: 'new', timestamp: '2026-06-01T12:00:00Z' },
      ];
      const sorted = sortByTimestamp(entries);
      expect(sorted.map((e) => e.content)).toEqual(['new', 'old']);
      expect(entries.map((e) => e.content)).toEqual(['old', 'new']); // input untouched
    });
  });
});
