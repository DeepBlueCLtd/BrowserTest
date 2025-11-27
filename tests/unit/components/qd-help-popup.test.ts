/**
 * Tests for qd-help-popup.ts component
 *
 * Feature: 008-user-guidance-popups
 * TDD: These tests are written FIRST, before implementation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { QdHelpPopup } from '../../../src/components/qd-help-popup';

// Import component
import '../../../src/components/qd-help-popup.js';

describe('qd-help-popup', () => {
  let container: HTMLElement;
  let element: QdHelpPopup;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    // Clean up any portals
    document.querySelectorAll('.qd-help-backdrop').forEach((el) => el.remove());
  });

  async function createPopup(
    options: {
      open?: boolean;
      title?: string;
      content?: string;
    } = {},
  ): Promise<QdHelpPopup> {
    element = document.createElement('qd-help-popup');
    if (options.title) element.title = options.title;
    if (options.content) element.content = options.content;
    container.appendChild(element);
    await element.updateComplete;
    // Set open last to trigger portal creation
    if (options.open) {
      element.open = true;
      await element.updateComplete;
      // Wait for portal to be created
      await new Promise((r) => setTimeout(r, 50));
    }
    return element;
  }

  describe('initial state', () => {
    it('is hidden by default', async () => {
      const el = await createPopup();
      expect(el.open).toBe(false);
      const backdrop = document.querySelector('.qd-help-backdrop');
      expect(backdrop).toBeFalsy();
    });

    it('has default title "Help"', async () => {
      const el = await createPopup();
      expect(el.title).toBe('Help');
    });

    it('has empty content by default', async () => {
      const el = await createPopup();
      expect(el.content).toBe('');
    });
  });

  describe('opening behavior', () => {
    it('creates portal when opened', async () => {
      await createPopup({
        open: true,
        title: 'Test Help',
        content: '<p>Help content</p>',
      });
      const backdrop = document.querySelector('.qd-help-backdrop');
      expect(backdrop).toBeTruthy();
    });

    it('displays title in portal', async () => {
      await createPopup({
        open: true,
        title: 'Login Help',
        content: '<p>Content</p>',
      });
      const title = document.querySelector('.qd-help-title');
      expect(title?.textContent).toBe('Login Help');
    });

    it('displays content in portal', async () => {
      await createPopup({
        open: true,
        title: 'Test',
        content: '<p>This is help content</p>',
      });
      const body = document.querySelector('.qd-help-body');
      expect(body?.innerHTML).toContain('This is help content');
    });

    it('renders HTML content', async () => {
      await createPopup({
        open: true,
        title: 'Test',
        content: '<h3>Title</h3><p><strong>Bold</strong> text</p>',
      });
      const body = document.querySelector('.qd-help-body');
      expect(body?.innerHTML).toContain('<h3>Title</h3>');
      expect(body?.innerHTML).toContain('<strong>Bold</strong>');
    });
  });

  describe('closing behavior', () => {
    it('closes on Escape key', async () => {
      const el = await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      expect(el.open).toBe(false);
      const backdrop = document.querySelector('.qd-help-backdrop');
      expect(backdrop).toBeFalsy();
    });

    it('closes on backdrop click', async () => {
      const el = await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });

      const backdrop = document.querySelector('.qd-help-backdrop') as HTMLElement;
      backdrop?.click();
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      expect(el.open).toBe(false);
    });

    it('closes on close button click', async () => {
      const el = await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });

      const closeBtn = document.querySelector('.qd-help-close') as HTMLElement;
      closeBtn?.click();
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      expect(el.open).toBe(false);
    });

    it('does NOT close on content click', async () => {
      const el = await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });

      const content = document.querySelector('.qd-help-content') as HTMLElement;
      content?.click();
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      expect(el.open).toBe(true);
    });

    it('emits qd:modal-close event on close', async () => {
      const el = await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });
      const closeHandler = vi.fn();
      el.addEventListener('qd:modal-close', closeHandler);

      const closeBtn = document.querySelector('.qd-help-close') as HTMLElement;
      closeBtn?.click();
      await el.updateComplete;

      expect(closeHandler).toHaveBeenCalled();
    });

    it('removes portal on close', async () => {
      const el = await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });

      el.open = false;
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const backdrop = document.querySelector('.qd-help-backdrop');
      expect(backdrop).toBeFalsy();
    });
  });

  describe('accessibility', () => {
    it('has dialog role', async () => {
      await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('has aria-modal="true"', async () => {
      await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
    });

    it('has aria-labelledby pointing to title', async () => {
      await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('aria-labelledby')).toBe('qd-help-title');
    });

    it('close button has aria-label="Close"', async () => {
      await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });
      const closeBtn = document.querySelector('.qd-help-close');
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close');
    });

    it('focuses close button when opened', async () => {
      await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });
      await new Promise((r) => setTimeout(r, 100)); // Wait for focus

      const closeBtn = document.querySelector('.qd-help-close');
      expect(document.activeElement).toBe(closeBtn);
    });
  });

  describe('close() method', () => {
    it('provides close() method that closes popup', async () => {
      const el = await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });

      el.close();
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      expect(el.open).toBe(false);
    });

    it('close() method emits qd:modal-close event', async () => {
      const el = await createPopup({
        open: true,
        title: 'Test',
        content: '<p>Content</p>',
      });
      const closeHandler = vi.fn();
      el.addEventListener('qd:modal-close', closeHandler);

      el.close();
      await el.updateComplete;

      expect(closeHandler).toHaveBeenCalled();
    });
  });
});
