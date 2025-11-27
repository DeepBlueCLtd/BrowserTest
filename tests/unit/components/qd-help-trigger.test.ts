/**
 * Tests for qd-help-trigger.ts component
 *
 * Feature: 008-user-guidance-popups
 * TDD: These tests are written FIRST, before implementation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { QdHelpTrigger } from '../../../src/components/qd-help-trigger';

// Import component
import '../../../src/components/qd-help-trigger.js';

describe('qd-help-trigger', () => {
  let container: HTMLElement;
  let element: QdHelpTrigger;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  async function createTrigger(
    options: {
      panelType?: 'login' | 'status' | 'instructor';
    } = {},
  ): Promise<QdHelpTrigger> {
    element = document.createElement('qd-help-trigger');
    if (options.panelType) element.panelType = options.panelType;
    container.appendChild(element);
    await element.updateComplete;
    return element;
  }

  describe('rendering', () => {
    it('renders a button with ? icon', async () => {
      const el = await createTrigger();
      const button = el.shadowRoot?.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.textContent?.trim()).toBe('?');
    });

    it('has default panelType of login', async () => {
      const el = await createTrigger();
      expect(el.panelType).toBe('login');
    });

    it('accepts custom panelType', async () => {
      const el = await createTrigger({ panelType: 'instructor' });
      expect(el.panelType).toBe('instructor');
    });
  });

  describe('accessibility', () => {
    it('button has aria-label="Help"', async () => {
      const el = await createTrigger();
      const button = el.shadowRoot?.querySelector('button');
      expect(button?.getAttribute('aria-label')).toBe('Help');
    });

    it('button has title="Help"', async () => {
      const el = await createTrigger();
      const button = el.shadowRoot?.querySelector('button');
      expect(button?.getAttribute('title')).toBe('Help');
    });

    it('button is keyboard focusable', async () => {
      const el = await createTrigger();
      const button = el.shadowRoot?.querySelector('button');
      // Buttons are focusable by default
      expect(button?.tagName).toBe('BUTTON');
    });
  });

  describe('events', () => {
    it('emits qd:help-open event on click', async () => {
      const el = await createTrigger({ panelType: 'login' });
      const handler = vi.fn();
      el.addEventListener('qd:help-open', handler);

      const button = el.shadowRoot?.querySelector('button');
      button?.click();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('event detail contains panelType', async () => {
      const el = await createTrigger({ panelType: 'status' });
      let eventDetail: { panelType: string } | null = null;
      el.addEventListener('qd:help-open', (e: Event) => {
        eventDetail = (e as CustomEvent<{ panelType: string }>).detail;
      });

      const button = el.shadowRoot?.querySelector('button');
      button?.click();

      expect(eventDetail).toEqual({ panelType: 'status' });
    });

    it('event bubbles and is composed', async () => {
      const el = await createTrigger();
      let eventBubbles = false;
      let eventComposed = false;

      el.addEventListener('qd:help-open', (e: Event) => {
        eventBubbles = e.bubbles;
        eventComposed = e.composed;
      });

      const button = el.shadowRoot?.querySelector('button');
      button?.click();

      expect(eventBubbles).toBe(true);
      expect(eventComposed).toBe(true);
    });
  });

  describe('panelType variations', () => {
    it('works with panelType="login"', async () => {
      const el = await createTrigger({ panelType: 'login' });
      let eventDetail: { panelType: string } | undefined;
      el.addEventListener('qd:help-open', (e: Event) => {
        eventDetail = (e as CustomEvent<{ panelType: string }>).detail;
      });

      el.shadowRoot?.querySelector('button')?.click();
      expect(eventDetail?.panelType).toBe('login');
    });

    it('works with panelType="status"', async () => {
      const el = await createTrigger({ panelType: 'status' });
      let eventDetail: { panelType: string } | undefined;
      el.addEventListener('qd:help-open', (e: Event) => {
        eventDetail = (e as CustomEvent<{ panelType: string }>).detail;
      });

      el.shadowRoot?.querySelector('button')?.click();
      expect(eventDetail?.panelType).toBe('status');
    });

    it('works with panelType="instructor"', async () => {
      const el = await createTrigger({ panelType: 'instructor' });
      let eventDetail: { panelType: string } | undefined;
      el.addEventListener('qd:help-open', (e: Event) => {
        eventDetail = (e as CustomEvent<{ panelType: string }>).detail;
      });

      el.shadowRoot?.querySelector('button')?.click();
      expect(eventDetail?.panelType).toBe('instructor');
    });
  });
});
