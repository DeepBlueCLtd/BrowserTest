/**
 * Unit tests for analysis-table enhancer - instructor view student entries
 * Tests for FR-012 (grouping by cell, timestamp sorting) and FR-013 (placeholder)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { StudentRecord } from '../../../src/types/contracts.js';
import { groupEntriesByCell, sortByTimestamp } from '../../../src/services/analysis-display.js';
import { createStudentEntriesDisplay } from '../../../src/enhancers/analysis-instructor-overlay.js';

describe('Analysis Table Enhancer - Instructor View (FR-012, FR-013)', () => {
  let table: HTMLTableElement;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create a simple 2x2 analysis table
    table = document.createElement('table');
    table.className = 'qd-analysis';
    table.innerHTML = `
      <thead>
        <tr><th>Header 1</th><th>Header 2</th></tr>
      </thead>
      <tbody>
        <tr><td class="interactive">Cell A</td><td class="interactive">Cell B</td></tr>
        <tr><td class="interactive">Cell C</td><td class="interactive">Cell D</td></tr>
      </tbody>
    `;
    container.appendChild(table);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  describe('T044: Student Entry Grouping by Cell', () => {
    it('should group student entries by cell key', () => {
      // Mock student records with analysis data
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-test',
          release: '11-2024',
          serviceId: 'RN2344',
          name: 'Alice Student',
          attempted: 0,
          correct: 0,
          updated: '2024-11-19T10:00:00Z',
          pages: {
            'page-1': {
              state: 'incomplete',
              answers: [],
              analysis: {
                tableId: 'test-table-id',
                cells: {
                  'R1C0#f:abc123': 'Alice answer for Cell A',
                  'R1C1#f:def456': 'Alice answer for Cell B',
                },
                firstEdited: '2024-11-19T10:00:00Z',
                lastEdited: '2024-11-19T10:00:00Z',
              },
            },
          },
        },
        {
          schema: 1,
          docId: 'doc-test',
          release: '11-2024',
          serviceId: 'RN5678',
          name: 'Bob Student',
          attempted: 0,
          correct: 0,
          updated: '2024-11-19T11:00:00Z',
          pages: {
            'page-1': {
              state: 'incomplete',
              answers: [],
              analysis: {
                tableId: 'test-table-id',
                cells: {
                  'R1C0#f:abc123': 'Bob answer for Cell A',
                },
                firstEdited: '2024-11-19T11:00:00Z',
                lastEdited: '2024-11-19T11:00:00Z',
              },
            },
          },
        },
      ];

      // Expected grouping: Cell A should have 2 entries, Cell B should have 1 entry
      const grouped = groupEntriesByCell(students, 'page-1');

      const cellAEntries = grouped['R1C0#f:abc123'];
      const cellBEntries = grouped['R1C1#f:def456'];

      expect(cellAEntries).toHaveLength(2);
      expect(cellBEntries).toHaveLength(1);

      // Verify Alice's entry for Cell A
      const aliceEntry = cellAEntries?.find((e) => e.serviceId === 'RN2344');
      expect(aliceEntry).toBeTruthy();
      if (aliceEntry) {
        expect(aliceEntry.content).toBe('Alice answer for Cell A');
        expect(aliceEntry.name).toBe('Alice Student');
      }

      // Verify Bob's entry for Cell A
      const bobEntry = cellAEntries?.find((e) => e.serviceId === 'RN5678');
      expect(bobEntry).toBeTruthy();
      if (bobEntry) {
        expect(bobEntry.content).toBe('Bob answer for Cell A');
      }
    });

    it('should handle students with no analysis data', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-test',
          release: '11-2024',
          serviceId: 'RN2344',
          name: 'Alice Student',
          attempted: 0,
          correct: 0,
          updated: '2024-11-19T10:00:00Z',
          pages: {},
        },
      ];

      const grouped = groupEntriesByCell(students, 'page-1');

      // Should return empty object
      expect(Object.keys(grouped)).toHaveLength(0);
    });

    it('should only include entries for the specified page', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-test',
          release: '11-2024',
          serviceId: 'RN2344',
          name: 'Alice Student',
          attempted: 0,
          correct: 0,
          updated: '2024-11-19T10:00:00Z',
          pages: {
            'page-1': {
              state: 'incomplete',
              answers: [],
              analysis: {
                tableId: 'table-1',
                cells: {
                  'R1C0#f:abc123': 'Page 1 answer',
                },
                firstEdited: '2024-11-19T10:00:00Z',
                lastEdited: '2024-11-19T10:00:00Z',
              },
            },
            'page-2': {
              state: 'incomplete',
              answers: [],
              analysis: {
                tableId: 'table-2',
                cells: {
                  'R1C0#f:xyz789': 'Page 2 answer',
                },
                firstEdited: '2024-11-19T10:00:00Z',
                lastEdited: '2024-11-19T10:00:00Z',
              },
            },
          },
        },
      ];

      const grouped = groupEntriesByCell(students, 'page-1');

      // Should only have page-1 entries
      expect(grouped['R1C0#f:abc123']).toBeTruthy();
      expect(grouped['R1C0#f:xyz789']).toBeUndefined();
    });
  });

  describe('T045: Timestamp Sorting (Newest First)', () => {
    it('should sort entries by timestamp in descending order (newest first)', () => {
      const entries = [
        {
          serviceId: 'RN1111',
          name: 'Student A',
          content: 'First entry',
          timestamp: '2024-11-19T10:00:00Z',
        },
        {
          serviceId: 'RN2222',
          name: 'Student B',
          content: 'Third entry',
          timestamp: '2024-11-19T12:00:00Z',
        },
        {
          serviceId: 'RN3333',
          name: 'Student C',
          content: 'Second entry',
          timestamp: '2024-11-19T11:00:00Z',
        },
      ];

      const sorted = sortByTimestamp(entries);

      // Newest first
      expect(sorted.length).toBe(3);
      expect(sorted[0]?.serviceId).toBe('RN2222'); // 12:00
      expect(sorted[1]?.serviceId).toBe('RN3333'); // 11:00
      expect(sorted[2]?.serviceId).toBe('RN1111'); // 10:00
    });

    it('should handle entries with identical timestamps', () => {
      const entries = [
        {
          serviceId: 'RN1111',
          name: 'Student A',
          content: 'Entry A',
          timestamp: '2024-11-19T10:00:00Z',
        },
        {
          serviceId: 'RN2222',
          name: 'Student B',
          content: 'Entry B',
          timestamp: '2024-11-19T10:00:00Z',
        },
      ];

      const sorted = sortByTimestamp(entries);

      // Should maintain stable sort
      expect(sorted).toHaveLength(2);
    });

    it('should handle empty array', () => {
      const sorted = sortByTimestamp([]);
      expect(sorted).toEqual([]);
    });
  });

  describe('FR-012: Display Student Entries', () => {
    it('should create display element for cell with student entries', () => {
      const entries = [
        {
          serviceId: 'RN2344',
          name: 'Alice Student',
          content: 'Alice answer',
          timestamp: '2024-11-19T14:23:00Z',
        },
        {
          serviceId: 'RN5678',
          name: 'Bob Student',
          content: 'Bob answer',
          timestamp: '2024-11-19T15:30:00Z',
        },
      ];

      const displayElement = createStudentEntriesDisplay(entries);

      // Should have container
      expect(displayElement).toBeTruthy();
      expect(displayElement.className).toContain('qd-student-entries');

      // Should have all entries
      const entryElements = displayElement.querySelectorAll('.qd-entry');
      expect(entryElements).toHaveLength(2);

      // First entry should be Bob (newest)
      const firstEntry = entryElements[0];
      expect(firstEntry).toBeTruthy();
      if (firstEntry) {
        expect(firstEntry.textContent).toContain('Bob Student');
        expect(firstEntry.textContent).toContain('5678'); // Last 4 of serviceId
        expect(firstEntry.textContent).toContain('Bob answer');

        // Should have timestamp in 24-hour format
        expect(firstEntry.textContent).toContain('15:30');
      }
    });
  });

  describe('FR-013: Empty Cell Placeholder', () => {
    it('should create placeholder for cell with no entries', () => {
      const displayElement = createStudentEntriesDisplay([]);

      expect(displayElement).toBeTruthy();
      expect(displayElement.textContent).toContain('(No entries yet)');
      expect(displayElement.className).toContain('qd-no-entries');
    });
  });
});
