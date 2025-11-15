/**
 * E2E Bootstrap Test - Phase 0
 *
 * Verifies that demo HTML files load correctly with the built bundle
 */

import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

test.describe('Phase 0 - Bootstrap Verification', () => {
  test.beforeEach(() => {
    // Verify dist files exist before running E2E tests
    const iifeBundle = join(projectRoot, 'dist/sonar-quiz.iife.js');
    const esmBundle = join(projectRoot, 'dist/sonar-quiz.esm.js');

    if (!existsSync(iifeBundle)) {
      throw new Error('IIFE bundle not found. Run "npm run build" before E2E tests.');
    }
    if (!existsSync(esmBundle)) {
      throw new Error('ESM bundle not found. Run "npm run build" before E2E tests.');
    }
  });

  test.skip('quiz examples demo page should load', async ({ page }) => {
    const quizExamplesPath = join(projectRoot, 'demo/quiz-examples.html');
    const fileUrl = `file://${quizExamplesPath}`;

    await page.goto(fileUrl);

    // Verify page loaded
    await expect(page).toHaveTitle(/Quiz Table Examples/);

    // Verify main heading exists
    const heading = page.locator('h1');
    await expect(heading).toContainText('Quiz Table Examples');

    // Verify at least one quiz table exists
    const quizTables = page.locator('table.qd-quiz');
    await expect(quizTables.first()).toBeVisible();
  });

  test.skip('analysis examples demo page should load', async ({ page }) => {
    const analysisExamplesPath = join(projectRoot, 'demo/analysis-examples.html');
    const fileUrl = `file://${analysisExamplesPath}`;

    await page.goto(fileUrl);

    // Verify page loaded
    await expect(page).toHaveTitle(/Analysis Table Examples/);

    // Verify main heading exists
    const heading = page.locator('h1');
    await expect(heading).toContainText('Analysis Table Examples');

    // Verify at least one analysis table exists
    const analysisTables = page.locator('table.qd-analysis');
    await expect(analysisTables.first()).toBeVisible();
  });
});
