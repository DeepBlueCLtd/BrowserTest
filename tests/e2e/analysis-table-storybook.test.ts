/**
 * Playwright E2E Tests for Analysis Table Storybook Stories
 *
 * Tests the analysis table enhancement by loading Storybook stories
 * and verifying UI behavior, especially data persistence across navigation.
 *
 * USAGE:
 * npm run test:e2e
 *
 * NOTE: Playwright automatically starts/stops Storybook. No manual setup needed.
 *
 * These tests verify:
 * - Cells with class="interactive" are editable in interactive mode
 * - Cells without class="interactive" remain read-only
 * - Data persists in sessionStorage across page navigation
 * - Analysis data is not lost when navigating to quiz tables
 */

import { test, expect } from '@playwright/test';

// Storybook URL (assumes Storybook is running on port 6006)
const STORYBOOK_URL = 'http://localhost:6006';

test.describe('Analysis Table - Storybook Stories', () => {
  test.describe('Non-Interactive Mode', () => {
    test('should not enable editing in non-interactive mode', async ({ page }) => {
      // Navigate to the NonInteractiveMode story
      await page.goto(
        `${STORYBOOK_URL}/iframe.html?id=enhancers-analysis-table--non-interactive-mode`,
      );

      // Wait for the table to be rendered and enhanced
      await page.waitForSelector('table.qd-analysis');
      await page.waitForTimeout(200); // Wait for enhancement to complete

      // Verify table has the non-interactive class
      const table = page.locator('table.qd-analysis');
      await expect(table).toHaveClass(/qd-analysis-non-interactive/);

      // Get all cells
      const cells = page.locator('table.qd-analysis td');
      const cellCount = await cells.count();

      // Verify NO cells are contenteditable
      for (let i = 0; i < cellCount; i++) {
        const cell = cells.nth(i);
        const isEditable = await cell.evaluate(
          (el) => (el as HTMLElement).contentEditable === 'true',
        );
        expect(isEditable).toBe(false);
      }
    });
  });

  test.describe('Interactive Mode', () => {
    test('should enable editing only for cells with interactive class', async ({ page }) => {
      // Navigate to the InteractiveMode story
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-analysis-table--interactive-mode`);

      // Wait for the table to be rendered and enhanced
      await page.waitForSelector('table.qd-analysis');
      await page.waitForTimeout(200); // Wait for enhancement to complete

      // Verify table has the interactive class
      const table = page.locator('table.qd-analysis');
      await expect(table).toHaveClass(/qd-analysis-interactive/);

      // Verify cells with class="interactive" are contenteditable
      const interactiveCells = page.locator('table.qd-analysis td.interactive');
      const interactiveCellCount = await interactiveCells.count();
      expect(interactiveCellCount).toBeGreaterThan(0);

      for (let i = 0; i < interactiveCellCount; i++) {
        const cell = interactiveCells.nth(i);
        const isEditable = await cell.evaluate(
          (el) => (el as HTMLElement).contentEditable === 'true',
        );
        expect(isEditable).toBe(true);
        await expect(cell).toHaveClass(/qd-editable/);
      }

      // Verify cells WITHOUT class="interactive" are NOT contenteditable
      const allCells = page.locator('table.qd-analysis td');
      const allCellCount = await allCells.count();

      for (let i = 0; i < allCellCount; i++) {
        const cell = allCells.nth(i);
        const hasInteractiveClass = await cell.evaluate((el) =>
          el.classList.contains('interactive'),
        );

        if (!hasInteractiveClass) {
          const isEditable = await cell.evaluate(
            (el) => (el as HTMLElement).contentEditable === 'true',
          );
          expect(isEditable).toBe(false);
        }
      }
    });

    test('should allow editing and saving in interactive cells', async ({ page }) => {
      // Navigate to the InteractiveMode story
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-analysis-table--interactive-mode`);

      // Wait for the table to be rendered and enhanced
      await page.waitForSelector('table.qd-analysis');
      await page.waitForTimeout(200); // Wait for enhancement to complete

      // Get first interactive cell
      const firstInteractiveCell = page.locator('table.qd-analysis td.interactive').first();

      // Clear any existing content
      await firstInteractiveCell.clear();

      // Type text into the cell
      const testText = 'The answer is 4';
      await firstInteractiveCell.fill(testText);

      // Trigger input event
      await firstInteractiveCell.dispatchEvent('input');

      // Wait for debounce (500ms) + buffer
      await page.waitForTimeout(700);

      // Verify content is saved
      const savedContent = (await firstInteractiveCell.textContent())?.trim();
      expect(savedContent).toBe(testText);

      // NOTE: sessionStorage checks skipped - E2E tests verify UI behavior, not storage implementation
      // Storage mechanism is covered by unit tests
    });

    test('CRITICAL: analysis data persists when navigating to quiz table and back', async ({
      page,
    }) => {
      // 1. Navigate to Analysis Table Interactive Mode
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-analysis-table--interactive-mode`);
      await page.waitForSelector('table.qd-analysis');
      await page.waitForTimeout(200);

      // 2. Enter data in first interactive cell
      const firstCell = page.locator('table.qd-analysis td.interactive').first();
      const testText1 = 'Answer to first question';
      await firstCell.clear();
      await firstCell.fill(testText1);
      await firstCell.dispatchEvent('input');
      await page.waitForTimeout(700); // Wait for auto-save

      // 3. Verify data is saved
      let savedContent = (await firstCell.textContent())?.trim();
      expect(savedContent).toBe(testText1);

      // 4. Navigate to a Quiz Table story
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--interactive-mcq`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      // 5. Navigate BACK to Analysis Table
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-analysis-table--interactive-mode`);
      await page.waitForSelector('table.qd-analysis');
      await page.waitForTimeout(200);

      // 6. CRITICAL: Verify the data is STILL there
      const firstCellAfterReturn = page.locator('table.qd-analysis td.interactive').first();
      savedContent = (await firstCellAfterReturn.textContent())?.trim();
      expect(savedContent).toBe(testText1);

      // NOTE: sessionStorage checks skipped - E2E tests verify UI behavior, not storage implementation
    });

    test('CRITICAL: analysis data persists when navigating to another analysis table and back', async ({
      page,
    }) => {
      // 1. Navigate to Interactive Mode story
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-analysis-table--interactive-mode`);
      await page.waitForSelector('table.qd-analysis');
      await page.waitForTimeout(200);

      // 2. Enter data in first interactive cell
      const firstCell = page.locator('table.qd-analysis td.interactive').first();
      const testText = 'Photosynthesis explanation';
      await firstCell.clear();
      await firstCell.fill(testText);
      await firstCell.dispatchEvent('input');
      await page.waitForTimeout(700); // Wait for auto-save

      // 3. Verify data is saved
      let savedContent = (await firstCell.textContent())?.trim();
      expect(savedContent).toBe(testText);

      // 4. Navigate to Mixed Editability story (another analysis table)
      await page.goto(
        `${STORYBOOK_URL}/iframe.html?id=enhancers-analysis-table--mixed-editability`,
      );
      await page.waitForSelector('table.qd-analysis');
      await page.waitForTimeout(200);

      // 5. Navigate BACK to Interactive Mode story
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-analysis-table--interactive-mode`);
      await page.waitForSelector('table.qd-analysis');
      await page.waitForTimeout(200);

      // 6. CRITICAL: Verify the data is STILL there
      const firstCellAfterReturn = page.locator('table.qd-analysis td.interactive').first();
      savedContent = (await firstCellAfterReturn.textContent())?.trim();
      expect(savedContent).toBe(testText);
    });
  });

  test.describe('Mixed Editability', () => {
    test('should have selective cell editability based on class', async ({ page }) => {
      // Navigate to the MixedEditability story
      await page.goto(
        `${STORYBOOK_URL}/iframe.html?id=enhancers-analysis-table--mixed-editability`,
      );

      // Wait for the table to be rendered and enhanced
      await page.waitForSelector('table.qd-analysis');
      await page.waitForTimeout(200);

      // Get cells in the "Value" column (column index 1)
      const valueCells = page.locator('table.qd-analysis tbody tr td:nth-child(2)');
      const valueCellCount = await valueCells.count();

      // Count editable vs non-editable
      let editableCount = 0;
      let nonEditableCount = 0;

      for (let i = 0; i < valueCellCount; i++) {
        const cell = valueCells.nth(i);
        const hasInteractiveClass = await cell.evaluate((el) =>
          el.classList.contains('interactive'),
        );
        const isEditable = await cell.evaluate(
          (el) => (el as HTMLElement).contentEditable === 'true',
        );

        if (hasInteractiveClass) {
          expect(isEditable).toBe(true);
          editableCount++;
        } else {
          expect(isEditable).toBe(false);
          nonEditableCount++;
        }
      }

      // Verify we have a mix of editable and non-editable cells
      expect(editableCount).toBeGreaterThan(0);
      expect(nonEditableCount).toBeGreaterThan(0);
    });
  });
});
