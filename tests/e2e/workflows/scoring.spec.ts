/**
 * E2E Test: scores record retries (SRD 013 WP5)
 *
 * Review reproduction: a student could change a wrong MCQ answer until it
 * turned green, and the instructor saw a clean score. Retries stay allowed,
 * but the attempts and the first result are now recorded and shown.
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { submitStudentLogin } from '../helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../dita-demo');

async function waitForBootstrap(page: Page): Promise<void> {
  await page.locator('qd-login[data-ready]').waitFor({ state: 'attached', timeout: 2000 });
}

test.describe('Scoring (SRD 013)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTestDB');
    });
    await page.reload();
    await waitForBootstrap(page);
  });

  test('a wrong-then-right answer shows as 2 tries, not right first time', async ({ page }) => {
    test.setTimeout(15000);
    const login = page.locator('qd-login');
    await login.locator('input[name="name"]').fill('Retry Student');
    await login.locator('input[name="serviceId"]').fill('30077777');
    await login.locator('input[name="pin"]').fill('1357');
    await submitStudentLogin(login);
    await expect(page.locator('qd-status')).toBeVisible();

    // Q1's correct answer is option 1: try 2 first, then 1
    const q1 = page.locator('table.qd-quiz select').first();
    await q1.selectOption('2');
    await expect(page.locator('.qd-answer-incorrect')).toHaveCount(1);
    await q1.selectOption('1');
    await expect(page.locator('.qd-answer-correct')).toHaveCount(1);
    await expect(page.locator('qd-status .progress-text')).toContainText(
      /1 (of \d+ )?answered · 1 correct/,
    );

    // Instructor view
    await page.locator('qd-status .logout-button').click();
    await page
      .locator('qd-login button')
      .filter({ hasText: /instructor/i })
      .click();
    await page.locator('qd-modal[open] input[type="password"]').fill('pwd');
    await page.locator('qd-modal[open] button[type="submit"]').click();
    await page.locator('qd-instructor button', { hasText: 'View All Scores' }).click();

    const row = page.locator('qd-modal[open] tr.student-row', { hasText: 'Retry Student' });
    await expect(row).toContainText('1 (100% of answered)');
    await expect(row).toContainText('0 of 1');
    await expect(row).toContainText('Q1: 1 (2 tries)');
  });
});
