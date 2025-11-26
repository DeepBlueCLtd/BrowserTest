/**
 * E2E Test: Cohort Management Workflow
 *
 * Tests data management functionality:
 * - Complete data erasure (sessionStorage qd/ keys)
 * - Confirmation dialog workflow
 * - Multi-student data cleanup
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../dita-demo');

const TEST_PASSWORD = 'pwd';

/**
 * Wait for bootstrap to complete and inject components
 */
async function waitForBootstrap(page: Page): Promise<void> {
  // Wait for qd-login element AND its shadow DOM to be ready
  // Use 'attached' state since qd-login may be hidden after login
  await page.locator('qd-login[data-ready]').waitFor({ state: 'attached', timeout: 2000 });
}

/**
 * Close PIN confirmation dialog if visible
 */
async function closePinConfirmationDialog(page: Page): Promise<void> {
  try {
    await page.locator('#qd-pin-confirmation-ok').click({ force: true, timeout: 2000 });
  } catch {
    // Dialog not visible or already closed, ignore
  }
}

test.describe('Cohort Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTestDB');
    });

    // Wait for bootstrap to inject qd-login component
    await waitForBootstrap(page);
  });

  test('should erase all data with confirmation', async ({ page }) => {
    // Create student data first
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await expect(page.locator('qd-status')).toBeVisible();

    // Answer some questions
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.waitForTimeout(500); // Wait for enhancement
    const quizTable = page.locator('table.qd-quiz');
    await expect(quizTable).toBeVisible();
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await expect(firstInput).toBeVisible();
    await firstInput.selectOption({ index: 1 });

    // Verify data exists in IndexedDB
    await expect(async () => {
      const dataBefore = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const request = indexedDB.open('BrowserTestDB');
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readonly');
            const store = tx.objectStore('students');
            const getRequest = store.getAll();
            getRequest.onsuccess = () => resolve(getRequest.result);
          };
        });
      });
      expect(dataBefore).toBeTruthy();
    }).toPass();

    // Unlock instructor mode
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    // Logout first to make qd-login visible
    const statusPanel = page.locator('qd-status');
    const logoutButton = statusPanel.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();
    await expect(page.locator('qd-login')).toBeVisible();

    // Page already has qd-instructor-hash element with the correct hash

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click({ force: true });
    await page.waitForTimeout(500); // Wait for instructor modal to open

    const passwordInput = page.locator('.qd-modal-backdrop input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 3000 });
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('.qd-modal-backdrop button[type="submit"]');
    await unlockButton.click();
    await expect(passwordInput).not.toBeVisible();
    await expect(page.getByText('View All Scores')).toBeVisible();

    // Click erase button to open confirmation modal
    const eraseButton = page.locator('button').filter({ hasText: /erase.*data/i });
    await expect(eraseButton).toBeVisible();
    await eraseButton.click();

    // Fill in confirmation text in the modal
    const confirmInput = page.locator('.qd-manage-modal-overlay input[type="text"]');
    await expect(confirmInput).toBeVisible();
    await confirmInput.fill('DELETE ALL DATA');

    // Click confirm button
    const confirmButton = page
      .locator('.qd-manage-modal-overlay button')
      .filter({ hasText: /delete/i });
    await confirmButton.click();

    // Wait for modal to close
    await expect(confirmInput).not.toBeVisible();

    // Verify sessionStorage cleared (clearQuizData clears sessionStorage, not IndexedDB)
    const sessionData = await page.evaluate(() => sessionStorage.getItem('qd/session'));
    expect(sessionData).toBeNull();

    // Also verify no qd/ prefixed keys exist
    const qdKeys = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('qd/')) keys.push(key);
      }
      return keys;
    });
    expect(qdKeys).toEqual([]);
  });

  test('should cancel data erasure on confirmation reject', async ({ page }) => {
    // Create student data
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await expect(page.locator('qd-status')).toBeVisible();

    // Answer a question
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.waitForTimeout(500);
    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });

    // Wait for save
    await expect(async () => {
      const savedData = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const request = indexedDB.open('BrowserTestDB');
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readonly');
            const store = tx.objectStore('students');
            const getRequest = store.getAll();
            getRequest.onsuccess = () => resolve(getRequest.result);
          };
        });
      });
      expect(savedData).toBeTruthy();
    }).toPass();

    // Unlock instructor mode
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    // Logout first to make qd-login visible
    const instructorStatusPanel = page.locator('qd-status');
    const instructorLogoutButton = instructorStatusPanel
      .locator('button')
      .filter({ hasText: /logout/i });
    await instructorLogoutButton.click();
    await expect(page.locator('qd-login')).toBeVisible();

    // Page already has qd-instructor-hash element with the correct hash

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click({ force: true });
    await page.waitForTimeout(500); // Wait for instructor modal to open

    const passwordInput = page.locator('.qd-modal-backdrop input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 3000 });
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('.qd-modal-backdrop button[type="submit"]');
    await unlockButton.click();
    await expect(passwordInput).not.toBeVisible();
    await expect(page.getByText('View All Scores')).toBeVisible();

    // Click erase button to open confirmation modal
    const eraseButton = page.locator('button').filter({ hasText: /erase.*data/i });
    await expect(eraseButton).toBeVisible();
    await eraseButton.click();

    // Verify modal appears
    const confirmInput = page.locator('.qd-manage-modal-overlay input[type="text"]');
    await expect(confirmInput).toBeVisible();

    // Click cancel button (X button)
    const cancelButton = page.locator('.qd-manage-modal-overlay button').filter({ hasText: '✕' });
    await cancelButton.click();

    // Wait for modal to close
    await expect(confirmInput).not.toBeVisible();

    // Verify data still exists
    const dataAfter = await page.evaluate(async () => {
      return new Promise<unknown[]>((resolve) => {
        const request = indexedDB.open('BrowserTestDB');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('students', 'readonly');
          const store = tx.objectStore('students');
          const getRequest = store.getAll();
          getRequest.onsuccess = () => resolve(getRequest.result as unknown[]);
        };
      });
    });
    expect(dataAfter).toBeTruthy();
    expect(dataAfter.length).toBeGreaterThan(0);
  });

  test('should erase multiple student records', async ({ page }) => {
    // Create first student
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);
    let login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await expect(page.locator('qd-status')).toBeVisible();

    // Answer a question as first student
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.waitForTimeout(500);
    let quizTable = page.locator('table.qd-quiz');
    let firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });

    // Wait for save
    await expect(async () => {
      const savedData = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const request = indexedDB.open('BrowserTestDB');
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readonly');
            const store = tx.objectStore('students');
            const getRequest = store.getAll();
            getRequest.onsuccess = () => resolve(getRequest.result);
          };
        });
      });
      expect(savedData).toBeTruthy();
    }).toPass();

    // Logout
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);
    const status = page.locator('qd-status');
    const logoutButton = status.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();
    await expect(page.locator('qd-login')).toBeVisible();

    // Create second student
    login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST002');
    await login.locator('input[name="name"]').fill('Jane Smith');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await expect(page.locator('qd-status')).toBeVisible();

    // Answer a question as second student
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.waitForTimeout(500);
    quizTable = page.locator('table.qd-quiz');
    firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });

    // Verify two students in IndexedDB
    await expect(async () => {
      const studentsBefore = await page.evaluate(async () => {
        return new Promise<unknown[]>((resolve) => {
          const request = indexedDB.open('BrowserTestDB');
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readonly');
            const store = tx.objectStore('students');
            const getRequest = store.getAll();
            getRequest.onsuccess = () => resolve(getRequest.result as unknown[]);
          };
        });
      });
      expect(studentsBefore.length).toBe(2);
    }).toPass();

    // Unlock instructor and erase all data
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    // Logout first to make qd-login visible
    const multiStatusPanel = page.locator('qd-status');
    const multiLogoutButton = multiStatusPanel.locator('button').filter({ hasText: /logout/i });
    await multiLogoutButton.click();
    await expect(page.locator('qd-login')).toBeVisible();

    // Page already has qd-instructor-hash element with the correct hash

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click({ force: true });
    await page.waitForTimeout(500); // Wait for instructor modal to open

    const passwordInput = page.locator('.qd-modal-backdrop input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 3000 });
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('.qd-modal-backdrop button[type="submit"]');
    await unlockButton.click();
    await expect(passwordInput).not.toBeVisible();
    await expect(page.getByText('View All Scores')).toBeVisible();

    // Click erase button to open confirmation modal
    const eraseButton = page.locator('button').filter({ hasText: /erase.*data/i });
    await expect(eraseButton).toBeVisible();
    await eraseButton.click();

    // Fill in confirmation text in the modal
    const confirmInput = page.locator('.qd-manage-modal-overlay input[type="text"]');
    await expect(confirmInput).toBeVisible();
    await confirmInput.fill('DELETE ALL DATA');

    // Click confirm button
    const confirmButton = page
      .locator('.qd-manage-modal-overlay button')
      .filter({ hasText: /delete/i });
    await confirmButton.click();

    // Wait for modal to close
    await expect(confirmInput).not.toBeVisible();

    // Verify sessionStorage cleared (clearQuizData clears sessionStorage, not IndexedDB)
    const sessionData = await page.evaluate(() => sessionStorage.getItem('qd/session'));
    expect(sessionData).toBeNull();

    // Also verify no qd/ prefixed keys exist
    const qdKeys = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('qd/')) keys.push(key);
      }
      return keys;
    });
    expect(qdKeys).toEqual([]);
  });

  test('should emit data-cleared event after erasure', async ({ page }) => {
    // Create student data
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await expect(page.locator('qd-status')).toBeVisible();

    // Unlock instructor
    // Logout first to make qd-login visible
    const eventStatusPanel = page.locator('qd-status');
    const eventLogoutButton = eventStatusPanel.locator('button').filter({ hasText: /logout/i });
    await eventLogoutButton.click();
    await expect(page.locator('qd-login')).toBeVisible();

    // Page already has qd-instructor-hash element with the correct hash

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click({ force: true });
    await page.waitForTimeout(500); // Wait for instructor modal to open

    const passwordInput = page.locator('.qd-modal-backdrop input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 3000 });
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('.qd-modal-backdrop button[type="submit"]');
    await unlockButton.click();
    await expect(passwordInput).not.toBeVisible();
    await expect(page.getByText('View All Scores')).toBeVisible();

    // Setup event listener
    const eventPromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener(
          'qd:data-cleared',
          () => {
            resolve(true);
          },
          { once: true },
        );
        setTimeout(() => resolve(false), 3000);
      });
    });

    // Click erase button to open confirmation modal
    const eraseButton = page.locator('button').filter({ hasText: /erase.*data/i });
    await eraseButton.click();

    // Fill in confirmation text in the modal
    const confirmInput = page.locator('.qd-manage-modal-overlay input[type="text"]');
    await expect(confirmInput).toBeVisible();
    await confirmInput.fill('DELETE ALL DATA');

    // Click confirm button
    const confirmButton = page
      .locator('.qd-manage-modal-overlay button')
      .filter({ hasText: /delete/i });
    await confirmButton.click();

    // Wait for modal to close
    await expect(confirmInput).not.toBeVisible();

    // Verify event was emitted
    const eventFired = await eventPromise;
    expect(eventFired).toBe(true);
  });
});
