/**
 * E2E Test: Instructor Dynamic Answer Reveal
 *
 * Tests that when an instructor logs in while on a quiz page,
 * the correct answers are dynamically revealed without requiring a page refresh.
 *
 * Scenario:
 * 1. Start not logged in
 * 2. Navigate to Mixed Quiz Questions page
 * 3. Login as instructor
 * 4. Verify answers are shown (without page refresh)
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { submitStudentLogin } from '../helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ditaPath = path.resolve(__dirname, '../../../dita-demo');

// Test password: "pwd" (hash configured in DITA output)
const TEST_PASSWORD = 'pwd';

/**
 * Wait for bootstrap to complete
 */
async function waitForBootstrap(page: Page): Promise<void> {
  // Wait for qd-login component to be injected (not necessarily visible)
  await page.waitForSelector('qd-login', { state: 'attached', timeout: 2000 });
}

test.describe('Instructor Dynamic Answer Reveal', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto(`file://${ditaPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
      indexedDB.deleteDatabase('BrowserTestDB');
    });
    await page.reload();
    await waitForBootstrap(page);
  });

  test('should reveal quiz answers when instructor logs in on quiz page', async ({ page }) => {
    // 1. Navigate to Mixed Quiz Questions page while NOT logged in
    await page.goto(`file://${ditaPath}/Pages/quiz-mixed.html`);
    await waitForBootstrap(page);

    // Verify quiz table exists
    const quizTable = page.locator('table.qd-quiz');
    await expect(quizTable).toBeVisible();

    // Verify answer column is hidden (security: answers hidden before login)
    // The answer column is the 2nd column (index 1)
    const firstAnswerCell = quizTable.locator('tbody tr').first().locator('td').nth(1);
    await expect(firstAnswerCell).toHaveClass(/qd-hidden/);

    // 2. Login as instructor (without leaving the page)
    const loginForm = page.locator('qd-login');
    await expect(loginForm).toBeVisible();

    // Click instructor button
    const instructorButton = loginForm.locator('button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    // Wait for modal to appear (qd-modal moves to body when open)
    const modalPassword = page.locator('qd-modal[open] input[type="password"]');
    await expect(modalPassword).toBeVisible({ timeout: 2000 });

    // Fill password and submit
    await modalPassword.fill(TEST_PASSWORD);
    const modalLoginButton = page.locator('qd-modal[open] button[type="submit"]');
    await modalLoginButton.click();

    // Wait for instructor panel to appear
    const instructorPanel = page.locator('qd-instructor');
    await expect(instructorPanel).toBeVisible({ timeout: 2000 });

    // 3. Verify answers are now revealed (without page refresh)
    // The answer column should no longer have qd-hidden class
    await expect(firstAnswerCell).not.toHaveClass(/qd-hidden/);

    // Verify the answer cell contains actual answer text (not empty)
    const answerText = await firstAnswerCell.textContent();
    expect(answerText?.trim()).toBeTruthy();

    // Verify detail column is also visible for instructor
    const firstDetailCell = quizTable.locator('tbody tr').first().locator('td').nth(2);
    await expect(firstDetailCell).not.toHaveClass(/qd-hidden/);
  });

  test('should reveal answers on all quiz rows when instructor logs in', async ({ page }) => {
    // Navigate to Mixed Quiz Questions page while NOT logged in
    await page.goto(`file://${ditaPath}/Pages/quiz-mixed.html`);
    await waitForBootstrap(page);

    const quizTable = page.locator('table.qd-quiz');
    await expect(quizTable).toBeVisible();

    // Get count of quiz rows
    const quizRows = quizTable.locator('tbody tr');
    const rowCount = await quizRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify ALL answer cells are hidden initially
    for (let i = 0; i < rowCount; i++) {
      const answerCell = quizRows.nth(i).locator('td').nth(1);
      await expect(answerCell).toHaveClass(/qd-hidden/);
    }

    // Login as instructor
    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    const modalPassword = page.locator('qd-modal[open] input[type="password"]');
    await expect(modalPassword).toBeVisible({ timeout: 2000 });
    await modalPassword.fill(TEST_PASSWORD);
    await page.locator('qd-modal[open] button[type="submit"]').click();

    // Wait for instructor panel
    await expect(page.locator('qd-instructor')).toBeVisible({ timeout: 2000 });

    // Verify ALL answer cells are now visible
    for (let i = 0; i < rowCount; i++) {
      const answerCell = quizRows.nth(i).locator('td').nth(1);
      await expect(answerCell).not.toHaveClass(/qd-hidden/);

      // Verify each cell has answer content
      const text = await answerCell.textContent();
      expect(text?.trim()).toBeTruthy();
    }
  });

  test('should make toggle available after dynamic login to show student answers', async ({
    page,
  }) => {
    // First, create some student data
    await page.goto(`file://${ditaPath}/page-index.html`);
    await waitForBootstrap(page);

    // Login as student
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('DYN001');
    await loginForm.locator('input[name="name"]').fill('Dynamic Test Student');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await submitStudentLogin(loginForm);

    // Close PIN confirmation dialog if it appears
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const modals = document.querySelectorAll('qd-modal[open], qd-confirm-dialog[open]');
      modals.forEach((modal) => {
        modal.removeAttribute('open');
      });
    });
    await page.waitForTimeout(100);

    await expect(page.locator('qd-status')).toBeVisible({ timeout: 2000 });

    // Navigate to quiz page and answer a question
    await page.goto(`file://${ditaPath}/Pages/quiz-mixed.html`);
    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });

    // Wait for save
    await page.waitForTimeout(500);

    // Logout student
    await page
      .locator('button')
      .filter({ hasText: /logout/i })
      .click();
    await expect(page.locator('qd-login')).toBeVisible();

    // Now login as instructor (staying on same quiz page)
    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    const modalPassword = page.locator('qd-modal[open] input[type="password"]');
    await expect(modalPassword).toBeVisible({ timeout: 2000 });
    await modalPassword.fill(TEST_PASSWORD);
    await page.locator('qd-modal[open] button[type="submit"]').click();

    // Wait for instructor panel
    const instructorPanel = page.locator('qd-instructor');
    await expect(instructorPanel).toBeVisible({ timeout: 2000 });

    // Verify toggle is available
    const toggleCheckbox = instructorPanel.locator('input[type="checkbox"]');
    await expect(toggleCheckbox).toBeVisible();

    // Enable toggle to show student answers
    await toggleCheckbox.check();

    // Wait for student answers to appear
    await page.waitForTimeout(300);

    // Verify student answers are displayed
    const studentAnswers = page.locator('.qd-student-answers');
    await expect(studentAnswers.first()).toBeVisible({ timeout: 2000 });
    await expect(studentAnswers.first()).toContainText('Dynamic Test Student');
  });
});
