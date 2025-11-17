/**
 * Playwright E2E Tests for Quiz Table Storybook Stories
 *
 * Tests the quiz table enhancement by loading Storybook stories
 * and verifying UI behavior in a real browser.
 *
 * USAGE:
 * npm run test:e2e
 *
 * NOTE: Playwright automatically starts/stops Storybook. No manual setup needed.
 *
 * These tests verify:
 * - Detail column is hidden in both interactive and non-interactive modes
 * - MCQ questions use select dropdowns with options
 * - Numeric questions use text inputs
 * - Answer validation and styling works correctly
 * - State progression works as expected
 * - Pre-filled answers load correctly from cache
 */

import { test, expect } from '@playwright/test';

// Storybook URL (assumes Storybook is running on port 6006)
const STORYBOOK_URL = 'http://localhost:6006';

test.describe('Quiz Table - Storybook Stories', () => {
  test.describe('Non-Interactive Mode', () => {
    test('should hide Answer and Detail columns in non-interactive mode', async ({ page }) => {
      // Navigate to the NonInteractiveMode story
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--non-interactive-mode`);

      // Wait for the table to be rendered and enhanced
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200); // Wait for enhancement to complete

      // Get all header cells
      const headerCells = page.locator('table.qd-quiz thead th');
      const headerCount = await headerCells.count();
      expect(headerCount).toBe(3); // Question, Answer, Detail

      // Verify Answer column (index 1) is hidden for security
      const answerHeader = headerCells.nth(1);
      await expect(answerHeader).toHaveClass(/qd-hidden/);

      // Verify Detail column (index 2) is hidden
      const detailHeader = headerCells.nth(2);
      await expect(detailHeader).toHaveClass(/qd-hidden/);

      // Verify all Answer and Detail cells in tbody are hidden
      const rows = page.locator('table.qd-quiz tbody tr');
      const rowCount = await rows.count();

      for (let i = 0; i < rowCount; i++) {
        const cells = rows.nth(i).locator('td');
        const answerCell = cells.nth(1);
        const detailCell = cells.nth(2);
        await expect(answerCell).toHaveClass(/qd-hidden/);
        await expect(detailCell).toHaveClass(/qd-hidden/);
      }
    });

    test('should not show input controls in non-interactive mode', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--non-interactive-mode`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      // Verify no input controls are present
      const inputs = page.locator('table.qd-quiz input.qd-quiz-input');
      await expect(inputs).toHaveCount(0);

      const selects = page.locator('table.qd-quiz select.qd-quiz-input');
      await expect(selects).toHaveCount(0);
    });

    test('should have non-interactive class', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--non-interactive-mode`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      const table = page.locator('table.qd-quiz');
      await expect(table).toHaveClass(/qd-quiz-non-interactive/);
    });
  });

  test.describe('Interactive Mode - MCQ', () => {
    test('should hide Detail column in interactive mode', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--interactive-mcq`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      // Verify Detail column (index 2) is hidden
      const headerCells = page.locator('table.qd-quiz thead th');
      const detailHeader = headerCells.nth(2);
      await expect(detailHeader).toHaveClass(/qd-hidden/);

      // Verify all Detail cells are hidden
      const rows = page.locator('table.qd-quiz tbody tr');
      const rowCount = await rows.count();

      for (let i = 0; i < rowCount; i++) {
        const cells = rows.nth(i).locator('td');
        const detailCell = cells.nth(2);
        await expect(detailCell).toHaveClass(/qd-hidden/);
      }
    });

    test('should show select dropdowns for MCQ questions', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--interactive-mcq`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      // Verify select elements are present
      const selects = page.locator('table.qd-quiz select.qd-quiz-input');
      await expect(selects).toHaveCount(3); // 3 MCQ questions

      // Verify first select has options
      const firstSelect = selects.first();
      const options = firstSelect.locator('option');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(3); // Placeholder + 3 options
    });

    test('should validate correct answer as green', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--interactive-mcq`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      // Select correct answer for first question (answer is 1)
      const firstSelect = page.locator('table.qd-quiz select.qd-quiz-input').first();
      await firstSelect.selectOption('1');

      // Wait for debounced save (200ms + buffer)
      await page.waitForTimeout(400);

      // Verify answer cell has correct styling
      const firstAnswerCell = page.locator('table.qd-quiz tbody tr').first().locator('td').nth(1);
      await expect(firstAnswerCell).toHaveClass(/qd-answer-correct/);
    });

    test('should validate incorrect answer as red', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--interactive-mcq`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      // Select incorrect answer for first question (correct is 1, select 2)
      const firstSelect = page.locator('table.qd-quiz select.qd-quiz-input').first();
      await firstSelect.selectOption('2');

      // Wait for debounced save
      await page.waitForTimeout(400);

      // Verify answer cell has incorrect styling
      const firstAnswerCell = page.locator('table.qd-quiz tbody tr').first().locator('td').nth(1);
      await expect(firstAnswerCell).toHaveClass(/qd-answer-incorrect/);
    });

    test('should have interactive class', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--interactive-mcq`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      const table = page.locator('table.qd-quiz');
      await expect(table).toHaveClass(/qd-quiz-interactive/);
    });
  });

  test.describe('Interactive Mode - Numeric', () => {
    test('should hide Detail column for numeric questions', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--interactive-numeric`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      // Verify Detail column is hidden
      const headerCells = page.locator('table.qd-quiz thead th');
      const detailHeader = headerCells.nth(2);
      await expect(detailHeader).toHaveClass(/qd-hidden/);
    });

    test('should show text input for numeric questions', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--interactive-numeric`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      // Verify text inputs are present
      const inputs = page.locator('table.qd-quiz input.qd-quiz-input');
      await expect(inputs).toHaveCount(3); // 3 numeric questions

      // Verify first input is text type
      const firstInput = inputs.first();
      await expect(firstInput).toHaveAttribute('type', 'text');
    });

    test('should validate numeric answer within tolerance', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--interactive-numeric`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      // Enter correct answer for first question (π = 3.14)
      const firstInput = page.locator('table.qd-quiz input.qd-quiz-input').first();
      await firstInput.fill('3.14');

      // Wait for debounced save
      await page.waitForTimeout(400);

      // Verify answer cell has correct styling
      const firstAnswerCell = page.locator('table.qd-quiz tbody tr').first().locator('td').nth(1);
      await expect(firstAnswerCell).toHaveClass(/qd-answer-correct/);
    });

    test('should validate numeric answer outside tolerance', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--interactive-numeric`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      // Enter incorrect answer for first question (π = 3.14, enter 3.5)
      const firstInput = page.locator('table.qd-quiz input.qd-quiz-input').first();
      await firstInput.fill('3.5');

      // Wait for debounced save
      await page.waitForTimeout(400);

      // Verify answer cell has incorrect styling
      const firstAnswerCell = page.locator('table.qd-quiz tbody tr').first().locator('td').nth(1);
      await expect(firstAnswerCell).toHaveClass(/qd-answer-incorrect/);
    });
  });

  test.describe('State Progression', () => {
    test('should show state progression from unstarted to complete', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--state-progression`);
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      // Verify initial state is unstarted
      const stateDisplay = page.locator('#state-display');
      await expect(stateDisplay).toContainText('unstarted');

      // Answer first question correctly (answer is 1)
      const firstSelect = page.locator('table.qd-quiz select.qd-quiz-input').first();
      await firstSelect.selectOption('1');
      await page.waitForTimeout(400);

      // Verify state changed to incomplete
      await expect(stateDisplay).toContainText('incomplete');

      // Answer second question correctly (answer is 2)
      const secondSelect = page.locator('table.qd-quiz select.qd-quiz-input').nth(1);
      await secondSelect.selectOption('2');
      await page.waitForTimeout(400);

      // Verify state changed to incomplete (not all answered)
      await expect(stateDisplay).toContainText('incomplete');

      // Answer third question correctly (answer is 2)
      const thirdSelect = page.locator('table.qd-quiz select.qd-quiz-input').nth(2);
      await thirdSelect.selectOption('2');
      await page.waitForTimeout(400);

      // Verify state changed to complete
      await expect(stateDisplay).toContainText('complete');
    });
  });

  test.describe('Pre-filled Answers', () => {
    test('should load pre-filled answers from cache', async ({ page }) => {
      await page.goto(
        `${STORYBOOK_URL}/iframe.html?id=enhancers-quiz-table--with-existing-answers`,
      );
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(200);

      // Verify first question has pre-filled answer (1)
      const firstSelect = page.locator('table.qd-quiz select.qd-quiz-input').first();
      const firstValue = await firstSelect.inputValue();
      expect(firstValue).toBe('1');

      // Verify first answer cell has correct styling
      const firstAnswerCell = page.locator('table.qd-quiz tbody tr').first().locator('td').nth(1);
      await expect(firstAnswerCell).toHaveClass(/qd-answer-correct/);

      // Verify second question has pre-filled answer (3) - incorrect
      const secondSelect = page.locator('table.qd-quiz select.qd-quiz-input').nth(1);
      const secondValue = await secondSelect.inputValue();
      expect(secondValue).toBe('3');

      // Verify second answer cell has incorrect styling
      const secondAnswerCell = page.locator('table.qd-quiz tbody tr').nth(1).locator('td').nth(1);
      await expect(secondAnswerCell).toHaveClass(/qd-answer-incorrect/);
    });
  });
});
