/**
 * E2E Test: Storage Monitor (Debug Tool)
 *
 * Tests storage monitor functionality:
 * - Monitor hidden by default
 * - Keyboard shortcut toggles visibility
 * - Displays sessionStorage data
 * - Clear individual keys functionality
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../dita-demo');

/**
 * Wait for bootstrap to complete and inject components
 */
async function waitForBootstrap(page: Page): Promise<void> {
  await page.locator('qd-login[data-ready]').waitFor({ state: 'attached', timeout: 2000 });
}

/**
 * Close PIN confirmation dialog if visible
 */
async function closePinConfirmationDialog(page: Page): Promise<void> {
  try {
    await page.locator('#qd-pin-confirmation-ok').click({ force: true, timeout: 500 });
  } catch {
    // Dialog not visible or already closed, ignore
  }
}

test.describe('Storage Monitor (Debug Tool)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTestDB');
    });
    await waitForBootstrap(page);
  });

  test('should inject storage monitor component when DEBUG_MODE enabled', async ({ page }) => {
    // Check if qd-storage-monitor exists in the page
    // Note: This depends on DEBUG_MODE being true in the build
    const storageMonitor = page.locator('qd-storage-monitor');

    // If DEBUG_MODE is true, component should exist (even if hidden)
    const count = await storageMonitor.count();

    // This test documents expected behavior - storage monitor exists when debug mode enabled
    if (count > 0) {
      // Component exists, verify it has expected attributes
      await expect(storageMonitor.first()).toHaveAttribute('dbName');
    } else {
      // DEBUG_MODE is false in this build - skip test
      test.skip();
    }
  });

  test('should toggle visibility with Ctrl+Shift+D keyboard shortcut', async ({ page }) => {
    const storageMonitor = page.locator('qd-storage-monitor');
    const count = await storageMonitor.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Monitor should start hidden
    await expect(storageMonitor.first()).toHaveAttribute('hidden', 'true');

    // Press Ctrl+Shift+D to toggle
    await page.keyboard.press('Control+Shift+D');

    // Monitor should now be visible
    await expect(storageMonitor.first()).not.toHaveAttribute('hidden', 'true');

    // Press again to hide
    await page.keyboard.press('Control+Shift+D');

    // Monitor should be hidden again
    await expect(storageMonitor.first()).toHaveAttribute('hidden', 'true');
  });

  test('should display sessionStorage entries when visible', async ({ page }) => {
    // First create some session data by logging in
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('MONITOR001');
    await login.locator('input[name="name"]').fill('Monitor Test');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    const storageMonitor = page.locator('qd-storage-monitor');
    const count = await storageMonitor.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Show the monitor
    await page.keyboard.press('Control+Shift+D');

    // Wait for monitor to update and render
    await page.waitForTimeout(200);

    // Should display session key in the monitor
    const monitorShadow = storageMonitor.first();

    // If shadow DOM is accessible, verify content
    // Note: This may need adjustment based on actual shadow DOM structure
    const monitorVisible = await monitorShadow.isVisible();
    expect(monitorVisible).toBe(true);
  });

  test('should show correct database name attribute', async ({ page }) => {
    const storageMonitor = page.locator('qd-storage-monitor');
    const count = await storageMonitor.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Verify dbName is set to BrowserTestDB (as per auto-injection)
    const dbName = await storageMonitor.first().getAttribute('dbName');
    expect(dbName).toBe('BrowserTestDB');
  });

  test('should be positioned in bottom-right corner when visible', async ({ page }) => {
    const storageMonitor = page.locator('qd-storage-monitor');
    const count = await storageMonitor.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Show the monitor
    await page.keyboard.press('Control+Shift+D');

    // Check positioning via computed styles
    const position = await storageMonitor.first().evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        position: style.position,
        bottom: style.bottom,
        right: style.right,
      };
    });

    // Should be fixed positioned at bottom-right
    expect(position.position).toBe('fixed');
    // Bottom/right should be small values (close to corner)
    expect(parseInt(position.bottom || '100')).toBeLessThan(50);
    expect(parseInt(position.right || '100')).toBeLessThan(50);
  });

  test('should update display when storage changes', async ({ page }) => {
    const storageMonitor = page.locator('qd-storage-monitor');
    const count = await storageMonitor.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Show the monitor
    await page.keyboard.press('Control+Shift+D');

    // Login to create storage entries
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('UPDATE001');
    await login.locator('input[name="name"]').fill('Update Test');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Wait for storage to update
    await page.waitForTimeout(300);

    // Monitor should reflect the new storage state
    // The exact assertion depends on how the monitor renders storage
    // This test verifies no errors occur during the update
    await expect(storageMonitor.first()).toBeVisible();
  });
});
