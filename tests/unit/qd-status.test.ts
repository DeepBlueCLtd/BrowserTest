/**
 * Unit tests for QdStatus component
 *
 * Tests session display, progress tracking, and logout functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { QdStatus } from '../../src/components/qd-status.js';
import type { SessionCache } from '../../src/types/contracts.js';
import { STORAGE_KEYS } from '../../src/types/contracts.js';
import { setJSON } from '../../src/utils/storage-helpers.js';
import '../../src/components/qd-status.js';

describe('QdStatus Component', () => {
  let element: QdStatus;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Clear storage
    sessionStorage.clear();

    element = document.createElement('qd-status');
    container.appendChild(element);

    // Wait for component to render
    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
    sessionStorage.clear();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      expect(element).toBeDefined();
      expect(element.tagName.toLowerCase()).toBe('qd-status');
    });

    it('should display session info when cache exists', async () => {
      // Set up session cache
      const cache: SessionCache = {
        totals: { total: 10, answered: 10, correct: 8 },
        pages: {},
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      // Trigger cache reload
      const event = new CustomEvent('qd:state-changed');
      document.dispatchEvent(event);

      element.requestUpdate();
      await element.updateComplete;

      // Check that totals are displayed in "X/Y Correct (Z%)" format
      const shadow = element.shadowRoot;
      expect(shadow?.textContent).toContain('8/10 Correct');
      expect(shadow?.textContent).toContain('80%');
    });

    it('should calculate and display percentage', async () => {
      const cache: SessionCache = {
        totals: { total: 10, answered: 10, correct: 8 },
        pages: {},
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      // Dispatch state-changed event to trigger cache reload
      const event = new CustomEvent('qd:state-changed');
      document.dispatchEvent(event);

      element.requestUpdate();
      await element.updateComplete;

      const shadow = element.shadowRoot;
      expect(shadow?.textContent).toContain('80%');
    });

    it('should display 0% when no questions answered', async () => {
      const cache: SessionCache = {
        totals: { total: 0, answered: 0, correct: 0 },
        pages: {},
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      element.requestUpdate();
      await element.updateComplete;

      const shadow = element.shadowRoot;
      expect(shadow?.textContent).toContain('0%');
    });

    it('should render logout button', () => {
      const logoutButton = element.shadowRoot?.querySelector('button');
      expect(logoutButton).toBeDefined();
      expect(logoutButton?.textContent).toContain('Logout');
    });
  });

  describe('Progress Display', () => {
    it('should update when cache changes', async () => {
      // Initial cache
      const cache: SessionCache = {
        totals: { total: 5, answered: 5, correct: 3 },
        pages: {},
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      element.requestUpdate();
      await element.updateComplete;

      let shadow = element.shadowRoot;
      expect(shadow?.textContent).toContain('5');
      expect(shadow?.textContent).toContain('3');

      // Update cache
      cache.totals.answered = 10;
      cache.totals.correct = 8;
      setJSON(STORAGE_KEYS.CACHE, cache);

      // Emit state changed event
      const event = new CustomEvent('qd:state-changed');
      document.dispatchEvent(event);

      element.requestUpdate();
      await element.updateComplete;

      shadow = element.shadowRoot;
      expect(shadow?.textContent).toContain('10');
      expect(shadow?.textContent).toContain('8');
    });
  });

  describe('Logout Functionality', () => {
    it('should emit qd:logout event when logout button clicked', async () => {
      let eventFired = false;
      element.addEventListener('qd:logout', () => {
        eventFired = true;
      });

      const logoutButton = element.shadowRoot?.querySelector('button') as HTMLButtonElement;
      expect(logoutButton).toBeDefined();

      logoutButton.click();
      await element.updateComplete;

      expect(eventFired).toBe(true);
    });

    it('should emit event with bubbles and composed properties', async () => {
      let capturedEvent: Event | null = null;
      element.addEventListener('qd:logout', (e) => {
        capturedEvent = e;
      });

      const logoutButton = element.shadowRoot?.querySelector('button') as HTMLButtonElement;
      logoutButton.click();
      await element.updateComplete;

      expect(capturedEvent).toBeDefined();
      if (capturedEvent) {
        expect((capturedEvent as CustomEvent).bubbles).toBe(true);
        expect((capturedEvent as CustomEvent).composed).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing cache gracefully', async () => {
      // No cache in storage
      element.requestUpdate();
      await element.updateComplete;

      // Should not throw
      expect(element.shadowRoot).toBeDefined();

      // Should show zeros
      const shadow = element.shadowRoot;
      expect(shadow?.textContent).toContain('0');
    });

    it('should handle empty pages object', async () => {
      const cache: SessionCache = {
        totals: { total: 0, answered: 0, correct: 0 },
        pages: {},
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      element.requestUpdate();
      await element.updateComplete;

      // Should not throw
      expect(element.shadowRoot).toBeDefined();
    });

    it('should handle division by zero for percentage', async () => {
      const cache: SessionCache = {
        totals: { total: 0, answered: 0, correct: 0 },
        pages: {},
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      element.requestUpdate();
      await element.updateComplete;

      const shadow = element.shadowRoot;
      // Should show 0% not NaN% or Infinity%
      expect(shadow?.textContent).toContain('0%');
      expect(shadow?.textContent).not.toContain('NaN');
      expect(shadow?.textContent).not.toContain('Infinity');
    });
  });

  describe('Real-time Updates', () => {
    it('should listen for qd:state-changed events', async () => {
      const cache: SessionCache = {
        totals: { total: 5, answered: 5, correct: 3 },
        pages: {
          'page-1': { state: 'incomplete', total: 5, answered: 5, correct: 3, answers: [] },
        },
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      element.requestUpdate();
      await element.updateComplete;

      // Update cache
      cache.totals.correct = 5;
      cache.pages['page-1']!.state = 'complete';
      cache.pages['page-1']!.correct = 5;
      setJSON(STORAGE_KEYS.CACHE, cache);

      // Emit state changed event
      const event = new CustomEvent('qd:state-changed', {
        detail: { pageId: 'page-1', state: 'complete' },
      });
      document.dispatchEvent(event);

      element.requestUpdate();
      await element.updateComplete;

      const shadow = element.shadowRoot;
      expect(shadow?.textContent).toContain('5');
    });
  });
});
