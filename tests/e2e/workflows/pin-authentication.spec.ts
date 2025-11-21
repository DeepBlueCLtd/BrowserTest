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
    indexedDB.deleteDatabase('BrowserTest');
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
  await loginForm.locator('button[type="submit"]').click();
}

// loginInstructor helper removed - T037 instructor test is skipped pending configuration

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

      // Check IndexedDB for student record with PIN
      const hasPin = await page.evaluate(async () => {
        return new Promise<boolean>((resolve) => {
          const request = indexedDB.open('BrowserTest', 3);
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readonly');
            const store = tx.objectStore('students');
            const getAll = store.getAll();
            getAll.onsuccess = () => {
              const students = getAll.result as Array<{ serviceId: string; pinHash?: string }>;
              const student = students.find((s) => s.serviceId === 'HASH01');
              resolve(Boolean(student && student.pinHash && student.pinHash.length === 64));
            };
            getAll.onerror = () => resolve(false);
          };
          request.onerror = () => resolve(false);
        });
      });

      expect(hasPin).toBe(true);
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
    test.skip('should allow instructor to reset student PIN', async ({ page }) => {
      // This test requires instructor password to be configured
      // Skip for now as it depends on page-specific configuration

      // Create student first
      await loginStudent(page, 'RESET01', 'Reset Test', '3333');
      await page.waitForSelector('text=PIN Stored', { timeout: 2000 });
      await page.waitForTimeout(3500);

      // Logout - pierce shadow DOM
      await page.locator('qd-status >> .logout-button').click();
      await waitForBootstrap(page);

      // Login as instructor (would need valid password hash in page)
      // await loginInstructor(page, 'instructor-password');

      // Click Reset PINs button
      // await page.locator('button:has-text("Reset PINs")').click();

      // Select student and reset
      // ...
    });
  });

  test.describe('T049 - Migration for Existing Students', () => {
    test('should prompt for PIN creation when v1 student logs in', async ({ page }) => {
      // Create a v1 student directly in IndexedDB (no PIN)
      await page.evaluate(async () => {
        return new Promise<void>((resolve, reject) => {
          const request = indexedDB.open('BrowserTest', 3);
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

      // Verify quiz data preserved (pierce shadow DOM)
      const progressText = await page.locator('qd-status >> .progress-text').textContent();
      expect(progressText).toContain('3');
    });
  });
});
