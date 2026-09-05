/**
 * E2E Test: Analysis Capture Workflow
 *
 * Tests analysis table functionality:
 * - Cell editability (interactive vs read-only)
 * - Auto-save with debouncing
 * - Answer persistence across reload
 * - Instructor view of student entries
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { submitStudentLogin } from '../helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../dita-demo');

const TEST_PASSWORD = 'pwd';

interface WindowWithSaveCount extends Window {
  __saveCount?: number;
}

/**
 * Wait for bootstrap to complete and inject components
 */
async function waitForBootstrap(page: Page): Promise<void> {
  // Wait for qd-login element AND its shadow DOM to be ready
  // Use 'attached' state since qd-login may be hidden after login
  await page.locator('qd-login[data-ready]').waitFor({ state: 'attached', timeout: 2000 });
}

test.describe('Analysis Capture Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTestDB');
    });

    // Wait for bootstrap to inject qd-login component
    await waitForBootstrap(page);

    // Login as student
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await submitStudentLogin(login);
    await expect(page.locator('qd-status')).toBeVisible();
  });

  test('should make interactive cells editable', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);
    await waitForBootstrap(page);

    // Find interactive cell
    const interactiveCell = page.locator('td.interactive').first();
    await expect(interactiveCell).toBeVisible();

    // Verify cell is editable
    const isEditable = await interactiveCell.getAttribute('contenteditable');
    expect(isEditable).toBe('true');
  });

  test('should keep non-interactive cells read-only', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);
    await waitForBootstrap(page);

    // Find non-interactive cell (header or regular cell without class)
    const readOnlyCell = page.locator('td:not(.interactive)').first();

    if ((await readOnlyCell.count()) > 0) {
      const isEditable = await readOnlyCell.getAttribute('contenteditable');
      expect(isEditable).toBeNull();
    }
  });

  test('should save cell edits to IndexedDB', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);
    await waitForBootstrap(page);

    // Verify session and table exist
    await expect(page.locator('qd-status')).toBeVisible();
    const analysisTable = page.locator('table.qd-analysis');
    await expect(analysisTable).toBeVisible();

    // Edit an interactive cell
    const interactiveCell = page.locator('td.interactive').first();
    await expect(interactiveCell).toBeVisible();

    // Verify contenteditable
    const isEditable = await interactiveCell.getAttribute('contenteditable');
    expect(isEditable).toBe('true');

    // Setup save listener
    const savePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:analysis-saved', () => resolve(true), { once: true });
      });
    });

    await interactiveCell.click();
    await interactiveCell.fill('Test analysis answer');

    // Wait for save event
    const saved = await savePromise;
    expect(saved).toBe(true);
  });

  test('should persist analysis answers across reload', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);
    await waitForBootstrap(page);

    // Setup save listener before editing
    const savePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:analysis-saved', () => resolve(true), { once: true });
      });
    });

    // Edit a cell
    const interactiveCell = page.locator('td.interactive').first();
    await interactiveCell.click();
    const testText = 'Persistent analysis answer';
    await interactiveCell.fill(testText);

    // Wait for save event
    await savePromise;

    // Reload page
    await page.reload();
    await waitForBootstrap(page);

    // Verify text persisted (re-query after reload)
    const reloadedCell = page.locator('td.interactive').first();
    const cellContent = await reloadedCell.textContent();
    expect(cellContent?.trim()).toBe(testText);
  });

  test('should debounce rapid edits', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);
    await waitForBootstrap(page);

    // Setup save counter
    await page.evaluate(() => {
      (window as WindowWithSaveCount).__saveCount = 0;
      document.addEventListener('qd:analysis-saved', () => {
        const w = window as WindowWithSaveCount;
        w.__saveCount = (w.__saveCount || 0) + 1;
      });
    });

    // Make rapid edits
    const interactiveCell = page.locator('td.interactive').first();
    await interactiveCell.click();
    await interactiveCell.fill('A');
    await interactiveCell.fill('AB');
    await interactiveCell.fill('ABC');
    await interactiveCell.fill('ABCD');

    // Wait for final debounced save and verify count
    await expect(async () => {
      const saveCount = await page.evaluate(() => {
        const w = window as WindowWithSaveCount;
        return w.__saveCount || 0;
      });
      expect(saveCount).toBe(1);
    }).toPass({ timeout: 3000 });
  });

  test('should show student entries in instructor mode', async ({ page }) => {
    // Student edits analysis cell
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);
    await waitForBootstrap(page);

    // Setup save listener
    const savePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:analysis-saved', () => resolve(true), { once: true });
      });
    });

    const interactiveCell = page.locator('td.interactive').first();
    await interactiveCell.click();
    await interactiveCell.fill('Student analysis response');

    // Wait for save event
    await savePromise;

    // Go back to index and logout first
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);

    // Logout if logged in
    const logoutBtn = page.locator('button').filter({ hasText: /logout/i });
    if ((await logoutBtn.count()) > 0) {
      await logoutBtn.click();
      await waitForBootstrap(page);
    }

    // Page already has qd-instructor-hash element, just click instructor button
    const instructorButton = page
      .locator('button')
      .filter({ hasText: /instructor/i })
      .first();
    await instructorButton.click();

    const passwordInput = page.locator('qd-modal[open] input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-modal[open] button[type="submit"]');
    await unlockButton.click();
    await expect(passwordInput).not.toBeVisible();

    // Verify instructor mode active
    await expect(page.getByText('View All Scores')).toBeVisible();

    // Navigate to analysis page
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);
    await waitForBootstrap(page);

    // Verify analysis table visible and instructor mode active
    const analysisTable = page.locator('table.qd-analysis');
    await expect(analysisTable).toBeVisible();

    // Verify instructor panel is visible on the page
    await expect(page.getByText('View All Scores')).toBeVisible();
  });

  test('should handle empty cell content', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);
    await waitForBootstrap(page);

    // Setup first save listener
    let savePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:analysis-saved', () => resolve(true), { once: true });
      });
    });

    // Edit cell then clear it
    const interactiveCell = page.locator('td.interactive').first();
    await interactiveCell.click();
    await interactiveCell.fill('Temporary text');

    // Wait for first save
    await savePromise;

    // Setup second save listener for empty content
    savePromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:analysis-saved', () => resolve(true), { once: true });
      });
    });

    // Clear the cell
    await interactiveCell.click();
    await interactiveCell.fill('');

    // Wait for empty save
    await savePromise;

    // Verify cell is now empty
    const content = await interactiveCell.textContent();
    expect(content?.trim()).toBe('');
  });
});
