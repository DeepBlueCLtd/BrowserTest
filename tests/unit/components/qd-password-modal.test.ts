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
  });

  async function createModal(
    options: {
      open?: boolean;
      title?: string;
      error?: string;
    } = {},
  ): Promise<QdPasswordModal> {
    element = document.createElement('qd-password-modal');
    if (options.open) element.open = true;
    if (options.title) element.title = options.title;
    if (options.error) element.error = options.error;
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
      // Portal renders backdrop to document.body, not shadowRoot
      const backdrop = document.querySelector('.qd-modal-backdrop');
      expect(backdrop).toBeTruthy();
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

      // Portal renders backdrop to document.body
      const backdrop = document.querySelector('.qd-modal-backdrop') as HTMLElement;
      backdrop?.click();
      await el.updateComplete;

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('title display', () => {
    it('has default title "Enter Password"', async () => {
      const el = await createModal({ open: true });
      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('Enter Password');
    });

    it('displays custom title when set', async () => {
      const el = await createModal({ open: true, title: 'Instructor Login' });
      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('Instructor Login');
    });
  });

  describe('password input', () => {
    it('renders password input field', async () => {
      const el = await createModal({ open: true });
      const input = el.shadowRoot?.querySelector('input[type="password"]');
      expect(input).toBeTruthy();
    });

    it('has placeholder text', async () => {
      const el = await createModal({ open: true });
      const input = el.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
      expect(input?.placeholder).toContain('Password');
    });

    it('focuses password input when modal opens', async () => {
      await createModal({ open: true });
      await new Promise((r) => setTimeout(r, 100)); // Wait for focus

      // Portal renders form to document.body, so check document.activeElement
      const input = document.querySelector('.qd-modal-backdrop input[type="password"]');
      expect(document.activeElement).toBe(input);
    });

    it('clears password on close', async () => {
      const el = await createModal({ open: true });
      const input = el.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;

      // Type password
      input.value = 'secret123';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      // Close modal
      el.close();
      await el.updateComplete;

      // Reopen
      el.show();
      await el.updateComplete;

      const newInput = el.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
      expect(newInput?.value).toBe('');
    });
  });

  describe('form submission', () => {
    it('renders submit button', async () => {
      const el = await createModal({ open: true });
      const button = el.shadowRoot?.querySelector('button[type="submit"]');
      expect(button).toBeTruthy();
    });

    it('emits qd:password-submit event with password on submit', async () => {
      const el = await createModal({ open: true });
      const submitHandler = vi.fn();
      el.addEventListener('qd:password-submit', submitHandler);

      // Type password
      const input = el.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
      input.value = 'testpassword';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      // Submit form
      const form = el.shadowRoot?.querySelector('form');
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
      const form = el.shadowRoot?.querySelector('form');
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await el.updateComplete;

      expect(submitHandler).not.toHaveBeenCalled();
    });

    it('shows required validation on empty submit', async () => {
      const el = await createModal({ open: true });

      // Submit without typing
      const form = el.shadowRoot?.querySelector('form');
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await el.updateComplete;

      // Should show error or input should have :invalid state
      const input = el.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
      expect(input?.required).toBe(true);
    });
  });

  describe('error display', () => {
    it('shows error message when error prop is set', async () => {
      const el = await createModal({ open: true, error: 'Incorrect password' });
      const content = el.shadowRoot?.textContent || '';
      expect(content).toContain('Incorrect password');
    });

    it('hides error when error prop is empty', async () => {
      const el = await createModal({ open: true });
      const errorElement = el.shadowRoot?.querySelector('.error-message');
      expect(errorElement).toBeFalsy();
    });

    it('clears error on input change', async () => {
      const el = await createModal({ open: true, error: 'Incorrect password' });

      // Type in input to clear error
      const input = el.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
      input.value = 'newpassword';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      const errorElement = el.shadowRoot?.querySelector('.error-message');
      expect(errorElement).toBeFalsy();
    });

    it('has proper error styling', async () => {
      const el = await createModal({ open: true, error: 'Test error' });
      const errorElement = el.shadowRoot?.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      // Error should have red styling (class-based)
      expect(errorElement?.classList.contains('error-message')).toBe(true);
    });
  });

  describe('cancel behavior', () => {
    it('renders cancel button', async () => {
      const el = await createModal({ open: true });
      const buttons = el.shadowRoot?.querySelectorAll('button');
      const cancelButton = Array.from(buttons || []).find(
        (b) => b.textContent?.trim().toLowerCase() === 'cancel',
      );
      expect(cancelButton).toBeTruthy();
    });

    it('closes on cancel click', async () => {
      const el = await createModal({ open: true });
      const closeHandler = vi.fn();
      el.addEventListener('close', closeHandler);

      const buttons = el.shadowRoot?.querySelectorAll('button');
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
      const input = el.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
      input.value = 'secret';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      // Cancel
      const buttons = el.shadowRoot?.querySelectorAll('button');
      const cancelButton = Array.from(buttons || []).find(
        (b) => b.textContent?.trim().toLowerCase() === 'cancel',
      );
      cancelButton?.click();
      await el.updateComplete;

      // Reopen and check
      el.show();
      await el.updateComplete;

      const newInput = el.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
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
      // Portal renders dialog to document.body
      const dialog = document.querySelector('.qd-modal-backdrop [role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('has input label or aria-label', async () => {
      const el = await createModal({ open: true });
      const input = el.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;

      // Check for either label, aria-label, or aria-labelledby
      const hasLabel =
        input?.id && el.shadowRoot?.querySelector(`label[for="${input.id}"]`) !== null;
      const hasAriaLabel = !!input?.getAttribute('aria-label');
      const hasAriaLabelledBy = !!input?.getAttribute('aria-labelledby');

      expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBe(true);
    });

    it('has form with submit button', async () => {
      const el = await createModal({ open: true });
      const form = el.shadowRoot?.querySelector('form');
      const submitBtn = el.shadowRoot?.querySelector('button[type="submit"]');
      expect(form).toBeTruthy();
      expect(submitBtn).toBeTruthy();
    });
  });
});
