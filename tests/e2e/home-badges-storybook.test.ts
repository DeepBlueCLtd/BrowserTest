/**
 * Playwright E2E Tests for Home Badges Storybook Stories
 *
 * Tests the home page badge enhancement by loading Storybook stories
 * and verifying R/A/G badge application and real-time updates.
 *
 * USAGE:
 * npm run test:e2e
 *
 * NOTE: Playwright automatically starts/stops Storybook. No manual setup needed.
 *
 * These tests verify:
 * - Badge CSS classes applied based on completion state
 * - Only .quizPageBtn links receive badges
 * - Real-time badge updates via button interactions
 * - Graceful degradation with empty cache
 */

import { test, expect } from '@playwright/test';

// Storybook URL (assumes Storybook is running on port 6006)
const STORYBOOK_URL = 'http://localhost:6006';

test.describe('Home Badges - Storybook Stories', () => {
  test.describe('All Badge States', () => {
    test('should apply red badge to unstarted pages', async ({ page }) => {
      // Navigate to the AllBadgeStates story
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-home-badges--all-badge-states`);

      // Wait for DOM to render and enhancement to complete
      await page.waitForSelector('.quizPageBtn');
      await page.waitForTimeout(200);

      // Find link for lesson-3 (unstarted)
      const link3 = page.locator('[data-page-id="lesson-3"]');
      await expect(link3).toHaveClass(/qd-badge-red/);
    });

    test('should apply amber badge to incomplete pages', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-home-badges--all-badge-states`);
      await page.waitForSelector('.quizPageBtn');
      await page.waitForTimeout(200);

      // Find link for lesson-2 (incomplete)
      const link2 = page.locator('[data-page-id="lesson-2"]');
      await expect(link2).toHaveClass(/qd-badge-amber/);
    });

    test('should apply green badge to complete pages', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-home-badges--all-badge-states`);
      await page.waitForSelector('.quizPageBtn');
      await page.waitForTimeout(200);

      // Find link for lesson-1 (complete)
      const link1 = page.locator('[data-page-id="lesson-1"]');
      await expect(link1).toHaveClass(/qd-badge-green/);
    });

    test('should apply all three badge states in one view', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-home-badges--all-badge-states`);
      await page.waitForSelector('.quizPageBtn');
      await page.waitForTimeout(200);

      // Verify all three states present
      const redBadges = page.locator('.qd-badge-red');
      const amberBadges = page.locator('.qd-badge-amber');
      const greenBadges = page.locator('.qd-badge-green');

      await expect(redBadges).toHaveCount(1); // lesson-3
      await expect(amberBadges).toHaveCount(1); // lesson-2
      await expect(greenBadges).toHaveCount(1); // lesson-1
    });
  });

  test.describe('Dynamic Updates', () => {
    test('should update badge from red to amber when marked incomplete', async ({ page }) => {
      // Navigate to DynamicUpdates story
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-home-badges--dynamic-updates`);
      await page.waitForSelector('.quizPageBtn');
      await page.waitForTimeout(200);

      // Verify initial state is red (unstarted)
      const link = page.locator('[data-page-id="lesson-1"]');
      await expect(link).toHaveClass(/qd-badge-red/);

      // Click "Mark Incomplete" button
      const incompleteButton = page.locator('.btn-incomplete');
      await incompleteButton.click();
      await page.waitForTimeout(200);

      // Verify badge changed to amber
      await expect(link).toHaveClass(/qd-badge-amber/);
      await expect(link).not.toHaveClass(/qd-badge-red/);
    });

    test('should update badge from amber to green when marked complete', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-home-badges--dynamic-updates`);
      await page.waitForSelector('.quizPageBtn');
      await page.waitForTimeout(200);

      const link = page.locator('[data-page-id="lesson-1"]');

      // First mark as incomplete (red → amber)
      const incompleteButton = page.locator('.btn-incomplete');
      await incompleteButton.click();
      await page.waitForTimeout(200);
      await expect(link).toHaveClass(/qd-badge-amber/);

      // Then mark as complete (amber → green)
      const completeButton = page.locator('.btn-complete');
      await completeButton.click();
      await page.waitForTimeout(200);

      // Verify badge changed to green
      await expect(link).toHaveClass(/qd-badge-green/);
      await expect(link).not.toHaveClass(/qd-badge-amber/);
    });

    test('should update badge from red directly to green when marked complete', async ({
      page,
    }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-home-badges--dynamic-updates`);
      await page.waitForSelector('.quizPageBtn');
      await page.waitForTimeout(200);

      const link = page.locator('[data-page-id="lesson-1"]');

      // Verify initial state is red
      await expect(link).toHaveClass(/qd-badge-red/);

      // Click "Mark Complete" button directly
      const completeButton = page.locator('.btn-complete');
      await completeButton.click();
      await page.waitForTimeout(200);

      // Verify badge changed to green
      await expect(link).toHaveClass(/qd-badge-green/);
      await expect(link).not.toHaveClass(/qd-badge-red/);
    });
  });

  test.describe('Empty Cache', () => {
    test('should show all red badges when cache is empty', async ({ page }) => {
      // Navigate to EmptyCache story
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-home-badges--empty-cache`);
      await page.waitForSelector('.quizPageBtn');
      await page.waitForTimeout(200);

      // Get all quiz page links
      const quizLinks = page.locator('.quizPageBtn');
      const linkCount = await quizLinks.count();

      // Verify all have red badges (unstarted)
      for (let i = 0; i < linkCount; i++) {
        const link = quizLinks.nth(i);
        await expect(link).toHaveClass(/qd-badge-red/);
      }

      // Verify no amber or green badges present
      const amberBadges = page.locator('.qd-badge-amber');
      const greenBadges = page.locator('.qd-badge-green');
      await expect(amberBadges).toHaveCount(0);
      await expect(greenBadges).toHaveCount(0);
    });

    test('should not apply badges to non-quiz links', async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=enhancers-home-badges--empty-cache`);
      await page.waitForSelector('.quizPageBtn');
      await page.waitForTimeout(200);

      // If there's a non-quiz link (className !== quizPageBtn), verify no badge
      const allLinks = page.locator('a');
      const linkCount = await allLinks.count();

      for (let i = 0; i < linkCount; i++) {
        const link = allLinks.nth(i);
        const hasQuizClass = await link.evaluate((el) => el.classList.contains('quizPageBtn'));

        if (!hasQuizClass) {
          // Verify no badge classes
          const hasRedBadge = await link.evaluate((el) => el.classList.contains('qd-badge-red'));
          const hasAmberBadge = await link.evaluate((el) =>
            el.classList.contains('qd-badge-amber'),
          );
          const hasGreenBadge = await link.evaluate((el) =>
            el.classList.contains('qd-badge-green'),
          );

          expect(hasRedBadge).toBe(false);
          expect(hasAmberBadge).toBe(false);
          expect(hasGreenBadge).toBe(false);
        }
      }
    });
  });
});
