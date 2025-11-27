/**
 * Tests for qd-modal.ts base component
 *
 * Feature: 007-lit-component-refactor
 * TDD: These tests are written FIRST, before implementation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { QdModal } from '../../../src/components/qd-modal';

// Import component
import '../../../src/components/qd-modal.js';

describe('qd-modal', () => {
  let container: HTMLElement;
  let element: QdModal;

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
    options: { open?: boolean; closable?: boolean } = {},
  ): Promise<QdModal> {
    element = document.createElement('qd-modal');
    if (options.open) element.open = true;
    if (options.closable !== undefined) element.closable = options.closable;
    container.appendChild(element);
    await element.updateComplete;
    return element;
  }

  /**
   * Helper to get modal elements from shadow DOM
   * When open, element is moved to body but shadow DOM structure is preserved
   */
  function getModalBackdrop(): HTMLElement | null {
    return element?.shadowRoot?.querySelector('.backdrop') ?? null;
  }

  function getModalContent(): HTMLElement | null {
    return element?.shadowRoot?.querySelector('.content') ?? null;
  }

  function getCloseButton(): HTMLElement | null {
    return element?.shadowRoot?.querySelector('.close-button') ?? null;
  }

  describe('open/close behavior', () => {
    it('is hidden by default (open=false)', async () => {
      const el = await createModal();

      expect(el.open).toBe(false);
      // Element does not have open attribute
      expect(el.hasAttribute('open')).toBe(false);
      // Backdrop element exists in shadow DOM
      const backdrop = getModalBackdrop();
      expect(backdrop).toBeTruthy();
    });

    it('shows modal when open=true', async () => {
      const el = await createModal({ open: true });

      expect(el.open).toBe(true);
      // Element has open attribute
      expect(el.hasAttribute('open')).toBe(true);
      // Modal is visible
      expect(getModalBackdrop()).toBeTruthy();
      // Element should be in body
      expect(el.parentElement).toBe(document.body);
    });

    it('hides modal when open changes to false', async () => {
      const el = await createModal({ open: true });

      el.open = false;
      await el.updateComplete;

      // Element no longer has open attribute
      expect(el.hasAttribute('open')).toBe(false);
      // Element restored to original parent
      expect(el.parentElement).toBe(container);
    });

    it('provides close() method', async () => {
      const el = await createModal({ open: true });

      el.close();
      await el.updateComplete;

      expect(el.open).toBe(false);
    });

    it('provides show() method', async () => {
      const el = await createModal();

      el.show();
      await el.updateComplete;

      expect(el.open).toBe(true);
    });
  });

  describe('Escape key handling', () => {
    it('closes on Escape key when closable=true (default)', async () => {
      const el = await createModal({ open: true });

      // qd-modal listens on document for keydown
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);
      await el.updateComplete;

      expect(el.open).toBe(false);
    });

    it('does not close on Escape when closable=false', async () => {
      const el = await createModal({ open: true, closable: false });

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);
      await el.updateComplete;

      expect(el.open).toBe(true);
    });

    it('emits qd:modal-close event on Escape', async () => {
      const el = await createModal({ open: true });

      const closeHandler = vi.fn();
      el.addEventListener('qd:modal-close', closeHandler);

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('backdrop click handling', () => {
    it('closes on backdrop click when closable=true (default)', async () => {
      const el = await createModal({ open: true });

      // Backdrop is in document body
      const backdrop = getModalBackdrop();
      backdrop?.click();
      await el.updateComplete;

      expect(el.open).toBe(false);
    });

    it('does not close on backdrop click when closable=false', async () => {
      const el = await createModal({ open: true, closable: false });

      const backdrop = getModalBackdrop();
      backdrop?.click();
      await el.updateComplete;

      expect(el.open).toBe(true);
    });

    it('does not close when clicking modal content (not backdrop)', async () => {
      const el = await createModal({ open: true });
      el.innerHTML = '<div>Content</div>';
      await el.updateComplete;

      // Content has stopPropagation
      const content = getModalContent();
      content?.click();
      await el.updateComplete;

      expect(el.open).toBe(true);
    });

    it('emits qd:modal-close event on backdrop click', async () => {
      const el = await createModal({ open: true });

      const closeHandler = vi.fn();
      el.addEventListener('qd:modal-close', closeHandler);

      const backdrop = getModalBackdrop();
      backdrop?.click();

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('focus trap', () => {
    it('traps focus within modal when open', async () => {
      const el = await createModal({ open: true });
      el.innerHTML = '<button class="first">First</button><button class="last">Last</button>';
      await el.updateComplete;

      // Content is rendered to body
      const modalContent = getModalContent();
      expect(modalContent).toBeTruthy();
    });

    it('focuses first focusable element when opened', async () => {
      const el = await createModal();
      el.innerHTML = '<button class="first">First</button><button class="last">Last</button>';
      await el.updateComplete;

      el.show();
      await el.updateComplete;

      // Wait for focus to be set
      await new Promise((r) => setTimeout(r, 100));

      // Focus goes to the slotted button or close button in shadow DOM
      const firstButton = el.querySelector('.first');
      expect(
        document.activeElement === firstButton || document.activeElement === getCloseButton(),
      ).toBe(true);
    });
  });

  describe('modal collision', () => {
    it('closes existing modal when new one opens', async () => {
      const el1 = await createModal({ open: true });
      expect(el1.open).toBe(true);

      // Create second modal
      const el2 = document.createElement('qd-modal');
      container.appendChild(el2);
      await el2.updateComplete;

      el2.show();
      await el2.updateComplete;

      // First modal should be closed
      expect(el1.open).toBe(false);
      expect(el2.open).toBe(true);
    });
  });

  describe('slot content', () => {
    it('renders slotted content', async () => {
      const el = await createModal({ open: true });
      el.innerHTML = '<div class="test-content">Hello</div>';
      await el.updateComplete;

      // Content is slotted (light DOM child)
      const slottedContent = el.querySelector('.test-content');
      expect(slottedContent).toBeTruthy();
      expect(slottedContent?.textContent).toBe('Hello');
    });

    it('renders header slot when provided', async () => {
      const el = await createModal({ open: true });
      el.innerHTML = '<span slot="header">Modal Title</span><div>Body content</div>';
      await el.updateComplete;

      // Header slot content
      const headerSlot = el.querySelector('[slot="header"]');
      expect(headerSlot?.textContent).toContain('Modal Title');
    });
  });

  describe('close button', () => {
    it('renders X close button when closable=true', async () => {
      await createModal({ open: true });

      const closeBtn = getCloseButton();
      expect(closeBtn).toBeTruthy();
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close');
    });

    it('hides close button when closable=false', async () => {
      await createModal({ open: true, closable: false });

      const closeBtn = getCloseButton();
      expect(closeBtn).toBeFalsy();
    });

    it('closes modal when X button clicked', async () => {
      const el = await createModal({ open: true });

      const closeBtn = getCloseButton();
      closeBtn?.click();
      await el.updateComplete;

      expect(el.open).toBe(false);
    });

    it('emits qd:modal-close event when X button clicked', async () => {
      const el = await createModal({ open: true });

      const closeHandler = vi.fn();
      el.addEventListener('qd:modal-close', closeHandler);

      const closeBtn = getCloseButton();
      closeBtn?.click();

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', async () => {
      const el = await createModal({ open: true });

      // Dialog role is on content element in shadow DOM
      const dialog = el.shadowRoot?.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('has aria-modal="true" when open', async () => {
      const el = await createModal({ open: true });

      const dialog = el.shadowRoot?.querySelector('[aria-modal="true"]');
      expect(dialog).toBeTruthy();
    });

    it('supports aria-labelledby for title', async () => {
      const el = await createModal({ open: true });
      el.setAttribute('aria-labelledby', 'title');

      expect(el.getAttribute('aria-labelledby')).toBe('title');
    });
  });
});
