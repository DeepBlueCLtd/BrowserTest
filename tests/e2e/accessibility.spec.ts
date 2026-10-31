/**
 * E2E Test: automated accessibility check (SRD 013 A11Y-04)
 *
 * Runs axe-core (WCAG 2.1 A and AA rules) on the DITA demo pages logged out,
 * as a student and as an instructor, and requires zero critical or serious
 * violations. axe-core is a dev dependency, injected from node_modules, so
 * the check needs no network.
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { submitStudentLogin } from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const demoPath = path.resolve(__dirname, '../../dita-demo');
const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js');

interface Violation {
  id: string;
  impact: string | null;
  nodes: number;
  targets: string[];
}

async function seriousViolations(page: Page): Promise<Violation[]> {
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (...a: unknown[]) => Promise<unknown> } }).axe;
    const result = (await axe.run(document, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    })) as {
      violations: { id: string; impact: string | null; nodes: { target: string[] }[] }[];
    };
    return result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
    }));
  });
  return violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
}

async function open(page: Page, file: string): Promise<void> {
  await page.goto(`file://${demoPath}/${file}`);
  await page.locator('qd-login[data-ready]').waitFor({ state: 'attached' });
}

async function loginStudent(page: Page): Promise<void> {
  const login = page.locator('qd-login');
  await login.locator('input[name="name"]').fill('Ally Access');
  await login.locator('input[name="serviceId"]').fill('30055555');
  await login.locator('input[name="pin"]').fill('2468');
  await submitStudentLogin(login);
  await expect(page.locator('qd-status')).toBeVisible();
}

async function loginInstructor(page: Page): Promise<void> {
  await page
    .locator('qd-login button')
    .filter({ hasText: /instructor/i })
    .click();
  await page.locator('qd-modal[open] input[type="password"]').fill('pwd');
  await page.locator('qd-modal[open] button[type="submit"]').click();
  await expect(page.locator('qd-instructor')).toBeVisible();
}

test.describe('Accessibility (WCAG 2.1 AA, axe-core)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, 'Pages/quiz-mcq.html');
    await page.evaluate(() => {
      sessionStorage.clear();
      indexedDB.deleteDatabase('BrowserTestDB');
    });
  });

  test('logged-out quiz page', async ({ page }) => {
    await open(page, 'Pages/quiz-mcq.html');
    expect(await seriousViolations(page)).toEqual([]);
  });

  test('student answering MCQ and numeric questions', async ({ page }) => {
    test.setTimeout(15000);
    await open(page, 'Pages/quiz-mcq.html');
    await loginStudent(page);
    await page.locator('table.qd-quiz select').first().selectOption({ index: 2 });
    await expect(page.locator('.qd-answer-feedback').first()).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);

    await open(page, 'Pages/quiz-numeric.html');
    await page.locator('table.qd-quiz input').first().fill('abc');
    await expect(page.locator('.qd-input-error').first()).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });

  test('student on an analysis page', async ({ page }) => {
    test.setTimeout(15000);
    await open(page, 'Pages/analysis-tactical.html');
    await loginStudent(page);
    expect(await seriousViolations(page)).toEqual([]);
  });

  test('instructor on the assessment index and a quiz page', async ({ page }) => {
    test.setTimeout(15000);
    await open(page, 'page-index.html');
    await loginInstructor(page);
    expect(await seriousViolations(page)).toEqual([]);

    await open(page, 'Pages/quiz-mcq.html');
    expect(await seriousViolations(page)).toEqual([]);
  });
});
