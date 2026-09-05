/**
 * E2E Tests: Encrypted (Obfuscated) Storage
 *
 * Feature 009 - Encrypt Stored Data (US3: Instructor access to obfuscated data)
 * - T034: Instructor can view scores with obfuscation enabled
 * - T035: CSV export contains readable data with obfuscation enabled
 *
 * These tests drive the dita-demo pages, which load the bundle from
 * dita-demo/oxygen-webhelp/template/resources/sonar-quiz.iife.js. The bundle
 * must be built with ENCRYPT_STORAGE=true (npm run build:dita:encrypted) and the
 * tests must be run with ENCRYPT_STORAGE=true (npm run test:e2e:encrypted).
 * When the flag is off every test in this file is skipped.
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { submitStudentLogin } from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../dita-demo');

const DB_NAME = 'BrowserTestDB';
const TEST_PASSWORD = 'pwd';

const STUDENT = {
  serviceId: 'ENC001',
  name: 'Obfuscated Student',
  pin: '2468',
};

/** MCQ page: first question, correct answer is option 1 (select index 1) */
const MCQ_ANSWER = '1';
/** Numeric page: first question, correct value 15 (tolerance 2) */
const NUMERIC_ANSWER = '15';

/**
 * Wait for bootstrap to complete
 */
async function waitForBootstrap(page: Page): Promise<void> {
  await page.locator('qd-login[data-ready]').waitFor({ state: 'attached', timeout: 2000 });
}

/**
 * Clear all storage
 */
async function clearStorage(page: Page): Promise<void> {
  await page.evaluate((dbName) => {
    sessionStorage.clear();
    localStorage.clear();
    indexedDB.deleteDatabase(dbName);
  }, DB_NAME);
}

/**
 * Close PIN confirmation dialog if visible
 */
async function closePinConfirmationDialog(page: Page): Promise<void> {
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const modals = document.querySelectorAll('qd-modal[open], qd-confirm-dialog[open]');
    modals.forEach((modal) => {
      modal.removeAttribute('open');
    });
  });
  await page.waitForTimeout(100);
}

/**
 * Login as student with PIN
 */
async function loginStudent(page: Page): Promise<void> {
  const loginForm = page.locator('qd-login');
  await loginForm.locator('input[name="name"]').fill(STUDENT.name);
  await loginForm.locator('input[name="serviceId"]').fill(STUDENT.serviceId);
  await loginForm.locator('input[name="pin"]').fill(STUDENT.pin);
  await submitStudentLogin(loginForm);
  await closePinConfirmationDialog(page);
}

/**
 * Login as instructor
 */
async function loginAsInstructor(page: Page): Promise<void> {
  const instructorButton = page.locator('qd-login button').filter({ hasText: /instructor/i });
  await instructorButton.click({ force: true });

  const passwordInput = page.locator('qd-modal[open] input[type="password"]');
  await expect(passwordInput).toBeVisible({ timeout: 2000 });
  await passwordInput.fill(TEST_PASSWORD);

  const unlockButton = page.locator('qd-modal[open] button[type="submit"]');
  await unlockButton.click();
  await expect(passwordInput).not.toBeVisible();

  await expect(page.getByText('View All Scores')).toBeVisible();
}

/**
 * Answer the first question on a quiz page and wait for the save to register.
 *
 * Saves are debounced (200ms) and the status panel shows cumulative totals, so
 * wait for the expected running total of correct answers before navigating on.
 */
async function answerFirstQuestion(
  page: Page,
  pageName: string,
  answer: string,
  expectedCorrect: number,
): Promise<void> {
  await page.goto(`file://${demoPath}/Pages/${pageName}.html`);
  await page.waitForTimeout(500); // Wait for page initialization

  const input = page.locator('table.qd-quiz .qd-quiz-input').first();
  if ((await input.evaluate((el) => el.tagName)) === 'SELECT') {
    await input.selectOption(answer);
  } else {
    await input.fill(answer);
  }

  // Status panel updates after the answer has been persisted to IndexedDB
  await expect(page.locator('qd-status')).toContainText(
    new RegExp(`${expectedCorrect}/\\d+ Correct`),
  );
}

/**
 * Login as student and answer one MCQ and one numeric question (both correct)
 */
async function createStudentWithAnswers(page: Page): Promise<void> {
  await loginStudent(page);
  await answerFirstQuestion(page, 'quiz-mcq', MCQ_ANSWER, 1);
  await answerFirstQuestion(page, 'quiz-numeric', NUMERIC_ANSWER, 2);
}

/**
 * Logout student (from index page) and login as instructor
 */
async function switchToInstructor(page: Page): Promise<void> {
  await page.goto(`file://${demoPath}/page-index.html`);
  await waitForBootstrap(page);

  const logoutButton = page.locator('button').filter({ hasText: /logout/i });
  await logoutButton.click();
  await expect(page.locator('qd-login')).toBeVisible();

  await loginAsInstructor(page);
}

/**
 * Open the scores modal (this also loads student data for CSV export)
 */
async function openScoresModal(page: Page) {
  const viewScoresButton = page.locator('button').filter({ hasText: /view.*scores/i });
  await viewScoresButton.click();

  const scoresModal = page.locator('qd-modal[open]');
  await expect(scoresModal).toBeVisible();
  return scoresModal;
}

/**
 * Read the raw (undecoded) values and keys from the students object store
 */
async function readRawStudentRecords(page: Page): Promise<{ keys: string[]; values: unknown[] }> {
  return page.evaluate((dbName) => {
    return new Promise<{ keys: string[]; values: unknown[] }>((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('students', 'readonly');
        const store = tx.objectStore('students');
        const keysRequest = store.getAllKeys();
        const valuesRequest = store.getAll();
        tx.oncomplete = () => {
          db.close();
          resolve({
            keys: keysRequest.result.filter((k): k is string => typeof k === 'string'),
            values: valuesRequest.result as unknown[],
          });
        };
        tx.onerror = () => reject(new Error(tx.error?.message || 'Transaction error'));
      };
      request.onerror = () => reject(new Error(request.error?.message || 'Request error'));
    });
  }, DB_NAME);
}

test.describe('Encrypted Storage (ENCRYPT_STORAGE=true)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${demoPath}/page-index.html`);
    await clearStorage(page);
    await page.reload();
    await waitForBootstrap(page);
  });

  test('should store student answers obfuscated in IndexedDB', async ({ page }) => {
    test.skip(process.env.ENCRYPT_STORAGE !== 'true', 'Test requires ENCRYPT_STORAGE=true');

    await createStudentWithAnswers(page);

    const { keys, values } = await readRawStudentRecords(page);

    // The student record exists under the composite key
    expect(keys.some((key) => key.endsWith(`/u${STUDENT.serviceId}`))).toBe(true);
    expect(values.length).toBeGreaterThan(0);

    // Every stored value is an obfuscated string, not a plain JSON object
    for (const value of values) {
      expect(typeof value).toBe('string');
      expect(value as string).toMatch(/^OBF:/);
    }

    // Student name, service ID and answers are not readable in the raw store
    const raw = JSON.stringify(values);
    expect(raw).not.toContain(STUDENT.name);
    expect(raw).not.toContain(STUDENT.serviceId);
    expect(raw).not.toContain('"answer"');
  });

  test('T034: instructor can view scores with obfuscation enabled', async ({ page }) => {
    test.skip(process.env.ENCRYPT_STORAGE !== 'true', 'Test requires ENCRYPT_STORAGE=true');

    await createStudentWithAnswers(page);
    await switchToInstructor(page);

    const scoresModal = await openScoresModal(page);

    // Student identity is decoded and readable
    await expect(scoresModal).toContainText(STUDENT.name);
    await expect(scoresModal).toContainText(STUDENT.serviceId);

    // Correct/attempted counts: 1 MCQ + 1 numeric, both correct
    await expect(scoresModal).toContainText(/2\/2\s*\(100%\)/);

    // Per-page answers are readable
    await expect(scoresModal).toContainText('quiz-mcq');
    await expect(scoresModal).toContainText('quiz-numeric');
    await expect(scoresModal).not.toContainText('OBF:');
  });

  test('T035: CSV export contains readable data with obfuscation enabled', async ({ page }) => {
    test.skip(process.env.ENCRYPT_STORAGE !== 'true', 'Test requires ENCRYPT_STORAGE=true');

    await createStudentWithAnswers(page);
    await switchToInstructor(page);

    // Open and close the scores modal to load student data for export
    const scoresModal = await openScoresModal(page);
    await expect(scoresModal).toContainText(STUDENT.name);
    await page.keyboard.press('Escape');
    await expect(scoresModal).not.toBeVisible();

    const exportButton = page.locator('button').filter({ hasText: /export.*csv/i });
    await expect(exportButton).toBeEnabled({ timeout: 2000 });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);

    const readable = await download.createReadStream();
    const chunks: Uint8Array[] = [];
    for await (const chunk of readable) {
      chunks.push(new Uint8Array(chunk as ArrayBuffer));
    }
    const csvContent = Buffer.concat(chunks).toString('utf-8');

    // Header row is intact
    expect(csvContent.split('\n')[0]).toBe(
      'Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp',
    );

    // Student identity and answers are plain text, one row per answer
    expect(csvContent).toContain(STUDENT.serviceId);
    expect(csvContent).toContain(STUDENT.name);
    expect(csvContent).toMatch(
      new RegExp(`^${STUDENT.serviceId},${STUDENT.name},.*,quiz-mcq,0,${MCQ_ANSWER},true,`, 'm'),
    );
    expect(csvContent).toMatch(
      new RegExp(
        `^${STUDENT.serviceId},${STUDENT.name},.*,quiz-numeric,0,${NUMERIC_ANSWER},true,`,
        'm',
      ),
    );
    expect(csvContent).not.toContain('OBF:');
  });
});
