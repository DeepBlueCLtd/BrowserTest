/**
 * Tests for qd-scores-modal.ts component
 *
 * Feature: 007-lit-component-refactor
 * TDD: These tests are written FIRST, before implementation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { QdScoresModal } from '../../../src/components/qd-scores-modal';
import type { StudentRecord } from '../../../src/types/contracts';

// Import component (will fail until implemented)
import '../../../src/components/qd-scores-modal.js';

describe('qd-scores-modal', () => {
  let container: HTMLElement;
  let element: QdScoresModal;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    // Clean up any modal containers and qd-modal elements rendered to body
    document.querySelectorAll('.qd-modal-container').forEach((el) => el.remove());
    document.querySelectorAll('body > qd-modal').forEach((el) => el.remove());
  });

  function createStudent(overrides: Partial<StudentRecord> = {}): StudentRecord {
    return {
      schema: 1,
      docId: 'doc-1',
      release: '2025-01',
      serviceId: 'TEST1234',
      name: 'Test Student',
      attempted: 5,
      correct: 4,
      updated: '2025-01-01T00:00:00Z',
      pages: {},
      ...overrides,
    };
  }

  async function createModal(
    options: {
      open?: boolean;
      students?: StudentRecord[];
    } = {},
  ): Promise<QdScoresModal> {
    element = document.createElement('qd-scores-modal');
    if (options.students) element.students = options.students;
    container.appendChild(element);
    await element.updateComplete;
    // Set open after initial render to ensure students are applied
    if (options.open) {
      element.open = true;
      await element.updateComplete;
      // Wait for nested qd-modal to move to body
      await new Promise((r) => requestAnimationFrame(r));
    }
    return element;
  }

  /**
   * Helper to find the active qd-modal (moved to body when open)
   */
  function findActiveModal() {
    return document.querySelector('qd-modal[open]');
  }

  /**
   * Get text content from the active modal's content area
   */
  function getModalContent(): string {
    const modal = findActiveModal();
    return modal?.textContent || '';
  }

  /**
   * Query elements inside the active modal's light DOM
   */
  function queryModalContent<T extends Element>(selector: string): T | null {
    const modal = findActiveModal();
    return modal?.querySelector<T>(selector) || null;
  }

  /**
   * Query all elements inside the active modal's light DOM
   */
  function queryAllModalContent<T extends Element>(selector: string): NodeListOf<T> | null {
    const modal = findActiveModal();
    return modal?.querySelectorAll<T>(selector) || null;
  }

  describe('modal behavior (inherited from qd-modal)', () => {
    it('is hidden by default', async () => {
      const el = await createModal();
      expect(el.open).toBe(false);
    });

    it('shows when open=true', async () => {
      const el = await createModal({ open: true });
      expect(el.open).toBe(true);
      // qd-modal is moved to body when open
      const modal = findActiveModal();
      expect(modal?.parentElement).toBe(document.body);
    });

    it('closes on Escape key', async () => {
      const el = await createModal({ open: true });
      // qd-modal listens on document for keydown
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('emits close event on backdrop click', async () => {
      const el = await createModal({ open: true });
      const closeHandler = vi.fn();
      el.addEventListener('close', closeHandler);

      // Backdrop is in qd-modal's shadow DOM (modal is in body when open)
      const modal = findActiveModal();
      const backdrop = modal?.shadowRoot?.querySelector('.backdrop') as HTMLElement;
      backdrop?.click();
      await el.updateComplete;

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('student list rendering', () => {
    it('shows "No students" message when empty', async () => {
      await createModal({ open: true, students: [] });
      const content = getModalContent();
      expect(content).toContain('No student data');
    });

    it('renders student names in table', async () => {
      const students = [
        createStudent({ name: 'Alice' }),
        createStudent({ name: 'Bob', serviceId: 'BOB12345' }),
      ];
      await createModal({ open: true, students });

      const rows = queryAllModalContent('tbody tr');
      expect(rows?.length).toBeGreaterThanOrEqual(2);

      const content = getModalContent();
      expect(content).toContain('Alice');
      expect(content).toContain('Bob');
    });

    it('renders service IDs', async () => {
      const students = [createStudent({ serviceId: 'ABC12345' })];
      await createModal({ open: true, students });

      const content = getModalContent();
      expect(content).toContain('ABC12345');
    });

    it('renders attempted and correct counts', async () => {
      const students = [createStudent({ attempted: 10, correct: 7 })];
      await createModal({ open: true, students });

      const content = getModalContent();
      expect(content).toContain('10');
      expect(content).toContain('7');
    });

    it('calculates and displays percentage', async () => {
      const students = [createStudent({ attempted: 10, correct: 8 })];
      await createModal({ open: true, students });

      const content = getModalContent();
      expect(content).toContain('80%');
    });

    it('shows 0% when no attempts', async () => {
      const students = [createStudent({ attempted: 0, correct: 0 })];
      await createModal({ open: true, students });

      const content = getModalContent();
      expect(content).toContain('0%');
    });

    it('sorts students alphabetically by name', async () => {
      const students = [
        createStudent({ name: 'Zara', serviceId: 'Z123' }),
        createStudent({ name: 'Alice', serviceId: 'A123' }),
        createStudent({ name: 'Mike', serviceId: 'M123' }),
      ];
      await createModal({ open: true, students });

      const rows = queryAllModalContent('tbody tr.student-row');
      const names = Array.from(rows || []).map((row) => row.textContent);
      const aliceIndex = names.findIndex((n) => n?.includes('Alice'));
      const mikeIndex = names.findIndex((n) => n?.includes('Mike'));
      const zaraIndex = names.findIndex((n) => n?.includes('Zara'));

      expect(aliceIndex).toBeLessThan(mikeIndex);
      expect(mikeIndex).toBeLessThan(zaraIndex);
    });
  });

  describe('score column', () => {
    it('shows combined score format', async () => {
      const students = [createStudent({ attempted: 10, correct: 8 })];
      await createModal({ open: true, students });

      const content = getModalContent();
      expect(content).toContain('8/10 (80%)');
    });

    it('highlights perfect scores', async () => {
      const students = [createStudent({ attempted: 5, correct: 5 })];
      await createModal({ open: true, students });

      const perfectCell = queryModalContent('.score-perfect');
      expect(perfectCell).toBeTruthy();
      expect(perfectCell?.textContent).toContain('100%');
    });
  });

  describe('answers column', () => {
    it('shows page names with answers', async () => {
      const students = [
        createStudent({
          pages: {
            'quiz-page-1': {
              state: 'complete',
              answers: [
                { answer: 'A', success: true, timestamp: '' },
                { answer: 'B', success: false, timestamp: '' },
              ],
            },
          },
        }),
      ];
      await createModal({ open: true, students });

      const content = getModalContent();
      expect(content).toContain('quiz-page-1');
      expect(content).toContain('Q1');
      expect(content).toContain('Q2');
      expect(content).toContain('A');
      expect(content).toContain('B');
    });

    it('color-codes correct answers green', async () => {
      const students = [
        createStudent({
          pages: {
            'page-1': {
              state: 'complete',
              answers: [{ answer: '1', success: true, timestamp: '' }],
            },
          },
        }),
      ];
      await createModal({ open: true, students });

      const correctBadge = queryModalContent('.answer-badge.correct');
      expect(correctBadge).toBeTruthy();
    });

    it('color-codes incorrect answers red', async () => {
      const students = [
        createStudent({
          pages: {
            'page-1': {
              state: 'incomplete',
              answers: [{ answer: '2', success: false, timestamp: '' }],
            },
          },
        }),
      ];
      await createModal({ open: true, students });

      const incorrectBadge = queryModalContent('.answer-badge.incorrect');
      expect(incorrectBadge).toBeTruthy();
    });

    it('shows dash for students with no answers', async () => {
      const students = [createStudent({ pages: {} })];
      await createModal({ open: true, students });

      const noAnswers = queryModalContent('.no-answers');
      expect(noAnswers).toBeTruthy();
    });
  });

  describe('close behavior', () => {
    it('provides close() method', async () => {
      const el = await createModal({ open: true });
      el.close();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('provides show() method', async () => {
      const el = await createModal({ open: false });
      el.show();
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('emits close event', async () => {
      const el = await createModal({ open: true });
      const closeHandler = vi.fn();
      el.addEventListener('close', closeHandler);

      // qd-modal listens on document for keydown
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);
      await el.updateComplete;

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has dialog role', async () => {
      await createModal({ open: true });
      // Dialog role is in qd-modal's shadow DOM (modal is in body when open)
      const modal = findActiveModal();
      const dialog = modal?.shadowRoot?.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('has modal title', async () => {
      await createModal({ open: true });
      // Modal title is passed via slot - find via qd-modal in body
      const modal = findActiveModal();
      const headerSlot = modal?.shadowRoot?.querySelector('slot[name="header"]') as HTMLSlotElement;
      const assignedElements = headerSlot?.assignedElements() || [];
      const headerText = assignedElements.map((el) => el.textContent).join('');
      expect(headerText).toContain('Student Scores');
    });
  });
});
