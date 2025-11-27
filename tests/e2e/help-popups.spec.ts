/**
 * E2E tests for Help Popups
 *
 * Tests the help popup functionality on login, status, and instructor panels.
 * Feature: 008-user-guidance-popups
 */

import { test, expect } from '@playwright/test';

test.describe('Help Popups', () => {
  test.describe('Login Panel Help', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a Storybook story that shows login with help
      await page.goto('http://localhost:6006/iframe.html?id=components-login--default');
      // Wait for component to be ready
      await page.waitForSelector('qd-login[data-ready]', { timeout: 5000 });
    });

    test('displays help trigger button on login panel', async ({ page }) => {
      const helpTrigger = page.locator('qd-login qd-help-trigger');
      await expect(helpTrigger).toBeVisible();
    });

    test('opens help popup when help trigger is clicked', async ({ page }) => {
      const helpTrigger = page.locator('qd-login qd-help-trigger button');
      await helpTrigger.click();

      // Help popup portal renders to body
      const popup = page.locator('.qd-help-backdrop');
      await expect(popup).toBeVisible();
    });

    test('displays login help content in popup', async ({ page }) => {
      const helpTrigger = page.locator('qd-login qd-help-trigger button');
      await helpTrigger.click();

      const title = page.locator('.qd-help-title');
      await expect(title).toBeVisible();

      const body = page.locator('.qd-help-body');
      await expect(body).toContainText('BrowserTest');
    });

    test('closes popup on Escape key', async ({ page }) => {
      const helpTrigger = page.locator('qd-login qd-help-trigger button');
      await helpTrigger.click();

      await expect(page.locator('.qd-help-backdrop')).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.locator('.qd-help-backdrop')).not.toBeVisible();
    });

    test('closes popup on backdrop click', async ({ page }) => {
      const helpTrigger = page.locator('qd-login qd-help-trigger button');
      await helpTrigger.click();

      await expect(page.locator('.qd-help-backdrop')).toBeVisible();

      // Click backdrop (not the content)
      await page.locator('.qd-help-backdrop').click({ position: { x: 10, y: 10 } });

      await expect(page.locator('.qd-help-backdrop')).not.toBeVisible();
    });

    test('closes popup on close button click', async ({ page }) => {
      const helpTrigger = page.locator('qd-login qd-help-trigger button');
      await helpTrigger.click();

      await expect(page.locator('.qd-help-backdrop')).toBeVisible();

      await page.locator('.qd-help-close').click();

      await expect(page.locator('.qd-help-backdrop')).not.toBeVisible();
    });
  });

  test.describe('Status Panel Help', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a Storybook story that shows status with help
      await page.goto('http://localhost:6006/iframe.html?id=components-status--with-help');
      // Wait for component to be ready
      await page.waitForSelector('qd-status[data-show]', { timeout: 5000 });
    });

    test('displays help trigger button on status panel', async ({ page }) => {
      const helpTrigger = page.locator('qd-status qd-help-trigger');
      await expect(helpTrigger).toBeVisible();
    });

    test('opens help popup when help trigger is clicked', async ({ page }) => {
      const helpTrigger = page.locator('qd-status qd-help-trigger button');
      await helpTrigger.click();

      // Help popup portal renders to body
      const popup = page.locator('.qd-help-backdrop');
      await expect(popup).toBeVisible();
    });

    test('displays status help content in popup', async ({ page }) => {
      const helpTrigger = page.locator('qd-status qd-help-trigger button');
      await helpTrigger.click();

      const title = page.locator('.qd-help-title');
      await expect(title).toBeVisible();

      const body = page.locator('.qd-help-body');
      await expect(body).toContainText('Score');
    });

    test('closes popup on Escape key', async ({ page }) => {
      const helpTrigger = page.locator('qd-status qd-help-trigger button');
      await helpTrigger.click();

      await expect(page.locator('.qd-help-backdrop')).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.locator('.qd-help-backdrop')).not.toBeVisible();
    });

    test('closes popup on close button click', async ({ page }) => {
      const helpTrigger = page.locator('qd-status qd-help-trigger button');
      await helpTrigger.click();

      await expect(page.locator('.qd-help-backdrop')).toBeVisible();

      await page.locator('.qd-help-close').click();

      await expect(page.locator('.qd-help-backdrop')).not.toBeVisible();
    });
  });

  test.describe('Instructor Panel Help', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a Storybook story that shows instructor with help
      await page.goto('http://localhost:6006/iframe.html?id=components-qdinstructor--with-help');
      // Wait for component to be ready and unlocked
      await page.waitForSelector('qd-instructor[data-show]', { timeout: 5000 });
    });

    test('displays help trigger button on instructor panel', async ({ page }) => {
      const helpTrigger = page.locator('qd-instructor qd-help-trigger');
      await expect(helpTrigger).toBeVisible();
    });

    test('opens help popup when help trigger is clicked', async ({ page }) => {
      const helpTrigger = page.locator('qd-instructor qd-help-trigger button');
      await helpTrigger.click();

      // Help popup portal renders to body
      const popup = page.locator('.qd-help-backdrop');
      await expect(popup).toBeVisible();
    });

    test('displays instructor help content in popup', async ({ page }) => {
      const helpTrigger = page.locator('qd-instructor qd-help-trigger button');
      await helpTrigger.click();

      const title = page.locator('.qd-help-title');
      await expect(title).toBeVisible();

      const body = page.locator('.qd-help-body');
      await expect(body).toContainText('Instructor');
    });

    test('closes popup on Escape key', async ({ page }) => {
      const helpTrigger = page.locator('qd-instructor qd-help-trigger button');
      await helpTrigger.click();

      await expect(page.locator('.qd-help-backdrop')).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.locator('.qd-help-backdrop')).not.toBeVisible();
    });

    test('closes popup on close button click', async ({ page }) => {
      const helpTrigger = page.locator('qd-instructor qd-help-trigger button');
      await helpTrigger.click();

      await expect(page.locator('.qd-help-backdrop')).toBeVisible();

      await page.locator('.qd-help-close').click();

      await expect(page.locator('.qd-help-backdrop')).not.toBeVisible();
    });
  });
});
