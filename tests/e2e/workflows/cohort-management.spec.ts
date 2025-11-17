/**
 * E2E Test: Cohort Management Workflow
 *
 * Tests data management functionality:
 * - Complete data erasure (IndexedDB + sessionStorage)
 * - Confirmation dialog workflow
 * - Multi-student data cleanup
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../demo');

const TEST_PASSWORD = 'instructor123';

test.describe('Cohort Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('SonarQuizDB');
    });
  });

  test('should erase all data with confirmation', async ({ page }) => {
    // Create student data first
    await page.goto(`file://${demoPath}/quiz-index.html`);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Answer some questions
    await page.goto(`file://${demoPath}/quiz-mcq.html`);
    await page.waitForTimeout(500);
    const firstRadio = page.locator('input[type="radio"]').first();
    await firstRadio.click();
    await page.waitForTimeout(1000);

    // Verify data exists in IndexedDB
    const dataBefore = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('SonarQuizDB');
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

    // Unlock instructor mode
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();
    await page.waitForTimeout(300);

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await page.waitForTimeout(500);

    // Setup dialog handler to confirm erasure
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toMatch(/erase|delete|clear|all data/i);
      await dialog.accept();
    });

    // Click erase button
    const eraseButton = page.locator('button').filter({ hasText: /erase.*data/i });
    await eraseButton.click();
    await page.waitForTimeout(1000);

    // Verify IndexedDB cleared
    const dataAfter = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('SonarQuizDB');
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

  test('should cancel data erasure on confirmation reject', async ({ page }) => {
    // Create student data
    await page.goto(`file://${demoPath}/quiz-index.html`);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Answer a question
    await page.goto(`file://${demoPath}/quiz-mcq.html`);
    await page.waitForTimeout(500);
    const firstRadio = page.locator('input[type="radio"]').first();
    await firstRadio.click();
    await page.waitForTimeout(1000);

    // Unlock instructor mode
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();
    await page.waitForTimeout(300);

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await page.waitForTimeout(500);

    // Setup dialog handler to cancel erasure
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.dismiss();
    });

    // Click erase button
    const eraseButton = page.locator('button').filter({ hasText: /erase.*data/i });
    await eraseButton.click();
    await page.waitForTimeout(500);

    // Verify data still exists
    const dataAfter = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('SonarQuizDB');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('students', 'readonly');
          const store = tx.objectStore('students');
          const getRequest = store.getAll();
          getRequest.onsuccess = () => resolve(getRequest.result);
        };
      });
    });
    expect(dataAfter).toBeTruthy();
    expect((dataAfter as any[]).length).toBeGreaterThan(0);
  });

  test('should erase multiple student records', async ({ page }) => {
    // Create first student
    await page.goto(`file://${demoPath}/quiz-index.html`);
    let login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Answer a question as first student
    await page.goto(`file://${demoPath}/quiz-mcq.html`);
    await page.waitForTimeout(500);
    let firstRadio = page.locator('input[type="radio"]').first();
    await firstRadio.click();
    await page.waitForTimeout(1000);

    // Logout
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await page.waitForTimeout(500);
    const status = page.locator('qd-status');
    const logoutButton = status.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();
    await page.waitForTimeout(500);

    // Create second student
    login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST002');
    await login.locator('input[name="name"]').fill('Jane Smith');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Answer a question as second student
    await page.goto(`file://${demoPath}/quiz-mcq.html`);
    await page.waitForTimeout(500);
    firstRadio = page.locator('input[type="radio"]').first();
    await firstRadio.click();
    await page.waitForTimeout(1000);

    // Verify two students in IndexedDB
    const studentsBefore = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('SonarQuizDB');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('students', 'readonly');
          const store = tx.objectStore('students');
          const getRequest = store.getAll();
          getRequest.onsuccess = () => resolve(getRequest.result);
        };
      });
    });
    expect((studentsBefore as any[]).length).toBe(2);

    // Unlock instructor and erase all data
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();
    await page.waitForTimeout(300);

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await page.waitForTimeout(500);

    // Confirm erasure
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const eraseButton = page.locator('button').filter({ hasText: /erase.*data/i });
    await eraseButton.click();
    await page.waitForTimeout(1000);

    // Verify all students cleared
    const studentsAfter = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('SonarQuizDB');
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

  test('should emit data-cleared event after erasure', async ({ page }) => {
    // Create student data
    await page.goto(`file://${demoPath}/quiz-index.html`);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

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
    await page.waitForTimeout(300);

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await page.waitForTimeout(500);

    // Setup event listener
    const eventPromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:data-cleared', () => {
          resolve(true);
        }, { once: true });
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
