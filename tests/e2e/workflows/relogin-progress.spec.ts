/**
 * E2E Test: Re-login Progress Display
 *
 * Regression test for bug: After logout and re-login, progress shows "0/0"
 * until page refresh or navigation, even though answers exist in IndexedDB.
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ditaPath = path.resolve(__dirname, '../../../dita-demo');

async function waitForBootstrap(page: Page): Promise<void> {
  await page.waitForSelector('qd-login', { state: 'attached', timeout: 2000 });
  await page.waitForTimeout(300);
}

async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
    indexedDB.deleteDatabase('BrowserTestDB');
  });
}

async function closePinConfirmationDialog(page: Page): Promise<void> {
  // Wait for modal to appear
  await page.waitForTimeout(300);

  // Force close any open modal by removing its open attribute
  await page.evaluate(() => {
    const modal = document.querySelector('qd-modal[open]');
    if (modal) {
      modal.removeAttribute('open');
    }
  });

  // Wait for modal to close
  await page.waitForTimeout(200);
}

async function loginStudent(
  page: Page,
  serviceId: string,
  name: string,
  pin: string,
): Promise<void> {
  const loginForm = page.locator('qd-login');
  await loginForm.locator('input[name="serviceId"]').fill(serviceId);
  await loginForm.locator('input[name="name"]').fill(name);
  await loginForm.locator('input[name="pin"]').fill(pin);
  await loginForm.locator('button[type="submit"]').click();
  await closePinConfirmationDialog(page);
  await page.locator('qd-status').waitFor({ timeout: 2000 });
}

async function logout(page: Page): Promise<void> {
  const statusPanel = page.locator('qd-status');
  await statusPanel.locator('.logout-button').click();
  await page.locator('qd-login').waitFor({ state: 'visible', timeout: 2000 });
}

test.describe('Re-login Progress Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${ditaPath}/page-index.html`);
    await clearStorage(page);
    await page.reload();
    await waitForBootstrap(page);
  });

  test('Progress should display immediately after re-login without page refresh', async ({
    page,
  }) => {
    // Step 1: Login as student
    await loginStudent(page, 'RELOGIN01', 'Test Student', '1234');

    // Step 2: Navigate to quiz and answer some questions
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    const quizTable = page.locator('table.qd-quiz');
    await quizTable.locator('.qd-quiz-input').first().selectOption({ index: 1 });
    await page.waitForTimeout(500); // Wait for auto-save

    // Step 3: Navigate back to index and verify progress shows
    await page.goto(`file://${ditaPath}/page-index.html`);
    await waitForBootstrap(page);

    const statusPanel = page.locator('qd-status');
    const progressBefore = await statusPanel.locator('.progress-text').textContent();
    // Should show some progress (e.g., "0/1 Correct" or "1/1 Correct")
    expect(progressBefore).toMatch(/\d+\/\d+/);

    // Extract the attempted count before logout
    const matchBefore = progressBefore?.match(/(\d+)\/(\d+)/);
    const attemptedBefore = matchBefore?.[2] ? parseInt(matchBefore[2], 10) : 0;
    expect(attemptedBefore).toBeGreaterThan(0);

    // Step 4: Logout
    await logout(page);

    // Verify we're logged out
    await expect(page.locator('qd-login')).toBeVisible();

    // Step 5: Re-login with SAME credentials
    await loginStudent(page, 'RELOGIN01', 'Test Student', '1234');

    // Step 6: CRITICAL CHECK - Progress should show immediately (not 0/0)
    // This is the failing assertion that demonstrates the bug
    const progressAfter = await statusPanel.locator('.progress-text').textContent();

    // Extract attempted count after re-login
    const matchAfter = progressAfter?.match(/(\d+)\/(\d+)/);
    const attemptedAfter = matchAfter?.[2] ? parseInt(matchAfter[2], 10) : 0;

    // BUG: This assertion should pass but currently fails
    // The progress should be the same as before logout (1 question attempted)
    // Instead it shows 0/0 until page refresh
    expect(attemptedAfter).toBe(attemptedBefore);
  });

  test('Progress persists correctly after re-login and page refresh (workaround)', async ({
    page,
  }) => {
    // This test documents the workaround behavior - refresh fixes display

    // Login and answer question
    await loginStudent(page, 'RELOGIN02', 'Test Student 2', '1234');

    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    const quizTable = page.locator('table.qd-quiz');
    await quizTable.locator('.qd-quiz-input').first().selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Go back and logout
    await page.goto(`file://${ditaPath}/page-index.html`);
    await waitForBootstrap(page);
    await logout(page);

    // Re-login
    await loginStudent(page, 'RELOGIN02', 'Test Student 2', '1234');

    // Refresh page (the workaround)
    await page.reload();
    await waitForBootstrap(page);

    // After refresh, progress should show correctly
    const statusPanel = page.locator('qd-status');
    const progressText = await statusPanel.locator('.progress-text').textContent();
    const match = progressText?.match(/(\d+)\/(\d+)/);
    const attempted = match?.[2] ? parseInt(match[2], 10) : 0;

    // This should pass - after refresh the progress displays correctly
    expect(attempted).toBeGreaterThan(0);
  });
});
