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
    if (options.open) element.open = true;
    if (options.students) element.students = options.students;
    container.appendChild(element);
    await element.updateComplete;
    return element;
  }

  describe('modal behavior (inherited from qd-modal)', () => {
    it('is hidden by default', async () => {
      const el = await createModal();
      expect(el.open).toBe(false);
    });

    it('shows when open=true', async () => {
      const el = await createModal({ open: true });
      expect(el.open).toBe(true);
      // The backdrop is inside the nested qd-modal component
      const qdModal = el.shadowRoot?.querySelector('qd-modal');
      const backdrop = qdModal?.shadowRoot?.querySelector('.modal-backdrop');
      expect(backdrop).toBeTruthy();
    });

    it('closes on Escape key', async () => {
      const el = await createModal({ open: true });
      // Send escape to the nested qd-modal
      const qdModal = el.shadowRoot?.querySelector('qd-modal');
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      qdModal?.dispatchEvent(event);
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('emits close event on backdrop click', async () => {
      const el = await createModal({ open: true });
      const closeHandler = vi.fn();
      el.addEventListener('close', closeHandler);

      // Click backdrop in nested qd-modal
      const qdModal = el.shadowRoot?.querySelector('qd-modal');
      const backdrop = qdModal?.shadowRoot?.querySelector('.modal-backdrop') as HTMLElement;
      backdrop?.click();
      await el.updateComplete;

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('student list rendering', () => {
    it('shows "No students" message when empty', async () => {
      const el = await createModal({ open: true, students: [] });
      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('No student data');
    });

    it('renders student names in table', async () => {
      const students = [
        createStudent({ name: 'Alice' }),
        createStudent({ name: 'Bob', serviceId: 'BOB12345' }),
      ];
      const el = await createModal({ open: true, students });

      const rows = el.shadowRoot?.querySelectorAll('tbody tr');
      expect(rows?.length).toBeGreaterThanOrEqual(2);

      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('Alice');
      expect(content).toContain('Bob');
    });

    it('renders service IDs', async () => {
      const students = [createStudent({ serviceId: 'ABC12345' })];
      const el = await createModal({ open: true, students });

      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('ABC12345');
    });

    it('renders attempted and correct counts', async () => {
      const students = [createStudent({ attempted: 10, correct: 7 })];
      const el = await createModal({ open: true, students });

      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('10');
      expect(content).toContain('7');
    });

    it('calculates and displays percentage', async () => {
      const students = [createStudent({ attempted: 10, correct: 8 })];
      const el = await createModal({ open: true, students });

      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('80%');
    });

    it('shows 0% when no attempts', async () => {
      const students = [createStudent({ attempted: 0, correct: 0 })];
      const el = await createModal({ open: true, students });

      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('0%');
    });

    it('sorts students alphabetically by name', async () => {
      const students = [
        createStudent({ name: 'Zara', serviceId: 'Z123' }),
        createStudent({ name: 'Alice', serviceId: 'A123' }),
        createStudent({ name: 'Mike', serviceId: 'M123' }),
      ];
      const el = await createModal({ open: true, students });

      const rows = el.shadowRoot?.querySelectorAll('tbody tr.student-row');
      const names = Array.from(rows || []).map((row) => row.textContent);
      const aliceIndex = names.findIndex((n) => n?.includes('Alice'));
      const mikeIndex = names.findIndex((n) => n?.includes('Mike'));
      const zaraIndex = names.findIndex((n) => n?.includes('Zara'));

      expect(aliceIndex).toBeLessThan(mikeIndex);
      expect(mikeIndex).toBeLessThan(zaraIndex);
    });
  });

  describe('row expansion', () => {
    it('starts with all rows expanded by default', async () => {
      const students = [
        createStudent({
          name: 'Alice',
          serviceId: 'A123',
          pages: {
            'page-1': {
              state: 'complete',
              answers: [{ answer: '1', success: true, timestamp: '' }],
            },
          },
        }),
      ];
      const el = await createModal({ open: true, students });

      // Detail rows should be visible
      const detailRows = el.shadowRoot?.querySelectorAll('.detail-row');
      expect(detailRows?.length).toBeGreaterThan(0);
    });

    it('toggles expansion on row click', async () => {
      const students = [
        createStudent({
          name: 'Alice',
          serviceId: 'A123',
          pages: {
            'page-1': {
              state: 'complete',
              answers: [{ answer: '1', success: true, timestamp: '' }],
            },
          },
        }),
      ];
      const el = await createModal({ open: true, students });

      // Click to collapse
      const row = el.shadowRoot?.querySelector('.student-row') as HTMLElement;
      row?.click();
      await el.updateComplete;

      // Should show collapsed indicator
      const expandIcon = row?.querySelector('.expand-icon');
      expect(expandIcon?.textContent?.trim()).toBe('▶');
    });

    it('shows expand/collapse indicator', async () => {
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
      const el = await createModal({ open: true, students });

      const icon = el.shadowRoot?.querySelector('.expand-icon');
      expect(icon).toBeTruthy();
      // Default expanded = ▼
      expect(icon?.textContent?.trim()).toBe('▼');
    });
  });

  describe('per-page breakdown', () => {
    it('shows page names in expanded view', async () => {
      const students = [
        createStudent({
          pages: {
            'quiz-page-1': { state: 'complete', answers: [] },
            'quiz-page-2': { state: 'incomplete', answers: [] },
          },
        }),
      ];
      const el = await createModal({ open: true, students });

      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('quiz-page-1');
      expect(content).toContain('quiz-page-2');
    });

    it('shows answers with question numbers', async () => {
      const students = [
        createStudent({
          pages: {
            'page-1': {
              state: 'complete',
              answers: [
                { answer: 'A', success: true, timestamp: '' },
                { answer: 'B', success: false, timestamp: '' },
              ],
            },
          },
        }),
      ];
      const el = await createModal({ open: true, students });

      const content = el.shadowRoot?.textContent || '';
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
      const el = await createModal({ open: true, students });

      const correctBadge = el.shadowRoot?.querySelector('.answer-badge.correct');
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
      const el = await createModal({ open: true, students });

      const incorrectBadge = el.shadowRoot?.querySelector('.answer-badge.incorrect');
      expect(incorrectBadge).toBeTruthy();
    });

    it('shows empty state for students with no pages', async () => {
      const students = [createStudent({ pages: {} })];
      const el = await createModal({ open: true, students });

      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('No quiz pages');
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

      // Trigger close via escape on nested qd-modal
      const qdModal = el.shadowRoot?.querySelector('qd-modal');
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      qdModal?.dispatchEvent(event);
      await el.updateComplete;

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has dialog role', async () => {
      const el = await createModal({ open: true });
      // Dialog role is in nested qd-modal
      const qdModal = el.shadowRoot?.querySelector('qd-modal');
      const dialog = qdModal?.shadowRoot?.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('has modal title', async () => {
      const el = await createModal({ open: true });
      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('Student Scores');
    });
  });
});
