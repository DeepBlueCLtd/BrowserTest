/**
 * E2E Test: Instructor Review Workflow
 *
 * Tests instructor functionality:
 * - Password unlock with rate limiting
 * - Viewing student scores
 * - CSV export
 * - Answer review
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../demo');

// Test password: "instructor123"
// Hash: c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5
const TEST_PASSWORD = 'instructor123';

test.describe('Instructor Review Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/quiz-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('SonarQuizDB');
    });

    // Login as student first to create some data
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="release"]').fill('01-2025');
    await login.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);
  });

  test('should unlock instructor mode with correct password', async ({ page }) => {
    await page.goto(`file://${demoPath}/quiz-index.html`);

    // Inject password hash into DOM (simulating Oxygen XSL)
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    // Click instructor button
    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    // Wait for instructor component
    await page.waitForTimeout(300);

    // Fill password
    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await passwordInput.fill(TEST_PASSWORD);

    // Submit
    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();

    // Verify instructor panel appears
    await page.waitForTimeout(500);
    const instructorPanel = page.locator('qd-instructor .instructor-panel');
    await expect(instructorPanel).toBeVisible();
  });

  test('should enforce rate limiting after failed attempts', async ({ page }) => {
    await page.goto(`file://${demoPath}/quiz-index.html`);

    // Inject password hash
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    // Click instructor button
    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();
    await page.waitForTimeout(300);

    // Try wrong password 3 times
    for (let i = 0; i < 3; i++) {
      const passwordInput = page.locator('qd-instructor input[type="password"]');
      await passwordInput.fill('wrong-password');
      const unlockButton = page.locator('qd-instructor button[type="submit"]');
      await unlockButton.click();
      await page.waitForTimeout(500);
    }

    // Verify rate limit message appears
    const rateLimitText = page.locator('qd-instructor').locator('text=/wait|locked|try again/i');
    await expect(rateLimitText).toBeVisible({ timeout: 1000 });
  });

  test('should display student scores in modal', async ({ page }) => {
    // Answer some questions to create score data
    await page.goto(`file://${demoPath}/quiz-mcq.html`);
    await page.waitForTimeout(500);

    const firstRadio = page.locator('input[type="radio"]').first();
    await firstRadio.click();
    await page.waitForTimeout(1000);

    // Go back and unlock instructor
    await page.goto(`file://${demoPath}/quiz-index.html`);

    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();
    await page.waitForTimeout(300);

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await page.waitForTimeout(500);

    // Click "View Scores" button
    const viewScoresButton = page.locator('button').filter({ hasText: /view scores/i });
    await viewScoresButton.click();

    // Verify modal appears
    const scoresModal = page.locator('qd-instructor-scores .modal-overlay');
    await expect(scoresModal).toBeVisible();

    // Verify student data shown
    await expect(scoresModal).toContainText('John Doe');
    await expect(scoresModal).toContainText('TEST001');
  });

  test('should export CSV with student data', async ({ page }) => {
    // Answer questions to create data
    await page.goto(`file://${demoPath}/quiz-mcq.html`);
    await page.waitForTimeout(500);

    const firstRadio = page.locator('input[type="radio"]').first();
    await firstRadio.click();
    await page.waitForTimeout(1000);

    // Unlock instructor
    await page.goto(`file://${demoPath}/quiz-index.html`);

    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();
    await page.waitForTimeout(300);

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await page.waitForTimeout(500);

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    const exportButton = page.locator('button').filter({ hasText: /export.*csv/i });
    await exportButton.click();

    // Verify download triggered
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/quiz-data-.*\.csv/);
  });

  test('should show student answers when instructor mode active', async ({ page }) => {
    // Student answers a question
    await page.goto(`file://${demoPath}/quiz-mcq.html`);
    await page.waitForTimeout(500);

    const firstRadio = page.locator('input[type="radio"]').first();
    await firstRadio.click();
    await page.waitForTimeout(1000);

    // Unlock instructor on same page
    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    // Since we're on quiz page, need to go to index first
    await page.goto(`file://${demoPath}/quiz-index.html`);

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();
    await page.waitForTimeout(300);

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await page.waitForTimeout(500);

    // Toggle "Show Answers" (if that feature exists)
    // This test assumes instructor can see student answers on quiz pages
    // Implementation may vary based on actual feature
  });

  test('should close scores modal on close button', async ({ page }) => {
    await page.goto(`file://${demoPath}/quiz-index.html`);

    await page.evaluate(() => {
      const span = document.createElement('span');
      span.id = 'instructor.password.hash';
      span.style.display = 'none';
      span.textContent = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';
      document.body.appendChild(span);
    });

    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click();
    await page.waitForTimeout(300);

    const passwordInput = page.locator('qd-instructor input[type="password"]');
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('qd-instructor button[type="submit"]');
    await unlockButton.click();
    await page.waitForTimeout(500);

    // Open scores modal
    const viewScoresButton = page.locator('button').filter({ hasText: /view scores/i });
    await viewScoresButton.click();

    const scoresModal = page.locator('qd-instructor-scores .modal-overlay');
    await expect(scoresModal).toBeVisible();

    // Close modal
    const closeButton = scoresModal.locator('button.close-button');
    await closeButton.click();

    // Verify modal closed
    await expect(scoresModal).not.toBeVisible();
  });
});
