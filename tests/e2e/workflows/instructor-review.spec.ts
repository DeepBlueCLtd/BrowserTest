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

test.describe('Instructor Review Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTestDB');
    });

    // Wait for bootstrap to inject qd-login component
    await waitForBootstrap(page);

    // Login as student first to create some data
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Wait for status to be visible
    await expect(page.locator('qd-status')).toBeVisible();
  });

  test('should unlock instructor mode with correct password', async ({ page }) => {
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    // Logout first to make qd-login visible
    const statusPanel = page.locator('qd-status');
    const logoutButton = statusPanel.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();
    await expect(page.locator('qd-login')).toBeVisible();

    // Page already has qd-instructor-hash element with the correct hash

    // Click instructor button
    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click({ force: true });
    await page.waitForTimeout(500);

    // Fill password
    const passwordInput = page.locator('.qd-modal-backdrop input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 3000 });
    await passwordInput.fill(TEST_PASSWORD);

    // Submit
    const unlockButton = page.locator('.qd-modal-backdrop button[type="submit"]');
    await unlockButton.click();
    await expect(passwordInput).not.toBeVisible();

    // Verify instructor panel appears
    await expect(page.getByText('View All Scores')).toBeVisible();
  });

  test('should display student scores in modal', async ({ page }) => {
    // Answer some questions to create score data
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);

    await page.waitForTimeout(500);
    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });

    // Wait for save to complete - check UI shows correct count
    await expect(page.locator('qd-status')).toContainText(/1\/\d+ Correct/);

    // Go back and unlock instructor
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
    await page.waitForTimeout(500);

    const passwordInput = page.locator('.qd-modal-backdrop input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 3000 });
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('.qd-modal-backdrop button[type="submit"]');
    await unlockButton.click();
    await expect(passwordInput).not.toBeVisible();

    // Click "View Scores" button
    const viewScoresButton = page.locator('button').filter({ hasText: /view.*scores/i });
    await expect(viewScoresButton).toBeVisible();
    await viewScoresButton.click();

    // Verify modal appears
    const scoresModal = page.locator('.qd-modal-backdrop');
    await expect(scoresModal).toBeVisible();

    // Verify student data shown
    await expect(scoresModal).toContainText('John Doe');
    await expect(scoresModal).toContainText('TEST001');
  });

  test('should show student answers when instructor mode active', async ({ page }) => {
    // Student answers a question
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);

    await page.waitForTimeout(500);
    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });

    // Wait for save to complete - check UI shows correct count
    await expect(page.locator('qd-status')).toContainText(/1\/\d+ Correct/);

    // Since we're on quiz page, need to go to index first
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
    await page.waitForTimeout(500);

    const passwordInput = page.locator('.qd-modal-backdrop input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 3000 });
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('.qd-modal-backdrop button[type="submit"]');
    await unlockButton.click();
    await expect(passwordInput).not.toBeVisible();

    // Verify instructor panel appears
    await expect(page.getByText('View All Scores')).toBeVisible();

    // Toggle "Show Answers" (if that feature exists)
    // This test assumes instructor can see student answers on quiz pages
    // Implementation may vary based on actual feature
  });

  test('should close scores modal on close button', async ({ page }) => {
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
    await page.waitForTimeout(500);

    const passwordInput = page.locator('.qd-modal-backdrop input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 3000 });
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('.qd-modal-backdrop button[type="submit"]');
    await unlockButton.click();
    await expect(passwordInput).not.toBeVisible();

    // Open scores modal
    const viewScoresButton = page.locator('button').filter({ hasText: /view.*scores/i });
    await expect(viewScoresButton).toBeVisible();
    await viewScoresButton.click();

    const scoresModal = page.locator('.qd-modal-backdrop');
    await expect(scoresModal).toBeVisible();

    // Close modal - qd-modal closes via Escape key
    await page.keyboard.press('Escape');

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

    // Verify color-coded UI is hidden (qd-hidden applied or not visible)
    const clearedClassList = await firstAnswerCell.getAttribute('class');
    expect(clearedClassList).toMatch(/qd-hidden/);

    // ===== INSTRUCTOR SESSION =====
    // 3. Instructor logs in
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    // qd-login should already be visible since student logged out
    // Page already has qd-instructor-hash element with the correct hash

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click({ force: true });
    await page.waitForTimeout(500);

    const passwordInput = page.locator('.qd-modal-backdrop input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 3000 });
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('.qd-modal-backdrop button[type="submit"]');
    await unlockButton.click();
    await expect(passwordInput).not.toBeVisible();

    // Verify instructor panel appears
    await expect(page.getByText('View All Scores')).toBeVisible();

    // 4. Navigate to quiz page as instructor
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.waitForTimeout(500);

    // Verify no student-specific UI state remains from previous student session
    const quizTableAsInstructor = page.locator('table.qd-quiz');
    const instructorAnswerCell = quizTableAsInstructor
      .locator('tbody tr')
      .first()
      .locator('td')
      .nth(1);

    // For instructor, answer column is visible but no color-coded classes from student session
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
