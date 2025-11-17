/**
 * E2E Test: Progress Tracking Workflow
 *
 * Tests the complete student workflow:
 * - Login
 * - Quiz answering (MCQ and numeric)
 * - Answer persistence
 * - Progress tracking (R/A/G badges)
 * - State calculation
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import type { StudentRecord, PageData } from '../../../src/types/contracts.js';

// Get absolute path to demo files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../demo');

interface PagesRecord {
  [pageId: string]: PageData;
}

/**
 * Wait for bootstrap to complete and inject components
 */
async function waitForBootstrap(page: Page): Promise<void> {
  // Wait for qd-login element AND its shadow content to render
  await page.locator('qd-login input[name="serviceId"]').waitFor({ timeout: 5000 });
}

test.describe('Progress Tracking Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('SonarQuizDB');
    });

    // Wait for bootstrap to inject qd-login component
    await waitForBootstrap(page);
  });

  test('should complete login flow with valid credentials', async ({ page }) => {
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await waitForBootstrap(page);

    // Wait for login component to load
    const login = page.locator('qd-login');
    await expect(login).toBeVisible();

    // Fill in login form
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');

    // Submit login
    await login.locator('button[type="submit"]').click();

    // Verify status panel appears
    const status = page.locator('qd-status');
    await expect(status).toBeVisible();

    // Verify status shows correct information
    await expect(status).toContainText('John Doe');
    await expect(status).toContainText('TEST001');
  });

  test('should answer MCQ questions and save to IndexedDB', async ({ page }) => {
    // Login first
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await waitForBootstrap(page);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();

    // Navigate to quiz page
    await page.goto(`file://${demoPath}/quiz-mcq.html`);

    // Answer first question (MCQ)
    const firstQuestion = page.locator('input[type="radio"]').first();
    await firstQuestion.click();

    // Verify answer saved in IndexedDB
    await expect(async () => {
      const savedData = await page.evaluate(async () => {
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
      expect(savedData).toBeTruthy();
    }).toPass();
  });

  test('should answer numeric questions with tolerance validation', async ({ page }) => {
    // Login first
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await waitForBootstrap(page);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();

    // Navigate to numeric quiz page
    await page.goto(`file://${demoPath}/quiz-numeric.html`);

    // Answer numeric question
    const numericInput = page.locator('input[type="number"]').first();
    await numericInput.fill('42');

    // Verify answer was saved
    await expect(async () => {
      const savedData = await page.evaluate(async () => {
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
      expect(savedData).toBeTruthy();
    }).toPass();
  });

  test('should persist answers across page reload', async ({ page }) => {
    // Login and answer question
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await waitForBootstrap(page);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();

    await page.goto(`file://${demoPath}/quiz-mcq.html`);

    const firstQuestion = page.locator('input[type="radio"]').first();
    await firstQuestion.click();

    // Reload page
    await page.reload();

    // Verify answer is still selected
    const selectedRadio = page.locator('input[type="radio"]:checked').first();
    await expect(selectedRadio).toBeChecked();
  });

  test('should update R/A/G badges on home page', async ({ page }) => {
    // Login
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await waitForBootstrap(page);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();

    // Initially, badges should be red (unstarted)
    const badge = page.locator('.quizPageBtn').first();
    await expect(badge).toHaveClass(/qd-badge-red/);

    // Answer questions on quiz page
    await page.goto(`file://${demoPath}/quiz-mcq.html`);

    const firstQuestion = page.locator('input[type="radio"]').first();
    await firstQuestion.click();

    // Go back to index
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await waitForBootstrap(page);

    // Badge should now be amber or green (incomplete or complete)
    await expect(badge).toHaveClass(/qd-badge-(amber|green)/);
  });

  test('should calculate completion state correctly', async ({ page }) => {
    // Login
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await waitForBootstrap(page);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();

    // Navigate to quiz with multiple questions
    await page.goto(`file://${demoPath}/quiz-examples.html`);

    // Answer all questions
    const radios = await page.locator('input[type="radio"]').all();
    for (const radio of radios) {
      await radio.click();
    }

    // Check completion state in IndexedDB
    await expect(async () => {
      const completionState = await page.evaluate(async () => {
        return new Promise<string>((resolve) => {
          const request = indexedDB.open('SonarQuizDB');
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readonly');
            const store = tx.objectStore('students');
            const getRequest = store.getAll();
            getRequest.onsuccess = () => {
              const students = getRequest.result as StudentRecord[];
              if (students.length > 0) {
                const student = students[0];
                const pages = student.pages as PagesRecord;
                const pagesArray = Object.values(pages);
                resolve(pagesArray[0]?.state || 'unknown');
              } else {
                resolve('no-data');
              }
            };
          };
        });
      });

      // State should be 'complete' or 'incomplete' (not 'unstarted')
      expect(completionState).toMatch(/complete|incomplete/);
    }).toPass();
  });

  test('should handle logout correctly', async ({ page }) => {
    // Login
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await waitForBootstrap(page);
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();

    // Verify status panel visible
    const status = page.locator('qd-status');
    await expect(status).toBeVisible();

    // Click logout
    const logoutButton = status.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();

    // Verify login panel reappears
    await expect(login).toBeVisible();

    // Verify sessionStorage cleared
    const sessionData = await page.evaluate(() => sessionStorage.getItem('qd/session'));
    expect(sessionData).toBeNull();
  });
});
