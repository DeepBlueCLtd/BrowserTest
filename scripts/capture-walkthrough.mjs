#!/usr/bin/env node

/**
 * Capture the screenshots for docs/walkthrough/ (the slide walkthrough).
 *
 * Drives the DITA demo in headless Chromium through the student and
 * instructor journeys, saves one PNG per slide into docs/walkthrough/img/,
 * and records where each annotation pin goes (measured from the live
 * elements) in docs/walkthrough/img/shots.js, so pins stay on target after
 * a UI change. Captions live in docs/walkthrough/index.html.
 *
 * Usage:
 *   npm run build:dita:plain          # put the current bundle into dita-demo/
 *   npm run walkthrough:capture
 *   git checkout -- dita-demo         # do not commit the locally built bundle
 *
 * Set PW_CHROMIUM_PATH to use a specific Chromium binary.
 */

import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEMO = `file://${join(ROOT, 'dita-demo')}`;
const OUT = join(ROOT, 'docs', 'walkthrough', 'img');
const WIDTH = 1280;
const HEIGHT = 800;
const PASSWORD = 'pwd'; // demo instructor password (hash in dita-demo)

/** Marked boxes per shot: { shotId: { pinId: { x, y, w, h } } } in % of the image. */
const shots = {};

/** Sample CSV export, embedded in shots.js for the export slide. */
let csvText = '';

/**
 * Screenshot the viewport and measure pins.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} id - Shot id, also the file name
 * @param {Record<string, import('@playwright/test').Locator>} pins - Pin id → element
 */
async function shot(page, id, pins = {}) {
  await page.waitForTimeout(350);
  const viewport = page.viewportSize() ?? { width: WIDTH, height: HEIGHT };
  const positions = {};
  for (const [pinId, locator] of Object.entries(pins)) {
    const box = await locator.first().boundingBox();
    if (!box) {
      throw new Error(`Pin ${id}/${pinId}: element not visible`);
    }
    // The deck outlines this box and puts the pin number on its top-left
    // corner, so the annotation does not cover what it points at
    const left = Math.max(box.x - 3, 0);
    const top = Math.max(box.y - 3, 0);
    const right = Math.min(box.x + box.width + 3, viewport.width);
    const bottom = Math.min(box.y + box.height + 3, viewport.height);
    const pct = (value, of) => +((value / of) * 100).toFixed(2);
    positions[pinId] = {
      x: pct(left, viewport.width),
      y: pct(top, viewport.height),
      w: pct(right - left, viewport.width),
      h: pct(bottom - top, viewport.height),
    };
  }
  shots[id] = positions;
  await page.screenshot({ path: join(OUT, `${id}.png`) });
  console.log(`  ✓ ${id}`);
}

async function waitReady(page) {
  await page.locator('qd-login[data-ready]').waitFor({ state: 'attached' });
  await page.waitForTimeout(300);
}

async function open(page, file) {
  await page.goto(`${DEMO}/${file}`);
  await waitReady(page);
}

/** Fill and submit the student form; completes the create-and-confirm step. */
async function loginStudent(page, name, serviceId, pin) {
  const form = page.locator('qd-login form.login-form');
  await form.locator('input[name="name"]').fill(name);
  await form.locator('input[name="serviceId"]').fill(serviceId);
  await form.locator('input[name="pin"]').fill(pin);
  await page.waitForTimeout(450); // registration lookup is debounced
  await form.locator('button.login-btn').click();
  const confirm = form.locator('button.login-btn:has-text("Confirm")');
  if (await confirm.isVisible({ timeout: 1500 }).catch(() => false)) {
    await form.locator('input[name="pin"]').fill(pin);
    await form.locator('button.login-btn').click();
  }
  await page.locator('qd-status').waitFor({ state: 'visible' });
}

async function logout(page) {
  await page.locator('qd-status .logout-button').click();
  await page.locator('qd-login').waitFor({ state: 'visible' });
}

async function loginInstructor(page) {
  await page.locator('qd-login button').filter({ hasText: /instructor/i }).click();
  await page.locator('qd-modal[open] input[type="password"]').fill(PASSWORD);
  await page.locator('qd-modal[open] button[type="submit"]').click();
  await page.locator('qd-instructor').waitFor({ state: 'visible' });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    acceptDownloads: true,
  });
  // The published template no longer has a search box (SRD 013 ANS-01), but
  // dita-demo/ predates that template; hide it so screenshots match.
  await context.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = '.wh_search_input { display: none !important; }';
      document.head.appendChild(style);
    });
  });
  const page = await context.newPage();

  console.log('Student journey');
  await open(page, 'Pages/quiz-mcq.html');
  await page.evaluate(() => {
    sessionStorage.clear();
    indexedDB.deleteDatabase('BrowserTestDB');
  });
  await open(page, 'Pages/quiz-mcq.html');
  await shot(page, '01-logged-out', {
    panel: page.locator('qd-login'),
    help: page.locator('qd-login qd-help-trigger'),
    notice: page.locator('.qd-login-notice'),
    table: page.locator('table.qd-quiz'),
  });

  const form = page.locator('qd-login form.login-form');
  await form.locator('input[name="name"]').fill('J');
  await form.locator('input[name="serviceId"]').fill('x');
  await form.locator('input[name="pin"]').fill('12');
  await form.locator('input[name="name"]').focus();
  await shot(page, '02-validation', {
    hint: page.locator('qd-login .hint-message'),
    field: page.locator('qd-login input[name="serviceId"]'),
    button: page.locator('qd-login button.login-btn'),
  });

  await form.locator('input[name="name"]').fill('Jo Bloggs');
  await form.locator('input[name="serviceId"]').fill('30012345');
  await form.locator('input[name="pin"]').fill('1234');
  await page.waitForTimeout(500);
  await shot(page, '03-create', { button: page.locator('qd-login button.login-btn') });
  await form.locator('button.login-btn').click();
  await shot(page, '04-confirm', {
    pin: page.locator('qd-login input[name="pin"]'),
    hint: page.locator('qd-login .hint-message'),
  });
  await form.locator('input[name="pin"]').fill('1234');
  await form.locator('button.login-btn').click();
  await page.locator('qd-status').waitFor({ state: 'visible' });

  const selects = page.locator('table.qd-quiz select');
  await selects.nth(0).selectOption('2'); // wrong first ...
  await page.waitForTimeout(400);
  await selects.nth(0).selectOption('1'); // ... then right: 2 tries
  await page.waitForTimeout(400);
  await selects.nth(1).selectOption('2'); // wrong
  await page.waitForTimeout(600);
  await shot(page, '05-mcq', {
    progress: page.locator('qd-status .progress-text'),
    header: page.locator('table.qd-quiz thead th').nth(1),
    correct: page.locator('.qd-answer-correct .qd-answer-feedback'),
    incorrect: page.locator('.qd-answer-incorrect .qd-answer-feedback'),
  });

  await open(page, 'Pages/quiz-numeric.html');
  const inputs = page.locator('table.qd-quiz input');
  await inputs.nth(4).fill('1500');
  await inputs.nth(4).press('Tab');
  await inputs.nth(0).fill('abc');
  await page.waitForTimeout(500);
  await shot(page, '06-numeric', {
    error: page.locator('.qd-input-error'),
    correct: page.locator('.qd-answer-correct .qd-answer-feedback'),
  });

  await open(page, 'Pages/analysis-tactical.html');
  const cells = page.locator('table.qd-analysis td.interactive');
  await cells.nth(0).click();
  await page.keyboard.type('High: submarine contact bearing 045');
  await cells.nth(1).click();
  await page.keyboard.type('Turn away and increase speed');
  await page.waitForTimeout(900);
  await shot(page, '07-analysis', {
    label: page.locator('table.qd-analysis td').first(),
    cell: cells.nth(0),
    quiz: page.locator('table.qd-quiz'),
  });

  await open(page, 'page-index.html');
  await shot(page, '08-badges', {
    amber: page.locator('a.quizPageBtn[href*="quiz-mcq"]'),
    analysis: page.locator('a.quizPageBtn[href*="analysis-tactical"]'),
    red: page.locator('a.quizPageBtn[href*="gram-1"]'),
  });

  await page.locator('qd-status qd-help-trigger').click();
  await shot(page, '09-help', { modal: page.locator('.qd-help-content') });
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 768, height: 900 });
  await open(page, 'Pages/quiz-mcq.html');
  await shot(page, '10-narrow', { panel: page.locator('qd-status') });
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });

  // Idle timeout: age the session, then reload
  await page.evaluate(() => {
    const session = JSON.parse(sessionStorage.getItem('qd/session'));
    session.expiresAt = new Date(Date.now() - 1000).toISOString();
    sessionStorage.setItem('qd/session', JSON.stringify(session));
  });
  await open(page, 'Pages/quiz-mcq.html');
  await shot(page, '11-timeout', { notice: page.locator('qd-login .notice-message') });

  // A second student, right first time, for the instructor views
  await loginStudent(page, 'Sam Smith', '30067890', '5678');
  for (const [i, option] of ['1', '3', '1', '1', '2'].entries()) {
    await selects.nth(i).selectOption(option);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(500);
  await logout(page);

  // Lockout after three wrong PINs
  for (let i = 0; i < 3; i++) {
    await form.locator('input[name="name"]').fill('Jo Bloggs');
    await form.locator('input[name="serviceId"]').fill('30012345');
    await form.locator('input[name="pin"]').fill('9999');
    await page.waitForTimeout(450);
    await form.locator('button.login-btn').click();
    await page.waitForTimeout(500);
  }
  await shot(page, '12-lockout', { banner: page.locator('qd-login .lockout-message') });

  console.log('Instructor journey');
  await open(page, 'Pages/quiz-mcq.html');
  await page.locator('qd-login button').filter({ hasText: /instructor/i }).click();
  await shot(page, '13-instructor-login', {
    password: page.locator('qd-modal[open] input[type="password"]'),
  });
  await page.locator('qd-modal[open] input[type="password"]').fill(PASSWORD);
  await page.locator('qd-modal[open] button[type="submit"]').click();
  await page.locator('qd-instructor').waitFor({ state: 'visible' });
  await shot(page, '14-instructor-quiz', {
    toolbar: page.locator('qd-instructor .instructor-title'),
    danger: page.locator('qd-instructor .danger-zone'),
    answer: page.locator('table.qd-quiz tbody td').nth(1),
    options: page.locator('table.qd-quiz tbody td').nth(2),
  });

  await page.locator('qd-instructor input[type="checkbox"]').check();
  await page.waitForTimeout(700);
  await shot(page, '15-student-answers', {
    toggle: page.locator('qd-instructor .toggle-label'),
    answers: page.locator('qd-student-answers').first(),
  });

  await open(page, 'Pages/analysis-tactical.html');
  await page.waitForTimeout(500);
  await shot(page, '16-analysis-instructor', {
    entries: page.locator('qd-student-entries').first(),
  });

  await page.locator('qd-instructor button', { hasText: 'View All Scores' }).click();
  await page.locator('qd-modal[open]').waitFor();
  const jo = page.locator('qd-modal[open] tr.student-row', { hasText: 'Jo Bloggs' });
  await shot(page, '17-scores', {
    answered: jo.locator('td').nth(2),
    correct: jo.locator('td').nth(3),
    first: jo.locator('td').nth(4),
    tries: jo.locator('.answer-badge', { hasText: 'tries' }),
    analysis: jo.locator('.analysis-badge'),
  });
  await page.keyboard.press('Escape');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('qd-instructor-export button').first().click(),
  ]);
  const csvPath = join(OUT, '..', 'sample-export.csv');
  await download.saveAs(csvPath);
  csvText = readFileSync(csvPath, 'utf8');

  await page.locator('qd-instructor button', { hasText: 'Reset PINs' }).click();
  await page.locator('qd-modal[open] button', { hasText: 'Reset' }).first().click();
  await page.locator('qd-modal[open] input[type="password"]').waitFor();
  await shot(page, '18-reset-pin', {
    password: page.locator('qd-modal[open] input[type="password"]'),
    confirm: page.locator('qd-modal[open] .confirm-btn'),
  });
  await page.locator('qd-modal[open] .cancel-btn').click();
  await page.keyboard.press('Escape');

  await page.locator('qd-instructor-manage button').first().click();
  await page.locator('.qd-manage-modal-overlay input[type="text"]').fill('DELETE ALL DATA');
  await shot(page, '19-erase', {
    phrase: page.locator('.qd-manage-modal-overlay input[type="text"]'),
    password: page.locator('.qd-manage-modal-overlay input[type="password"]'),
  });
  await page.keyboard.press('Escape');

  console.log('Shared-machine check');
  const forged = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  await forged.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = '.wh_search_input { display: none !important; }';
      document.head.appendChild(style);
    });
  });
  const intruder = await forged.newPage();
  await open(intruder, 'Pages/quiz-mcq.html');
  await intruder.evaluate(() => sessionStorage.setItem('qd/instructor', 'true'));
  await open(intruder, 'Pages/quiz-mcq.html');
  await shot(intruder, '20-forged-flag', {
    panel: intruder.locator('qd-login'),
    table: intruder.locator('table.qd-quiz'),
  });

  await browser.close();

  writeFileSync(
    join(OUT, 'shots.js'),
    '// Generated by scripts/capture-walkthrough.mjs. Pin positions in % of each image.\n' +
      `window.WALKTHROUGH_SHOTS = ${JSON.stringify(shots, null, 2)};\n` +
      // The deck opens from file://, where it cannot fetch the CSV itself
      `window.WALKTHROUGH_CSV = ${JSON.stringify(csvText)};\n`,
  );
  console.log(`\nWrote ${Object.keys(shots).length} screenshots and pin positions to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
