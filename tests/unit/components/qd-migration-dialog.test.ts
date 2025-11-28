/**
 * Tests for qd-migration-dialog.ts component
 *
 * Feature: 009-encrypt-stored-data
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { QdMigrationDialog } from '../../../src/components/qd-migration-dialog';

// Import component
import '../../../src/components/qd-migration-dialog.js';

describe('qd-migration-dialog', () => {
  let container: HTMLElement;
  let element: QdMigrationDialog;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Setup instructor hash for password validation
    // Password "pwd" => SHA-256 hash truncated to 12 chars
    const hashSpan = document.createElement('span');
    hashSpan.id = 'qd-instructor-hash';
    hashSpan.style.display = 'none';
    hashSpan.textContent = 'a1159e9df367'; // First 12 chars of SHA-256("pwd")
    document.body.appendChild(hashSpan);
  });

  afterEach(() => {
    container.remove();
    // Clean up any modal containers and qd-modal elements rendered to body
    document.querySelectorAll('.qd-modal-container').forEach((el) => el.remove());
    document.querySelectorAll('body > qd-modal').forEach((el) => el.remove());
    document.getElementById('qd-instructor-hash')?.remove();
  });

  async function createDialog(
    options: {
      open?: boolean;
      expected?: 'plain' | 'obfuscated';
      found?: 'plain' | 'obfuscated';
      dbName?: string;
      releaseId?: string;
    } = {},
  ): Promise<QdMigrationDialog> {
    element = document.createElement('qd-migration-dialog');
    if (options.expected) element.expected = options.expected;
    if (options.found) element.found = options.found;
    if (options.dbName) element.dbName = options.dbName;
    if (options.releaseId) element.releaseId = options.releaseId;
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

  describe('modal behavior', () => {
    it('is hidden by default', async () => {
      const el = await createDialog();
      expect(el.open).toBe(false);
    });

    it('shows when open=true', async () => {
      const el = await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      expect(el.open).toBe(true);
      const modal = findActiveModal();
      expect(modal?.parentElement).toBe(document.body);
    });

    it('closes on Escape key and emits cancel event', async () => {
      const el = await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      const cancelHandler = vi.fn();
      el.addEventListener('qd:migration-cancel', cancelHandler);

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);
      await el.updateComplete;

      expect(cancelHandler).toHaveBeenCalled();
    });
  });

  describe('format mismatch display', () => {
    it('displays warning banner', async () => {
      await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      const content = getModalContent();
      expect(content).toContain('Storage format mismatch');
    });

    it('displays expected format', async () => {
      await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      const content = getModalContent();
      expect(content).toContain('obfuscated');
    });

    it('displays found format', async () => {
      await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      const content = getModalContent();
      expect(content).toContain('plain');
    });

    it('shows header "Database Migration Required"', async () => {
      await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      const content = getModalContent();
      expect(content).toContain('Database Migration Required');
    });
  });

  describe('password input', () => {
    it('renders password input field', async () => {
      await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      const passwordInput = queryModalContent('input[type="password"]');
      expect(passwordInput).toBeTruthy();
    });

    it('has instructor password label', async () => {
      await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      const content = getModalContent();
      expect(content).toContain('Instructor Password');
    });
  });

  describe('buttons', () => {
    it('renders Migrate Database button', async () => {
      await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      const buttons = queryAllModalContent('button');
      const migrateBtn = Array.from(buttons || []).find((b) =>
        b.textContent?.includes('Migrate Database'),
      );
      expect(migrateBtn).toBeTruthy();
    });

    it('renders Cancel button', async () => {
      await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      const buttons = queryAllModalContent('button');
      const cancelBtn = Array.from(buttons || []).find((b) =>
        b.textContent?.toLowerCase().includes('cancel'),
      );
      expect(cancelBtn).toBeTruthy();
    });

    it('emits qd:migration-cancel on cancel click', async () => {
      const el = await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      const cancelHandler = vi.fn();
      el.addEventListener('qd:migration-cancel', cancelHandler);

      const buttons = queryAllModalContent<HTMLButtonElement>('button');
      const cancelBtn = Array.from(buttons || []).find((b) =>
        b.textContent?.toLowerCase().includes('cancel'),
      );
      cancelBtn?.click();
      await el.updateComplete;

      expect(cancelHandler).toHaveBeenCalled();
    });
  });

  describe('password validation', () => {
    it('shows error for incorrect password', async () => {
      const el = await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });

      // Enter wrong password
      const passwordInput = queryModalContent<HTMLInputElement>('input[type="password"]');
      if (passwordInput) {
        passwordInput.value = 'wrongpassword';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Submit form
      const form = queryModalContent<HTMLFormElement>('form');
      form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 100)); // Wait for async validation

      // Check for error message
      const content = getModalContent();
      expect(content).toContain('Incorrect');
    });

    it('shows error when password not configured', async () => {
      // Remove the instructor hash element
      document.getElementById('qd-instructor-hash')?.remove();

      const el = await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });

      // Enter password
      const passwordInput = queryModalContent<HTMLInputElement>('input[type="password"]');
      if (passwordInput) {
        passwordInput.value = 'anypassword';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Submit form
      const form = queryModalContent<HTMLFormElement>('form');
      form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 100));

      // Check for error message
      const content = getModalContent();
      expect(content).toContain('not configured');
    });
  });

  describe('state transitions', () => {
    it('resets state when dialog opens', async () => {
      const el = await createDialog({
        open: false,
        expected: 'obfuscated',
        found: 'plain',
      });

      // Open dialog
      el.open = true;
      await el.updateComplete;
      await new Promise((r) => requestAnimationFrame(r));

      // Should show password form (initial state)
      const passwordInput = queryModalContent('input[type="password"]');
      expect(passwordInput).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('has dialog role via qd-modal', async () => {
      await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      const modal = findActiveModal();
      const dialog = modal?.shadowRoot?.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('password input has aria-label', async () => {
      await createDialog({
        open: true,
        expected: 'obfuscated',
        found: 'plain',
      });
      const passwordInput = queryModalContent<HTMLInputElement>('input[type="password"]');
      expect(passwordInput?.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('properties', () => {
    it('has expected property', async () => {
      const el = await createDialog({
        expected: 'obfuscated',
        found: 'plain',
      });
      expect(el.expected).toBe('obfuscated');
    });

    it('has found property', async () => {
      const el = await createDialog({
        expected: 'obfuscated',
        found: 'plain',
      });
      expect(el.found).toBe('plain');
    });

    it('has dbName property', async () => {
      const el = await createDialog({
        dbName: 'BrowserTestDB',
      });
      expect(el.dbName).toBe('BrowserTestDB');
    });

    it('has releaseId property', async () => {
      const el = await createDialog({
        releaseId: 'TRV Connectors Autumn 2025',
      });
      expect(el.releaseId).toBe('TRV Connectors Autumn 2025');
    });
  });
});
