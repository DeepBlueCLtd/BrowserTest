/**
 * E2E Test: Cohort Management Workflow
 *
 * Tests data management functionality:
 * - Complete data erasure (IndexedDB + sessionStorage)
 * - Confirmation dialog workflow
 * - Multi-student data cleanup
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../dita-demo');

const TEST_PASSWORD = 'instructor123';

/**
 * Wait for bootstrap to complete and inject components
 */
async function waitForBootstrap(page: Page): Promise<void> {
  // Wait for qd-login element AND its shadow DOM to be ready
  await page.locator('qd-login[data-ready]').waitFor({ timeout: 5000 });
}

test.describe.skip('Cohort Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTest');
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
          const request = indexedDB.open('BrowserTest');
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
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();

    // Wait for instructor panel
    await expect(page.locator('qd-instructor .instructor-panel')).toBeVisible();

    // Setup dialog handler to confirm erasure
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toMatch(/erase|delete|clear|all data/i);
      await dialog.accept();
    });

    // Click erase button
    const eraseButton = page.locator('button').filter({ hasText: /erase.*data/i });
    await expect(eraseButton).toBeVisible();
    await eraseButton.click();

    // Verify IndexedDB cleared
    const dataAfter = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('BrowserTest');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('students', 'readonly');
          const store = tx.objectStore('students');
          const getRequest = store.getAll();
          getRequest.onsuccess = () => resolve(getRequest.result);
        };
      });
    });
    expect(dataAfter).toEqual([]);

    // Verify sessionStorage cleared
    const sessionData = await page.evaluate(() => sessionStorage.getItem('qd/session'));
    expect(sessionData).toBeNull();
  });

  test.skip('should cancel data erasure on confirmation reject', async ({ page }) => {
    // Create student data
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
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
          const request = indexedDB.open('BrowserTest');
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
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await expect(page.locator('qd-instructor .instructor-panel')).toBeVisible();

    // Setup dialog handler to cancel erasure
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.dismiss();
    });

    // Click erase button
    const eraseButton = page.locator('button').filter({ hasText: /erase.*data/i });
    await expect(eraseButton).toBeVisible();
    await eraseButton.click();

    // Verify data still exists
    const dataAfter = await page.evaluate(async () => {
      return new Promise<unknown[]>((resolve) => {
        const request = indexedDB.open('BrowserTest');
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

  test.skip('should erase multiple student records', async ({ page }) => {
    // Create first student
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);
    let login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('button[type="submit"]').click();
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
          const request = indexedDB.open('BrowserTest');
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
          const request = indexedDB.open('BrowserTest');
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
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await expect(page.locator('qd-instructor .instructor-panel')).toBeVisible();

    // Confirm erasure
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const eraseButton = page.locator('button').filter({ hasText: /erase.*data/i });
    await expect(eraseButton).toBeVisible();
    await eraseButton.click();

    // Verify all students cleared
    const studentsAfter = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('BrowserTest');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('students', 'readonly');
          const store = tx.objectStore('students');
          const getRequest = store.getAll();
          getRequest.onsuccess = () => resolve(getRequest.result);
        };
      });
    });
    expect(studentsAfter).toEqual([]);
  });

  test.skip('should emit data-cleared event after erasure', async ({ page }) => {
    // Create student data
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await expect(page.locator('qd-status')).toBeVisible();

    // Unlock instructor
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await expect(page.locator('qd-instructor .instructor-panel')).toBeVisible();

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

    // Confirm and trigger erasure
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const eraseButton = page.locator('button').filter({ hasText: /erase.*data/i });
    await eraseButton.click();

    // Verify event was emitted
    const eventFired = await eventPromise;
    expect(eventFired).toBe(true);
  });
});
