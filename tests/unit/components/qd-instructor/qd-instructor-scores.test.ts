/**
 * Unit tests for qd-instructor-scores component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../../src/components/qd-instructor/qd-instructor-scores.js';
import type { QdInstructorScores } from '../../../../src/components/qd-instructor/qd-instructor-scores.js';
import type { StudentRecord } from '../../../../src/types/contracts.js';

describe('qd-instructor-scores', () => {
  let element: QdInstructorScores;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('qd-instructor-scores');
    container.appendChild(element);

    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
  });

  describe('modal rendering', () => {
    it('should not render when showModal is false', () => {
      const modal = element.shadowRoot?.querySelector('.modal-overlay');
      expect(modal).toBeNull();
    });

    it('should render when showModal is true', async () => {
      element.showModal = true;
      await element.updateComplete;

      const modal = element.shadowRoot?.querySelector('.modal-overlay');
      expect(modal).toBeTruthy();
    });

    it('should emit close event when close button clicked', async () => {
      element.showModal = true;
      await element.updateComplete;

      let eventFired = false;
      element.addEventListener('close', () => {
        eventFired = true;
      });

      const closeButton = element.shadowRoot?.querySelector('.close-button') as HTMLButtonElement;
      closeButton?.click();

      expect(eventFired).toBe(true);
    });

    it('should emit close event when overlay clicked', async () => {
      element.showModal = true;
      await element.updateComplete;

      let eventFired = false;
      element.addEventListener('close', () => {
        eventFired = true;
      });

      const overlay = element.shadowRoot?.querySelector('.modal-overlay') as HTMLElement;
      overlay?.click();

      expect(eventFired).toBe(true);
    });
  });

  describe('empty state', () => {
    it('should show "No student data" when empty', async () => {
      element.showModal = true;
      element.students = [];
      await element.updateComplete;

      const text = element.shadowRoot?.textContent;
      expect(text).toContain('No student data available');
    });
  });

  describe('student list', () => {
    const mockStudents: StudentRecord[] = [
      {
        schema: 1,
        docId: 'qd/01-2025/uTEST1',
        serviceId: 'TEST1',
        name: 'Alice',
        release: '01-2025',
        attempted: 10,
        correct: 8,
        updated: new Date().toISOString(),
        pages: {},
      },
      {
        schema: 1,
        docId: 'qd/01-2025/uTEST2',
        serviceId: 'TEST2',
        name: 'Bob',
        release: '01-2025',
        attempted: 5,
        correct: 5,
        updated: new Date().toISOString(),
        pages: {},
      },
    ];

    beforeEach(async () => {
      element.showModal = true;
      element.students = mockStudents;
      await element.updateComplete;
    });

    it('should render all students', () => {
      const rows = element.shadowRoot?.querySelectorAll('tbody tr');
      expect(rows?.length).toBeGreaterThan(0);
    });

    it('should sort students by name', () => {
      const firstRow = element.shadowRoot?.querySelector('tbody tr');
      expect(firstRow?.textContent).toContain('Alice');
    });

    it('should display service ID', () => {
      const text = element.shadowRoot?.textContent;
      expect(text).toContain('TEST1');
    });

    it('should display attempted count', () => {
      const text = element.shadowRoot?.textContent;
      expect(text).toContain('10');
    });

    it('should display correct count', () => {
      const text = element.shadowRoot?.textContent;
      expect(text).toContain('8');
    });

    it('should calculate percentage', () => {
      const text = element.shadowRoot?.textContent;
      expect(text).toContain('80%');
    });
  });

  describe('expandable details', () => {
    const mockStudentWithPages: StudentRecord = {
      schema: 1,
      docId: 'qd/01-2025/uTEST1',
      serviceId: 'TEST1',
      name: 'Alice',
      release: '01-2025',
      attempted: 5,
      correct: 3,
      updated: new Date().toISOString(),
      pages: {
        'page-1': {
          state: 'complete',
          answers: [
            { answer: 'a', success: true, timestamp: '2025-01-01T00:00:00Z' },
            { answer: 'b', success: false, timestamp: '2025-01-01T00:00:01Z' },
          ],
        },
        'page-2': {
          state: 'incomplete',
          answers: [
            { answer: '42', success: true, timestamp: '2025-01-01T00:00:02Z' },
          ],
        },
      },
    };

    beforeEach(async () => {
      element.showModal = true;
      element.students = [mockStudentWithPages];
      await element.updateComplete;
    });

    it('should not show expanded details initially', () => {
      const expanded = element['expandedStudents'].has('TEST1');
      expect(expanded).toBe(false);
    });

    it('should toggle expansion on button click', async () => {
      // Manually call toggle to test logic
      element['toggleStudent']('TEST1');
      await element.updateComplete;

      const expanded = element['expandedStudents'].has('TEST1');
      expect(expanded).toBe(true);
    });

    it('should show page breakdown when expanded', async () => {
      // Toggle to expand
      element['toggleStudent']('TEST1');
      await element.updateComplete;

      // Check that expansion is tracked
      expect(element['expandedStudents'].has('TEST1')).toBe(true);

      // Re-render should show pages
      element.requestUpdate();
      await element.updateComplete;

      const text = element.shadowRoot?.textContent;
      expect(text).toContain('page-1');
      expect(text).toContain('page-2');
    });
  });

  describe('percentage calculation', () => {
    it('should return 0% when no attempts', () => {
      const student: StudentRecord = {
        schema: 1,
        docId: 'qd/01-2025/uTEST',
        serviceId: 'TEST',
        name: 'Test',
        release: '01-2025',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      const summary = element['calculateSummary'](student);
      expect(summary.percentage).toBe(0);
    });

    it('should calculate correct percentage', () => {
      const student: StudentRecord = {
        schema: 1,
        docId: 'qd/01-2025/uTEST',
        serviceId: 'TEST',
        name: 'Test',
        release: '01-2025',
        attempted: 10,
        correct: 7,
        updated: new Date().toISOString(),
        pages: {},
      };

      const summary = element['calculateSummary'](student);
      expect(summary.percentage).toBe(70);
    });

    it('should round percentage', () => {
      const student: StudentRecord = {
        schema: 1,
        docId: 'qd/01-2025/uTEST',
        serviceId: 'TEST',
        name: 'Test',
        release: '01-2025',
        attempted: 3,
        correct: 2,
        updated: new Date().toISOString(),
        pages: {},
      };

      const summary = element['calculateSummary'](student);
      expect(summary.percentage).toBe(67); // 66.67 rounded
    });
  });
});
