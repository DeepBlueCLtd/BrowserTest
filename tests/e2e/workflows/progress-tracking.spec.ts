/**
 * E2E Tests for Progress Tracking (Home Page Badges)
 *
 * Tests the complete workflow of:
 * 1. Student answers quiz questions
 * 2. Progress is tracked in session cache
 * 3. Home page badges reflect quiz completion status
 */

import { test, expect } from '@playwright/test';

test.describe('Progress Tracking - Home Page Badges', () => {
  test.beforeEach(async () => {
    // Setup test environment with file:// protocol
    // For now, we'll use a localhost approach
    // In production, this would use file:// URLs
  });

  test('should display gray badges when no session exists', async ({ page }) => {
    // Navigate to home page
    await page.goto('/demo/home.html');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Check for test links with badges
    const links = page.locator('.qd-test-link');
    const count = await links.count();

    expect(count).toBeGreaterThan(0);

    // Verify all badges are gray (no session)
    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const badge = link.locator('.qd-badge');

      await expect(badge).toHaveClass(/qd-badge--gray/);
      await expect(badge).toHaveAttribute('aria-label', /status unknown/i);
    }
  });

  test('should display red badges for unstarted pages', async ({ page }) => {
    // Setup: Create a session with unstarted pages
    await page.goto('/demo/home.html');

    // Mock sessionStorage with unstarted pages
    await page.evaluate(() => {
      const cache = {
        totals: { answered: 0, correct: 0 },
        pages: {
          'page-1': { state: 'unstarted', answered: 0, correct: 0 },
          'page-2': { state: 'unstarted', answered: 0, correct: 0 },
        },
      };
      sessionStorage.setItem('qd/state', JSON.stringify(cache));
    });

    // Reload to apply cache
    await page.reload();

    // Verify badges are red
    const badges = page.locator('.qd-badge--red');
    await expect(badges.first()).toBeVisible();
  });

  test('should update badges from red to amber when quiz started', async ({ page }) => {
    // Start with unstarted pages
    await page.goto('/demo/home.html');

    await page.evaluate(() => {
      const cache = {
        totals: { answered: 0, correct: 0 },
        pages: {
          'quiz-page': { state: 'unstarted', answered: 0, correct: 0 },
        },
      };
      sessionStorage.setItem('qd/state', JSON.stringify(cache));
    });

    await page.reload();

    // Verify initial red badge
    const link = page.locator('.qd-test-link[href*="quiz-page"]');
    await expect(link.locator('.qd-badge')).toHaveClass(/qd-badge--red/);

    // Navigate to quiz page
    await page.goto('/demo/quiz-page.html');

    // Answer one question (incomplete)
    const select = page.locator('select.qd-input-container').first();
    await select.selectOption('1');

    // Wait for auto-save
    await page.waitForTimeout(200);

    // Navigate back to home page
    await page.goto('/demo/home.html');

    // Verify badge changed to amber
    await expect(link.locator('.qd-badge')).toHaveClass(/qd-badge--amber/);
    await expect(link.locator('.qd-badge')).toHaveAttribute('aria-label', /in progress/i);
  });

  test('should update badges from amber to green when quiz completed', async ({ page }) => {
    // Setup with incomplete page
    await page.goto('/demo/home.html');

    await page.evaluate(() => {
      const cache = {
        totals: { answered: 2, correct: 1 },
        pages: {
          'quiz-page': { state: 'incomplete', answered: 2, correct: 1 },
        },
      };
      sessionStorage.setItem('qd/state', JSON.stringify(cache));
    });

    await page.reload();

    // Verify initial amber badge
    const link = page.locator('.qd-test-link[href*="quiz-page"]');
    await expect(link.locator('.qd-badge')).toHaveClass(/qd-badge--amber/);

    // Navigate to quiz page
    await page.goto('/demo/quiz-page.html');

    // Complete all questions correctly
    const selects = page.locator('select.qd-input-container');
    const count = await selects.count();

    for (let i = 0; i < count; i++) {
      // Select correct answers (assuming option 1 is correct for demo)
      await selects.nth(i).selectOption('1');
      await page.waitForTimeout(200);
    }

    // Navigate back to home page
    await page.goto('/demo/home.html');

    // Verify badge changed to green
    await expect(link.locator('.qd-badge')).toHaveClass(/qd-badge--green/);
    await expect(link.locator('.qd-badge')).toHaveAttribute('aria-label', /complete/i);
  });

  test('should show mixed badge states for multiple pages', async ({ page }) => {
    await page.goto('/demo/home.html');

    // Setup mixed progress
    await page.evaluate(() => {
      const cache = {
        totals: { answered: 10, correct: 8 },
        pages: {
          'page-1': { state: 'complete', answered: 5, correct: 5 },
          'page-2': { state: 'incomplete', answered: 3, correct: 2 },
          'page-3': { state: 'unstarted', answered: 0, correct: 0 },
          'page-4': { state: 'incomplete', answered: 2, correct: 1 },
        },
      };
      sessionStorage.setItem('qd/state', JSON.stringify(cache));
    });

    await page.reload();

    // Verify each page has correct badge color
    await expect(page.locator('.qd-test-link[href*="page-1"] .qd-badge')).toHaveClass(
      /qd-badge--green/,
    );
    await expect(page.locator('.qd-test-link[href*="page-2"] .qd-badge')).toHaveClass(
      /qd-badge--amber/,
    );
    await expect(page.locator('.qd-test-link[href*="page-3"] .qd-badge')).toHaveClass(
      /qd-badge--red/,
    );
    await expect(page.locator('.qd-test-link[href*="page-4"] .qd-badge')).toHaveClass(
      /qd-badge--amber/,
    );
  });

  test('should update badges in real-time when state changes', async ({ page }) => {
    await page.goto('/demo/home.html');

    // Setup initial state
    await page.evaluate(() => {
      const cache = {
        totals: { answered: 0, correct: 0 },
        pages: {
          'test-page': { state: 'unstarted', answered: 0, correct: 0 },
        },
      };
      sessionStorage.setItem('qd/state', JSON.stringify(cache));
    });

    await page.reload();

    const link = page.locator('.qd-test-link[href*="test-page"]');

    // Verify initial state (red)
    await expect(link.locator('.qd-badge')).toHaveClass(/qd-badge--red/);

    // Simulate state change event
    await page.evaluate(() => {
      const cache = {
        totals: { answered: 1, correct: 0 },
        pages: {
          'test-page': { state: 'incomplete', answered: 1, correct: 0 },
        },
      };
      sessionStorage.setItem('qd/state', JSON.stringify(cache));

      // Dispatch state-changed event
      document.dispatchEvent(
        new CustomEvent('qd:state-changed', {
          detail: { pageId: 'test-page', state: 'incomplete' },
        }),
      );
    });

    // Wait for badge update
    await page.waitForTimeout(100);

    // Verify badge changed to amber
    await expect(link.locator('.qd-badge')).toHaveClass(/qd-badge--amber/);
  });

  test('should persist badge states across page reloads', async ({ page }) => {
    await page.goto('/demo/home.html');

    // Setup progress
    await page.evaluate(() => {
      const cache = {
        totals: { answered: 5, correct: 5 },
        pages: {
          'page-1': { state: 'complete', answered: 5, correct: 5 },
        },
      };
      sessionStorage.setItem('qd/state', JSON.stringify(cache));
    });

    await page.reload();

    // Verify badge is green
    const badge = page.locator('.qd-test-link[href*="page-1"] .qd-badge');
    await expect(badge).toHaveClass(/qd-badge--green/);

    // Reload page again
    await page.reload();

    // Verify badge is still green
    await expect(badge).toHaveClass(/qd-badge--green/);
  });

  test('should clear badges on logout', async ({ page }) => {
    await page.goto('/demo/home.html');

    // Setup session and cache
    await page.evaluate(() => {
      const session = {
        serviceId: 'TEST001',
        name: 'Test Student',
        release: '01-2025',
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        instructorUnlocked: false,
      };

      const cache = {
        totals: { answered: 5, correct: 5 },
        pages: {
          'page-1': { state: 'complete', answered: 5, correct: 5 },
        },
      };

      sessionStorage.setItem('qd/session', JSON.stringify(session));
      sessionStorage.setItem('qd/state', JSON.stringify(cache));
    });

    await page.reload();

    // Verify badge is visible
    await expect(page.locator('.qd-badge--green').first()).toBeVisible();

    // Trigger logout
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('qd:logout', { detail: {} }));
    });

    // Wait for event processing
    await page.waitForTimeout(100);

    // Verify badges changed to gray (no session)
    await expect(page.locator('.qd-badge--gray').first()).toBeVisible();
  });

  test('should handle missing page IDs gracefully', async ({ page }) => {
    await page.goto('/demo/home.html');

    // Setup cache with only some pages
    await page.evaluate(() => {
      const cache = {
        totals: { answered: 5, correct: 5 },
        pages: {
          'page-1': { state: 'complete', answered: 5, correct: 5 },
          // page-2 and page-3 not in cache
        },
      };
      sessionStorage.setItem('qd/state', JSON.stringify(cache));
    });

    await page.reload();

    // Verify page-1 has green badge
    await expect(page.locator('.qd-test-link[href*="page-1"] .qd-badge')).toHaveClass(
      /qd-badge--green/,
    );

    // Verify pages not in cache have gray badges
    await expect(page.locator('.qd-test-link[href*="page-2"] .qd-badge')).toHaveClass(
      /qd-badge--gray/,
    );
  });

  test('should have accessible ARIA labels', async ({ page }) => {
    await page.goto('/demo/home.html');

    await page.evaluate(() => {
      const cache = {
        totals: { answered: 10, correct: 8 },
        pages: {
          'page-1': { state: 'complete', answered: 5, correct: 5 },
          'page-2': { state: 'incomplete', answered: 3, correct: 2 },
          'page-3': { state: 'unstarted', answered: 0, correct: 0 },
        },
      };
      sessionStorage.setItem('qd/state', JSON.stringify(cache));
    });

    await page.reload();

    // Check ARIA labels for each state
    const greenBadge = page.locator('.qd-badge--green').first();
    await expect(greenBadge).toHaveAttribute('aria-label', /complete/i);
    await expect(greenBadge).toHaveAttribute('role', 'status');

    const amberBadge = page.locator('.qd-badge--amber').first();
    await expect(amberBadge).toHaveAttribute('aria-label', /in progress/i);
    await expect(amberBadge).toHaveAttribute('role', 'status');

    const redBadge = page.locator('.qd-badge--red').first();
    await expect(redBadge).toHaveAttribute('aria-label', /not started/i);
    await expect(redBadge).toHaveAttribute('role', 'status');
  });
});
