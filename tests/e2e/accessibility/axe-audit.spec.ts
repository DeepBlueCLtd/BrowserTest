/**
 * E2E Accessibility Audit with axe-core
 *
 * Tests accessibility compliance against WCAG 2.1 Level AA standards.
 *
 * Requirements:
 * - WCAG 2.1 Level AA compliance
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Color contrast
 * - ARIA attributes
 *
 * Note: Install @axe-core/playwright:
 * npm install --save-dev @axe-core/playwright
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
 

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { promises as fs } from 'fs';
import path from 'path';

const TEST_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="release" content="02-2025">
  <meta name="document-id" content="a11y-test">
  <title>Accessibility Test</title>
</head>
<body>
  <h1>Accessibility Test Page</h1>

  <qd-login release="02-2025" docId="a11y-test" title="Accessibility Test"></qd-login>

  <table class="qd-quiz qd-page" data-page-id="a11y-page">
    <thead>
      <tr>
        <th>Question</th>
        <th>Answer</th>
        <th>Detail</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>What is 2 + 2?</td>
        <td>4</td>
        <td>0.1</td>
      </tr>
      <tr>
        <td>Select the correct option:</td>
        <td>1</td>
        <td>
          <ol>
            <li>Option A</li>
            <li>Option B</li>
            <li>Option C</li>
          </ol>
        </td>
      </tr>
    </tbody>
  </table>

  <script src="../dist/sonar-quiz.iife.js" data-sonar-quiz data-debug="true"></script>
</body>
</html>
`;

test.describe('Accessibility Audit - Page Structure', () => {
  let testFile: string;

  test.beforeEach(async () => {
    // Create test HTML file
    const testDir = path.join(process.cwd(), 'test-fixtures');
    await fs.mkdir(testDir, { recursive: true });
    testFile = path.join(testDir, 'a11y-test.html');
    await fs.writeFile(testFile, TEST_HTML);
  });

  test.afterEach(async () => {
    // Clean up
    try {
      await fs.unlink(testFile);
    } catch {
      // Ignore
    }
  });

  test('should have no accessibility violations on initial page load', async ({ page }) => {
    await page.goto(`file://${testFile}`);

    // Wait for components to load
    await page.waitForSelector('qd-login');
    await page.waitForSelector('table.qd-quiz');

    // Run axe accessibility audit
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accessibilityScanResults.violations.forEach((violation: any) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Help: ${violation.helpUrl}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        violation.nodes.forEach((node: any) => {
          console.log(`  Element: ${node.html}`);
        });
      });
    }

    // Expect zero violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no violations after login', async ({ page }) => {
    await page.goto(`file://${testFile}`);

    // Wait for components
    await page.waitForSelector('qd-login');

    // Login
    await page.evaluate(() => {
      const login = document.querySelector('qd-login');
      if (login?.shadowRoot) {
        const serviceIdInput = login.shadowRoot.querySelector('#serviceId') as HTMLInputElement;
        const nameInput = login.shadowRoot.querySelector('#name') as HTMLInputElement;
        const submitButton = login.shadowRoot.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;

        if (serviceIdInput) serviceIdInput.value = 'A11Y001';
        if (nameInput) nameInput.value = 'Accessibility Test';
        if (submitButton) submitButton.click();
      }
    });

    // Wait for quiz to be active
    await page.waitForTimeout(500);

    // Run axe audit after login
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Accessibility - Keyboard Navigation', () => {
  let testFile: string;

  test.beforeEach(async () => {
    const testDir = path.join(process.cwd(), 'test-fixtures');
    await fs.mkdir(testDir, { recursive: true });
    testFile = path.join(testDir, 'a11y-keyboard.html');
    await fs.writeFile(testFile, TEST_HTML);
  });

  test.afterEach(async () => {
    try {
      await fs.unlink(testFile);
    } catch {
      // Ignore
    }
  });

  test('should allow keyboard navigation through login form', async ({ page }) => {
    await page.goto(`file://${testFile}`);

    await page.waitForSelector('qd-login');

    // Focus on service ID input using Tab
    await page.keyboard.press('Tab');

    // Check if service ID input is focused
    const serviceIdFocused = await page.evaluate(() => {
      const login = document.querySelector('qd-login');
      if (!login?.shadowRoot) return false;
      const activeElement = login.shadowRoot.activeElement;
      return activeElement?.id === 'serviceId';
    });

    expect(serviceIdFocused).toBe(true);

    // Tab to name input
    await page.keyboard.press('Tab');

    const nameFocused = await page.evaluate(() => {
      const login = document.querySelector('qd-login');
      if (!login?.shadowRoot) return false;
      const activeElement = login.shadowRoot.activeElement;
      return activeElement?.id === 'name';
    });

    expect(nameFocused).toBe(true);

    // Tab to submit button
    await page.keyboard.press('Tab');

    const buttonFocused = await page.evaluate(() => {
      const login = document.querySelector('qd-login');
      if (!login?.shadowRoot) return false;
      const activeElement = login.shadowRoot.activeElement;
      return activeElement?.tagName === 'BUTTON';
    });

    expect(buttonFocused).toBe(true);
  });

  test('should allow keyboard navigation through quiz inputs', async ({ page }) => {
    await page.goto(`file://${testFile}`);

    // Login first
    await page.waitForSelector('qd-login');
    await page.evaluate(() => {
      const login = document.querySelector('qd-login');
      if (login?.shadowRoot) {
        const serviceIdInput = login.shadowRoot.querySelector('#serviceId') as HTMLInputElement;
        const nameInput = login.shadowRoot.querySelector('#name') as HTMLInputElement;
        const submitButton = login.shadowRoot.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;

        if (serviceIdInput) serviceIdInput.value = 'KEY001';
        if (nameInput) nameInput.value = 'Keyboard Test';
        if (submitButton) submitButton.click();
      }
    });

    await page.waitForTimeout(500);

    // Focus on first quiz input
    await page.keyboard.press('Tab');

    // Check if input is focused
    const inputFocused = await page.evaluate(() => {
      return (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT'
      );
    });

    expect(inputFocused).toBe(true);
  });
});

test.describe('Accessibility - ARIA Attributes', () => {
  let testFile: string;

  test.beforeEach(async () => {
    const testDir = path.join(process.cwd(), 'test-fixtures');
    await fs.mkdir(testDir, { recursive: true });
    testFile = path.join(testDir, 'a11y-aria.html');
    await fs.writeFile(testFile, TEST_HTML);
  });

  test.afterEach(async () => {
    try {
      await fs.unlink(testFile);
    } catch {
      // Ignore
    }
  });

  test('should have proper ARIA labels on form inputs', async ({ page }) => {
    await page.goto(`file://${testFile}`);

    await page.waitForSelector('qd-login');

    // Check for ARIA labels or labels
    const hasLabels = await page.evaluate(() => {
      const login = document.querySelector('qd-login');
      if (!login?.shadowRoot) return false;

      const serviceIdInput = login.shadowRoot.querySelector('#serviceId');
      const nameInput = login.shadowRoot.querySelector('#name');

      // Check if inputs have labels or aria-label
      const serviceIdHasLabel =
        !!login.shadowRoot.querySelector('label[for="serviceId"]') ||
        !!serviceIdInput?.getAttribute('aria-label');
      const nameHasLabel =
        !!login.shadowRoot.querySelector('label[for="name"]') ||
        !!nameInput?.getAttribute('aria-label');

      return serviceIdHasLabel && nameHasLabel;
    });

    expect(hasLabels).toBe(true);
  });

  test('should have proper role attributes on interactive elements', async ({ page }) => {
    await page.goto(`file://${testFile}`);

    await page.waitForSelector('table.qd-quiz');

    // Check that tables have proper roles
    const tableRoles = await page.evaluate(() => {
      const table = document.querySelector('table.qd-quiz');
      return {
        hasTableRole: table?.getAttribute('role') === 'table' || table?.tagName === 'TABLE',
        hasHeaders: !!table?.querySelector('thead'),
      };
    });

    expect(tableRoles.hasTableRole).toBe(true);
    expect(tableRoles.hasHeaders).toBe(true);
  });
});

test.describe('Accessibility - Color Contrast', () => {
  let testFile: string;

  test.beforeEach(async () => {
    const testDir = path.join(process.cwd(), 'test-fixtures');
    await fs.mkdir(testDir, { recursive: true });
    testFile = path.join(testDir, 'a11y-contrast.html');
    await fs.writeFile(testFile, TEST_HTML);
  });

  test.afterEach(async () => {
    try {
      await fs.unlink(testFile);
    } catch {
      // Ignore
    }
  });

  test('should have sufficient color contrast ratios', async ({ page }) => {
    await page.goto(`file://${testFile}`);

    await page.waitForSelector('qd-login');

    // Run axe audit specifically for color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('qd-login')
      .analyze();

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (v: any) => v.id === 'color-contrast',
    );

    if (contrastViolations.length > 0) {
      console.log('Color contrast violations:');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contrastViolations.forEach((violation: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        violation.nodes.forEach((node: any) => {
          console.log(`  ${node.html}`);
          console.log(`  ${node.failureSummary}`);
        });
      });
    }

    expect(contrastViolations).toEqual([]);
  });
});

test.describe('Accessibility - Screen Reader Support', () => {
  let testFile: string;

  test.beforeEach(async () => {
    const testDir = path.join(process.cwd(), 'test-fixtures');
    await fs.mkdir(testDir, { recursive: true });
    testFile = path.join(testDir, 'a11y-sr.html');
    await fs.writeFile(testFile, TEST_HTML);
  });

  test.afterEach(async () => {
    try {
      await fs.unlink(testFile);
    } catch {
      // Ignore
    }
  });

  test('should have proper document structure for screen readers', async ({ page }) => {
    await page.goto(`file://${testFile}`);

    await page.waitForSelector('table.qd-quiz');

    // Check for proper heading structure
    const headings = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return {
        hasH1: !!h1,
        h1Text: h1?.textContent?.trim(),
      };
    });

    expect(headings.hasH1).toBe(true);
    expect(headings.h1Text).toBeTruthy();

    // Check for lang attribute
    const hasLang = await page.evaluate(() => {
      return !!document.documentElement.getAttribute('lang');
    });

    expect(hasLang).toBe(true);

    // Check for proper table structure
    const tableStructure = await page.evaluate(() => {
      const table = document.querySelector('table.qd-quiz');
      return {
        hasCaption: !!table?.querySelector('caption'),
        hasHeaders: !!table?.querySelector('thead'),
        hasTH: !!table?.querySelector('th'),
      };
    });

    // Tables should have headers
    expect(tableStructure.hasHeaders).toBe(true);
    expect(tableStructure.hasTH).toBe(true);
  });
});
