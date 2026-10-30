/**
 * E2E Test: shared classroom machine (SRD 013 WP1)
 *
 * Starts from the review's reproduction: a logged-out student sets
 * sessionStorage['qd/instructor'] = 'true' from DevTools and reloads. Before
 * SRD 013 that showed the instructor toolbar and the answer key, and allowed
 * "Erase All Data".
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../dita-demo');
const TEST_PASSWORD = 'pwd';

async function waitForBootstrap(page: Page): Promise<void> {
  await page.locator('qd-login[data-ready]').waitFor({ state: 'attached', timeout: 2000 });
}

async function loginInstructor(page: Page): Promise<void> {
  await page.locator('qd-login button').filter({ hasText: /instructor/i }).click();
  const password = page.locator('qd-modal[open] input[type="password"]');
  await expect(password).toBeVisible();
  await password.fill(TEST_PASSWORD);
  await page.locator('qd-modal[open] button[type="submit"]').click();
  await expect(page.locator('qd-instructor')).toBeVisible();
}

test.describe('Shared machine (SRD 013)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTestDB');
    });
    await page.reload();
    await waitForBootstrap(page);
  });

  test('a hand-written instructor flag does not grant instructor mode (SEC-01, SEC-02)', async ({
    page,
  }) => {
    await page.evaluate(() => sessionStorage.setItem('qd/instructor', 'true'));
    await page.reload();
    await waitForBootstrap(page);

    await expect(page.locator('qd-instructor')).not.toBeVisible();
    await expect(page.locator('qd-login')).toBeVisible();
    // The answer column stays hidden
    await expect(page.locator('table.qd-quiz')).not.toHaveClass(/qd-quiz-instructor/);
    // The forged value is removed
    expect(await page.evaluate(() => sessionStorage.getItem('qd/instructor'))).toBeNull();
  });

  test('a real instructor session survives navigation (SEC-01)', async ({ page }) => {
    await loginInstructor(page);
    await page.goto(`file://${demoPath}/Pages/quiz-numeric.html`);
    await waitForBootstrap(page);
    await expect(page.locator('qd-instructor')).toBeVisible();
    await expect(page.locator('qd-login')).not.toBeVisible();
  });

  test('Erase All Data refuses a wrong password (SEC-03)', async ({ page }) => {
    await loginInstructor(page);
    await page.locator('button').filter({ hasText: /erase.*data/i }).click();
    await page.locator('.qd-manage-modal-overlay input[type="text"]').fill('DELETE ALL DATA');
    await page.locator('.qd-manage-modal-overlay input[type="password"]').fill('wrong');
    await page.locator('.qd-manage-modal-overlay button').filter({ hasText: /delete/i }).click();

    await expect(page.locator('.qd-manage-modal-overlay [role="alert"]')).toHaveText(
      'Incorrect instructor password',
    );
    await expect(page.locator('.qd-manage-modal-overlay')).toBeVisible();
  });
});
