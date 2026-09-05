/**
 * Unit tests for qd-instructor-export component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../../src/components/qd-instructor/qd-instructor-export.js';
import type { QdInstructorExport } from '../../../../src/components/qd-instructor/qd-instructor-export.js';
import type { StudentRecord } from '../../../../src/types/contracts.js';

describe('qd-instructor-export', () => {
  let element: QdInstructorExport;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('qd-instructor-export');
    container.appendChild(element);

    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
  });

  describe('rendering', () => {
    it('should render export button', () => {
      const button = element.shadowRoot?.querySelector('button');
      expect(button).toBeTruthy();
    });

    it('should disable button when no data', () => {
      const button = element.shadowRoot?.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should enable button when data present', async () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'qd/01-2025/uTEST1',
          serviceId: 'TEST1',
          name: 'Test Student',
          release: '01-2025',
          attempted: 1,
          correct: 1,
          updated: new Date().toISOString(),
          pages: {},
        },
      ];

      element.students = students;
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });
  });

  describe('CSV generation', () => {
    it('should generate CSV with header row', () => {
      const csv = element['generateCSV']();
      expect(csv).toContain(
        'Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp',
      );
    });

    it('should escape fields with commas', () => {
      const escaped = element['escapeCSVField']('Hello, World');
      expect(escaped).toBe('"Hello, World"');
    });

    it('should escape fields with quotes', () => {
      const escaped = element['escapeCSVField']('Say "Hello"');
      expect(escaped).toBe('"Say ""Hello"""');
    });

    it('should neutralise leading formula characters', () => {
      // Untrusted student names / answers must not execute in Excel or Sheets
      expect(element['escapeCSVField']('=cmd|calc')).toBe("'=cmd|calc");
      expect(element['escapeCSVField']('+1234')).toBe("'+1234");
      expect(element['escapeCSVField']('-1+1')).toBe("'-1+1");
      expect(element['escapeCSVField']('@SUM(A1)')).toBe("'@SUM(A1)");
    });

    it('should neutralise and quote a formula field containing a comma', () => {
      expect(element['escapeCSVField']('=HYPERLINK("a","b")')).toBe('"\'=HYPERLINK(""a"",""b"")"');
    });

    it('should not escape simple fields', () => {
      const escaped = element['escapeCSVField']('SimpleField');
      expect(escaped).toBe('SimpleField');
    });

    it('should generate CSV rows for student answers', async () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'qd/01-2025/uTEST1',
          serviceId: 'TEST1',
          name: 'Test Student',
          release: '01-2025',
          attempted: 1,
          correct: 1,
          updated: new Date().toISOString(),
          pages: {
            'page-1': {
              state: 'complete',
              answers: [
                {
                  answer: 'a',
                  success: true,
                  timestamp: '2025-01-01T00:00:00Z',
                },
              ],
            },
          },
        },
      ];

      element.students = students;
      await element.updateComplete;

      const csv = element['generateCSV']();
      expect(csv).toContain('TEST1');
      expect(csv).toContain('Test Student');
      expect(csv).toContain('page-1');
      expect(csv).toContain('true');
    });
  });

  describe('tooltip', () => {
    it('should show "No data to export" tooltip when empty', () => {
      const button = element.shadowRoot?.querySelector('button');
      expect(button?.getAttribute('title')).toBe('No data to export');
    });

    it('should show student count in tooltip when data present', async () => {
      element.students = [
        {
          schema: 1,
          docId: 'qd/01-2025/uTEST1',
          serviceId: 'TEST1',
          name: 'Student 1',
          release: '01-2025',
          attempted: 2,
          correct: 1,
          updated: new Date().toISOString(),
          pages: {
            'page-1': {
              state: 'incomplete',
              answers: [
                { answer: 'a', success: true, timestamp: '2025-01-01T00:00:00Z' },
                { answer: 'b', success: false, timestamp: '2025-01-01T00:01:00Z' },
              ],
            },
          },
        },
        {
          schema: 1,
          docId: 'qd/01-2025/uTEST2',
          serviceId: 'TEST2',
          name: 'Student 2',
          release: '01-2025',
          attempted: 1,
          correct: 1,
          updated: new Date().toISOString(),
          pages: {
            'page-1': {
              state: 'complete',
              answers: [{ answer: 'c', success: true, timestamp: '2025-01-01T00:00:00Z' }],
            },
          },
        },
      ];
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector('button');
      expect(button?.getAttribute('title')).toBe('Export 2 students to CSV');
    });
  });
});
