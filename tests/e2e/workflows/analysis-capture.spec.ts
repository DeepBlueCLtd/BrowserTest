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
import type { StudentRecord, PageData } from '../../../src/types/contracts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../dita-demo');

const TEST_PASSWORD = 'instructor123';

interface WindowWithSaveCount extends Window {
  __saveCount?: number;
}

interface PagesRecord {
  [pageId: string]: PageData;
}

/**
 * Wait for bootstrap to complete and inject components
 */
async function waitForBootstrap(page: Page): Promise<void> {
  // Wait for qd-login element AND its shadow DOM to be ready
  await page.locator('qd-login[data-ready]').waitFor({ timeout: 2000 });
}

test.describe('Analysis Capture Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTest');
    });

    // Wait for bootstrap to inject qd-login component
    await waitForBootstrap(page);

    // Login as student
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('button[type="submit"]').click();
    await expect(page.locator('qd-status')).toBeVisible();
  });

  test.skip('should make interactive cells editable', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);

    // Find interactive cell
    const interactiveCell = page.locator('td.interactive').first();
    await expect(interactiveCell).toBeVisible();

    // Verify cell is editable
    const isEditable = await interactiveCell.getAttribute('contenteditable');
    expect(isEditable).toBe('true');
  });

  test.skip('should keep non-interactive cells read-only', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);

    // Find non-interactive cell (header or regular cell without class)
    const readOnlyCell = page.locator('td:not(.interactive)').first();

    if ((await readOnlyCell.count()) > 0) {
      const isEditable = await readOnlyCell.getAttribute('contenteditable');
      expect(isEditable).toBeNull();
    }
  });

  test.skip('should save cell edits to IndexedDB', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);

    // Wait for table enhancement
    await page.waitForTimeout(500);

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

    await interactiveCell.click();
    await interactiveCell.fill('Test analysis answer');

    // Wait for debounced save (500ms debounce + time to save)
    await page.waitForTimeout(1500);

    // Verify data saved
    const savedData = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const request = indexedDB.open('BrowserTest');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('students', 'readonly');
          const store = tx.objectStore('students');
          const getRequest = store.getAll();
          getRequest.onsuccess = () => {
            const students = getRequest.result as StudentRecord[];
            if (students.length > 0 && students[0]?.pages) {
              const pages = Object.values(students[0].pages);
              resolve(
                pages.some((p) => p?.analysis?.cells && Object.keys(p.analysis.cells).length > 0),
              );
            } else {
              resolve(false);
            }
          };
        };
      });
    });

    expect(savedData).toBe(true);
  });

  test.skip('should persist analysis answers across reload', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);

    // Edit a cell
    const interactiveCell = page.locator('td.interactive').first();
    await interactiveCell.click();
    const testText = 'Persistent analysis answer';
    await interactiveCell.fill(testText);

    // Wait for save
    await expect(async () => {
      const savedData = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const request = indexedDB.open('BrowserTest');
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readonly');
            const store = tx.objectStore('students');
            const getRequest = store.getAll();
            getRequest.onsuccess = () => resolve(getRequest.result);
          };
        });
      });
      expect(savedData).toBeTruthy();
    }).toPass();

    // Reload page
    await page.reload();

    // Verify text persisted (re-query after reload)
    const reloadedCell = page.locator('td.interactive').first();
    const cellContent = await reloadedCell.textContent();
    expect(cellContent?.trim()).toBe(testText);
  });

  test.skip('should debounce rapid edits', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);

    // Setup save counter
    await page.evaluate(() => {
      (window as WindowWithSaveCount).__saveCount = 0;
      document.addEventListener('qd:answer-saved', () => {
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

  test.skip('should show student entries in instructor mode', async ({ page }) => {
    // Student edits analysis cell
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);

    const interactiveCell = page.locator('td.interactive').first();
    await interactiveCell.click();
    await interactiveCell.fill('Student analysis response');

    // Wait for save
    await expect(async () => {
      const savedData = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const request = indexedDB.open('BrowserTest');
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readonly');
            const store = tx.objectStore('students');
            const getRequest = store.getAll();
            getRequest.onsuccess = () => resolve(getRequest.result);
          };
        });
      });
      expect(savedData).toBeTruthy();
    }).toPass();

    // Unlock instructor mode
    await page.goto(`file://${demoPath}/page-index.html`);
    await waitForBootstrap(page);
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await expect(page.locator('qd-instructor .instructor-panel')).toBeVisible();

    // Navigate to analysis page
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);

    // Toggle "Show Answers" if needed
    const showAnswersToggle = page
      .locator('input[type="checkbox"]')
      .filter({ hasText: /show.*answer/i });
    if ((await showAnswersToggle.count()) > 0) {
      await showAnswersToggle.check();
    }

    // Verify student entry shown
    const studentEntry = page.locator('text=/Student analysis response|John Doe|TEST001/i').first();
    await expect(studentEntry).toBeVisible();
  });

  test.skip('should calculate table ID from structure', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);

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

  test.skip('should generate unique cell keys', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);

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

  test.skip('should handle empty cell content', async ({ page }) => {
    await page.goto(`file://${demoPath}/Pages/gram-1.html`);

    // Edit cell then clear it
    const interactiveCell = page.locator('td.interactive').first();
    await interactiveCell.click();
    await interactiveCell.fill('Temporary text');

    // Wait for save
    await expect(async () => {
      const savedData = await page.evaluate(async () => {
        return new Promise<StudentRecord[]>((resolve) => {
          const request = indexedDB.open('BrowserTest');
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readonly');
            const store = tx.objectStore('students');
            const getRequest = store.getAll();
            getRequest.onsuccess = () => resolve(getRequest.result as StudentRecord[]);
          };
        });
      });
      expect(savedData).toBeTruthy();
    }).toPass();

    // Clear the cell
    await interactiveCell.click();
    await interactiveCell.fill('');

    // Wait for empty save
    await expect(async () => {
      const savedData = await page.evaluate(async () => {
        return new Promise<string | null>((resolve) => {
          const request = indexedDB.open('BrowserTest');
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('students', 'readonly');
            const store = tx.objectStore('students');
            const getRequest = store.getAll();
            getRequest.onsuccess = () => {
              const students = getRequest.result as StudentRecord[];
              if (students.length > 0) {
                const pages = students[0]?.pages as PagesRecord | undefined;
                if (pages) {
                  const pageKeys = Object.keys(pages);
                  const firstPageKey = pageKeys[0];
                  if (firstPageKey) {
                    const pageData: PageData = pages[firstPageKey] as PageData;
                    const cells = pageData?.analysis?.cells || {};
                    const firstKey = Object.keys(cells)[0];
                    if (firstKey) {
                      resolve(cells[firstKey] ?? null);
                    }
                  }
                }
              }
              resolve(null);
            };
          };
        });
      });
      expect(savedData).toBe('');
    }).toPass();
  });
});
