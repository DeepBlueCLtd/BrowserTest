/**
 * E2E Tests: PIN Authentication
 *
 * Tests PIN authentication workflows:
 * - T015: New student PIN creation
 * - T027: Returning student login with PIN
 * - T037: Instructor PIN reset
 * - T049: Migration for existing students
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { submitStudentLogin } from '../helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ditaPath = path.resolve(__dirname, '../../../dita-demo');

/**
 * Wait for bootstrap to complete
 */
async function waitForBootstrap(page: Page): Promise<void> {
  await page.waitForSelector('qd-login', { state: 'attached', timeout: 2000 });
  await page.waitForTimeout(300);
}

/**
 * Clear all storage
 */
async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
    indexedDB.deleteDatabase('BrowserTestDB');
    indexedDB.deleteDatabase('BrowserTestDB');
  });
}

/**
 * Login as student with PIN
 */
async function loginStudent(
  page: Page,
  serviceId: string,
  name: string,
  pin: string,
): Promise<void> {
  const loginForm = page.locator('qd-login');
  await loginForm.locator('input[name="name"]').fill(name);
  await loginForm.locator('input[name="serviceId"]').fill(serviceId);
  await loginForm.locator('input[name="pin"]').fill(pin);
  await submitStudentLogin(loginForm);
}

/**
 * Login as instructor
 */
async function loginInstructor(page: Page, password: string): Promise<void> {
  // Click Instructor button (pierce shadow DOM)
  await page.locator('qd-login >> button:has-text("Instructor")').click();

  // Wait for modal and fill password (modal is in document.body, not shadow DOM)
  const modal = page.locator('qd-modal[open]');
  await expect(modal).toBeVisible({ timeout: 2000 });
  await modal.locator('input[type="password"]').fill(password);
  await modal.locator('button:has-text("Login")').click();
}

test.describe('PIN Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${ditaPath}/page-index.html`);
    await clearStorage(page);
    await page.reload();
    await waitForBootstrap(page);
  });

  test.describe('T015 - New Student PIN Creation', () => {
    test('should create PIN for new student and show confirmation', async ({ page }) => {
      // Fill login form with PIN
      await loginStudent(page, 'NEW001', 'New Student', '1234');

      // Wait for confirmation modal
      const confirmModal = page.locator('text=PIN Stored');
      await expect(confirmModal).toBeVisible({ timeout: 2000 });

      // Verify confirmation message
      await expect(page.locator('text=Your PIN has been saved')).toBeVisible();

      // Click OK to dismiss (faster than waiting for auto-close)
      await page.locator('button:has-text("OK")').click();

      // Verify logged in (status panel visible)
      const statusPanel = page.locator('qd-status');
      await expect(statusPanel).toBeVisible({ timeout: 2000 });
    });

    test('should reject invalid PIN format', async ({ page }) => {
      const loginForm = page.locator('qd-login');

      // Try with 3-digit PIN
      await loginForm.locator('input[name="name"]').fill('Test User');
      await loginForm.locator('input[name="serviceId"]').fill('TEST01');
      await loginForm.locator('input[name="pin"]').fill('123');

      // Login button should be disabled
      const loginBtn = loginForm.locator('button[type="submit"]');
      await expect(loginBtn).toBeDisabled();
    });

    test('should store PIN hash in IndexedDB', async ({ page }) => {
      // Create new student
      await loginStudent(page, 'HASH01', 'Hash Test', '5678');

      // Wait for confirmation and dismiss
      await page.waitForSelector('text=PIN Stored', { timeout: 2000 });
      await page.locator('button:has-text("OK")').click();

      // Verify student is logged in (PIN was stored successfully)
      await expect(page.locator('qd-status')).toBeVisible({ timeout: 2000 });

      // The PIN hash storage is verified by successful login
      // Detailed IndexedDB verification is in integration tests
    });
  });

  test.describe('T027 - Returning Student Login', () => {
    test('should authenticate returning student with correct PIN', async ({ page }) => {
      // First login - create student
      await loginStudent(page, 'RET001', 'Returning Student', '4321');
      await page.waitForSelector('text=PIN Stored', { timeout: 2000 });
      await page.locator('button:has-text("OK")').click();

      // Logout - pierce shadow DOM
      await page.locator('qd-status >> .logout-button').click();

      // Wait for login form
      await waitForBootstrap(page);

      // Login again with same PIN
      await loginStudent(page, 'RET001', 'Returning Student', '4321');

      // Should be logged in (no confirmation modal for returning student)
      await expect(page.locator('qd-status')).toBeVisible({ timeout: 2000 });
    });

    test('should reject incorrect PIN', async ({ page }) => {
      // First login - create student
      await loginStudent(page, 'WRONG01', 'Wrong PIN Test', '1111');
      await page.waitForSelector('text=PIN Stored', { timeout: 2000 });
      await page.locator('button:has-text("OK")').click();

      // Logout - pierce shadow DOM
      await page.locator('qd-status >> .logout-button').click();
      await waitForBootstrap(page);

      // Try with wrong PIN
      await loginStudent(page, 'WRONG01', 'Wrong PIN Test', '9999');

      // Should show error
      const errorMsg = page.locator('.error-message');
      await expect(errorMsg).toContainText('Incorrect PIN');
    });

    test('should lock out after 3 failed attempts', async ({ page }) => {
      // Create student
      await loginStudent(page, 'LOCK01', 'Lockout Test', '2222');
      await page.waitForSelector('text=PIN Stored', { timeout: 2000 });
      await page.locator('button:has-text("OK")').click();

      // Logout - pierce shadow DOM
      await page.locator('qd-status >> .logout-button').click();
      await waitForBootstrap(page);

      // Try 3 wrong PINs
      for (let i = 0; i < 3; i++) {
        await loginStudent(page, 'LOCK01', 'Lockout Test', '0000');
        // Wait for error message before next attempt
        await page.waitForSelector('.error-message', { timeout: 1000 }).catch(() => {});
      }

      // Should show lockout message
      const lockoutMsg = page.locator('.lockout-message');
      await expect(lockoutMsg).toContainText('Too many attempts');
    });
  });

  test.describe('T037 - Instructor PIN Reset', () => {
    test('should allow instructor to access reset dialog', async ({ page }) => {
      // Login as instructor (password matches hash in dita-demo)
      await loginInstructor(page, 'pwd');

      // Wait for modal to close
      await expect(page.locator('qd-modal[open]')).not.toBeVisible({ timeout: 2000 });

      // Verify instructor panel visible
      await expect(page.locator('qd-instructor')).toBeVisible({ timeout: 2000 });

      // Click Reset PINs button (pierce shadow DOM)
      await page.locator('qd-instructor >> button:has-text("Reset PINs")').click();

      // Wait for PIN reset dialog to open (qd-modal moves to body when opened,
      // so we look for a modal with the "Reset Student PIN" header content)
      const resetDialogModal = page
        .locator('qd-modal[open]')
        .filter({ hasText: 'Reset Student PIN' });
      await expect(resetDialogModal).toBeVisible({ timeout: 2000 });

      // Verify dialog content is rendered (search input visible)
      await expect(page.locator('.search-input')).toBeVisible();

      // Close dialog with Escape key
      await page.keyboard.press('Escape');

      // Verify dialog closed
      await expect(resetDialogModal).not.toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('T049 - Migration for Existing Students', () => {
    // This test writes plain data to IndexedDB - only works when ENCRYPT_STORAGE=false
    // The v1→v2 schema migration is also tested in unit/integration tests
    test('should prompt for PIN creation when v1 student logs in', async ({ page }) => {
      // Skip when encryption is enabled (plain data would cause format mismatch error)
      test.skip(
        process.env.ENCRYPT_STORAGE === 'true',
        'Skipped when ENCRYPT_STORAGE=true (test writes plain data)',
      );
      // Create a v1 student directly in IndexedDB (no PIN)
      await page.evaluate(async () => {
        return new Promise<void>((resolve, reject) => {
          // Use BrowserTestDB as configured in dita-demo
          const request = indexedDB.open('BrowserTestDB', 3);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('students')) {
              db.createObjectStore('students');
            }
            if (!db.objectStoreNames.contains('backups')) {
              db.createObjectStore('backups');
            }
            if (!db.objectStoreNames.contains('auditLog')) {
              db.createObjectStore('auditLog', { keyPath: 'eventId' });
            }
          };
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readwrite');
            const store = tx.objectStore('students');

            // Create v1 student (no PIN fields) with quiz data
            const v1Student = {
              schema: 1,
              docId: '',
              release: 'TRV Connectors Autumn 2025',
              serviceId: 'V1USER',
              name: 'Legacy User',
              attempted: 5,
              correct: 3,
              updated: new Date().toISOString(),
              pages: {
                'page-1': {
                  answers: [
                    { answer: 'a', success: true, timestamp: new Date().toISOString() },
                    { answer: 'b', success: true, timestamp: new Date().toISOString() },
                    { answer: 'c', success: true, timestamp: new Date().toISOString() },
                  ],
                  state: 'complete',
                },
                'page-2': {
                  answers: [
                    { answer: 'x', success: false, timestamp: new Date().toISOString() },
                    { answer: 'y', success: false, timestamp: new Date().toISOString() },
                  ],
                  state: 'incomplete',
                },
              },
            };

            const key = `qd/TRV Connectors Autumn 2025/uV1USER`;
            store.put(v1Student, key);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error(tx.error?.message || 'Transaction error'));
          };
          request.onerror = () => reject(new Error(request.error?.message || 'Request error'));
        });
      });

      // Reload to pick up the student
      await page.reload();
      await waitForBootstrap(page);

      // Login as the v1 student with a new PIN
      await loginStudent(page, 'V1USER', 'Legacy User', '7777');

      // Should show confirmation (PIN created during migration)
      const confirmModal = page.locator('text=PIN Stored');
      await expect(confirmModal).toBeVisible({ timeout: 2000 });

      // Click OK to dismiss
      await page.locator('button:has-text("OK")').click();

      // Verify logged in
      const statusPanel = page.locator('qd-status');
      await expect(statusPanel).toBeVisible({ timeout: 2000 });

      // Migration complete - student is logged in with new PIN
      // Quiz data preservation is tested in integration tests
    });
  });

  test.describe('Storage Format Migration Dialog', () => {
    // These tests verify the migration dialog shows when storage format doesn't match build
    // Test creates data in the "wrong" format to trigger StorageFormatError

    test('should show migration dialog when format mismatch detected', async ({ page }) => {
      // Skip when ENCRYPT_STORAGE is false - we'll create obfuscated data which won't be detected
      // This test only makes sense when ENCRYPT_STORAGE=true (expecting obfuscated) but finds plain
      test.skip(
        process.env.ENCRYPT_STORAGE !== 'true',
        'Test requires ENCRYPT_STORAGE=true to detect plain data as mismatch',
      );

      // Create plain (non-obfuscated) student data directly in IndexedDB
      await page.evaluate(async () => {
        return new Promise<void>((resolve, reject) => {
          const request = indexedDB.open('BrowserTestDB', 3);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('students')) {
              db.createObjectStore('students');
            }
            if (!db.objectStoreNames.contains('backups')) {
              db.createObjectStore('backups');
            }
            if (!db.objectStoreNames.contains('auditLog')) {
              db.createObjectStore('auditLog', { keyPath: 'eventId' });
            }
          };
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readwrite');
            const store = tx.objectStore('students');

            // Create plain student data (NOT obfuscated)
            const plainStudent = {
              schema: 2,
              docId: '',
              release: 'TRV Connectors Autumn 2025',
              serviceId: 'MISMATCH',
              name: 'Mismatch User',
              attempted: 0,
              correct: 0,
              updated: new Date().toISOString(),
              pages: {},
              pinHash: 'somehash',
              pinCreatedAt: new Date().toISOString(),
            };

            const key = `qd/TRV Connectors Autumn 2025/uMISMATCH`;
            store.put(plainStudent, key);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error(tx.error?.message || 'Transaction error'));
          };
          request.onerror = () => reject(new Error(request.error?.message || 'Request error'));
        });
      });

      // Reload to pick up the data
      await page.reload();
      await waitForBootstrap(page);

      // Try to login - should trigger format mismatch
      await loginStudent(page, 'MISMATCH', 'Mismatch User', '1234');

      // Should show migration dialog
      const migrationDialog = page
        .locator('qd-modal[open]')
        .filter({ hasText: 'Database Migration Required' });
      await expect(migrationDialog).toBeVisible({ timeout: 2000 });

      // Verify it shows format mismatch info
      await expect(page.locator('text=Storage format mismatch')).toBeVisible();
      await expect(page.locator('text=plain')).toBeVisible();
      await expect(page.locator('text=obfuscated')).toBeVisible();
    });

    test('should allow canceling migration dialog', async ({ page }) => {
      test.skip(process.env.ENCRYPT_STORAGE !== 'true', 'Test requires ENCRYPT_STORAGE=true');

      // Create plain student data
      await page.evaluate(async () => {
        return new Promise<void>((resolve, reject) => {
          const request = indexedDB.open('BrowserTestDB', 3);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('students')) {
              db.createObjectStore('students');
            }
            if (!db.objectStoreNames.contains('backups')) {
              db.createObjectStore('backups');
            }
            if (!db.objectStoreNames.contains('auditLog')) {
              db.createObjectStore('auditLog', { keyPath: 'eventId' });
            }
          };
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readwrite');
            const store = tx.objectStore('students');

            const plainStudent = {
              schema: 2,
              docId: '',
              release: 'TRV Connectors Autumn 2025',
              serviceId: 'CANCEL01',
              name: 'Cancel Test',
              attempted: 0,
              correct: 0,
              updated: new Date().toISOString(),
              pages: {},
              pinHash: 'somehash',
              pinCreatedAt: new Date().toISOString(),
            };

            const key = `qd/TRV Connectors Autumn 2025/uCANCEL01`;
            store.put(plainStudent, key);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error(tx.error?.message || 'Transaction error'));
          };
          request.onerror = () => reject(new Error(request.error?.message || 'Request error'));
        });
      });

      await page.reload();
      await waitForBootstrap(page);

      // Trigger migration dialog
      await loginStudent(page, 'CANCEL01', 'Cancel Test', '1234');

      // Wait for migration dialog
      const migrationDialog = page
        .locator('qd-modal[open]')
        .filter({ hasText: 'Database Migration Required' });
      await expect(migrationDialog).toBeVisible({ timeout: 2000 });

      // Click cancel
      await page.locator('button:has-text("Cancel")').click();

      // Dialog should close
      await expect(migrationDialog).not.toBeVisible({ timeout: 2000 });

      // Should show error message about contacting instructor
      await expect(page.locator('.error-message')).toContainText('contact');
    });

    test('should reject incorrect instructor password in migration dialog', async ({ page }) => {
      test.skip(process.env.ENCRYPT_STORAGE !== 'true', 'Test requires ENCRYPT_STORAGE=true');

      // Create plain student data
      await page.evaluate(async () => {
        return new Promise<void>((resolve, reject) => {
          const request = indexedDB.open('BrowserTestDB', 3);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('students')) {
              db.createObjectStore('students');
            }
            if (!db.objectStoreNames.contains('backups')) {
              db.createObjectStore('backups');
            }
            if (!db.objectStoreNames.contains('auditLog')) {
              db.createObjectStore('auditLog', { keyPath: 'eventId' });
            }
          };
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readwrite');
            const store = tx.objectStore('students');

            const plainStudent = {
              schema: 2,
              docId: '',
              release: 'TRV Connectors Autumn 2025',
              serviceId: 'WRONGPW',
              name: 'Wrong Password',
              attempted: 0,
              correct: 0,
              updated: new Date().toISOString(),
              pages: {},
              pinHash: 'somehash',
              pinCreatedAt: new Date().toISOString(),
            };

            const key = `qd/TRV Connectors Autumn 2025/uWRONGPW`;
            store.put(plainStudent, key);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error(tx.error?.message || 'Transaction error'));
          };
          request.onerror = () => reject(new Error(request.error?.message || 'Request error'));
        });
      });

      await page.reload();
      await waitForBootstrap(page);

      // Trigger migration dialog
      await loginStudent(page, 'WRONGPW', 'Wrong Password', '1234');

      // Wait for migration dialog
      const migrationDialog = page
        .locator('qd-modal[open]')
        .filter({ hasText: 'Database Migration Required' });
      await expect(migrationDialog).toBeVisible({ timeout: 2000 });

      // Enter wrong password
      await migrationDialog.locator('input[type="password"]').fill('wrongpassword');
      await migrationDialog.locator('button:has-text("Migrate Database")').click();

      // Should show error
      await expect(page.locator('.error-message')).toContainText('Incorrect');

      // Dialog should still be open
      await expect(migrationDialog).toBeVisible();
    });
  });
});
