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
    // Clean up modal from document.body
    document.querySelector('.qd-scores-modal-container')?.remove();
  });

  // Helper to get modal container from document.body
  const getModalContainer = () => document.querySelector('.qd-scores-modal-container');

  describe('modal rendering', () => {
    it('should not render when showModal is false', () => {
      const modal = getModalContainer();
      expect(modal).toBeNull();
    });

    it('should render when showModal is true', async () => {
      element.showModal = true;
      await element.updateComplete;

      const modal = getModalContainer();
      expect(modal).toBeTruthy();
    });

    it('should emit close event when close button clicked', async () => {
      element.showModal = true;
      await element.updateComplete;

      let eventFired = false;
      element.addEventListener('close', () => {
        eventFired = true;
      });

      const modalContainer = getModalContainer();
      const closeButton = modalContainer?.querySelector('button') as HTMLButtonElement;
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

      const overlay = getModalContainer()?.querySelector('.qd-scores-modal-overlay') as HTMLElement;
      overlay?.click();

      expect(eventFired).toBe(true);
    });
  });

  describe('empty state', () => {
    it('should show "No student data" when empty', async () => {
      element.showModal = true;
      element.students = [];
      await element.updateComplete;

      const text = getModalContainer()?.textContent;
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
      const rows = getModalContainer()?.querySelectorAll('tbody tr');
      expect(rows?.length).toBeGreaterThan(0);
    });

    it('should sort students by name', () => {
      const firstRow = getModalContainer()?.querySelector('tbody tr');
      expect(firstRow?.textContent).toContain('Alice');
    });

    it('should display service ID', () => {
      const text = getModalContainer()?.textContent;
      expect(text).toContain('TEST1');
    });

    it('should display attempted count', () => {
      const text = getModalContainer()?.textContent;
      expect(text).toContain('10');
    });

    it('should display correct count', () => {
      const text = getModalContainer()?.textContent;
      expect(text).toContain('8');
    });

    it('should calculate percentage', () => {
      const text = getModalContainer()?.textContent;
      expect(text).toContain('80%');
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
