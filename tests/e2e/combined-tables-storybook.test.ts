/**
 * E2E tests for Combined Tables Storybook stories
 *
 * Tests the interaction between analysis tables and quiz tables on the same page,
 * ensuring both data types coexist properly in storage.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { test, expect } from '@playwright/test';

const STORYBOOK_URL = 'http://localhost:6006';

test.describe('Combined Tables - AnalysisAndQuiz Story', () => {
  test('should allow editing analysis cells', async ({ page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-combined-tables--analysis-and-quiz`);

    // Wait for tables to be enhanced
    await page.waitForSelector('table.qd-analysis');
    await page.waitForSelector('table.qd-quiz');

    // Find first editable cell in analysis table
    const firstCell = page.locator('table.qd-analysis td.interactive').first();

    // Verify it's editable
    const isEditable = await firstCell.evaluate((el) => {
      if (el instanceof HTMLElement) {
        return el.contentEditable === 'true';
      }
      return false;
    });
    expect(isEditable).toBe(true);

    // Enter data
    await firstCell.fill('150');

    // Wait for auto-save (500ms debounce + buffer)
    await page.waitForTimeout(700);

    // Verify data persists in storage
    const cacheData = await page.evaluate(() => {
      const cacheJson = sessionStorage.getItem('qd/cache');
      if (!cacheJson) return null;
       
       
      return JSON.parse(cacheJson);
    });

    expect(cacheData).toBeDefined();
     
    expect(cacheData.pages['combined-page-1']).toBeDefined();
     
    expect(cacheData.pages['combined-page-1'].analysis).toBeDefined();
     
    expect(cacheData.pages['combined-page-1'].analysis.cells).toBeDefined();
  });

  test('should allow answering quiz questions', async ({ page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-combined-tables--analysis-and-quiz`);

    // Wait for quiz table to be enhanced
    await page.waitForSelector('table.qd-quiz .qd-quiz-input');

    // Find first quiz input
    const firstInput = page.locator('table.qd-quiz .qd-quiz-input').first();

    // Enter answer
    await firstInput.fill('2');

    // Trigger input event to auto-save
    await firstInput.dispatchEvent('input');

    // Wait for auto-save (200ms debounce + buffer)
    await page.waitForTimeout(400);

    // Verify data persists in storage
    const cacheData = await page.evaluate(() => {
      const cacheJson = sessionStorage.getItem('qd/cache');
      if (!cacheJson) return null;
       
      return JSON.parse(cacheJson);
    });

    expect(cacheData).toBeDefined();
    expect(cacheData.pages['combined-page-1']).toBeDefined();
    expect(cacheData.pages['combined-page-1'].answers).toBeDefined();
    expect(cacheData.pages['combined-page-1'].answers.length).toBeGreaterThan(0);
  });

  test('CRITICAL: analysis and quiz data coexist in same pageId', async ({ page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-combined-tables--analysis-and-quiz`);

    // Wait for both tables
    await page.waitForSelector('table.qd-analysis td.interactive');
    await page.waitForSelector('table.qd-quiz .qd-quiz-input');

    // 1. Enter analysis data
    const analysisCell = page.locator('table.qd-analysis td.interactive').first();
    await analysisCell.fill('200');
    await page.waitForTimeout(700); // Wait for auto-save

    // 2. Enter quiz answer
    const quizInput = page.locator('table.qd-quiz .qd-quiz-input').first();
    await quizInput.fill('2');
    await quizInput.dispatchEvent('input');
    await page.waitForTimeout(400); // Wait for auto-save

    // 3. Verify BOTH data types exist in storage
    const cacheData = await page.evaluate(() => {
      const cacheJson = sessionStorage.getItem('qd/cache');
      if (!cacheJson) return null;
       
      return JSON.parse(cacheJson);
    });

    expect(cacheData).toBeDefined();
    const pageData = cacheData.pages['combined-page-1'];
    expect(pageData).toBeDefined();

    // CRITICAL: Both fields must exist
    expect(pageData.analysis).toBeDefined();
    expect(pageData.analysis.cells).toBeDefined();
    expect(pageData.answers).toBeDefined();
    expect(pageData.answers.length).toBeGreaterThan(0);

    // Verify content
    const cellKeys = Object.keys(pageData.analysis.cells);
    expect(cellKeys.length).toBeGreaterThan(0);
    expect(Object.values(pageData.analysis.cells)).toContain('200');
  });

  test('CRITICAL: quiz save does not wipe analysis data', async ({ page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-combined-tables--analysis-and-quiz`);

    await page.waitForSelector('table.qd-analysis td.interactive');
    await page.waitForSelector('table.qd-quiz .qd-quiz-input');

    // 1. Save analysis data first
    const analysisCell = page.locator('table.qd-analysis td.interactive').nth(1);
    await analysisCell.fill('3.5');
    await page.waitForTimeout(700);

    // Get analysis data
    let cacheData = await page.evaluate(() => {
      const cacheJson = sessionStorage.getItem('qd/cache');
      return cacheJson ? JSON.parse(cacheJson) : null;
    });

    const analysisCellsBefore = { ...cacheData.pages['combined-page-1'].analysis.cells };

    // 2. Save quiz answer
    const quizInput = page.locator('table.qd-quiz .qd-quiz-input').nth(1);
    await quizInput.fill('1');
    await quizInput.dispatchEvent('input');
    await page.waitForTimeout(400);

    // 3. Verify analysis data STILL exists
    cacheData = await page.evaluate(() => {
      const cacheJson = sessionStorage.getItem('qd/cache');
      return cacheJson ? JSON.parse(cacheJson) : null;
    });

    const analysisCellsAfter = cacheData.pages['combined-page-1'].analysis.cells;

    // Analysis cells should be unchanged
    expect(analysisCellsAfter).toEqual(analysisCellsBefore);
    expect(Object.values(analysisCellsAfter)).toContain('3.5');
  });

  test('CRITICAL: analysis save does not wipe quiz data', async ({ page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-combined-tables--analysis-and-quiz`);

    await page.waitForSelector('table.qd-analysis td.interactive');
    await page.waitForSelector('table.qd-quiz .qd-quiz-input');

    // 1. Save quiz answer first
    const quizInput = page.locator('table.qd-quiz .qd-quiz-input').first();
    await quizInput.fill('2');
    await quizInput.dispatchEvent('input');
    await page.waitForTimeout(400);

    // Get quiz answers
    let cacheData = await page.evaluate(() => {
      const cacheJson = sessionStorage.getItem('qd/cache');
      return cacheJson ? JSON.parse(cacheJson) : null;
    });

    const answersBefore = [...cacheData.pages['combined-page-1'].answers];
    expect(answersBefore.length).toBeGreaterThan(0);

    // 2. Save analysis data
    const analysisCell = page.locator('table.qd-analysis td.interactive').first();
    await analysisCell.fill('100');
    await page.waitForTimeout(700);

    // 3. Verify quiz answers STILL exist
    cacheData = await page.evaluate(() => {
      const cacheJson = sessionStorage.getItem('qd/cache');
      return cacheJson ? JSON.parse(cacheJson) : null;
    });

    const answersAfter = cacheData.pages['combined-page-1'].answers;

    // Quiz answers should be unchanged
    expect(answersAfter).toEqual(answersBefore);
    expect(answersAfter[0].answer).toBe('2');
  });
});

test.describe('Combined Tables - WithExistingData Story', () => {
  test('should load pre-filled analysis data', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=enhancers-combined-tables--with-existing-data`,
    );

    // Wait for analysis table to be enhanced
    await page.waitForSelector('table.qd-analysis td.interactive');

    // Check first cell (should have "100")
    const firstCell = page.locator('table.qd-analysis td.interactive').first();
    const firstCellText = await firstCell.textContent();
    expect(firstCellText).toBe('100');

    // Check second cell (should have "2.5")
    const secondCell = page.locator('table.qd-analysis td.interactive').nth(1);
    const secondCellText = await secondCell.textContent();
    expect(secondCellText).toBe('2.5');

    // Check third cell (should be empty)
    const thirdCell = page.locator('table.qd-analysis td.interactive').nth(2);
    const thirdCellText = await thirdCell.textContent();
    expect(thirdCellText).toBe('');
  });

  test('should load pre-filled quiz answer', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=enhancers-combined-tables--with-existing-data`,
    );

    // Wait for quiz table to be enhanced
    await page.waitForSelector('table.qd-quiz .qd-quiz-input');

    // First question should have answer "2"
    const firstInput = page.locator('table.qd-quiz .qd-quiz-input').first();
    const firstValue = await firstInput.inputValue();
    expect(firstValue).toBe('2');

    // Second question should be empty
    const secondInput = page.locator('table.qd-quiz .qd-quiz-input').nth(1);
    const secondValue = await secondInput.inputValue();
    expect(secondValue).toBe('');
  });

  test('should have both analysis and quiz data in storage', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=enhancers-combined-tables--with-existing-data`,
    );

    // Wait for tables to be enhanced
    await page.waitForSelector('table.qd-analysis');
    await page.waitForSelector('table.qd-quiz');

    // Verify storage has both data types
    const cacheData = await page.evaluate(() => {
      const cacheJson = sessionStorage.getItem('qd/cache');
      return cacheJson ? JSON.parse(cacheJson) : null;
    });

    expect(cacheData).toBeDefined();
    const pageData = cacheData.pages['combined-page-2'];
    expect(pageData).toBeDefined();

    // Both fields must exist
    expect(pageData.analysis).toBeDefined();
    expect(pageData.analysis.cells).toBeDefined();
    expect(pageData.answers).toBeDefined();

    // Verify content
    expect(pageData.analysis.cells['R0C1#f:00001505']).toBe('100');
    expect(pageData.analysis.cells['R1C1#f:00001505']).toBe('2.5');
    expect(pageData.answers.length).toBe(1);
    expect(pageData.answers[0].answer).toBe('2');
  });
});

test.describe('Combined Tables - NonInteractive Story', () => {
  test('should NOT clear session storage', async ({ page }) => {
    // 1. First, go to interactive story and create some data
    await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-combined-tables--analysis-and-quiz`);

    await page.waitForSelector('table.qd-analysis td.interactive');
    const analysisCell = page.locator('table.qd-analysis td.interactive').first();
    await analysisCell.fill('999');
    await page.waitForTimeout(700);

    // Verify data was saved
    let cacheData = await page.evaluate(() => {
      const cacheJson = sessionStorage.getItem('qd/cache');
      return cacheJson ? JSON.parse(cacheJson) : null;
    });

    expect(cacheData).toBeDefined();
    expect(cacheData.pages['combined-page-1']).toBeDefined();

    // 2. Navigate to NonInteractive story
    await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-combined-tables--non-interactive`);

    // Wait for page to load
    await page.waitForSelector('table.qd-analysis');

    // 3. CRITICAL: Session storage should NOT be cleared
    cacheData = await page.evaluate(() => {
      const cacheJson = sessionStorage.getItem('qd/cache');
      return cacheJson ? JSON.parse(cacheJson) : null;
    });

    // Data should still exist
    expect(cacheData).toBeDefined();
    expect(cacheData.pages['combined-page-1']).toBeDefined();
    expect(cacheData.pages['combined-page-1'].analysis).toBeDefined();
  });

  test('should render cells as non-editable', async ({ page }) => {
    await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-combined-tables--non-interactive`);

    await page.waitForSelector('table.qd-analysis');

    // Check that cells are NOT editable
    const interactiveCells = page.locator('table.qd-analysis td.interactive');
    const count = await interactiveCells.count();

    for (let i = 0; i < count; i++) {
      const isEditable = await interactiveCells.nth(i).evaluate((el) => {
        if (el instanceof HTMLElement) {
          return el.contentEditable === 'true';
        }
        return false;
      });
      expect(isEditable).toBe(false);
    }
  });
});
