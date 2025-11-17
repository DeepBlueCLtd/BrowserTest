/**
 * Unit tests for qd-instructor-manage component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../../src/components/qd-instructor/qd-instructor-manage.js';
import type { QdInstructorManage } from '../../../../src/components/qd-instructor/qd-instructor-manage.js';

describe('qd-instructor-manage', () => {
  let element: QdInstructorManage;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('qd-instructor-manage');
    container.appendChild(element);

    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
  });

  describe('rendering', () => {
    it('should render clear data button', () => {
      const button = element.shadowRoot?.querySelector('button.danger');
      expect(button).toBeTruthy();
      expect(button?.textContent).toContain('Erase All Data');
    });

    it('should not show dialog initially', () => {
      const modal = element.shadowRoot?.querySelector('.modal-overlay');
      expect(modal).toBeNull();
    });
  });

  describe('confirmation dialog', () => {
    it('should show dialog when clear button clicked', async () => {
      const button = element.shadowRoot?.querySelector('button.danger') as HTMLButtonElement;
      button.click();
      await element.updateComplete;

      const modal = element.shadowRoot?.querySelector('.modal-overlay');
      expect(modal).toBeTruthy();
    });

    it('should hide dialog when cancel clicked', async () => {
      element['showConfirmDialog'] = true;
      await element.updateComplete;

      const cancelButton = Array.from(
        element.shadowRoot?.querySelectorAll('button') || []
      ).find(btn => btn.textContent?.includes('Cancel')) as HTMLButtonElement;

      cancelButton?.click();
      await element.updateComplete;

      expect(element['showConfirmDialog']).toBe(false);
    });

    it('should require exact confirmation text', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'wrong text';
      await element.updateComplete;

      const confirmButton = Array.from(
        element.shadowRoot?.querySelectorAll('button') || []
      ).find(btn => btn.textContent?.includes('Delete All Data')) as HTMLButtonElement;

      confirmButton?.click();
      await element.updateComplete;

      // Manually call handler to test logic
      element['handleConfirmClear']();
      await element.updateComplete;

      expect(element['error']).toContain('Confirmation text does not match');
      expect(element['showConfirmDialog']).toBe(true);
    });

    it('should disable confirm button when text invalid', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'invalid';
      await element.updateComplete;

      const confirmButton = Array.from(
        element.shadowRoot?.querySelectorAll('button') || []
      ).find(btn => btn.textContent?.includes('Delete All Data')) as HTMLButtonElement;

      expect(confirmButton?.disabled).toBe(true);
    });

    it('should enable confirm button when text valid', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'DELETE ALL DATA';
      await element.updateComplete;

      const confirmButton = Array.from(
        element.shadowRoot?.querySelectorAll('button') || []
      ).find(btn => btn.textContent?.includes('Delete All Data')) as HTMLButtonElement;

      expect(confirmButton?.disabled).toBe(false);
    });
  });

  describe('data clearing', () => {
    it('should emit qd:data-cleared event on successful clear', async () => {
      let eventFired = false;
      element.addEventListener('qd:data-cleared', () => {
        eventFired = true;
      });

      element['showConfirmDialog'] = true;
      element['confirmText'] = 'DELETE ALL DATA';
      await element.updateComplete;

      const confirmButton = Array.from(
        element.shadowRoot?.querySelectorAll('button') || []
      ).find(btn => btn.textContent?.includes('Delete All Data')) as HTMLButtonElement;

      confirmButton?.click();
      await element.updateComplete;

      expect(eventFired).toBe(true);
    });

    it('should show success message after clearing', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'DELETE ALL DATA';
      await element.updateComplete;

      const confirmButton = Array.from(
        element.shadowRoot?.querySelectorAll('button') || []
      ).find(btn => btn.textContent?.includes('Delete All Data')) as HTMLButtonElement;

      confirmButton?.click();
      await element.updateComplete;

      expect(element['success']).toContain('cleared successfully');
    });

    it('should close dialog after clearing', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'DELETE ALL DATA';
      await element.updateComplete;

      const confirmButton = Array.from(
        element.shadowRoot?.querySelectorAll('button') || []
      ).find(btn => btn.textContent?.includes('Delete All Data')) as HTMLButtonElement;

      confirmButton?.click();
      await element.updateComplete;

      expect(element['showConfirmDialog']).toBe(false);
    });
  });

  describe('confirmation text input', () => {
    it('should update confirmText on input', async () => {
      element['showConfirmDialog'] = true;
      await element.updateComplete;

      const input = element.shadowRoot?.querySelector('input[type="text"]') as HTMLInputElement;
      input.value = 'DELETE ALL DATA';
      input.dispatchEvent(new Event('input'));
      await element.updateComplete;

      expect(element['confirmText']).toBe('DELETE ALL DATA');
    });
  });

  describe('accessibility', () => {
    it('should have modal overlay role', async () => {
      element['showConfirmDialog'] = true;
      await element.updateComplete;

      const modal = element.shadowRoot?.querySelector('.modal-overlay');
      expect(modal).toBeTruthy();
    });

    it('should have close button in modal', async () => {
      element['showConfirmDialog'] = true;
      await element.updateComplete;

      const closeButton = element.shadowRoot?.querySelector('.close-button');
      expect(closeButton).toBeTruthy();
    });
  });
});
