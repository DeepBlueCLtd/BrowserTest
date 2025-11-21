/**
 * E2E Test: Data Coexistence
 *
 * Tests critical data coexistence scenarios:
 * - Quiz saves don't wipe analysis data
 * - Analysis saves don't wipe quiz data
 * - Both data types persist across page reload
 * - IndexedDB contains both answers and analysis.cells
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../dita-demo');

// Page with both qd-quiz and qd-analysis tables
const COEXISTENCE_PAGE = 'Pages/analysis-contact.html';

/**
 * Wait for bootstrap to complete
 */
async function waitForBootstrap(page: Page): Promise<void> {
  await page.locator('qd-login[data-ready]').waitFor({ state: 'attached', timeout: 2000 });
}

/**
 * Fill quiz input based on element type (text input or select)
 */
async function fillQuizInput(
  input: import('@playwright/test').Locator,
  value: string,
): Promise<void> {
  const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
  if (tagName === 'select') {
    await input.selectOption({ index: parseInt(value) });
  } else {
    await input.fill(value);
  }
}

test.describe('Data Coexistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTest');
    });

    // Wait for bootstrap
    await waitForBootstrap(page);

    // Login as student
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('COEX01');
    await login.locator('input[name="name"]').fill('Test User');
    await login.locator('button[type="submit"]').click();
    await expect(page.locator('qd-status')).toBeVisible();
  });

  test('should preserve analysis data when saving quiz answer', async ({ page }) => {
    await page.goto(`file://${demoPath}/${COEXISTENCE_PAGE}`);
    await waitForBootstrap(page);

    // 1. Edit analysis cell first
    const analysisSavePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:analysis-saved', () => resolve(true), { once: true });
      });
    });

    const interactiveCell = page.locator('td.interactive').first();
    const analysisText = 'Analysis entry before quiz';
    await interactiveCell.click();
    await interactiveCell.fill(analysisText);
    await analysisSavePromise;

    // 2. Now answer a quiz question
    const quizSavePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:answer-saved', () => resolve(true), { once: true });
      });
    });

    const quizInput = page.locator('table.qd-quiz .qd-quiz-input').first();
    await quizInput.fill('42');
    await quizSavePromise;

    // 3. Reload and verify both values persist
    await page.reload();
    await waitForBootstrap(page);

    // Verify quiz value
    const reloadedQuizInput = page.locator('table.qd-quiz .qd-quiz-input').first();
    const quizValue = await reloadedQuizInput.inputValue();
    expect(quizValue).toBe('42');

    // Verify analysis text
    const reloadedCell = page.locator('td.interactive').first();
    const cellContent = await reloadedCell.textContent();
    expect(cellContent?.trim()).toBe(analysisText);
  });

  test('should preserve quiz data when saving analysis entry', async ({ page }) => {
    await page.goto(`file://${demoPath}/${COEXISTENCE_PAGE}`);
    await waitForBootstrap(page);

    // 1. Answer quiz question first
    const quizSavePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:answer-saved', () => resolve(true), { once: true });
      });
    });

    const quizInput = page.locator('table.qd-quiz .qd-quiz-input').first();
    await quizInput.fill('100');
    await quizSavePromise;

    // 2. Now edit analysis cell
    const analysisSavePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:analysis-saved', () => resolve(true), { once: true });
      });
    });

    const interactiveCell = page.locator('td.interactive').first();
    const analysisText = 'Analysis entry after quiz';
    await interactiveCell.click();
    await interactiveCell.fill(analysisText);
    await analysisSavePromise;

    // 3. Reload and verify both values persist
    await page.reload();
    await waitForBootstrap(page);

    // Verify quiz value
    const reloadedQuizInput = page.locator('table.qd-quiz .qd-quiz-input').first();
    const quizValue = await reloadedQuizInput.inputValue();
    expect(quizValue).toBe('100');

    // Verify analysis text
    const reloadedCell = page.locator('td.interactive').first();
    const cellContent = await reloadedCell.textContent();
    expect(cellContent?.trim()).toBe(analysisText);
  });

  test('should persist both data types across page reload', async ({ page }) => {
    await page.goto(`file://${demoPath}/${COEXISTENCE_PAGE}`);
    await waitForBootstrap(page);

    // 1. Save quiz answer
    const quizSavePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:answer-saved', () => resolve(true), { once: true });
      });
    });

    const quizTable = page.locator('table.qd-quiz');
    const quizInput = quizTable.locator('.qd-quiz-input').first();
    await quizInput.fill('25');
    await quizSavePromise;

    // 2. Save analysis entry
    const analysisSavePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:analysis-saved', () => resolve(true), { once: true });
      });
    });

    const interactiveCell = page.locator('td.interactive').first();
    const analysisText = 'Persisted analysis text';
    await interactiveCell.click();
    await interactiveCell.fill(analysisText);
    await analysisSavePromise;

    // 3. Reload page
    await page.reload();
    await waitForBootstrap(page);

    // 4. Verify quiz answer persisted
    const reloadedQuizInput = page.locator('table.qd-quiz .qd-quiz-input').first();
    const quizValue = await reloadedQuizInput.inputValue();
    expect(quizValue).toBe('25');

    // 5. Verify analysis text persisted
    const reloadedCell = page.locator('td.interactive').first();
    const cellContent = await reloadedCell.textContent();
    expect(cellContent?.trim()).toBe(analysisText);
  });

  test('should maintain data integrity with interleaved saves', async ({ page }) => {
    await page.goto(`file://${demoPath}/${COEXISTENCE_PAGE}`);
    await waitForBootstrap(page);

    // Interleave quiz and analysis saves multiple times
    const quizTable = page.locator('table.qd-quiz');
    const quizInputs = quizTable.locator('.qd-quiz-input');
    const interactiveCell = page.locator('td.interactive').first();

    // Quiz save 1
    let savePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:answer-saved', () => resolve(true), { once: true });
      });
    });
    await fillQuizInput(quizInputs.first(), '10');
    await savePromise;

    // Analysis save 1
    savePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:analysis-saved', () => resolve(true), { once: true });
      });
    });
    await interactiveCell.click();
    await interactiveCell.fill('First analysis');
    await savePromise;

    // Quiz save 2 (if second question exists)
    const inputCount = await quizInputs.count();
    if (inputCount > 1) {
      savePromise = page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
          document.addEventListener('qd:answer-saved', () => resolve(true), { once: true });
        });
      });
      await fillQuizInput(quizInputs.nth(1), '2');
      await savePromise;
    }

    // Analysis save 2 (overwrite)
    savePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:analysis-saved', () => resolve(true), { once: true });
      });
    });
    await interactiveCell.click();
    await interactiveCell.fill('Updated analysis');
    await savePromise;

    // Reload and verify both data types persist
    await page.reload();
    await waitForBootstrap(page);

    // Verify first quiz input has value
    const reloadedQuizInputs = page.locator('table.qd-quiz .qd-quiz-input');
    const quizValue1 = await reloadedQuizInputs.first().inputValue();
    expect(quizValue1).toBe('10');

    // Verify analysis text
    const reloadedCell = page.locator('td.interactive').first();
    const cellContent = await reloadedCell.textContent();
    expect(cellContent?.trim()).toBe('Updated analysis');
  });

  test('should isolate data between different students', async ({ page }) => {
    await page.goto(`file://${demoPath}/${COEXISTENCE_PAGE}`);
    await waitForBootstrap(page);

    // Student 1 saves quiz and analysis
    const quizSavePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:answer-saved', () => resolve(true), { once: true });
      });
    });

    await page.locator('table.qd-quiz .qd-quiz-input').first().fill('55');
    await quizSavePromise;

    const analysisSavePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:analysis-saved', () => resolve(true), { once: true });
      });
    });

    await page.locator('td.interactive').first().click();
    await page.locator('td.interactive').first().fill('Student 1 analysis');
    await analysisSavePromise;

    // Logout
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);
    await page
      .locator('button')
      .filter({ hasText: /logout/i })
      .click();
    await waitForBootstrap(page);

    // Login as different student
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('COEX02');
    await login.locator('input[name="name"]').fill('Second User');
    await login.locator('button[type="submit"]').click();
    await expect(page.locator('qd-status')).toBeVisible();

    // Navigate to coexistence page
    await page.goto(`file://${demoPath}/${COEXISTENCE_PAGE}`);
    await waitForBootstrap(page);

    // Verify student 2 sees empty data
    const quizInput = page.locator('table.qd-quiz .qd-quiz-input').first();
    const quizValue = await quizInput.inputValue();
    expect(quizValue).toBe('');

    const analysisCell = page.locator('td.interactive').first();
    const cellContent = await analysisCell.textContent();
    expect(cellContent?.trim()).not.toBe('Student 1 analysis');

    // Logout and login as student 1 to verify their data persists
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);
    await page
      .locator('button')
      .filter({ hasText: /logout/i })
      .click();
    await waitForBootstrap(page);

    const login2 = page.locator('qd-login');
    await login2.locator('input[name="serviceId"]').fill('COEX01');
    await login2.locator('input[name="name"]').fill('Test User');
    await login2.locator('button[type="submit"]').click();
    await expect(page.locator('qd-status')).toBeVisible();

    await page.goto(`file://${demoPath}/${COEXISTENCE_PAGE}`);
    await waitForBootstrap(page);

    // Verify student 1's quiz data still exists
    const student1QuizInput = page.locator('table.qd-quiz .qd-quiz-input').first();
    const student1QuizValue = await student1QuizInput.inputValue();
    expect(student1QuizValue).toBe('55');
  });
});
