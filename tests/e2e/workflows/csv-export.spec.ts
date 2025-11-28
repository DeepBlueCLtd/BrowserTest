/**
 * E2E Test: CSV Data Export
 *
 * Tests CSV export functionality:
 * - Export button visible in instructor mode
 * - Export triggers download
 * - CSV contains student data
 * - Empty state handling
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
  await page.locator('qd-login[data-ready]').waitFor({ state: 'attached', timeout: 2000 });
}

/**
 * Close PIN confirmation dialog if visible
 */
async function closePinConfirmationDialog(page: Page): Promise<void> {
  // Wait for any modal animation
  await page.waitForTimeout(200);

  // Force close any open modal by removing its open attribute
  await page.evaluate(() => {
    const modals = document.querySelectorAll('qd-modal[open], qd-confirm-dialog[open]');
    modals.forEach((modal) => {
      modal.removeAttribute('open');
    });
  });

  // Wait for modal to close
  await page.waitForTimeout(100);
}

/**
 * Login as instructor
 */
async function loginAsInstructor(page: Page): Promise<void> {
  // Click instructor button on login form
  const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
  await instructorButton.click({ force: true });

  // Fill password in modal
  const passwordInput = page.locator('qd-modal[open] input[type="password"]');
  await expect(passwordInput).toBeVisible({ timeout: 2000 });
  await passwordInput.fill(TEST_PASSWORD);

  // Submit
  const unlockButton = page.locator('qd-modal[open] button[type="submit"]');
  await unlockButton.click();
  await expect(passwordInput).not.toBeVisible();

  // Verify instructor panel appears
  await expect(page.getByText('View All Scores')).toBeVisible();
}

test.describe('CSV Data Export', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTestDB');
    });
    await waitForBootstrap(page);
  });

  test('should show Export CSV button in instructor mode', async ({ page }) => {
    await loginAsInstructor(page);

    // Verify Export CSV button visible
    const exportButton = page.locator('button').filter({ hasText: /export.*csv/i });
    await expect(exportButton).toBeVisible();
  });

  test('should trigger download on Export CSV click', async ({ page }) => {
    // First create some student data
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Answer a quiz question
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.waitForTimeout(500); // Wait for page initialization

    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });

    // Wait for save
    await expect(page.locator('qd-status')).toContainText(/1\/\d+ Correct/);

    // Go back and logout
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    const logoutButton = page.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();
    await expect(page.locator('qd-login')).toBeVisible();

    // Login as instructor
    await loginAsInstructor(page);

    // First click "View All Scores" to trigger student data loading from IndexedDB
    const viewScoresButton = page.locator('button').filter({ hasText: /view.*scores/i });
    await viewScoresButton.click();

    // Verify scores modal appears with student data
    const scoresModal = page.locator('qd-modal[open]');
    await expect(scoresModal).toBeVisible();
    await expect(scoresModal).toContainText('John Doe');

    // Close the modal
    await page.keyboard.press('Escape');
    await expect(scoresModal).not.toBeVisible();

    // Now the students are loaded, export button should be enabled
    const exportButton = page.locator('button').filter({ hasText: /export.*csv/i });
    await expect(exportButton).toBeEnabled({ timeout: 2000 });

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await exportButton.click();

    // Verify download triggered
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should generate CSV with correct header row', async ({ page }) => {
    // Create student data
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Answer a question
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.waitForTimeout(500);

    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });
    await expect(page.locator('qd-status')).toContainText(/1\/\d+ Correct/);

    // Logout and login as instructor
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    const logoutButton = page.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();
    await expect(page.locator('qd-login')).toBeVisible();

    await loginAsInstructor(page);

    // First click "View All Scores" to trigger student data loading from IndexedDB
    const viewScoresButton = page.locator('button').filter({ hasText: /view.*scores/i });
    await viewScoresButton.click();

    // Verify scores modal appears with student data
    const scoresModal = page.locator('qd-modal[open]');
    await expect(scoresModal).toBeVisible();
    await expect(scoresModal).toContainText('John Doe');

    // Close the modal
    await page.keyboard.press('Escape');
    await expect(scoresModal).not.toBeVisible();

    // Now the students are loaded, export button should be enabled
    const exportButton = page.locator('button').filter({ hasText: /export.*csv/i });
    await expect(exportButton).toBeEnabled({ timeout: 2000 });

    // Setup download and capture content
    const downloadPromise = page.waitForEvent('download');

    await exportButton.click();

    const download = await downloadPromise;

    // Read CSV content
    const readable = await download.createReadStream();
    const chunks: Uint8Array[] = [];
    for await (const chunk of readable) {
      chunks.push(new Uint8Array(chunk as ArrayBuffer));
    }
    const csvContent = Buffer.concat(chunks).toString('utf-8');

    // Verify header row
    const lines = csvContent.split('\n');
    expect(lines[0]).toBe(
      'Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp',
    );
  });

  test('should include student answer data in CSV', async ({ page }) => {
    // Create student and answer questions
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('EXPORT001');
    await login.locator('input[name="name"]').fill('Export Test User');
    await login.locator('input[name="pin"]').fill('5678');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Answer a question
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.waitForTimeout(500);

    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });
    await expect(page.locator('qd-status')).toContainText(/1\/\d+ Correct/);

    // Logout and switch to instructor
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    const logoutButton = page.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();
    await expect(page.locator('qd-login')).toBeVisible();

    await loginAsInstructor(page);

    // First click "View All Scores" to trigger student data loading from IndexedDB
    const viewScoresButton = page.locator('button').filter({ hasText: /view.*scores/i });
    await viewScoresButton.click();

    // Verify scores modal appears with student data
    const scoresModal = page.locator('qd-modal[open]');
    await expect(scoresModal).toBeVisible();
    await expect(scoresModal).toContainText('Export Test User');

    // Close the modal
    await page.keyboard.press('Escape');
    await expect(scoresModal).not.toBeVisible();

    // Now the students are loaded, export button should be enabled
    const exportButton = page.locator('button').filter({ hasText: /export.*csv/i });
    await expect(exportButton).toBeEnabled({ timeout: 2000 });

    // Export and verify content
    const downloadPromise = page.waitForEvent('download');

    await exportButton.click();

    const download = await downloadPromise;
    const readable = await download.createReadStream();
    const chunks: Uint8Array[] = [];
    for await (const chunk of readable) {
      chunks.push(new Uint8Array(chunk as ArrayBuffer));
    }
    const csvContent = Buffer.concat(chunks).toString('utf-8');

    // Verify student data in CSV
    expect(csvContent).toContain('EXPORT001');
    expect(csvContent).toContain('Export Test User');
  });

  test('should handle empty data state gracefully', async ({ page }) => {
    // Login directly as instructor (no student data)
    await loginAsInstructor(page);

    // Export button should be visible but disabled when no data
    const exportButton = page.locator('button').filter({ hasText: /export.*csv/i });
    await expect(exportButton).toBeVisible();

    // Button should be disabled when there's no data
    await expect(exportButton).toBeDisabled();

    // Verify button has tooltip indicating no data
    const title = await exportButton.getAttribute('title');
    expect(title).toContain('No data');
  });

  test('should generate filename with timestamp', async ({ page }) => {
    // First create some student data
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('FNAME001');
    await login.locator('input[name="name"]').fill('Filename Test');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Answer a question
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.waitForTimeout(500);

    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });
    await expect(page.locator('qd-status')).toContainText(/1\/\d+ Correct/);

    // Logout and switch to instructor
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    const logoutButton = page.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();
    await expect(page.locator('qd-login')).toBeVisible();

    await loginAsInstructor(page);

    // First click "View All Scores" to trigger student data loading from IndexedDB
    const viewScoresButton = page.locator('button').filter({ hasText: /view.*scores/i });
    await viewScoresButton.click();

    // Verify scores modal appears with student data
    const scoresModal = page.locator('qd-modal[open]');
    await expect(scoresModal).toBeVisible();
    await expect(scoresModal).toContainText('Filename Test');

    // Close the modal
    await page.keyboard.press('Escape');
    await expect(scoresModal).not.toBeVisible();

    // Now the students are loaded, export button should be enabled
    const exportButton = page.locator('button').filter({ hasText: /export.*csv/i });
    await expect(exportButton).toBeEnabled({ timeout: 2000 });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();

    const download = await downloadPromise;

    // Filename should include 'quiz-data' and timestamp pattern
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/quiz-data-\d{4}-\d{2}-\d{2}.*\.csv/);
  });
});
