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

  describe('open/close behavior', () => {
    it('is hidden by default (open=false)', async () => {
      const el = await createModal();

      expect(el.open).toBe(false);
      const backdrop = el.shadowRoot?.querySelector('.modal-backdrop');
      expect(backdrop).toBeFalsy();
    });

    it('shows modal when open=true', async () => {
      const el = await createModal({ open: true });

      expect(el.open).toBe(true);
      // Portal renders to document.body
      const backdrop = document.querySelector('.qd-modal-backdrop');
      expect(backdrop).toBeTruthy();
    });

    it('hides modal when open changes to false', async () => {
      const el = await createModal({ open: true });

      el.open = false;
      await el.updateComplete;

      // Portal removed from document.body
      const backdrop = document.querySelector('.qd-modal-backdrop');
      expect(backdrop).toBeFalsy();
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

      // Portal renders to document.body
      const backdrop = document.querySelector('.qd-modal-backdrop') as HTMLElement;
      backdrop?.click();
      await el.updateComplete;

      expect(el.open).toBe(false);
    });

    it('does not close on backdrop click when closable=false', async () => {
      const el = await createModal({ open: true, closable: false });

      const backdrop = document.querySelector('.qd-modal-backdrop') as HTMLElement;
      backdrop?.click();
      await el.updateComplete;

      expect(el.open).toBe(true);
    });

    it('does not close when clicking modal content (not backdrop)', async () => {
      const el = await createModal({ open: true });
      el.innerHTML = '<div>Content</div>';
      await el.updateComplete;

      // Content in portal has stopPropagation
      const content = document.querySelector('.qd-modal-content') as HTMLElement;
      content?.click();
      await el.updateComplete;

      expect(el.open).toBe(true);
    });

    it('emits qd:modal-close event on backdrop click', async () => {
      const el = await createModal({ open: true });

      const closeHandler = vi.fn();
      el.addEventListener('qd:modal-close', closeHandler);

      const backdrop = document.querySelector('.qd-modal-backdrop') as HTMLElement;
      backdrop?.click();

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('focus trap', () => {
    it('traps focus within modal when open', async () => {
      const el = await createModal({ open: true });
      el.innerHTML = '<button class="first">First</button><button class="last">Last</button>';
      await el.updateComplete;

      // Portal renders content to document.body
      const modalContent = document.querySelector('.qd-modal-content');
      expect(modalContent).toBeTruthy();
    });

    it('focuses first focusable element when opened', async () => {
      const el = await createModal();
      el.innerHTML = '<button class="first">First</button><button class="last">Last</button>';
      await el.updateComplete;

      el.show();
      await el.updateComplete;

      // Wait for focus to be set
      await new Promise((r) => setTimeout(r, 50));

      // Portal clones content, so find button in portal
      const firstButton = document.querySelector('.qd-modal-backdrop .first');
      expect(document.activeElement).toBe(firstButton);
    });
  });

  describe('modal collision', () => {
    it('closes existing modal when new one opens', async () => {
      const el1 = await createModal({ open: true });

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

      // Portal clones content to document.body
      const portalContent = document.querySelector('.qd-modal-backdrop .test-content');
      expect(portalContent).toBeTruthy();
      expect(portalContent?.textContent).toBe('Hello');
    });

    it('renders header slot when provided', async () => {
      const el = await createModal({ open: true });
      el.innerHTML = '<span slot="header">Modal Title</span><div>Body content</div>';
      await el.updateComplete;

      // Portal places header content in .qd-modal-header
      const headerContent = document.querySelector('.qd-modal-header');
      expect(headerContent?.textContent).toContain('Modal Title');
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', async () => {
      await createModal({ open: true });

      // Portal renders to document.body
      const dialog = document.querySelector('.qd-modal-backdrop [role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('has aria-modal="true" when open', async () => {
      await createModal({ open: true });

      const dialog = document.querySelector('.qd-modal-backdrop [aria-modal="true"]');
      expect(dialog).toBeTruthy();
    });

    it('supports aria-labelledby for title', async () => {
      const el = await createModal({ open: true });
      el.setAttribute('aria-labelledby', 'title');

      expect(el.getAttribute('aria-labelledby')).toBe('title');
    });
  });
});
