/**
 * E2E Tests: Login Flow Storybook Stories
 *
 * Tests the complete login workflows via Storybook
 */

import { test, expect, type Page } from '@playwright/test';

const STORYBOOK_URL = 'http://localhost:6006';

/**
 * Wait for web component shadow content to render
 */
async function waitForBootstrap(page: Page): Promise<void> {
  // Wait for qd-login shadow content to be ready (using placeholder since no name attribute)
  await page
    .locator('qd-login input[placeholder="Service ID (30012345)"]')
    .waitFor({ timeout: 5000 });
}

test.describe('Login Flow - Storybook Stories', () => {
  test('Student Login Flow - should complete login and show status', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=workflows-login-flow--student-login-flow&viewMode=story`,
    );
    await waitForBootstrap(page);

    // Wait for story to load
    const login = page.locator('qd-login');
    await expect(login).toBeVisible();

    // Fill in student credentials
    await login.locator('input[placeholder="Service ID (30012345)"]').fill('TEST001');
    await login.locator('input[placeholder="Name (J Smith)"]').fill('John Doe');

    // Submit login
    await login.locator('button[type="submit"]').click();

    // Verify status panel appears
    const status = page.locator('qd-status');
    await expect(status).toBeVisible();
    await expect(status).toContainText('John Doe');
    await expect(status).toContainText('TEST001');
  });

  test('Instructor Login Flow - should unlock with password', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=workflows-login-flow--instructor-login-flow&viewMode=story`,
    );
    await waitForBootstrap(page);

    // Wait for story to load
    const login = page.locator('qd-login');
    await expect(login).toBeVisible();

    // Click instructor button
    const instructorButton = login.locator('button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    // Wait for instructor component/modal
    const instructor = page.locator('qd-instructor');
    await expect(instructor).toBeVisible();

    // Enter password
    const passwordInput = instructor.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('instructor123');

    // Submit
    const unlockButton = instructor.locator('button[type="submit"]');
    await unlockButton.click();

    // Verify instructor panel appears
    const instructorPanel = instructor.locator('.instructor-panel');
    await expect(instructorPanel).toBeVisible();
  });

  test('Instructor Login Flow - should enforce rate limiting', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=workflows-login-flow--instructor-login-flow&viewMode=story`,
    );
    await waitForBootstrap(page);

    const login = page.locator('qd-login');
    await expect(login).toBeVisible();

    // Click instructor button
    const instructorButton = login.locator('button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    const instructor = page.locator('qd-instructor');
    const passwordInput = instructor.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Try wrong password 3 times
    for (let i = 0; i < 3; i++) {
      await passwordInput.fill('wrong-password');
      const unlockButton = instructor.locator('button[type="submit"]');
      await unlockButton.click();
      await expect(passwordInput).toBeVisible();
    }

    // Verify rate limit message appears
    const rateLimitText = instructor.locator('text=/wait|locked|try again/i');
    await expect(rateLimitText).toBeVisible();
  });

  test('Full Page - should show login then status in header', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=workflows-login-flow--full-page-with-login-status&viewMode=story`,
    );
    await waitForBootstrap(page);

    // Verify page header and nav
    const header = page.locator('.page-header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Sonar Quiz System');

    // Verify login form visible in status panel container
    const login = page.locator('.status-panel-container qd-login');
    await expect(login).toBeVisible();

    // Login
    await login.locator('input[placeholder="Service ID (30012345)"]').fill('TEST001');
    await login.locator('input[placeholder="Name (J Smith)"]').fill('Jane Smith');
    await login.locator('button[type="submit"]').click();

    // Verify status panel appears in same container
    const status = page.locator('.status-panel-container qd-status');
    await expect(status).toBeVisible();
    await expect(status).toContainText('Jane Smith');

    // Verify welcome section
    await expect(page.locator('.welcome-section')).toBeVisible();
    await expect(page.locator('.welcome-section')).toContainText(
      'Welcome to the Sonar Quiz System',
    );
  });

  test('Instructor Mode Full Controls - should show all control buttons', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=workflows-login-flow--instructor-mode-full-controls&viewMode=story`,
    );
    await waitForBootstrap(page);

    const login = page.locator('qd-login');
    await expect(login).toBeVisible();

    // Unlock instructor
    const instructorButton = login.locator('button').filter({ hasText: /instructor/i });
    await instructorButton.click();

    const instructor = page.locator('qd-instructor');
    const passwordInput = instructor.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('instructor123');

    const unlockButton = instructor.locator('button[type="submit"]');
    await unlockButton.click();

    // Verify instructor panel with controls
    const instructorPanel = instructor.locator('.instructor-panel');
    await expect(instructorPanel).toBeVisible();

    // Verify control buttons exist
    const viewScoresButton = page.locator('button').filter({ hasText: /view.*scores/i });
    await expect(viewScoresButton).toBeVisible();

    const exportButton = page.locator('button').filter({ hasText: /export.*csv/i });
    await expect(exportButton).toBeVisible();

    const eraseButton = page.locator('button').filter({ hasText: /erase.*data/i });
    await expect(eraseButton).toBeVisible();
  });

  test('Login to Status Transition - should show both states', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=workflows-login-flow--login-to-status-transition&viewMode=story`,
    );
    await waitForBootstrap(page);

    // Verify transition demo container
    const transitionDemo = page.locator('.transition-demo');
    await expect(transitionDemo).toBeVisible();

    // Verify login form visible initially
    const login = transitionDemo.locator('qd-login');
    await expect(login).toBeVisible();

    // Login
    await login.locator('input[placeholder="Service ID (30012345)"]').fill('TEST123');
    await login.locator('input[placeholder="Name (J Smith)"]').fill('Test User');
    await login.locator('button[type="submit"]').click();

    // Verify status panel appears
    const status = transitionDemo.locator('qd-status');
    await expect(status).toBeVisible();
    await expect(status).toContainText('Test User');
  });

  test('Student Logout - should return to login form', async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=workflows-login-flow--login-to-status-transition&viewMode=story`,
    );
    await waitForBootstrap(page);

    const login = page.locator('qd-login');
    await expect(login).toBeVisible();

    // Login
    await login.locator('input[placeholder="Service ID (30012345)"]').fill('TEST001');
    await login.locator('input[placeholder="Name (J Smith)"]').fill('John Doe');
    await login.locator('button[type="submit"]').click();

    // Verify status visible
    const status = page.locator('qd-status');
    await expect(status).toBeVisible();

    // Click logout
    const logoutButton = status.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();

    // Verify login form reappears
    await expect(login).toBeVisible();
  });
});
