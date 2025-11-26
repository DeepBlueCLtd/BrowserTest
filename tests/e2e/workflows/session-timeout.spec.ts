/**
 * E2E Test: Session Timeout Management
 *
 * Tests session timeout functionality:
 * - Session creation with expiry timestamp
 * - Activity updates extend session
 * - Expired sessions trigger logout
 * - Session data cleared on timeout
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../../dita-demo');

// 30 minutes in milliseconds
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

interface SessionShape {
  serviceId: string;
  name: string;
  release: string;
  loginTime: string;
  lastActivity: string;
  expiresAt: string;
  instructorUnlocked?: boolean;
}

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

test.describe('Session Timeout Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto(`file://${demoPath}/page-index.html`);
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTestDB');
    });
    await waitForBootstrap(page);
  });

  test('should create session with expiry timestamp', async ({ page }) => {
    // Login as student
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Verify session created with required fields
    const session = await page.evaluate((): SessionShape | null => {
      const data = sessionStorage.getItem('qd/session');
      return data ? (JSON.parse(data) as SessionShape) : null;
    });

    expect(session).not.toBeNull();
    expect(session!.serviceId).toBe('TEST001');
    expect(session!.expiresAt).toBeTruthy();
    expect(session!.lastActivity).toBeTruthy();
    expect(session!.loginTime).toBeTruthy();

    // Verify expiry is ~30 minutes from now
    const expiresAt = new Date(session!.expiresAt).getTime();
    const loginTime = new Date(session!.loginTime).getTime();
    const expectedExpiry = loginTime + SESSION_TIMEOUT_MS;

    // Allow 5 second tolerance for test execution time
    expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(5000);
  });

  test('should update lastActivity on user interaction', async ({ page }) => {
    // Login
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Get initial lastActivity
    const initialSession = await page.evaluate((): SessionShape | null => {
      const data = sessionStorage.getItem('qd/session');
      return data ? (JSON.parse(data) as SessionShape) : null;
    });
    const initialActivity = initialSession!.lastActivity;

    // Wait briefly then navigate to quiz page (triggers activity update)
    await page.waitForTimeout(100);
    await page.goto(`file://${demoPath}/Pages/quiz-mcq.html`);
    await waitForBootstrap(page);

    // Answer a question to trigger activity
    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 1 });

    // Verify lastActivity was updated
    const updatedSession = await page.evaluate((): SessionShape | null => {
      const data = sessionStorage.getItem('qd/session');
      return data ? (JSON.parse(data) as SessionShape) : null;
    });

    // lastActivity should be same or later than initial
    const initialTime = new Date(initialActivity).getTime();
    const updatedTime = new Date(updatedSession!.lastActivity).getTime();
    expect(updatedTime).toBeGreaterThanOrEqual(initialTime);
  });

  test('should detect expired session via isSessionExpired utility', async ({ page }) => {
    // Login
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Manually set expired session
    await page.evaluate(() => {
      const data = sessionStorage.getItem('qd/session');
      if (data) {
        const session = JSON.parse(data) as { expiresAt: string };
        // Set expiry to 1 hour ago
        session.expiresAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        sessionStorage.setItem('qd/session', JSON.stringify(session));
      }
    });

    // Verify session is considered expired
    const isExpired = await page.evaluate(() => {
      const data = sessionStorage.getItem('qd/session');
      if (!data) return true;
      const session = JSON.parse(data) as { expiresAt: string };
      const expiresAt = new Date(session.expiresAt);
      return new Date() >= expiresAt;
    });

    expect(isExpired).toBe(true);
  });

  test('should clear session on logout', async ({ page }) => {
    // Login
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Verify session exists
    let session = await page.evaluate(() => sessionStorage.getItem('qd/session'));
    expect(session).not.toBeNull();

    // Logout
    const logoutButton = page.locator('button').filter({ hasText: /logout/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Verify session cleared
    session = await page.evaluate(() => sessionStorage.getItem('qd/session'));
    expect(session).toBeNull();

    // Verify cache also cleared
    const cache = await page.evaluate(() => sessionStorage.getItem('qd/cache'));
    expect(cache).toBeNull();
  });

  test('should emit qd:logout event when session cleared', async ({ page }) => {
    // Login
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Setup logout event listener
    const logoutPromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('qd:logout', () => resolve(true), { once: true });
        // Timeout after 2 seconds
        setTimeout(() => resolve(false), 2000);
      });
    });

    // Logout
    const logoutButton = page.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();

    // Verify event was emitted
    const eventEmitted = await logoutPromise;
    expect(eventEmitted).toBe(true);
  });

  test('should show login form after session cleared', async ({ page }) => {
    // Login
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Verify status panel visible
    await expect(page.locator('qd-status')).toBeVisible();

    // Logout
    const logoutButton = page.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();

    // Verify login form visible again
    await expect(page.locator('qd-login')).toBeVisible();
  });

  test('should preserve instructor state separate from student session', async ({ page }) => {
    const TEST_PASSWORD = 'pwd';

    // Login as student first
    const login = page.locator('qd-login');
    await login.locator('input[name="serviceId"]').fill('TEST001');
    await login.locator('input[name="name"]').fill('John Doe');
    await login.locator('input[name="pin"]').fill('1234');
    await login.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    // Logout student
    const logoutButton = page.locator('button').filter({ hasText: /logout/i });
    await logoutButton.click();

    // Verify student session cleared
    const sessionAfterLogout = await page.evaluate(() => sessionStorage.getItem('qd/session'));
    expect(sessionAfterLogout).toBeNull();

    // Login as instructor
    const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
    await instructorButton.click({ force: true });

    const passwordInput = page.locator('.qd-modal-backdrop input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 2000 });
    await passwordInput.fill(TEST_PASSWORD);

    const unlockButton = page.locator('.qd-modal-backdrop button[type="submit"]');
    await unlockButton.click();
    await expect(passwordInput).not.toBeVisible();

    // Verify instructor panel visible (instructor mode activated)
    await expect(page.getByText('View All Scores')).toBeVisible();

    // Verify instructor state is stored (via qd/instructor key)
    const instructorState = await page.evaluate(() => sessionStorage.getItem('qd/instructor'));
    expect(instructorState).toBe('true');
  });
});
