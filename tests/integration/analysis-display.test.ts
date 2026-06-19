/**
 * Integration tests for analysis table instructor display (T046)
 * Tests FR-012 (grouping by cell, timestamp sorting) and FR-013 (placeholder)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { StudentRecord, PageId } from '../../src/types/contracts.js';
import {
  groupEntriesByCell,
  sortByTimestamp,
  type CellEntry,
} from '../../src/services/analysis-display.js';
import { createStudentEntriesDisplay } from '../../src/enhancers/analysis-instructor-overlay.js';

describe('Analysis Table Instructor Display Integration (T046)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-11-19T15:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Full workflow: Multiple students with analysis data', () => {
    const pageId: PageId = 'analysis-page-1';

    // Create realistic student records
    const students: StudentRecord[] = [
      {
        schema: 1,
        docId: 'doc-test',
        release: 'TRV Autumn 2024',
        serviceId: 'RN1234',
        name: 'Alice Johnson',
        attempted: 5,
        correct: 4,
        updated: '2024-11-19T10:30:00Z',
        pages: {
          [pageId]: {
            state: 'incomplete',
            answers: [],
            analysis: {
              tableId: 'analysis-table-123',
              cells: {
                'R1C1#f:abc123': 'Alice thinks the connector should be type A',
                'R2C1#f:def456': 'The voltage tolerance is ±5%',
              },
              firstEdited: '2024-11-19T10:00:00Z',
              lastEdited: '2024-11-19T10:30:00Z',
            },
          },
        },
      },
      {
        schema: 1,
        docId: 'doc-test',
        release: 'TRV Autumn 2024',
        serviceId: 'RN5678',
        name: 'Bob Smith',
        attempted: 3,
        correct: 2,
        updated: '2024-11-19T14:00:00Z',
        pages: {
          [pageId]: {
            state: 'incomplete',
            answers: [],
            analysis: {
              tableId: 'analysis-table-123',
              cells: {
                'R1C1#f:abc123': 'Type B connector is better for this application',
                'R1C2#f:xyz789': 'Consider the temperature range -40 to +85C',
              },
              firstEdited: '2024-11-19T13:00:00Z',
              lastEdited: '2024-11-19T14:00:00Z',
            },
          },
        },
      },
      {
        schema: 1,
        docId: 'doc-test',
        release: 'TRV Autumn 2024',
        serviceId: 'RN9999',
        name: 'Carol Davis',
        attempted: 7,
        correct: 7,
        updated: '2024-11-19T12:00:00Z',
        pages: {
          [pageId]: {
            state: 'complete',
            answers: [],
            analysis: {
              tableId: 'analysis-table-123',
              cells: {
                'R1C1#f:abc123': 'Type C with gold plating for corrosion resistance',
              },
              firstEdited: '2024-11-19T11:45:00Z',
              lastEdited: '2024-11-19T12:00:00Z',
            },
          },
        },
      },
    ];

    it('should group entries by cell and sort by timestamp (newest first)', () => {
      // Group entries by cell
      const grouped = groupEntriesByCell(students, pageId);

      // Cell R1C1 should have 3 entries (Alice, Bob, Carol)
      const cell1Entries = grouped['R1C1#f:abc123'] || [];
      expect(cell1Entries).toHaveLength(3);

      // Sort entries
      const sortedCell1 = sortByTimestamp(cell1Entries);

      // Bob (14:00) should be first (newest)
      expect(sortedCell1[0]?.name).toBe('Bob Smith');
      expect(sortedCell1[0]?.serviceId).toBe('RN5678');

      // Carol (12:00) should be second
      expect(sortedCell1[1]?.name).toBe('Carol Davis');

      // Alice (10:30) should be third (oldest)
      expect(sortedCell1[2]?.name).toBe('Alice Johnson');
    });

    it('should create display with all student entries in correct order', async () => {
      const grouped = groupEntriesByCell(students, pageId);
      const entries = grouped['R1C1#f:abc123'] || [];

      const display = createStudentEntriesDisplay(entries);
      document.body.appendChild(display);
      await display.updateComplete;

      // Should have 3 entry divs (in shadow DOM)
      const entryDivs = display.shadowRoot?.querySelectorAll('.qd-entry');
      expect(entryDivs).toHaveLength(3);

      // First entry should be Bob (newest)
      const firstEntry = entryDivs?.[0];
      expect(firstEntry?.textContent).toContain('Bob Smith');
      expect(firstEntry?.textContent).toContain('5678'); // Last 4 digits
      expect(firstEntry?.textContent).toContain('Type B connector');

      // Last entry should be Alice (oldest)
      const lastEntry = entryDivs?.[2];
      expect(lastEntry?.textContent).toContain('Alice Johnson');
      expect(lastEntry?.textContent).toContain('type A');
      display.remove();
    });

    it('should display timestamp in 24-hour format', async () => {
      const entries: CellEntry[] = [
        {
          serviceId: 'RN1234',
          name: 'Test Student',
          content: 'Test answer',
          timestamp: '2024-11-19T14:23:45Z',
        },
      ];

      const display = createStudentEntriesDisplay(entries);
      document.body.appendChild(display);
      await display.updateComplete;
      const text = display.shadowRoot?.textContent || '';

      // Should contain 24-hour time format
      expect(text).toMatch(/14:23/);
      display.remove();
    });

    it('should handle cell with no entries (FR-013)', async () => {
      // Cell R3C1 has no entries from any student
      const grouped = groupEntriesByCell(students, pageId);
      const emptyEntries = grouped['R3C1#f:empty'] || [];

      const display = createStudentEntriesDisplay(emptyEntries);
      document.body.appendChild(display);
      await display.updateComplete;

      // Should show placeholder
      expect(display.shadowRoot?.textContent).toContain('(No entries yet)');
      expect(display.shadowRoot?.querySelector('.qd-no-entries')).not.toBeNull();
      display.remove();
    });

    it('should isolate entries by page', () => {
      // Add student with entry on different page
      const studentWithOtherPage: StudentRecord = {
        schema: 1,
        docId: 'doc-test',
        release: 'TRV Autumn 2024',
        serviceId: 'RN0000',
        name: 'Other Student',
        attempted: 1,
        correct: 1,
        updated: '2024-11-19T15:00:00Z',
        pages: {
          'other-page': {
            state: 'incomplete',
            answers: [],
            analysis: {
              tableId: 'other-table',
              cells: {
                'R1C1#f:abc123': 'This should not appear',
              },
              firstEdited: '2024-11-19T15:00:00Z',
              lastEdited: '2024-11-19T15:00:00Z',
            },
          },
        },
      };

      const allStudents = [...students, studentWithOtherPage];
      const grouped = groupEntriesByCell(allStudents, pageId);

      // Should only have 3 entries for R1C1, not 4
      const entries = grouped['R1C1#f:abc123'] || [];
      expect(entries).toHaveLength(3);

      // Should not contain "Other Student"
      const names = entries.map((e) => e.name);
      expect(names).not.toContain('Other Student');
    });

    it('should handle students with no analysis data gracefully', () => {
      const studentsWithEmpty: StudentRecord[] = [
        ...students,
        {
          schema: 1,
          docId: 'doc-test',
          release: 'TRV Autumn 2024',
          serviceId: 'RN0001',
          name: 'Empty Student',
          attempted: 0,
          correct: 0,
          updated: '2024-11-19T09:00:00Z',
          pages: {}, // No pages at all
        },
        {
          schema: 1,
          docId: 'doc-test',
          release: 'TRV Autumn 2024',
          serviceId: 'RN0002',
          name: 'Quiz Only Student',
          attempted: 5,
          correct: 5,
          updated: '2024-11-19T08:00:00Z',
          pages: {
            [pageId]: {
              state: 'complete',
              answers: [{ answer: 'a', success: true, timestamp: '2024-11-19T08:00:00Z' }],
              // No analysis property
            },
          },
        },
      ];

      const grouped = groupEntriesByCell(studentsWithEmpty, pageId);

      // Should still have only 3 entries for R1C1
      const entries = grouped['R1C1#f:abc123'];
      expect(entries).toHaveLength(3);
    });
  });

  describe('Edge cases', () => {
    it('should handle identical timestamps with stable sort', () => {
      const entries: CellEntry[] = [
        {
          serviceId: 'RN1111',
          name: 'Student A',
          content: 'Answer A',
          timestamp: '2024-11-19T10:00:00Z',
        },
        {
          serviceId: 'RN2222',
          name: 'Student B',
          content: 'Answer B',
          timestamp: '2024-11-19T10:00:00Z', // Same timestamp
        },
        {
          serviceId: 'RN3333',
          name: 'Student C',
          content: 'Answer C',
          timestamp: '2024-11-19T10:00:00Z', // Same timestamp
        },
      ];

      const sorted = sortByTimestamp(entries);

      // Should return all 3 entries
      expect(sorted).toHaveLength(3);

      // Order may vary for same timestamps, but all should be present
      const serviceIds = sorted.map((e) => e.serviceId);
      expect(serviceIds).toContain('RN1111');
      expect(serviceIds).toContain('RN2222');
      expect(serviceIds).toContain('RN3333');
    });

    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(1000);
      const entries: CellEntry[] = [
        {
          serviceId: 'RN1234',
          name: 'Student',
          content: longContent,
          timestamp: '2024-11-19T10:00:00Z',
        },
      ];

      const display = createStudentEntriesDisplay(entries);
      document.body.appendChild(display);
      await display.updateComplete;

      // Should contain the full content
      expect(display.shadowRoot?.textContent).toContain(longContent);
      display.remove();
    });

    it('should handle special characters in content', async () => {
      const specialContent = '<script>alert("XSS")</script> & "quotes" \'apostrophes\'';
      const entries: CellEntry[] = [
        {
          serviceId: 'RN1234',
          name: 'Student',
          content: specialContent,
          timestamp: '2024-11-19T10:00:00Z',
        },
      ];

      const display = createStudentEntriesDisplay(entries);
      document.body.appendChild(display);
      await display.updateComplete;

      // Lit auto-escapes: the literal text is present, no live <script> element
      expect(display.shadowRoot?.textContent).toContain('<script>');
      expect(display.shadowRoot?.querySelector('script')).toBeNull();
      display.remove();
    });
  });
});
