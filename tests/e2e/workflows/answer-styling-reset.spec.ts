/**
 * E2E Test: Answer Styling Reset on User Switch
 *
 * Regression test for bug: After User A logs out, User B (a new user)
 * sees User A's answer styling (correct/incorrect colors) persisted.
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { submitStudentLogin } from '../helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ditaPath = path.resolve(__dirname, '../../../dita-demo/Pages');

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
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const modal = document.querySelector('qd-modal[open]');
    if (modal) {
      modal.removeAttribute('open');
    }
  });
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
  await submitStudentLogin(loginForm);
  await closePinConfirmationDialog(page);
  await page.locator('qd-status').waitFor({ timeout: 2000 });
}

async function logout(page: Page): Promise<void> {
  const statusPanel = page.locator('qd-status');
  await statusPanel.locator('.logout-button').click();
  await page.locator('qd-login').waitFor({ state: 'visible', timeout: 2000 });
}

test.describe('Answer Styling Reset on User Switch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${ditaPath}/quiz-mcq.html`);
    await clearStorage(page);
    await page.reload();
    await waitForBootstrap(page);
  });

  test('New user should not see previous user answer styling', async ({ page }) => {
    // Step 1: Login as User A
    await loginStudent(page, 'USERA001', 'User A', '1234');

    // Step 2: Answer the first question (should apply styling)
    const quizTable = page.locator('table.qd-quiz');
    const firstSelect = quizTable.locator('.qd-quiz-input').first();
    await firstSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500); // Wait for auto-save and styling

    // Step 3: Verify styling was applied to User A
    const firstAnswerCell = quizTable.locator('tbody tr').first().locator('td').nth(1);
    const userAHasStyling = await firstAnswerCell.evaluate((cell) => {
      return (
        cell.classList.contains('qd-answer-correct') ||
        cell.classList.contains('qd-answer-incorrect')
      );
    });
    expect(userAHasStyling).toBe(true);

    // Step 4: Logout User A
    await logout(page);

    // Step 5: Login as User B (completely different user)
    await loginStudent(page, 'USERB002', 'User B', '5678');

    // Step 6: CRITICAL CHECK - User B should NOT see User A's styling
    // The answer cells should have NO styling classes for a new user
    const hasStylingAfterSwitch = await firstAnswerCell.evaluate((cell) => {
      return (
        cell.classList.contains('qd-answer-correct') ||
        cell.classList.contains('qd-answer-incorrect')
      );
    });

    // BUG: This should be false - new user should see clean slate
    expect(hasStylingAfterSwitch).toBe(false);

    // Also verify the select is reset to default
    const selectValue = await firstSelect.inputValue();
    expect(selectValue).toBe(''); // Should be empty (placeholder selected)
  });

  test('Same user re-login should preserve their styling', async ({ page }) => {
    // Step 1: Login as User A
    await loginStudent(page, 'USERA003', 'User A', '1234');

    // Step 2: Answer a question
    const quizTable = page.locator('table.qd-quiz');
    const firstSelect = quizTable.locator('.qd-quiz-input').first();
    await firstSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Step 3: Logout
    await logout(page);

    // Step 4: Re-login as SAME user
    await loginStudent(page, 'USERA003', 'User A', '1234');

    // Step 5: SAME user should see their styling restored
    const firstAnswerCell = quizTable.locator('tbody tr').first().locator('td').nth(1);
    const hasStyling = await firstAnswerCell.evaluate((cell) => {
      return (
        cell.classList.contains('qd-answer-correct') ||
        cell.classList.contains('qd-answer-incorrect')
      );
    });

    // Same user's data should be restored
    expect(hasStyling).toBe(true);
  });
});
