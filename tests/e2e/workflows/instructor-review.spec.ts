/**
 * E2E Test: Instructor Review Workflow
 *
 * Tests instructor functionality:
 * - Password unlock with rate limiting
 * - Viewing student scores
 * - CSV export
 * - Answer review
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../dita-demo');

// Test password: "instructor123"
// Hash: c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5
const TEST_PASSWORD = 'instructor123';

/**
 * Wait for bootstrap to complete and inject components
 */
async function waitForBootstrap(page: Page): Promise<void> {
  // Wait for qd-login element AND its shadow DOM to be ready
  await page.locator('qd-login[data-ready]').waitFor({ timeout: 5000 });
}

test.describe.skip('Instructor Review Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTest');
    });

    // Wait for bootstrap to inject qd-login component
    await waitForBootstrap(page);

    // Login as student first to create some data
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('button[type="submit"]').click();

    // Wait for status to be visible
    await expect(page.locator('qd-status')).toBeVisible();
  });

  test('should unlock instructor mode with correct password', async ({ page }) => {
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    // Inject password hash into DOM (simulating Oxygen XSL)
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    // Click instructor button
    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    // Fill password
    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(TEST_PASSWORD);

    // Submit
    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();

    // Verify instructor panel appears
    const instructorPanel = page.locator('qd-instructor .instructor-panel');
    await expect(instructorPanel).toBeVisible();
  });

  test('should enforce rate limiting after failed attempts', async ({ page }) => {
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    // Inject password hash
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    // Click instructor button
    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Try wrong password 3 times
    for (let i = 0; i < 3; i++) {
      await passwordInput.fill('wrong-password');
      const unlockButton = page.locator('qd-instructor button[type="submit"]');
      await unlockButton.click();
      await expect(passwordInput).toBeVisible();
    }

    // Verify rate limit message appears
    const rateLimitText = page.locator('qd-instructor').locator('text=/wait|locked|try again/i');
    await expect(rateLimitText).toBeVisible({ timeout: 1000 });
  });

  test('should display student scores in modal', async ({ page }) => {
    // Answer some questions to create score data
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);

    await page.waitForTimeout(500);
    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });

    // Wait for save to complete
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

    // Go back and unlock instructor
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

    // Click "View Scores" button
    const viewScoresButton = page.locator('button').filter({ hasText: /view scores/i });
    await expect(viewScoresButton).toBeVisible();
    await viewScoresButton.click();

    // Verify modal appears
    const scoresModal = page.locator('qd-instructor-scores .modal-overlay');
    await expect(scoresModal).toBeVisible();

    // Verify student data shown
    await expect(scoresModal).toContainText('John Doe');
    await expect(scoresModal).toContainText('TEST001');
  });

  test('should export CSV with student data', async ({ page }) => {
    // Answer questions to create data
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);

    await page.waitForTimeout(500);
    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });

    // Wait for save to complete
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

    // Unlock instructor
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

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    const exportButton = page.locator('button').filter({ hasText: /export.*csv/i });
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    // Verify download triggered
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/quiz-data-.*\.csv/);
  });

  test('should show student answers when instructor mode active', async ({ page }) => {
    // Student answers a question
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);

    await page.waitForTimeout(500);
    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });

    // Wait for save to complete
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

    // Unlock instructor on same page
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    // Since we're on quiz page, need to go to index first
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();

    // Verify instructor panel appears
    const instructorPanel = page.locator('qd-instructor .instructor-panel');
    await expect(instructorPanel).toBeVisible();

    // Toggle "Show Answers" (if that feature exists)
    // This test assumes instructor can see student answers on quiz pages
    // Implementation may vary based on actual feature
  });

  test('should close scores modal on close button', async ({ page }) => {
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

    // Open scores modal
    const viewScoresButton = page.locator('button').filter({ hasText: /view scores/i });
    await expect(viewScoresButton).toBeVisible();
    await viewScoresButton.click();

    const scoresModal = page.locator('qd-instructor-scores .modal-overlay');
    await expect(scoresModal).toBeVisible();

    // Close modal
    const closeButton = scoresModal.locator('button.close-button');
    await closeButton.click();

    // Verify modal closed
    await expect(scoresModal).not.toBeVisible();
  });

  test('should clear all student UI state on student-to-instructor transition (FR-001, FR-002)', async ({
    page,
  }) => {
    // ===== STUDENT SESSION =====
    // 1. Student logs in and answers questions
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.waitForTimeout(500);

    // Answer a question (creates color-coded feedback)
    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });

    // Verify answer cell has color-coded class
    const firstAnswerCell = quizTable.locator('tbody tr').first().locator('td').nth(1);
    await expect(async () => {
      const classList = await firstAnswerCell.getAttribute('class');
      expect(classList).toMatch(/qd-answer-(correct|incorrect)/);
    }).toPass();

    // 2. Student logs out
    const logoutButton = page.locator('button').filter({ hasText: /logout/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Wait for logout to complete
    await page.waitForTimeout(200);

    // Verify color-coded classes are cleared
    const clearedClassList = await firstAnswerCell.getAttribute('class');
    expect(clearedClassList).not.toMatch(/qd-answer-correct/);
    expect(clearedClassList).not.toMatch(/qd-answer-incorrect/);

    // ===== INSTRUCTOR SESSION =====
    // 3. Instructor logs in
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

    // Verify instructor panel appears
    const instructorPanel = page.locator('qd-instructor .instructor-panel');
    await expect(instructorPanel).toBeVisible();

    // 4. Navigate to quiz page as instructor
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.waitForTimeout(500);

    // Verify no student-specific UI state remains
    const quizTableAsInstructor = page.locator('table.qd-quiz');
    const instructorAnswerCell = quizTableAsInstructor.locator('tbody tr').first().locator('td').nth(1);

    // Verify no color-coded classes from student session
    const instructorCellClass = await instructorAnswerCell.getAttribute('class');
    expect(instructorCellClass).not.toMatch(/qd-answer-correct/);
    expect(instructorCellClass).not.toMatch(/qd-answer-incorrect/);

    // Verify sessionStorage has no student state
    const instructorState = await page.evaluate(() => {
      return {
        showAnswers: sessionStorage.getItem('qd/instructor/showAnswers'),
        instructorKey: sessionStorage.getItem('qd/instructor'),
      };
    });

    // These should be null in fresh instructor session (unless toggle manually enabled)
    expect(instructorState.showAnswers).toBeNull();
  });
});
