/**
 * E2E Test: Build Info Display
 *
 * Tests build info component functionality:
 * - Info icon visible in status panel
 * - Tooltip appears on hover/focus
 * - Displays app name and build date
 * - Accessible via keyboard
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { submitStudentLogin } from '../helpers.js';

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
  // Wait for any modal animation
  await page.waitForTimeout(200);

  // Force close any open modal by removing its open attribute
  await page.evaluate(() => {
    const modals = document.querySelectorAll('qd-modal[open], qd-confirm-dialog[open]');
    modals.forEach((modal) => {
      modal.removeAttribute('open');
    });
  });

  // Wait for modal to close
  await page.waitForTimeout(100);
}

/**
 * Login as student to show status panel
 */
async function loginAsStudent(page: Page): Promise<void> {
  const login = page.locator('qd-login');
  await login.locator('input[name="serviceId"]').fill('BUILD001');
  await login.locator('input[name="name"]').fill('Build Test');
  await login.locator('input[name="pin"]').fill('1234');
  await submitStudentLogin(login);
  await closePinConfirmationDialog(page);
  await expect(page.locator('qd-status')).toBeVisible();
}

test.describe('Build Info Display', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTestDB');
    });
    await waitForBootstrap(page);
  });

  test('should display build info icon in status panel', async ({ page }) => {
    await loginAsStudent(page);

    // qd-build-info is included in qd-status component
    const buildInfo = page.locator('qd-status qd-build-info');
    await expect(buildInfo).toBeAttached();
  });

  test('should show info icon with "i" character', async ({ page }) => {
    await loginAsStudent(page);

    // The info icon contains "i" text
    const buildInfo = page.locator('qd-status qd-build-info');
    const iconText = await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return '';
      const icon = shadow.querySelector('.info-icon');
      return icon?.textContent?.trim() || '';
    });

    expect(iconText).toBe('i');
  });

  test('should show tooltip on hover', async ({ page }) => {
    await loginAsStudent(page);

    const buildInfo = page.locator('qd-status qd-build-info');

    // Get initial tooltip visibility
    const initialVisible = await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return false;
      const tooltip = shadow.querySelector('.tooltip');
      if (!tooltip) return false;
      const style = window.getComputedStyle(tooltip);
      return style.visibility === 'visible' && style.opacity !== '0';
    });
    expect(initialVisible).toBe(false);

    // Focus the info icon to trigger tooltip (more reliable than hover for shadow DOM)
    await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return;
      const icon = shadow.querySelector('.info-icon') as HTMLElement;
      if (icon) icon.focus();
    });

    // Wait for tooltip transition
    await page.waitForTimeout(300);

    // Check tooltip is now visible
    const afterFocusVisible = await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return false;
      const tooltip = shadow.querySelector('.tooltip');
      if (!tooltip) return false;
      const style = window.getComputedStyle(tooltip);
      return style.visibility === 'visible' && parseFloat(style.opacity) > 0.9;
    });
    expect(afterFocusVisible).toBe(true);
  });

  test('should display app name in tooltip', async ({ page }) => {
    await loginAsStudent(page);

    const buildInfo = page.locator('qd-status qd-build-info');

    // Get tooltip content
    const tooltipContent = await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return '';
      const tooltip = shadow.querySelector('.tooltip');
      return tooltip?.textContent || '';
    });

    // Should contain "BrowserTest" and "Deep Blue C Ltd"
    expect(tooltipContent).toContain('BrowserTest');
    expect(tooltipContent).toContain('Deep Blue C Ltd');
  });

  test('should display build date in tooltip', async ({ page }) => {
    await loginAsStudent(page);

    const buildInfo = page.locator('qd-status qd-build-info');

    // Get tooltip content
    const tooltipContent = await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return '';
      const tooltip = shadow.querySelector('.tooltip');
      return tooltip?.textContent || '';
    });

    // Should contain "Built" text (followed by date or "Development")
    expect(tooltipContent).toContain('Built');
  });

  test('should be keyboard accessible with tabindex', async ({ page }) => {
    await loginAsStudent(page);

    const buildInfo = page.locator('qd-status qd-build-info');

    // Check info icon has tabindex for keyboard access
    const tabindex = await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return null;
      const icon = shadow.querySelector('.info-icon');
      return icon?.getAttribute('tabindex');
    });

    expect(tabindex).toBe('0');
  });

  test('should have accessible role and label', async ({ page }) => {
    await loginAsStudent(page);

    const buildInfo = page.locator('qd-status qd-build-info');

    // Check accessibility attributes
    const a11y = await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return { role: null, label: null };
      const icon = shadow.querySelector('.info-icon');
      return {
        role: icon?.getAttribute('role'),
        label: icon?.getAttribute('aria-label'),
      };
    });

    expect(a11y.role).toBe('button');
    expect(a11y.label).toBe('Build information');
  });

  test('should show tooltip on focus (keyboard navigation)', async ({ page }) => {
    await loginAsStudent(page);

    const buildInfo = page.locator('qd-status qd-build-info');

    // Focus the icon via evaluate
    await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return;
      const icon = shadow.querySelector('.info-icon') as HTMLElement;
      if (icon) icon.focus();
    });

    // Wait for tooltip transition
    await page.waitForTimeout(300);

    // Check tooltip is visible on focus
    const isVisible = await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return false;
      const tooltip = shadow.querySelector('.tooltip');
      if (!tooltip) return false;
      const style = window.getComputedStyle(tooltip);
      return style.visibility === 'visible' && style.opacity === '1';
    });
    expect(isVisible).toBe(true);
  });

  test('should hide tooltip when focus moves away', async ({ page }) => {
    await loginAsStudent(page);

    const buildInfo = page.locator('qd-status qd-build-info');

    // Focus the icon via evaluate
    await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return;
      const icon = shadow.querySelector('.info-icon') as HTMLElement;
      if (icon) icon.focus();
    });
    await page.waitForTimeout(300);

    // Move focus away by blurring the element
    await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return;
      const icon = shadow.querySelector('.info-icon') as HTMLElement;
      if (icon) icon.blur();
    });
    await page.waitForTimeout(300);

    // Check tooltip is hidden
    const isVisible = await buildInfo.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return false;
      const tooltip = shadow.querySelector('.tooltip');
      if (!tooltip) return false;
      const style = window.getComputedStyle(tooltip);
      return style.visibility === 'visible' && style.opacity === '1';
    });
    expect(isVisible).toBe(false);
  });
});
