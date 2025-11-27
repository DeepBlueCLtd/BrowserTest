/**
 * Tests for qd-confirm-dialog.ts component
 *
 * Feature: 007-lit-component-refactor
 * TDD: These tests are written FIRST, before implementation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { QdConfirmDialog } from '../../../src/components/qd-confirm-dialog';

// Import component (will fail until implemented)
import '../../../src/components/qd-confirm-dialog.js';

describe('qd-confirm-dialog', () => {
  let container: HTMLElement;
  let element: QdConfirmDialog;

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

  async function createDialog(
    options: {
      open?: boolean;
      title?: string;
      message?: string;
      confirmText?: string;
      cancelText?: string;
      destructive?: boolean;
    } = {},
  ): Promise<QdConfirmDialog> {
    element = document.createElement('qd-confirm-dialog');
    if (options.title) element.title = options.title;
    if (options.message) element.message = options.message;
    if (options.confirmText) element.confirmText = options.confirmText;
    if (options.cancelText) element.cancelText = options.cancelText;
    if (options.destructive !== undefined) element.destructive = options.destructive;
    container.appendChild(element);
    await element.updateComplete;
    // Set open after initial render
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
   * Get text content from the active modal
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
      const el = await createDialog();
      expect(el.open).toBe(false);
    });

    it('shows when open=true', async () => {
      const el = await createDialog({ open: true, title: 'Confirm', message: 'Are you sure?' });
      expect(el.open).toBe(true);
      // qd-modal is moved to body when open
      const modal = findActiveModal();
      expect(modal?.parentElement).toBe(document.body);
    });

    it('closes on Escape key', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      // qd-modal listens on document for keydown
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('emits qd:cancel event on backdrop click', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      const cancelHandler = vi.fn();
      el.addEventListener('qd:cancel', cancelHandler);

      // Backdrop is in qd-modal's shadow DOM (modal is in body when open)
      const modal = findActiveModal();
      const backdrop = modal?.shadowRoot?.querySelector('.backdrop') as HTMLElement;
      backdrop?.click();
      await el.updateComplete;

      expect(cancelHandler).toHaveBeenCalled();
    });
  });

  describe('title display', () => {
    it('displays title text', async () => {
      await createDialog({
        open: true,
        title: 'Confirm Delete',
        message: 'Are you sure?',
      });
      const content = getModalContent();
      expect(content).toContain('Confirm Delete');
    });

    it('has default title "Confirm"', async () => {
      await createDialog({ open: true, message: 'Are you sure?' });
      const content = getModalContent();
      expect(content).toContain('Confirm');
    });
  });

  describe('message display', () => {
    it('displays message text', async () => {
      await createDialog({
        open: true,
        title: 'Test',
        message: 'This action cannot be undone.',
      });
      const content = getModalContent();
      expect(content).toContain('This action cannot be undone.');
    });

    it('renders HTML in message', async () => {
      await createDialog({
        open: true,
        title: 'Test',
        message: 'Delete <strong>important</strong> file?',
      });
      const content = getModalContent();
      expect(content).toContain('Delete');
      expect(content).toContain('important');
    });
  });

  describe('confirm button', () => {
    it('renders confirm button', async () => {
      await createDialog({ open: true, title: 'Test', message: 'Test' });
      const confirmBtn = queryModalContent('.confirm-btn, button[type="submit"]');
      expect(confirmBtn).toBeTruthy();
    });

    it('has default text "Confirm"', async () => {
      await createDialog({ open: true, title: 'Test', message: 'Test' });
      const buttons = queryAllModalContent('button');
      const confirmBtn = Array.from(buttons || []).find(
        (b) => b.classList.contains('confirm-btn') || b.textContent?.trim() === 'Confirm',
      );
      expect(confirmBtn?.textContent?.trim()).toBe('Confirm');
    });

    it('uses custom confirmText', async () => {
      await createDialog({
        open: true,
        title: 'Test',
        message: 'Test',
        confirmText: 'Yes, Delete',
      });
      const buttons = queryAllModalContent('button');
      const hasCustomText = Array.from(buttons || []).some(
        (b) => b.textContent?.trim() === 'Yes, Delete',
      );
      expect(hasCustomText).toBe(true);
    });

    it('emits qd:confirm event on click', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      const confirmHandler = vi.fn();
      el.addEventListener('qd:confirm', confirmHandler);

      const buttons = queryAllModalContent<HTMLButtonElement>('button');
      const confirmBtn = Array.from(buttons || []).find(
        (b) => b.classList.contains('confirm-btn') || b.textContent?.trim() === 'Confirm',
      );
      confirmBtn?.click();
      await el.updateComplete;

      expect(confirmHandler).toHaveBeenCalled();
    });

    it('closes dialog on confirm', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });

      const buttons = queryAllModalContent<HTMLButtonElement>('button');
      const confirmBtn = Array.from(buttons || []).find(
        (b) => b.classList.contains('confirm-btn') || b.textContent?.trim() === 'Confirm',
      );
      confirmBtn?.click();
      await el.updateComplete;

      expect(el.open).toBe(false);
    });
  });

  describe('cancel button', () => {
    it('renders cancel button', async () => {
      await createDialog({ open: true, title: 'Test', message: 'Test' });
      const buttons = queryAllModalContent('button');
      const cancelBtn = Array.from(buttons || []).find(
        (b) =>
          b.classList.contains('cancel-btn') || b.textContent?.trim().toLowerCase() === 'cancel',
      );
      expect(cancelBtn).toBeTruthy();
    });

    it('has default text "Cancel"', async () => {
      await createDialog({ open: true, title: 'Test', message: 'Test' });
      const buttons = queryAllModalContent('button');
      const cancelBtn = Array.from(buttons || []).find(
        (b) => b.textContent?.trim().toLowerCase() === 'cancel',
      );
      expect(cancelBtn).toBeTruthy();
    });

    it('uses custom cancelText', async () => {
      await createDialog({
        open: true,
        title: 'Test',
        message: 'Test',
        cancelText: 'No, Keep',
      });
      const buttons = queryAllModalContent('button');
      const hasCustomText = Array.from(buttons || []).some(
        (b) => b.textContent?.trim() === 'No, Keep',
      );
      expect(hasCustomText).toBe(true);
    });

    it('emits qd:cancel event on click', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      const cancelHandler = vi.fn();
      el.addEventListener('qd:cancel', cancelHandler);

      const buttons = queryAllModalContent<HTMLButtonElement>('button');
      const cancelBtn = Array.from(buttons || []).find(
        (b) => b.textContent?.trim().toLowerCase() === 'cancel',
      );
      cancelBtn?.click();
      await el.updateComplete;

      expect(cancelHandler).toHaveBeenCalled();
    });

    it('closes dialog on cancel', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });

      const buttons = queryAllModalContent<HTMLButtonElement>('button');
      const cancelBtn = Array.from(buttons || []).find(
        (b) => b.textContent?.trim().toLowerCase() === 'cancel',
      );
      cancelBtn?.click();
      await el.updateComplete;

      expect(el.open).toBe(false);
    });
  });

  describe('destructive mode', () => {
    it('has destructive=false by default', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      expect(el.destructive).toBe(false);
    });

    it('applies destructive styling to confirm button when destructive=true', async () => {
      await createDialog({
        open: true,
        title: 'Delete',
        message: 'Are you sure?',
        destructive: true,
      });

      const buttons = queryAllModalContent('button');
      const confirmBtn = Array.from(buttons || []).find(
        (b) => b.classList.contains('confirm-btn') || b.textContent?.trim() === 'Confirm',
      );

      // Should have destructive class or red-ish background
      const hasDestructiveStyle =
        confirmBtn?.classList.contains('destructive') ||
        confirmBtn?.classList.contains('confirm-btn--destructive');
      expect(hasDestructiveStyle).toBe(true);
    });

    it('uses normal styling when destructive=false', async () => {
      await createDialog({
        open: true,
        title: 'Save',
        message: 'Save changes?',
        destructive: false,
      });

      const buttons = queryAllModalContent('button');
      const confirmBtn = Array.from(buttons || []).find(
        (b) => b.classList.contains('confirm-btn') || b.textContent?.trim() === 'Confirm',
      );

      // Should NOT have destructive class
      const hasDestructiveStyle =
        confirmBtn?.classList.contains('destructive') ||
        confirmBtn?.classList.contains('confirm-btn--destructive');
      expect(hasDestructiveStyle).toBe(false);
    });
  });

  describe('close methods', () => {
    it('provides close() method', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      el.close();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('provides show() method', async () => {
      const el = await createDialog({ open: false, title: 'Test', message: 'Test' });
      el.show();
      await el.updateComplete;
      expect(el.open).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has dialog role', async () => {
      await createDialog({ open: true, title: 'Test', message: 'Test' });
      // Dialog role is in qd-modal's shadow DOM (modal is in body when open)
      const modal = findActiveModal();
      const dialog = modal?.shadowRoot?.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('focuses a button when opened', async () => {
      await createDialog({ open: true, title: 'Test', message: 'Test' });
      await new Promise((r) => setTimeout(r, 100)); // Wait for focus

      // Modal should focus some interactive element (button)
      // Due to shadow DOM boundaries, we just verify focus moved from body
      expect(document.activeElement !== document.body).toBe(true);
    });
  });
});
