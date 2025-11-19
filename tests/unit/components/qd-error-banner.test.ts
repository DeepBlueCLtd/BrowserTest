/**
 * Unit tests for qd-error-banner component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../../src/components/qd-error-banner.js';
import type { QdErrorBanner } from '../../../src/components/qd-error-banner.js';

describe('qd-error-banner', () => {
  let element: QdErrorBanner;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('qd-error-banner');
    container.appendChild(element);

    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
  });

  describe('rendering', () => {
    it('should not render without message', () => {
      const banner = element.shadowRoot?.querySelector('.banner');
      expect(banner).toBeNull();
    });

    it('should render with message', async () => {
      element.message = 'Test error message';
      await element.updateComplete;

      const banner = element.shadowRoot?.querySelector('.banner');
      expect(banner).toBeTruthy();
      expect(banner?.textContent).toContain('Test error message');
    });

    it('should render close button by default', async () => {
      element.message = 'Test message';
      await element.updateComplete;

      const closeButton = element.shadowRoot?.querySelector('.close-button');
      expect(closeButton).toBeTruthy();
    });

    it('should hide close button when dismissable is false', async () => {
      element.message = 'Test message';
      element.dismissable = false;
      await element.updateComplete;

      const closeButton = element.shadowRoot?.querySelector('.close-button');
      expect(closeButton).toBeNull();
    });
  });

  describe('severity levels', () => {
    beforeEach(async () => {
      element.message = 'Test message';
      await element.updateComplete;
    });

    it('should apply error class by default', () => {
      const banner = element.shadowRoot?.querySelector('.banner');
      expect(banner?.classList.contains('error')).toBe(true);
    });

    it('should apply warning class', async () => {
      element.severity = 'warning';
      await element.updateComplete;

      const banner = element.shadowRoot?.querySelector('.banner');
      expect(banner?.classList.contains('warning')).toBe(true);
    });

    it('should apply info class', async () => {
      element.severity = 'info';
      await element.updateComplete;

      const banner = element.shadowRoot?.querySelector('.banner');
      expect(banner?.classList.contains('info')).toBe(true);
    });
  });

  describe('dismissal', () => {
    beforeEach(async () => {
      element.message = 'Test message';
      await element.updateComplete;
    });

    it('should emit dismiss event when close button clicked', async () => {
      let dismissed = false;
      element.addEventListener('dismiss', () => {
        dismissed = true;
      });

      const closeButton = element.shadowRoot?.querySelector('.close-button') as HTMLButtonElement;
      closeButton?.click();
      await element.updateComplete;

      expect(dismissed).toBe(true);
    });

    it('should hide element when dismissed', async () => {
      const closeButton = element.shadowRoot?.querySelector('.close-button') as HTMLButtonElement;
      closeButton?.click();
      await element.updateComplete;

      expect(element.hidden).toBe(true);
    });
  });

  describe('auto-dismiss', () => {
    it('should auto-dismiss after timeout', async () => {
      vi.useFakeTimers();

      // Create new element with autoDismiss already set
      container.removeChild(element);
      element = document.createElement('qd-error-banner');
      element.message = 'Test message';
      element.autoDismissMs = 3000;
      container.appendChild(element);
      await element.updateComplete;

      expect(element.hidden).toBe(false);

      vi.advanceTimersByTime(3000);
      await element.updateComplete;

      expect(element.hidden).toBe(true);

      vi.useRealTimers();
    });

    it('should not auto-dismiss when autoDismissMs is 0', async () => {
      vi.useFakeTimers();

      element.message = 'Test message';
      element.autoDismissMs = 0;
      await element.updateComplete;

      vi.advanceTimersByTime(5000);
      await element.updateComplete;

      expect(element.hidden).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('accessibility', () => {
    beforeEach(async () => {
      element.message = 'Test message';
      await element.updateComplete;
    });

    it('should have role="alert"', () => {
      const banner = element.shadowRoot?.querySelector('.banner');
      expect(banner?.getAttribute('role')).toBe('alert');
    });

    it('should have aria-live="polite"', () => {
      const banner = element.shadowRoot?.querySelector('.banner');
      expect(banner?.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-label on close button', () => {
      const closeButton = element.shadowRoot?.querySelector('.close-button');
      expect(closeButton?.getAttribute('aria-label')).toBe('Dismiss');
    });
  });
});
