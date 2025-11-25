/**
 * Unit tests for qd-instructor-scores component
 *
 * Refactored to work with qd-scores-modal composition.
 * Feature: 007-lit-component-refactor
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../../src/components/qd-instructor/qd-instructor-scores.js';
import type { QdInstructorScores } from '../../../../src/components/qd-instructor/qd-instructor-scores.js';
import type { QdScoresModal } from '../../../../src/components/qd-scores-modal.js';
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

  // Helper to get nested qd-scores-modal
  const getScoresModal = (): QdScoresModal | null => {
    return element.shadowRoot?.querySelector('qd-scores-modal') || null;
  };

  // Helper to get modal content text through nested shadow DOMs
  const getModalText = async (): Promise<string> => {
    const scoresModal = getScoresModal();
    if (!scoresModal) return '';
    await scoresModal.updateComplete;
    return scoresModal.shadowRoot?.textContent || '';
  };

  describe('modal rendering', () => {
    it('should not render modal when showModal is false', () => {
      const scoresModal = getScoresModal();
      expect(scoresModal?.open).toBe(false);
    });

    it('should render modal when showModal is true', async () => {
      element.showModal = true;
      await element.updateComplete;

      const scoresModal = getScoresModal();
      expect(scoresModal?.open).toBe(true);
    });

    it('should emit close event when modal closes', async () => {
      element.showModal = true;
      await element.updateComplete;

      let eventFired = false;
      element.addEventListener('close', () => {
        eventFired = true;
      });

      const scoresModal = getScoresModal();
      // Simulate escape key on nested qd-modal
      const qdModal = scoresModal?.shadowRoot?.querySelector('qd-modal');
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      qdModal?.dispatchEvent(event);
      await element.updateComplete;

      expect(eventFired).toBe(true);
    });

    it('should pass students to qd-scores-modal', async () => {
      const mockStudents: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          serviceId: 'A123',
          name: 'Alice',
          release: '01-2025',
          attempted: 5,
          correct: 4,
          updated: '',
          pages: {},
        },
      ];

      element.students = mockStudents;
      element.showModal = true;
      await element.updateComplete;

      const scoresModal = getScoresModal();
      expect(scoresModal?.students).toEqual(mockStudents);
    });
  });

  describe('empty state', () => {
    it('should show "No student data" when empty', async () => {
      element.showModal = true;
      element.students = [];
      await element.updateComplete;

      const text = await getModalText();
      expect(text).toContain('No student data');
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
        updated: '2025-01-01T00:00:00Z',
        pages: {
          'page-1': {
            state: 'complete',
            answers: [
              { answer: 'A', success: true, timestamp: '2025-01-01T10:00:00Z' },
              { answer: 'B', success: true, timestamp: '2025-01-01T10:01:00Z' },
            ],
          },
        },
      },
      {
        schema: 1,
        docId: 'qd/01-2025/uTEST2',
        serviceId: 'TEST2',
        name: 'Bob',
        release: '01-2025',
        attempted: 5,
        correct: 3,
        updated: '2025-01-01T00:00:00Z',
        pages: {},
      },
    ];

    it('should display student names', async () => {
      element.students = mockStudents;
      element.showModal = true;
      await element.updateComplete;

      const text = await getModalText();
      expect(text).toContain('Alice');
      expect(text).toContain('Bob');
    });

    it('should display service IDs', async () => {
      element.students = mockStudents;
      element.showModal = true;
      await element.updateComplete;

      const text = await getModalText();
      expect(text).toContain('TEST1');
      expect(text).toContain('TEST2');
    });

    it('should display attempted counts', async () => {
      element.students = mockStudents;
      element.showModal = true;
      await element.updateComplete;

      const text = await getModalText();
      expect(text).toContain('10');
      expect(text).toContain('5');
    });

    it('should display correct counts', async () => {
      element.students = mockStudents;
      element.showModal = true;
      await element.updateComplete;

      const text = await getModalText();
      expect(text).toContain('8');
      expect(text).toContain('3');
    });

    it('should calculate and display percentages', async () => {
      element.students = mockStudents;
      element.showModal = true;
      await element.updateComplete;

      const text = await getModalText();
      expect(text).toContain('80%'); // Alice: 8/10
      expect(text).toContain('60%'); // Bob: 3/5
    });

    it('should sort students alphabetically by name', async () => {
      const unsortedStudents: StudentRecord[] = [
        { ...mockStudents[1]!, name: 'Zara' },
        { ...mockStudents[0]!, name: 'Alice' },
      ];

      element.students = unsortedStudents;
      element.showModal = true;
      await element.updateComplete;

      const scoresModal = getScoresModal();
      await scoresModal?.updateComplete;
      const rows = scoresModal?.shadowRoot?.querySelectorAll('.student-row');

      if (rows && rows.length >= 2) {
        expect(rows[0]?.textContent).toContain('Alice');
        expect(rows[1]?.textContent).toContain('Zara');
      }
    });
  });

  describe('expanded details', () => {
    const studentWithPages: StudentRecord = {
      schema: 1,
      docId: 'test',
      serviceId: 'A123',
      name: 'Alice',
      release: '01-2025',
      attempted: 2,
      correct: 1,
      updated: '',
      pages: {
        'quiz-page-1': {
          state: 'incomplete',
          answers: [
            { answer: 'A', success: true, timestamp: '2025-01-01T10:00:00Z' },
            { answer: 'B', success: false, timestamp: '2025-01-01T10:01:00Z' },
          ],
        },
      },
    };

    it('should show page names in expanded view', async () => {
      element.students = [studentWithPages];
      element.showModal = true;
      await element.updateComplete;

      const text = await getModalText();
      expect(text).toContain('quiz-page-1');
    });

    it('should show question numbers', async () => {
      element.students = [studentWithPages];
      element.showModal = true;
      await element.updateComplete;

      const text = await getModalText();
      expect(text).toContain('Q1');
      expect(text).toContain('Q2');
    });

    it('should show answers', async () => {
      element.students = [studentWithPages];
      element.showModal = true;
      await element.updateComplete;

      const text = await getModalText();
      expect(text).toContain('A');
      expect(text).toContain('B');
    });

    it('should have correct/incorrect CSS classes', async () => {
      element.students = [studentWithPages];
      element.showModal = true;
      await element.updateComplete;

      const scoresModal = getScoresModal();
      await scoresModal?.updateComplete;

      const correctBadge = scoresModal?.shadowRoot?.querySelector('.answer-badge.correct');
      const incorrectBadge = scoresModal?.shadowRoot?.querySelector('.answer-badge.incorrect');

      expect(correctBadge).toBeTruthy();
      expect(incorrectBadge).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have modal title', async () => {
      element.showModal = true;
      await element.updateComplete;

      const text = await getModalText();
      expect(text).toContain('Student Scores');
    });
  });
});
