/**
 * Unit tests for qd-instructor-export component - export button state
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../src/components/qd-instructor/qd-instructor-export.js';
import type { QdInstructorExport } from '../../../src/components/qd-instructor/qd-instructor-export.js';
import type { StudentRecord } from '../../../src/types/contracts.js';

describe('qd-instructor-export - Export Button State (FR-006)', () => {
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

  it('should enable export button when students have data', async () => {
    // Mock students with answered questions
    const studentsWithData: StudentRecord[] = [
      {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Alice Student',
        attempted: 3,
        correct: 2,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            state: 'complete',
            answers: [
              { answer: 'a', success: true, timestamp: '2024-11-19T10:00:00Z' },
              { answer: 'b', success: false, timestamp: '2024-11-19T10:01:00Z' },
              { answer: 'c', success: true, timestamp: '2024-11-19T10:02:00Z' },
            ],
            lastAttempted: '2024-11-19T10:02:00Z',
          },
        },
      },
    ];

    // Set students property
    element.students = studentsWithData;
    await element.updateComplete;

    // Find export button
    const button = element.shadowRoot?.querySelector('button');
    expect(button).toBeTruthy();

    // Button should be enabled
    expect(button?.disabled).toBe(false);
  });

  it('should disable export button when no students exist', async () => {
    // Set empty students array
    element.students = [];
    await element.updateComplete;

    // Find export button
    const button = element.shadowRoot?.querySelector('button');
    expect(button).toBeTruthy();

    // Button should be disabled
    expect(button?.disabled).toBe(true);
  });

  it('should disable export button when students have no answers', async () => {
    // Mock students with zero attempted questions
    const studentsWithoutData: StudentRecord[] = [
      {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Alice Student',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      },
      {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN5678',
        name: 'Bob Student',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      },
    ];

    // Set students property
    element.students = studentsWithoutData;
    await element.updateComplete;

    // Find export button
    const button = element.shadowRoot?.querySelector('button');
    expect(button).toBeTruthy();

    // Button should be disabled (no answers to export)
    expect(button?.disabled).toBe(true);
  });

  it('should enable export button when at least one student has answers', async () => {
    // Mix of students: one with answers, one without
    const mixedStudents: StudentRecord[] = [
      {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Alice Student',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      },
      {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN5678',
        name: 'Bob Student',
        attempted: 2,
        correct: 1,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            state: 'incomplete',
            answers: [
              { answer: 'a', success: true, timestamp: '2024-11-19T11:00:00Z' },
              { answer: 'b', success: false, timestamp: '2024-11-19T11:01:00Z' },
            ],
            lastAttempted: '2024-11-19T11:01:00Z',
          },
        },
      },
    ];

    // Set students property
    element.students = mixedStudents;
    await element.updateComplete;

    // Find export button
    const button = element.shadowRoot?.querySelector('button');
    expect(button).toBeTruthy();

    // Button should be enabled (at least one student has answers)
    expect(button?.disabled).toBe(false);
  });

  it('should trigger download when button is clicked', async () => {
    // Mock students with data
    const studentsWithData: StudentRecord[] = [
      {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Alice Student',
        attempted: 1,
        correct: 1,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            state: 'complete',
            answers: [{ answer: 'a', success: true, timestamp: '2024-11-19T10:00:00Z' }],
            lastAttempted: '2024-11-19T10:00:00Z',
          },
        },
      },
    ];

    element.students = studentsWithData;
    await element.updateComplete;

    // Find button and verify it's enabled
    const button = element.shadowRoot?.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.disabled).toBe(false);

    // Click triggers CSV generation (actual download tested in E2E)
    button.click();
  });

  it('should update button state when students property changes', async () => {
    // Start with no students
    element.students = [];
    await element.updateComplete;

    const button = element.shadowRoot?.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    // Add students with data
    element.students = [
      {
        schema: 1,
        docId: 'doc-test',
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Alice Student',
        attempted: 1,
        correct: 1,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            state: 'complete',
            answers: [{ answer: 'a', success: true, timestamp: '2024-11-19T10:00:00Z' }],
            lastAttempted: '2024-11-19T10:00:00Z',
          },
        },
      },
    ];
    await element.updateComplete;

    // Button should now be enabled
    expect(button.disabled).toBe(false);

    // Remove students
    element.students = [];
    await element.updateComplete;

    // Button should be disabled again
    expect(button.disabled).toBe(true);
  });

  describe('CSV Generation (FR-008, FR-009)', () => {
    it('should generate CSV with correct header row', () => {
      const students: StudentRecord[] = [];
      element.students = students;

      // Access private generateCSV method via any cast for testing
      const csv = (element as never as { generateCSV: () => string }).generateCSV();

      // Should have header row
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp');
    });

    it('should include all student answer data in CSV rows', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-test',
          release: '11-2024',
          serviceId: 'RN2344',
          name: 'Alice Student',
          attempted: 2,
          correct: 1,
          updated: new Date().toISOString(),
          pages: {
            'page-1': {
              state: 'incomplete',
              answers: [
                { answer: 'a', success: true, timestamp: '2024-11-19T10:00:00.000Z' },
                { answer: 'b', success: false, timestamp: '2024-11-19T10:01:00.000Z' },
              ],
              lastAttempted: '2024-11-19T10:01:00.000Z',
            },
          },
        },
      ];
      element.students = students;

      const csv = (element as never as { generateCSV: () => string }).generateCSV();
      const lines = csv.split('\n');

      // Should have header + 2 data rows
      expect(lines.length).toBe(3);

      // First answer row
      expect(lines[1]).toContain('RN2344');
      expect(lines[1]).toContain('Alice Student');
      expect(lines[1]).toContain('11-2024');
      expect(lines[1]).toContain('page-1');
      expect(lines[1]).toContain(',0,'); // Question index 0
      expect(lines[1]).toContain(',a,'); // Answer
      expect(lines[1]).toContain(',true,'); // Success
      expect(lines[1]).toContain('2024-11-19T10:00:00.000Z'); // Timestamp in ISO format
    });

    it('should escape CSV special characters (FR-009)', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-test',
          release: '11-2024',
          serviceId: 'RN2344',
          name: 'Student, with comma',
          attempted: 1,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'page-1': {
              state: 'incomplete',
              answers: [
                {
                  answer: 'Answer with "quotes" and, commas',
                  success: false,
                  timestamp: '2024-11-19T10:00:00.000Z',
                },
              ],
              lastAttempted: '2024-11-19T10:00:00.000Z',
            },
          },
        },
      ];
      element.students = students;

      const csv = (element as never as { generateCSV: () => string }).generateCSV();
      const lines = csv.split('\n');

      // Name with comma should be quoted
      expect(lines[1]).toContain('"Student, with comma"');

      // Answer with quotes and commas should be escaped
      expect(lines[1]).toContain('"Answer with ""quotes"" and, commas"');
    });

    it('should handle newlines in answer text', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-test',
          release: '11-2024',
          serviceId: 'RN2344',
          name: 'Alice',
          attempted: 1,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'page-1': {
              state: 'incomplete',
              answers: [
                {
                  answer: 'Line 1\nLine 2\nLine 3',
                  success: false,
                  timestamp: '2024-11-19T10:00:00.000Z',
                },
              ],
              lastAttempted: '2024-11-19T10:00:00.000Z',
            },
          },
        },
      ];
      element.students = students;

      const csv = (element as never as { generateCSV: () => string }).generateCSV();

      // Answer with newlines should be quoted (don't split by \n as it breaks CSV parsing)
      // Just verify the full CSV contains the properly quoted multi-line answer
      expect(csv).toContain('"Line 1\nLine 2\nLine 3"');
      expect(csv).toContain('RN2344');
      expect(csv).toContain('Alice');
    });

    it('should handle empty answers array gracefully', () => {
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'doc-test',
          release: '11-2024',
          serviceId: 'RN2344',
          name: 'No Answers',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'page-1': {
              state: 'unstarted',
              answers: [],
              lastAttempted: undefined,
            },
          },
        },
      ];
      element.students = students;

      const csv = (element as never as { generateCSV: () => string }).generateCSV();
      const lines = csv.split('\n');

      // Should only have header row (no data rows)
      expect(lines.length).toBe(1);
    });
  });
});
