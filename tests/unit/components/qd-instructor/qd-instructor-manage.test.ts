/**
 * Unit tests for qd-instructor-manage component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Erase-all clears IndexedDB through the storage service singleton; the
// singleton is not initialised in unit tests, so stub it.
const { clearAllMock } = vi.hoisted(() => ({ clearAllMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../../../src/services/storage-service.js', () => ({
  getStorageService: () => ({ clearAll: clearAllMock }),
}));

import '../../../../src/components/qd-instructor/qd-instructor-manage.js';
import type { QdInstructorManage } from '../../../../src/components/qd-instructor/qd-instructor-manage.js';
import {
  configureInstructorHash,
  resetInstructorForTest,
  TEST_INSTRUCTOR_PASSWORD,
} from '../../../helpers/instructor.js';
import { resetReauthLimiterForTests } from '../../../../src/services/auth/instructor-session.js';

/** Let the async password check and the re-render finish. */
async function settle(el: QdInstructorManage): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;
  }
}

describe('qd-instructor-manage', () => {
  let element: QdInstructorManage;
  let container: HTMLDivElement;

  beforeEach(async () => {
    clearAllMock.mockClear();
    resetReauthLimiterForTests();
    await configureInstructorHash();
    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('qd-instructor-manage');
    container.appendChild(element);

    await element.updateComplete;
  });

  afterEach(() => {
    resetInstructorForTest();
    container.remove();
    // Clean up modal from document.body
    document.querySelector('.qd-manage-modal-container')?.remove();
  });

  // Helper to get modal container from document.body
  const getModalContainer = () => document.querySelector('.qd-manage-modal-container');

  describe('rendering', () => {
    it('should render clear data button', () => {
      const button = element.shadowRoot?.querySelector('button.danger');
      expect(button).toBeTruthy();
      expect(button?.textContent).toContain('Erase All Data');
    });

    it('should not show dialog initially', () => {
      const modal = getModalContainer();
      expect(modal).toBeNull();
    });
  });

  describe('confirmation dialog', () => {
    it('should show dialog when clear button clicked', async () => {
      const button = element.shadowRoot?.querySelector('button.danger') as HTMLButtonElement;
      button.click();
      await element.updateComplete;

      const modal = getModalContainer();
      expect(modal).toBeTruthy();
    });

    it('should hide dialog when cancel clicked', async () => {
      element['showConfirmDialog'] = true;
      await element.updateComplete;

      const modalContainer = getModalContainer();
      const cancelButton = Array.from(modalContainer?.querySelectorAll('button') || []).find(
        (btn) => btn.textContent?.includes('Cancel'),
      ) as HTMLButtonElement;

      cancelButton?.click();
      await element.updateComplete;

      expect(element['showConfirmDialog']).toBe(false);
    });

    it('should require exact confirmation text', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'wrong text';
      await element.updateComplete;

      // Manually call handler to test logic
      await element['handleConfirmClear']();
      await element.updateComplete;

      expect(element['error']).toContain('Confirmation text does not match');
      expect(element['showConfirmDialog']).toBe(true);
    });

    it('should disable confirm button when text invalid', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'invalid';
      await element.updateComplete;

      const modalContainer = getModalContainer();
      const confirmButton = Array.from(modalContainer?.querySelectorAll('button') || []).find(
        (btn) => btn.textContent?.includes('Delete All Data'),
      ) as HTMLButtonElement;

      expect(confirmButton?.disabled).toBe(true);
    });

    it('should enable confirm button when text valid', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'DELETE ALL DATA';
      element['password'] = TEST_INSTRUCTOR_PASSWORD;
      await element.updateComplete;

      const modalContainer = getModalContainer();
      const confirmButton = Array.from(modalContainer?.querySelectorAll('button') || []).find(
        (btn) => btn.textContent?.includes('Delete All Data'),
      ) as HTMLButtonElement;

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
      element['password'] = TEST_INSTRUCTOR_PASSWORD;
      await element.updateComplete;

      const modalContainer = getModalContainer();
      const confirmButton = Array.from(modalContainer?.querySelectorAll('button') || []).find(
        (btn) => btn.textContent?.includes('Delete All Data'),
      ) as HTMLButtonElement;

      confirmButton?.click();
      await settle(element);

      expect(eventFired).toBe(true);
    });

    it('should show success message after clearing', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'DELETE ALL DATA';
      element['password'] = TEST_INSTRUCTOR_PASSWORD;
      await element.updateComplete;

      const modalContainer = getModalContainer();
      const confirmButton = Array.from(modalContainer?.querySelectorAll('button') || []).find(
        (btn) => btn.textContent?.includes('Delete All Data'),
      ) as HTMLButtonElement;

      confirmButton?.click();
      await settle(element);

      expect(element['success']).toContain('cleared successfully');
    });

    it('should close dialog after clearing', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'DELETE ALL DATA';
      element['password'] = TEST_INSTRUCTOR_PASSWORD;
      await element.updateComplete;

      const modalContainer = getModalContainer();
      const confirmButton = Array.from(modalContainer?.querySelectorAll('button') || []).find(
        (btn) => btn.textContent?.includes('Delete All Data'),
      ) as HTMLButtonElement;

      confirmButton?.click();
      await settle(element);

      expect(element['showConfirmDialog']).toBe(false);
    });
  });

  describe('password re-check (SRD 013 SEC-03)', () => {
    const confirmButton = () =>
      Array.from(getModalContainer()?.querySelectorAll('button') || []).find((btn) =>
        btn.textContent?.includes('Delete All Data'),
      ) as HTMLButtonElement;

    it('asks for the instructor password in the dialog', async () => {
      element['showConfirmDialog'] = true;
      await element.updateComplete;
      expect(getModalContainer()?.querySelector('input[type="password"]')).toBeTruthy();
    });

    it('keeps Delete disabled until a password is entered', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'DELETE ALL DATA';
      await element.updateComplete;
      expect(confirmButton().disabled).toBe(true);
    });

    it('does not erase anything with a wrong password', async () => {
      let cleared = false;
      element.addEventListener('qd:data-cleared', () => (cleared = true));
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'DELETE ALL DATA';
      element['password'] = 'wrong';
      await element.updateComplete;

      confirmButton().click();
      await settle(element);

      expect(clearAllMock).not.toHaveBeenCalled();
      expect(cleared).toBe(false);
      expect(element['error']).toBe('Incorrect instructor password');
      expect(element['showConfirmDialog']).toBe(true);
      expect(element['password']).toBe('');
    });

    it('locks out after repeated wrong passwords', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'DELETE ALL DATA';
      for (let i = 0; i < 4; i++) {
        element['password'] = 'wrong';
        await element.updateComplete;
        confirmButton().click();
        await settle(element);
      }
      expect(element['error']).toMatch(/Too many attempts/);
      expect(clearAllMock).not.toHaveBeenCalled();
    });

    it('erases with the right password', async () => {
      element['showConfirmDialog'] = true;
      element['confirmText'] = 'DELETE ALL DATA';
      element['password'] = TEST_INSTRUCTOR_PASSWORD;
      await element.updateComplete;
      confirmButton().click();
      await settle(element);
      expect(clearAllMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard (SRD 013 UX-07)', () => {
    it('closes the dialog on Escape', async () => {
      element['showConfirmDialog'] = true;
      await element.updateComplete;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await element.updateComplete;
      expect(element['showConfirmDialog']).toBe(false);
      expect(getModalContainer()).toBeNull();
    });
  });

  describe('confirmation text input', () => {
    it('should update confirmText on input', async () => {
      element['showConfirmDialog'] = true;
      await element.updateComplete;

      const modalContainer = getModalContainer();
      const input = modalContainer?.querySelector('input[type="text"]') as HTMLInputElement;
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

      const modal = getModalContainer()?.querySelector('.qd-manage-modal-overlay');
      expect(modal).toBeTruthy();
    });

    it('should have close button in modal', async () => {
      element['showConfirmDialog'] = true;
      await element.updateComplete;

      const modalContainer = getModalContainer();
      const closeButton = modalContainer?.querySelector('button');
      expect(closeButton).toBeTruthy();
    });
  });
});
