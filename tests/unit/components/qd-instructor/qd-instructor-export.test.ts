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

  describe('analysis entries (SRD 013 ANA-01, ANA-02)', () => {
    const student = (): StudentRecord => ({
      schema: 3,
      docId: '',
      serviceId: '30012345',
      name: 'Jo Bloggs',
      release: 'R1',
      attempted: 0,
      correct: 0,
      updated: '2026-10-30T00:00:00Z',
      pages: {
        'analysis-tactical': {
          state: 'incomplete',
          answers: [],
          analysis: {
            tableId: 't1',
            cells: {
              'R0C1#f:aaa': 'High, contact bearing 045',
              'R1C1#f:bbb': '',
              'R2C1#f:ccc': '=1+1',
            },
            labels: { 'R0C1#f:aaa': 'Threat Assessment' },
            lastEdited: '2026-10-30T10:00:00Z',
            totalCells: 6,
          },
        },
      },
    });

    it('appends a Kind column, keeping the original columns in place', () => {
      const header = element.generateCSV().split('\n')[0];
      expect(header).toBe(
        'Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp,Kind,Attempts,First Attempt Correct',
      );
    });

    it('exports one row per filled analysis cell, labelled by its row', () => {
      element.students = [student()];
      const lines = element.generateCSV().split('\n');
      expect(lines).toContain(
        '30012345,Jo Bloggs,R1,analysis-tactical,Threat Assessment,"High, contact bearing 045",,2026-10-30T10:00:00Z,analysis,,',
      );
      // Empty cells are skipped; a cell with no stored label falls back to its key
      expect(lines.filter((l) => l.includes(',analysis,'))).toHaveLength(2);
      expect(lines.some((l) => l.includes('R2C1#f:ccc'))).toBe(true);
    });

    it('neutralises formulas in analysis text', () => {
      element.students = [student()];
      expect(element.generateCSV()).toContain(",'=1+1,");
    });

    it('marks quiz rows as quiz', () => {
      const s = student();
      s.pages['quiz-mcq'] = {
        state: 'incomplete',
        answers: [{ answer: '2', success: false, timestamp: 't' }],
      };
      element.students = [s];
      expect(element.generateCSV()).toContain('quiz-mcq,0,2,false,t,quiz,,');
    });

    it('enables export when only analysis work exists', async () => {
      element.students = [student()];
      await element.updateComplete;
      const button = element.shadowRoot!.querySelector('button')!;
      expect(button.disabled).toBe(false);
    });
  });
});

describe('qd-instructor-export attempts (SRD 013 SCO-06, SCO-07)', () => {
  it('appends attempts and first-attempt correctness for quiz rows', async () => {
    const el = document.createElement('qd-instructor-export');
    document.body.appendChild(el);
    el.students = [
      {
        schema: 3,
        docId: '',
        serviceId: 'S1',
        name: 'Al',
        release: 'R1',
        attempted: 2,
        correct: 2,
        updated: '',
        pages: {
          'quiz-mcq': {
            state: 'incomplete',
            answers: [
              { answer: '3', success: true, timestamp: 't1', attempts: 4, firstSuccess: false },
              // Answered before v3: no attempt history
              { answer: '1', success: true, timestamp: 't2' },
            ],
          },
        },
      },
    ];
    await el.updateComplete;
    const lines = el.generateCSV().split('\n');
    expect(lines).toContain('S1,Al,R1,quiz-mcq,0,3,true,t1,quiz,4,false');
    expect(lines).toContain('S1,Al,R1,quiz-mcq,1,1,true,t2,quiz,,');
    el.remove();
  });
});
