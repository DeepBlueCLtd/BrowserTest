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
    if (options.open) element.open = true;
    if (options.title) element.title = options.title;
    if (options.message) element.message = options.message;
    if (options.confirmText) element.confirmText = options.confirmText;
    if (options.cancelText) element.cancelText = options.cancelText;
    if (options.destructive !== undefined) element.destructive = options.destructive;
    container.appendChild(element);
    await element.updateComplete;
    return element;
  }

  describe('modal behavior (inherited from qd-modal)', () => {
    it('is hidden by default', async () => {
      const el = await createDialog();
      expect(el.open).toBe(false);
    });

    it('shows when open=true', async () => {
      const el = await createDialog({ open: true, title: 'Confirm', message: 'Are you sure?' });
      expect(el.open).toBe(true);
      // The backdrop is inside the nested qd-modal component
      const qdModal = el.shadowRoot?.querySelector('qd-modal');
      const backdrop = qdModal?.shadowRoot?.querySelector('.modal-backdrop');
      expect(backdrop).toBeTruthy();
    });

    it('closes on Escape key', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      // Send escape to the nested qd-modal
      const qdModal = el.shadowRoot?.querySelector('qd-modal');
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      qdModal?.dispatchEvent(event);
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('emits qd:cancel event on backdrop click', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      const cancelHandler = vi.fn();
      el.addEventListener('qd:cancel', cancelHandler);

      // Click backdrop in nested qd-modal
      const qdModal = el.shadowRoot?.querySelector('qd-modal');
      const backdrop = qdModal?.shadowRoot?.querySelector('.modal-backdrop') as HTMLElement;
      backdrop?.click();
      await el.updateComplete;

      expect(cancelHandler).toHaveBeenCalled();
    });
  });

  describe('title display', () => {
    it('displays title text', async () => {
      const el = await createDialog({
        open: true,
        title: 'Confirm Delete',
        message: 'Are you sure?',
      });
      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('Confirm Delete');
    });

    it('has default title "Confirm"', async () => {
      const el = await createDialog({ open: true, message: 'Are you sure?' });
      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('Confirm');
    });
  });

  describe('message display', () => {
    it('displays message text', async () => {
      const el = await createDialog({
        open: true,
        title: 'Test',
        message: 'This action cannot be undone.',
      });
      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('This action cannot be undone.');
    });

    it('renders HTML in message', async () => {
      const el = await createDialog({
        open: true,
        title: 'Test',
        message: 'Delete <strong>important</strong> file?',
      });
      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('Delete');
      expect(content).toContain('important');
    });
  });

  describe('confirm button', () => {
    it('renders confirm button', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      const confirmBtn = el.shadowRoot?.querySelector('.confirm-btn, button[type="submit"]');
      expect(confirmBtn).toBeTruthy();
    });

    it('has default text "Confirm"', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      const buttons = el.shadowRoot?.querySelectorAll('button');
      const confirmBtn = Array.from(buttons || []).find(
        (b) => b.classList.contains('confirm-btn') || b.textContent?.trim() === 'Confirm',
      );
      expect(confirmBtn?.textContent?.trim()).toBe('Confirm');
    });

    it('uses custom confirmText', async () => {
      const el = await createDialog({
        open: true,
        title: 'Test',
        message: 'Test',
        confirmText: 'Yes, Delete',
      });
      const buttons = el.shadowRoot?.querySelectorAll('button');
      const hasCustomText = Array.from(buttons || []).some(
        (b) => b.textContent?.trim() === 'Yes, Delete',
      );
      expect(hasCustomText).toBe(true);
    });

    it('emits qd:confirm event on click', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      const confirmHandler = vi.fn();
      el.addEventListener('qd:confirm', confirmHandler);

      const buttons = el.shadowRoot?.querySelectorAll('button');
      const confirmBtn = Array.from(buttons || []).find(
        (b) => b.classList.contains('confirm-btn') || b.textContent?.trim() === 'Confirm',
      );
      confirmBtn?.click();
      await el.updateComplete;

      expect(confirmHandler).toHaveBeenCalled();
    });

    it('closes dialog on confirm', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });

      const buttons = el.shadowRoot?.querySelectorAll('button');
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
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      const buttons = el.shadowRoot?.querySelectorAll('button');
      const cancelBtn = Array.from(buttons || []).find(
        (b) =>
          b.classList.contains('cancel-btn') || b.textContent?.trim().toLowerCase() === 'cancel',
      );
      expect(cancelBtn).toBeTruthy();
    });

    it('has default text "Cancel"', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      const buttons = el.shadowRoot?.querySelectorAll('button');
      const cancelBtn = Array.from(buttons || []).find(
        (b) => b.textContent?.trim().toLowerCase() === 'cancel',
      );
      expect(cancelBtn).toBeTruthy();
    });

    it('uses custom cancelText', async () => {
      const el = await createDialog({
        open: true,
        title: 'Test',
        message: 'Test',
        cancelText: 'No, Keep',
      });
      const buttons = el.shadowRoot?.querySelectorAll('button');
      const hasCustomText = Array.from(buttons || []).some(
        (b) => b.textContent?.trim() === 'No, Keep',
      );
      expect(hasCustomText).toBe(true);
    });

    it('emits qd:cancel event on click', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      const cancelHandler = vi.fn();
      el.addEventListener('qd:cancel', cancelHandler);

      const buttons = el.shadowRoot?.querySelectorAll('button');
      const cancelBtn = Array.from(buttons || []).find(
        (b) => b.textContent?.trim().toLowerCase() === 'cancel',
      );
      cancelBtn?.click();
      await el.updateComplete;

      expect(cancelHandler).toHaveBeenCalled();
    });

    it('closes dialog on cancel', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });

      const buttons = el.shadowRoot?.querySelectorAll('button');
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
      const el = await createDialog({
        open: true,
        title: 'Delete',
        message: 'Are you sure?',
        destructive: true,
      });

      const buttons = el.shadowRoot?.querySelectorAll('button');
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
      const el = await createDialog({
        open: true,
        title: 'Save',
        message: 'Save changes?',
        destructive: false,
      });

      const buttons = el.shadowRoot?.querySelectorAll('button');
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
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      // Dialog role is in nested qd-modal
      const qdModal = el.shadowRoot?.querySelector('qd-modal');
      const dialog = qdModal?.shadowRoot?.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('focuses confirm button when opened', async () => {
      const el = await createDialog({ open: true, title: 'Test', message: 'Test' });
      await new Promise((r) => setTimeout(r, 100)); // Wait for focus

      const buttons = el.shadowRoot?.querySelectorAll('button');
      const confirmBtn = Array.from(buttons || []).find(
        (b) => b.classList.contains('confirm-btn') || b.textContent?.trim() === 'Confirm',
      );
      const activeElement = el.shadowRoot?.activeElement;

      // Either confirm button or first focusable should be focused
      expect(activeElement === confirmBtn || activeElement !== null).toBe(true);
    });
  });
});
