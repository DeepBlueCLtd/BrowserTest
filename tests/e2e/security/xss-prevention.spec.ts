/**
 * E2E Security Tests - XSS Prevention
 *
 * Tests XSS (Cross-Site Scripting) prevention mechanisms across the application.
 * Verifies that user-controlled data is properly escaped and never executed as code.
 *
 * Security Requirements:
 * - No innerHTML usage with user data
 * - All DOM manipulation via createElement() + textContent
 * - CSP headers prevent inline scripts
 * - Event handlers properly sanitized
 */

import { test, expect, type Page } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Create test HTML with XSS payload in quiz content
 */
function createXSSTestHTML(xssPayload: string, location: 'question' | 'option' | 'detail'): string {
  const questionText = location === 'question' ? xssPayload : 'Safe question text';
  const optionText = location === 'option' ? xssPayload : 'Safe option';
  const detailText = location === 'detail' ? xssPayload : '0.1';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="release" content="02-2025">
  <meta name="document-id" content="xss-test">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self';
                 script-src 'self';
                 style-src 'self' 'unsafe-inline';
                 img-src 'self' data:;
                 connect-src 'none';
                 object-src 'none';">
  <title>XSS Prevention Test</title>
</head>
<body>
  <h1>Security Test Page</h1>

  <table class="qd-quiz qd-page" data-page-id="xss-test">
    <thead>
      <tr>
        <th>Question</th>
        <th>Answer</th>
        <th>Detail</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${questionText}</td>
        <td>4</td>
        <td>${detailText}</td>
      </tr>
      <tr>
        <td>Select option:</td>
        <td>1</td>
        <td><ol><li>${optionText}</li><li>Option B</li></ol></td>
      </tr>
    </tbody>
  </table>

  <script src="../dist/sonar-quiz.iife.js" data-sonar-quiz data-debug="true"></script>
</body>
</html>
`;
}

/**
 * Helper to check if XSS payload was executed
 */
async function checkXSSNotExecuted(page: Page): Promise<boolean> {
  // Check if our XSS marker variable exists (it shouldn't)
  const xssExecuted = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    return !!(window as any).XSS_EXECUTED;
  });

  return !xssExecuted; // Return true if XSS was NOT executed (safe)
}

/**
 * Helper to verify text is properly escaped (not rendered as HTML)
 */
async function checkTextProperlyEscaped(page: Page, text: string): Promise<boolean> {
  // The malicious text should appear as plain text, not as HTML elements
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  const bodyText = await page.evaluate(() => document.body.textContent || '');

  // Text should be present in textContent
  const textPresent = bodyText.includes(text.replace(/<[^>]*>/g, ''));

  // If text contains <script>, it should NOT be in innerHTML as an actual script tag
  if (text.includes('<script>')) {
    const hasActualScriptTag = bodyHTML.includes('<script>window.XSS_EXECUTED');
    return textPresent && !hasActualScriptTag;
  }

  return textPresent;
}

test.describe('XSS Prevention - Quiz Table', () => {
  const xssPayloads = [
    {
      name: 'Script tag injection',
      payload: '<script>window.XSS_EXECUTED = true;</script>',
    },
    {
      name: 'Event handler injection',
      payload: '<img src=x onerror="window.XSS_EXECUTED=true">',
    },
    {
      name: 'JavaScript URL',
      payload: '<a href="javascript:window.XSS_EXECUTED=true">Click</a>',
    },
    {
      name: 'SVG with script',
      payload: '<svg><script>window.XSS_EXECUTED=true</script></svg>',
    },
    {
      name: 'Data URI script',
      payload: '<iframe src="data:text/html,<script>top.XSS_EXECUTED=true</script>"></iframe>',
    },
  ];

  for (const { name, payload } of xssPayloads) {
    test(`should prevent XSS in quiz questions: ${name}`, async ({ page }) => {
      // Create test HTML file with XSS payload in question
      const testDir = path.join(process.cwd(), 'test-fixtures');
      await fs.mkdir(testDir, { recursive: true });
      const testFile = path.join(testDir, `xss-question-${name.replace(/\s+/g, '-')}.html`);
      await fs.writeFile(testFile, createXSSTestHTML(payload, 'question'));

      // Navigate to test file
      await page.goto(`file://${testFile}`);

      // Wait for quiz to load
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(500);

      // Verify XSS was NOT executed
      const safe = await checkXSSNotExecuted(page);
      expect(safe).toBe(true);

      // Verify text was properly escaped
      const escaped = await checkTextProperlyEscaped(page, payload);
      expect(escaped).toBe(true);

      // Clean up
      await fs.unlink(testFile);
    });

    test(`should prevent XSS in quiz options: ${name}`, async ({ page }) => {
      // Create test HTML file with XSS payload in MCQ option
      const testDir = path.join(process.cwd(), 'test-fixtures');
      await fs.mkdir(testDir, { recursive: true });
      const testFile = path.join(testDir, `xss-option-${name.replace(/\s+/g, '-')}.html`);
      await fs.writeFile(testFile, createXSSTestHTML(payload, 'option'));

      // Navigate to test file
      await page.goto(`file://${testFile}`);

      // Wait for quiz to load
      await page.waitForSelector('table.qd-quiz');
      await page.waitForTimeout(500);

      // Verify XSS was NOT executed
      const safe = await checkXSSNotExecuted(page);
      expect(safe).toBe(true);

      // Verify text was properly escaped
      const escaped = await checkTextProperlyEscaped(page, payload);
      expect(escaped).toBe(true);

      // Clean up
      await fs.unlink(testFile);
    });
  }
});

test.describe('XSS Prevention - Validation Banners', () => {
  test('should safely display validation errors with malicious content', async ({ page }) => {
    // Create HTML with invalid table structure that will trigger validation errors
    const testHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="release" content="02-2025">
  <title>Validation XSS Test</title>
</head>
<body>
  <h1>Validation Error Test</h1>

  <!-- Invalid quiz table (missing required columns) -->
  <table class="qd-quiz qd-page">
    <thead>
      <tr>
        <th>Question<script>window.XSS_EXECUTED = true;</script></th>
        <th>Answer</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>What is 2+2?</td>
        <td>4</td>
      </tr>
    </tbody>
  </table>

  <script src="../dist/sonar-quiz.iife.js" data-sonar-quiz data-debug="true"></script>
</body>
</html>
`;

    // Create test file
    const testDir = path.join(process.cwd(), 'test-fixtures');
    await fs.mkdir(testDir, { recursive: true });
    const testFile = path.join(testDir, 'validation-xss.html');
    await fs.writeFile(testFile, testHTML);

    // Navigate to test file
    await page.goto(`file://${testFile}`);

    // Wait for page to load
    await page.waitForTimeout(500);

    // Verify XSS was NOT executed
    const safe = await checkXSSNotExecuted(page);
    expect(safe).toBe(true);

    // Clean up
    await fs.unlink(testFile);
  });
});

test.describe('XSS Prevention - User Input', () => {
  test('should sanitize user input in login form', async ({ page }) => {
    const testHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="release" content="02-2025">
  <title>Login XSS Test</title>
</head>
<body>
  <qd-login release="02-2025" docId="test"></qd-login>

  <table class="qd-quiz qd-page">
    <thead>
      <tr><th>Question</th><th>Answer</th><th>Detail</th></tr>
    </thead>
    <tbody>
      <tr><td>Test</td><td>4</td><td>0.1</td></tr>
    </tbody>
  </table>

  <script src="../dist/sonar-quiz.iife.js" data-sonar-quiz data-debug="true"></script>
</body>
</html>
`;

    // Create test file
    const testDir = path.join(process.cwd(), 'test-fixtures');
    await fs.mkdir(testDir, { recursive: true });
    const testFile = path.join(testDir, 'login-xss.html');
    await fs.writeFile(testFile, testHTML);

    // Navigate to test file
    await page.goto(`file://${testFile}`);

    // Wait for login component
    await page.waitForSelector('qd-login');

    // Try to submit XSS payload in name field
    await page.evaluate(() => {
      const login = document.querySelector('qd-login');
      if (login?.shadowRoot) {
        const serviceIdInput = login.shadowRoot.querySelector('#serviceId') as HTMLInputElement;
        const nameInput = login.shadowRoot.querySelector('#name') as HTMLInputElement;
        const submitButton = login.shadowRoot.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;

        if (serviceIdInput) serviceIdInput.value = 'TEST001';
        if (nameInput) nameInput.value = '<script>window.XSS_EXECUTED=true;</script>';
        if (submitButton) submitButton.click();
      }
    });

    // Wait for form submission
    await page.waitForTimeout(500);

    // Verify XSS was NOT executed
    const safe = await checkXSSNotExecuted(page);
    expect(safe).toBe(true);

    // Verify the malicious input was stored safely
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sessionData = await page.evaluate(() => {
      const data = sessionStorage.getItem('qd/session');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return data ? JSON.parse(data) : null;
    });

    expect(sessionData).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(sessionData.name).toContain('<script>'); // Stored as plain text
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(sessionData.name).not.toContain('XSS_EXECUTED'); // Not executed

    // Clean up
    await fs.unlink(testFile);
  });

  test('should sanitize user answers in quiz inputs', async ({ page }) => {
    const testHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="release" content="02-2025">
  <title>Answer XSS Test</title>
</head>
<body>
  <qd-login release="02-2025" docId="test"></qd-login>

  <table class="qd-quiz qd-page" data-page-id="test">
    <thead>
      <tr><th>Question</th><th>Answer</th><th>Detail</th></tr>
    </thead>
    <tbody>
      <tr><td>Enter number:</td><td>4</td><td>0.1</td></tr>
    </tbody>
  </table>

  <script src="../dist/sonar-quiz.iife.js" data-sonar-quiz data-debug="true"></script>
</body>
</html>
`;

    // Create test file
    const testDir = path.join(process.cwd(), 'test-fixtures');
    await fs.mkdir(testDir, { recursive: true });
    const testFile = path.join(testDir, 'answer-xss.html');
    await fs.writeFile(testFile, testHTML);

    // Navigate to test file
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

        if (serviceIdInput) serviceIdInput.value = 'TEST001';
        if (nameInput) nameInput.value = 'Test User';
        if (submitButton) submitButton.click();
      }
    });

    // Wait for quiz to be ready
    await page.waitForTimeout(500);

    // Try to inject XSS via answer input
    const input = page.locator('input[type="number"]').first();
    await input.fill('<script>window.XSS_EXECUTED=true;</script>');
    await input.blur();

    // Wait for auto-save
    await page.waitForTimeout(500);

    // Verify XSS was NOT executed
    const safe = await checkXSSNotExecuted(page);
    expect(safe).toBe(true);

    // Clean up
    await fs.unlink(testFile);
  });
});

test.describe('CSP Headers', () => {
  test('should block inline scripts via CSP', async ({ page }) => {
    const testHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';">
  <title>CSP Test</title>
</head>
<body>
  <h1>CSP Test</h1>

  <!-- This inline script should be blocked by CSP -->
  <script>window.INLINE_SCRIPT_EXECUTED = true;</script>

  <script src="../dist/sonar-quiz.iife.js" data-sonar-quiz></script>

  <table class="qd-quiz qd-page">
    <thead>
      <tr><th>Question</th><th>Answer</th><th>Detail</th></tr>
    </thead>
    <tbody>
      <tr><td>Test</td><td>4</td><td>0.1</td></tr>
    </tbody>
  </table>
</body>
</html>
`;

    // Create test file
    const testDir = path.join(process.cwd(), 'test-fixtures');
    await fs.mkdir(testDir, { recursive: true });
    const testFile = path.join(testDir, 'csp-test.html');
    await fs.writeFile(testFile, testHTML);

    // Navigate to test file
    await page.goto(`file://${testFile}`);

    // Wait for page to load
    await page.waitForTimeout(500);

    // Verify inline script was blocked
    const inlineBlocked = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      return !(window as any).INLINE_SCRIPT_EXECUTED;
    });

    expect(inlineBlocked).toBe(true);

    // Verify external script (sonar-quiz.iife.js) was allowed
    const externalLoaded = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      return !!(window as any).SonarQuiz;
    });

    expect(externalLoaded).toBe(true);

    // Clean up
    await fs.unlink(testFile);
  });
});
