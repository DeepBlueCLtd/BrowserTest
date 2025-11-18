/**
 * E2E Test: Instructor Flow (DITA Output)
 *
 * Tests instructor workflow using actual DITA-published HTML:
 * - Student login and quiz interaction
 * - Instructor login
 * - Toggle student answers display
 * - Multi-page navigation with session persistence
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ditaPath = path.resolve(__dirname, '../../../dita/out/oxygen');

// Test password: "pwd"
// Hash: "a1159e9df367" (from DITA config)
const TEST_PASSWORD = 'pwd';

/**
 * Wait for bootstrap to complete
 */
async function waitForBootstrap(page: Page): Promise<void> {
  // Wait for qd-login component to be injected (not necessarily visible)
  await page.waitForSelector('qd-login', { state: 'attached', timeout: 5000 });

  // Give components time to update visibility
  await page.waitForTimeout(500);
}

test.describe('DITA Instructor Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto(`file://${ditaPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
      // Clear IndexedDB (may be BrowserTestDB based on DITA config)
      indexedDB.deleteDatabase('BrowserTestDB');
      indexedDB.deleteDatabase('BrowserTest');
    });
    await page.reload();
    await waitForBootstrap(page);
  });

  test('Flow: Student login → Answer quiz → Logout', async ({ page }) => {
    // Navigate to index page
    await page.goto(`file://${ditaPath}/page-index.html`);
    await waitForBootstrap(page);

    // Verify login form is visible
    const loginForm = page.locator('qd-login');
    await expect(loginForm).toBeVisible();

    // Fill student login form
    const serviceIdInput = loginForm.locator('input[name="serviceId"]');
    const nameInput = loginForm.locator('input[name="name"]');
    await serviceIdInput.fill('STU001');
    await nameInput.fill('Alice Smith');

    // Click login button
    const loginButton = loginForm.locator('button[type="submit"]');
    await loginButton.click();

    // Wait for status panel to appear (login successful)
    const statusPanel = page.locator('qd-status');
    await expect(statusPanel).toBeVisible({ timeout: 3000 });

    // Verify student status shows progress
    await expect(statusPanel.locator('.progress-text')).toContainText('0/');

    // Navigate to a quiz page
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');

    // Wait for quiz page to load
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    // Verify quiz table is interactive
    const quizTable = page.locator('table.qd-quiz');
    await expect(quizTable).toBeVisible();

    // Check that quiz inputs are present
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await expect(firstInput).toBeVisible();

    // Answer the first question (assuming MCQ with select dropdown)
    await firstInput.selectOption({ index: 1 });

    // Wait for auto-save
    await page.waitForTimeout(1000);

    // Navigate back to index
    await page.goto(`file://${ditaPath}/page-index.html`);
    await waitForBootstrap(page);

    // Verify progress updated
    await expect(statusPanel.locator('.progress-text')).toContainText(/1\//);

    // Logout
    const logoutButton = statusPanel.locator('.logout-button');
    await logoutButton.click();

    // Verify login form reappears
    await expect(loginForm).toBeVisible();
  });

  test('Flow: Instructor login → View student answers', async ({ page }) => {
    // First, create some student data
    await page.goto(`file://${ditaPath}/page-index.html`);
    await waitForBootstrap(page);

    // Login as student
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('STU002');
    await loginForm.locator('input[name="name"]').fill('Bob Jones');
    await loginForm.locator('button[type="submit"]').click();
    await page.locator('qd-status').waitFor({ timeout: 3000 });

    // Navigate to quiz page and answer a question
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });
    await page.waitForTimeout(1000);

    // Logout
    await page.goto(`file://${ditaPath}/page-index.html`);
    await page.locator('qd-status .logout-button').click();

    // Now login as instructor
    await waitForBootstrap(page);

    // Click instructor button
    const instructorButton = loginForm.locator('button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(500);

    // Fill password in modal (modal is appended to body, not in shadow DOM)
    const modalPassword = page.locator('body > div[style*="position: fixed"] input[type="password"]');
    await expect(modalPassword).toBeVisible({ timeout: 2000 });
    await modalPassword.fill(TEST_PASSWORD);

    // Click login in modal
    const modalLoginButton = page.locator('body > div[style*="position: fixed"] button[type="submit"]');
    await modalLoginButton.click();

    // Wait for instructor panel to appear
    const instructorPanel = page.locator('qd-instructor');
    await expect(instructorPanel).toBeVisible({ timeout: 3000 });

    // Verify "Instructor Mode" title is present
    await expect(instructorPanel.locator('.instructor-title')).toContainText('Instructor Mode');

    // Verify toggle checkbox is present
    const toggleCheckbox = instructorPanel.locator('input[type="checkbox"]');
    await expect(toggleCheckbox).toBeVisible();

    // Verify badge styling removed (no red/amber/green classes on buttons)
    const quizButtons = page.locator('.quizPageBtn');
    const firstButton = quizButtons.first();
    await expect(firstButton).not.toHaveClass(/qd-badge-(red|amber|green)/);

    // Navigate to quiz page
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    // Toggle "Show student answers"
    await page.locator('qd-instructor input[type="checkbox"]').check();

    // Wait for student answers to be displayed
    await page.waitForTimeout(1000);

    // Verify student answers display exists
    const studentAnswers = page.locator('.qd-student-answers');
    await expect(studentAnswers.first()).toBeVisible({ timeout: 3000 });

    // Verify student name is shown
    await expect(studentAnswers.first()).toContainText('Bob Jones');

    // Toggle off
    await page.locator('qd-instructor input[type="checkbox"]').uncheck();

    // Verify student answers hidden
    await expect(studentAnswers.first()).not.toBeVisible();
  });

  test('Flow: Multi-page navigation with session persistence', async ({ page }) => {
    // Login as student
    await page.goto(`file://${ditaPath}/page-index.html`);
    await waitForBootstrap(page);

    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('STU003');
    await loginForm.locator('input[name="name"]').fill('Carol White');
    await loginForm.locator('button[type="submit"]').click();
    await page.locator('qd-status').waitFor();

    // Navigate to quiz page 1
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    // Verify session persists (status panel visible)
    await expect(page.locator('qd-status')).toBeVisible();

    // Answer a question
    const quizTable = page.locator('table.qd-quiz');
    await quizTable.locator('.qd-quiz-input').first().selectOption({ index: 1 });
    await page.waitForTimeout(1000);

    // Navigate to quiz page 2
    await page.goto(`file://${ditaPath}/Pages/quiz-numeric.html`);
    await waitForBootstrap(page);

    // Verify session still persists
    await expect(page.locator('qd-status')).toBeVisible();

    // Verify quiz table is interactive
    const numericTable = page.locator('table.qd-quiz');
    await expect(numericTable).toBeVisible();

    // Answer a numeric question
    const numericInput = numericTable.locator('.qd-quiz-input').first();
    await numericInput.fill('42');
    await page.waitForTimeout(1000);

    // Navigate back to index
    await page.goto(`file://${ditaPath}/page-index.html`);
    await waitForBootstrap(page);

    // Verify progress shows 2 questions answered
    const statusPanel = page.locator('qd-status');
    await expect(statusPanel.locator('.progress-text')).toContainText(/2\//);

    // Refresh page (simulate browser restart)
    await page.reload();
    await waitForBootstrap(page);

    // Verify session restored from IndexedDB
    await expect(statusPanel).toBeVisible();
    await expect(statusPanel.locator('.progress-text')).toContainText(/2\//);
  });
});
