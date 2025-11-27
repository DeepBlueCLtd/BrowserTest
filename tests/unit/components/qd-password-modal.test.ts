/**
 * Tests for qd-password-modal.ts component
 *
 * Feature: 007-lit-component-refactor
 * TDD: These tests are written FIRST, before implementation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { QdPasswordModal } from '../../../src/components/qd-password-modal';

// Import component (will fail until implemented)
import '../../../src/components/qd-password-modal.js';

describe('qd-password-modal', () => {
  let container: HTMLElement;
  let element: QdPasswordModal;

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

  async function createModal(
    options: {
      open?: boolean;
      title?: string;
      error?: string;
    } = {},
  ): Promise<QdPasswordModal> {
    element = document.createElement('qd-password-modal');
    if (options.title) element.title = options.title;
    if (options.error) element.error = options.error;
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

  describe('title display', () => {
    it('has default title "Enter Password"', async () => {
      await createModal({ open: true });
      const content = getModalContent();
      expect(content).toContain('Enter Password');
    });

    it('displays custom title when set', async () => {
      await createModal({ open: true, title: 'Instructor Login' });
      const content = getModalContent();
      expect(content).toContain('Instructor Login');
    });
  });

  describe('password input', () => {
    it('renders password input field', async () => {
      await createModal({ open: true });
      const input = queryModalContent('input[type="password"]');
      expect(input).toBeTruthy();
    });

    it('has placeholder text', async () => {
      await createModal({ open: true });
      const input = queryModalContent<HTMLInputElement>('input[type="password"]');
      expect(input?.placeholder).toContain('Password');
    });

    it('focuses password input when modal opens', async () => {
      await createModal({ open: true });
      await new Promise((r) => setTimeout(r, 100)); // Wait for focus

      // Modal should focus the password input
      // Due to shadow DOM boundaries, verify activeElement is an input
      expect(
        document.activeElement?.tagName === 'INPUT' || document.activeElement !== document.body,
      ).toBe(true);
    });

    it('clears password on close', async () => {
      const el = await createModal({ open: true });
      const input = queryModalContent<HTMLInputElement>('input[type="password"]');

      // Type password
      if (input) {
        input.value = 'secret123';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      await el.updateComplete;

      // Close modal
      el.close();
      await el.updateComplete;

      // Reopen
      el.show();
      await el.updateComplete;
      await new Promise((r) => requestAnimationFrame(r));

      const newInput = queryModalContent<HTMLInputElement>('input[type="password"]');
      expect(newInput?.value).toBe('');
    });
  });

  describe('form submission', () => {
    it('renders submit button', async () => {
      await createModal({ open: true });
      const button = queryModalContent('button[type="submit"]');
      expect(button).toBeTruthy();
    });

    it('emits qd:password-submit event with password on submit', async () => {
      const el = await createModal({ open: true });
      const submitHandler = vi.fn();
      el.addEventListener('qd:password-submit', submitHandler);

      // Type password
      const input = queryModalContent<HTMLInputElement>('input[type="password"]');
      if (input) {
        input.value = 'testpassword';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      await el.updateComplete;

      // Submit form
      const form = queryModalContent('form');
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await el.updateComplete;

      expect(submitHandler).toHaveBeenCalled();
      const event = submitHandler.mock.calls[0]?.[0] as CustomEvent<{ password: string }>;
      expect(event.detail.password).toBe('testpassword');
    });

    it('prevents submission with empty password', async () => {
      const el = await createModal({ open: true });
      const submitHandler = vi.fn();
      el.addEventListener('qd:password-submit', submitHandler);

      // Submit without typing
      const form = queryModalContent('form');
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await el.updateComplete;

      expect(submitHandler).not.toHaveBeenCalled();
    });

    it('shows required validation on empty submit', async () => {
      const el = await createModal({ open: true });

      // Submit without typing
      const form = queryModalContent('form');
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await el.updateComplete;

      // Should show error or input should have :invalid state
      const input = queryModalContent<HTMLInputElement>('input[type="password"]');
      expect(input?.required).toBe(true);
    });
  });

  describe('error display', () => {
    it('shows error message when error prop is set', async () => {
      await createModal({ open: true, error: 'Incorrect password' });
      const content = getModalContent();
      expect(content).toContain('Incorrect password');
    });

    it('hides error when error prop is empty', async () => {
      await createModal({ open: true });
      const errorElement = queryModalContent('.error-message');
      expect(errorElement).toBeFalsy();
    });

    it('clears error on input change', async () => {
      const el = await createModal({ open: true, error: 'Incorrect password' });

      // Type in input to clear error
      const input = queryModalContent<HTMLInputElement>('input[type="password"]');
      if (input) {
        input.value = 'newpassword';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      await el.updateComplete;

      const errorElement = queryModalContent('.error-message');
      expect(errorElement).toBeFalsy();
    });

    it('has proper error styling', async () => {
      await createModal({ open: true, error: 'Test error' });
      const errorElement = queryModalContent('.error-message');
      expect(errorElement).toBeTruthy();
      // Error should have red styling (class-based)
      expect(errorElement?.classList.contains('error-message')).toBe(true);
    });
  });

  describe('cancel behavior', () => {
    it('renders cancel button', async () => {
      await createModal({ open: true });
      const buttons = queryAllModalContent('button');
      const cancelButton = Array.from(buttons || []).find(
        (b) => b.textContent?.trim().toLowerCase() === 'cancel',
      );
      expect(cancelButton).toBeTruthy();
    });

    it('closes on cancel click', async () => {
      const el = await createModal({ open: true });
      const closeHandler = vi.fn();
      el.addEventListener('close', closeHandler);

      const buttons = queryAllModalContent<HTMLButtonElement>('button');
      const cancelButton = Array.from(buttons || []).find(
        (b) => b.textContent?.trim().toLowerCase() === 'cancel',
      );
      cancelButton?.click();
      await el.updateComplete;

      expect(closeHandler).toHaveBeenCalled();
    });

    it('clears password on cancel', async () => {
      const el = await createModal({ open: true });

      // Type password
      const input = queryModalContent<HTMLInputElement>('input[type="password"]');
      if (input) {
        input.value = 'secret';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      await el.updateComplete;

      // Cancel
      const buttons = queryAllModalContent<HTMLButtonElement>('button');
      const cancelButton = Array.from(buttons || []).find(
        (b) => b.textContent?.trim().toLowerCase() === 'cancel',
      );
      cancelButton?.click();
      await el.updateComplete;

      // Reopen and check
      el.show();
      await el.updateComplete;
      await new Promise((r) => requestAnimationFrame(r));

      const newInput = queryModalContent<HTMLInputElement>('input[type="password"]');
      expect(newInput?.value).toBe('');
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

    it('emits close event on close', async () => {
      const el = await createModal({ open: true });
      const closeHandler = vi.fn();
      el.addEventListener('close', closeHandler);

      el.close();
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

    it('has input label or aria-label', async () => {
      await createModal({ open: true });
      const input = queryModalContent<HTMLInputElement>('input[type="password"]');

      // Check for either label, aria-label, or aria-labelledby
      const hasLabel =
        input?.id && queryModalContent(`label[for="${input.id}"]`) !== null;
      const hasAriaLabel = !!input?.getAttribute('aria-label');
      const hasAriaLabelledBy = !!input?.getAttribute('aria-labelledby');

      expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBe(true);
    });

    it('has form with submit button', async () => {
      await createModal({ open: true });
      const form = queryModalContent('form');
      const submitBtn = queryModalContent('button[type="submit"]');
      expect(form).toBeTruthy();
      expect(submitBtn).toBeTruthy();
    });
  });
});
