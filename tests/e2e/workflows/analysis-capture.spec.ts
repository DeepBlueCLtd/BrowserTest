/**
 * E2E Test: Analysis Capture Workflow
 *
 * Tests analysis table functionality:
 * - Cell editability (interactive vs read-only)
 * - Auto-save with debouncing
 * - Answer persistence across reload
 * - Instructor view of student entries
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../demo');

const TEST_PASSWORD = 'instructor123';

test.describe('Analysis Capture Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('SonarQuizDB');
    });

    // Login as student
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);
  });

  test('should make interactive cells editable', async ({ page }) => {
    await page.goto(`file://${demoPath}/analysis-examples.html`);
    await page.waitForTimeout(500);

    // Find interactive cell
    const interactiveCell = page.locator('td.interactive').first();
    await expect(interactiveCell).toBeVisible();

    // Verify cell is editable
    const isEditable = await interactiveCell.getAttribute('contenteditable');
    expect(isEditable).toBe('true');
  });

  test('should keep non-interactive cells read-only', async ({ page }) => {
    await page.goto(`file://${demoPath}/analysis-examples.html`);
    await page.waitForTimeout(500);

    // Find non-interactive cell (header or regular cell without class)
    const readOnlyCell = page.locator('td:not(.interactive)').first();

    if (await readOnlyCell.count() > 0) {
      const isEditable = await readOnlyCell.getAttribute('contenteditable');
      expect(isEditable).toBeNull();
    }
  });

  test('should save cell edits to IndexedDB', async ({ page }) => {
    await page.goto(`file://${demoPath}/analysis-examples.html`);
    await page.waitForTimeout(500);

    // Edit an interactive cell
    const interactiveCell = page.locator('td.interactive').first();
    await interactiveCell.click();
    await interactiveCell.fill('Test analysis answer');
    await page.waitForTimeout(1500); // Wait for debounced save

    // Verify saved in IndexedDB
    const savedData = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('SonarQuizDB');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('students', 'readonly');
          const store = tx.objectStore('students');
          const getRequest = store.getAll();
          getRequest.onsuccess = () => {
            const students = getRequest.result as any[];
            if (students.length > 0) {
              const pages = students[0].pages || {};
              const pageKeys = Object.keys(pages);
              if (pageKeys.length > 0) {
                const pageData = pages[pageKeys[0]];
                resolve(pageData.answers || {});
              }
            }
            resolve({});
          };
        };
      });
    });

    expect(Object.keys(savedData as object).length).toBeGreaterThan(0);
  });

  test('should persist analysis answers across reload', async ({ page }) => {
    await page.goto(`file://${demoPath}/analysis-examples.html`);
    await page.waitForTimeout(500);

    // Edit a cell
    const interactiveCell = page.locator('td.interactive').first();
    await interactiveCell.click();
    const testText = 'Persistent analysis answer';
    await interactiveCell.fill(testText);
    await page.waitForTimeout(1500); // Wait for save

    // Reload page
    await page.reload();
    await page.waitForTimeout(500);

    // Verify text persisted
    const cellContent = await interactiveCell.textContent();
    expect(cellContent?.trim()).toBe(testText);
  });

  test('should debounce rapid edits', async ({ page }) => {
    await page.goto(`file://${demoPath}/analysis-examples.html`);
    await page.waitForTimeout(500);

    // Setup save counter
    let saveCount = 0;
    await page.evaluate(() => {
      (window as any).__saveCount = 0;
      document.addEventListener('qd:answer-saved', () => {
        (window as any).__saveCount++;
      });
    });

    // Make rapid edits
    const interactiveCell = page.locator('td.interactive').first();
    await interactiveCell.click();
    await interactiveCell.fill('A');
    await page.waitForTimeout(100);
    await interactiveCell.fill('AB');
    await page.waitForTimeout(100);
    await interactiveCell.fill('ABC');
    await page.waitForTimeout(100);
    await interactiveCell.fill('ABCD');

    // Wait for final debounced save
    await page.waitForTimeout(1500);

    // Check save count (should be 1, not 4)
    saveCount = await page.evaluate(() => (window as any).__saveCount);
    expect(saveCount).toBe(1);
  });

  test('should show student entries in instructor mode', async ({ page }) => {
    // Student edits analysis cell
    await page.goto(`file://${demoPath}/analysis-examples.html`);
    await page.waitForTimeout(500);

    const interactiveCell = page.locator('td.interactive').first();
    await interactiveCell.click();
    await interactiveCell.fill('Student analysis response');
    await page.waitForTimeout(1500);

    // Unlock instructor mode
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();
    await page.waitForTimeout(300);

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await page.waitForTimeout(500);

    // Navigate to analysis page
    await page.goto(`file://${demoPath}/analysis-examples.html`);
    await page.waitForTimeout(500);

    // Toggle "Show Answers" if needed
    const showAnswersToggle = page.locator('input[type="checkbox"]').filter({ hasText: /show.*answer/i });
    if (await showAnswersToggle.count() > 0) {
      await showAnswersToggle.check();
      await page.waitForTimeout(300);
    }

    // Verify student entry shown
    const studentEntry = page.locator('text=/Student analysis response|John Doe|TEST001/i').first();
    await expect(studentEntry).toBeVisible({ timeout: 2000 });
  });

  test('should calculate table ID from structure', async ({ page }) => {
    await page.goto(`file://${demoPath}/analysis-examples.html`);
    await page.waitForTimeout(500);

    // Get table metadata
    const tableId = await page.evaluate(() => {
      const table = document.querySelector('table.qd-analysis') as HTMLTableElement;
      if (table && table.dataset.tableId) {
        return table.dataset.tableId;
      }
      return null;
    });

    // Verify table ID is 16 characters (hash format)
    expect(tableId).toBeTruthy();
    expect(tableId?.length).toBe(16);
  });

  test('should generate unique cell keys', async ({ page }) => {
    await page.goto(`file://${demoPath}/analysis-examples.html`);
    await page.waitForTimeout(500);

    // Get cell keys
    const cellKeys = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('td.interactive'));
      return cells.map((cell) => (cell as HTMLElement).dataset.cellKey);
    });

    // Verify all keys unique
    const uniqueKeys = new Set(cellKeys);
    expect(uniqueKeys.size).toBe(cellKeys.length);

    // Verify key format: R{row}C{col}#f:{hash}
    for (const key of cellKeys) {
      expect(key).toMatch(/^R\d+C\d+#f:[a-f0-9]{8}$/);
    }
  });

  test('should handle empty cell content', async ({ page }) => {
    await page.goto(`file://${demoPath}/analysis-examples.html`);
    await page.waitForTimeout(500);

    // Edit cell then clear it
    const interactiveCell = page.locator('td.interactive').first();
    await interactiveCell.click();
    await interactiveCell.fill('Temporary text');
    await page.waitForTimeout(1500);

    // Clear the cell
    await interactiveCell.click();
    await interactiveCell.fill('');
    await page.waitForTimeout(1500);

    // Verify empty answer saved
    const savedData = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('SonarQuizDB');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('students', 'readonly');
          const store = tx.objectStore('students');
          const getRequest = store.getAll();
          getRequest.onsuccess = () => {
            const students = getRequest.result as any[];
            if (students.length > 0) {
              const pages = students[0].pages || {};
              const pageKeys = Object.keys(pages);
              if (pageKeys.length > 0) {
                const pageData = pages[pageKeys[0]];
                const answers = pageData.answers || {};
                const firstKey = Object.keys(answers)[0];
                resolve(answers[firstKey]?.answer || null);
              }
            }
            resolve(null);
          };
        };
      });
    });

    expect(savedData).toBe('');
  });
});
