/**
 * E2E Test: Student Flow (DITA Output)
 *
 * Tests core student workflows using actual DITA-published HTML:
 * - Login and session creation
 * - Quiz interaction (MCQ and numeric questions)
 * - Multi-page navigation with session persistence
 * - Answer persistence across browser reload
 * - Progress tracking and badge updates
 * - Logout and session cleanup
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ditaPath = path.resolve(__dirname, '../../../dita-demo');

/**
 * Wait for bootstrap to complete
 */
async function waitForBootstrap(page: Page): Promise<void> {
  await page.waitForSelector('qd-login', { state: 'attached', timeout: 2000 });
  await page.waitForTimeout(300);
}

/**
 * Clear all storage
 */
async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
    indexedDB.deleteDatabase('BrowserTestDB');
    indexedDB.deleteDatabase('BrowserTestDB');
  });
}

/**
 * Close PIN confirmation dialog if visible
 */
async function closePinConfirmationDialog(page: Page): Promise<void> {
  try {
    await page.locator('#qd-pin-confirmation-ok').click({ force: true, timeout: 2000 });
  } catch {
    // Dialog not visible or already closed, ignore
  }
}

test.describe('DITA Student Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`file://${ditaPath}/page-index.html`);
    await clearStorage(page);
    await page.reload();
    await waitForBootstrap(page);
  });

  test('Flow: Student login creates session and shows status panel', async ({ page }) => {
    // Verify login form is visible
    const loginForm = page.locator('qd-login');
    await expect(loginForm).toBeVisible();

    // Fill login form
    await loginForm.locator('input[name="serviceId"]').fill('ALICE01');
    await loginForm.locator('input[name="name"]').fill('Alice Johnson');
    await loginForm.locator('input[name="pin"]').fill('1234');

    // Submit login
    await loginForm.locator('button[type="submit"]').click();

    // Close PIN confirmation dialog if it appears
    await closePinConfirmationDialog(page);

    // Verify status panel appears (login successful)
    const statusPanel = page.locator('qd-status');
    await expect(statusPanel).toBeVisible({ timeout: 2000 });

    // Verify login form is hidden
    await expect(loginForm).not.toBeVisible();

    // Verify status shows initial progress (0 correct)
    await expect(statusPanel.locator('.progress-text')).toContainText('0/');
    await expect(statusPanel.locator('.progress-text')).toContainText('Correct');

    // Verify status indicator is red (no progress)
    const indicator = statusPanel.locator('.status-indicator');
    await expect(indicator).toHaveClass(/red/);
  });

  test('Flow: Answer MCQ question and verify validation', async ({ page }) => {
    // Login
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('BOB02');
    await loginForm.locator('input[name="name"]').fill('Bob Smith');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await loginForm.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await page.locator('qd-status').waitFor();

    // Navigate to MCQ quiz page
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    // Verify quiz table is interactive
    const quizTable = page.locator('table.qd-quiz');
    await expect(quizTable).toBeVisible();
    await expect(quizTable).toHaveClass(/qd-quiz-interactive/);

    // Get first question input (should be select dropdown for MCQ)
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await expect(firstInput).toBeVisible();

    // Select first option (index 1, since 0 is placeholder)
    await firstInput.selectOption({ index: 1 });

    // Wait for auto-save (debounced)
    await page.waitForTimeout(500);

    // Verify answer cell gets validation styling
    const firstRow = quizTable.locator('tbody tr').first();
    const answerCell = firstRow.locator('td').nth(1);

    // Cell should have either qd-answer-correct or qd-answer-incorrect class
    const cellClass = await answerCell.getAttribute('class');
    expect(cellClass).toMatch(/qd-answer-(correct|incorrect)/);
  });

  test('Flow: Answer numeric question and verify auto-save', async ({ page }) => {
    // Login
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('CAROL03');
    await loginForm.locator('input[name="name"]').fill('Carol White');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await loginForm.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await page.locator('qd-status').waitFor();

    // Navigate to numeric quiz page
    await page.click('a.quizPageBtn[href*="quiz-numeric"]');
    await page.waitForURL(/quiz-numeric\.html/);
    await waitForBootstrap(page);

    // Get first numeric input
    const quizTable = page.locator('table.qd-quiz');
    const numericInput = quizTable.locator('.qd-quiz-input').first();
    await expect(numericInput).toBeVisible();

    // Enter numeric value
    await numericInput.fill('42.5');

    // Wait for auto-save
    await page.waitForTimeout(500);

    // Verify validation styling applied
    const firstRow = quizTable.locator('tbody tr').first();
    const answerCell = firstRow.locator('td').nth(1);
    const cellClass = await answerCell.getAttribute('class');
    expect(cellClass).toMatch(/qd-answer-(correct|incorrect)/);
  });

  test('Flow: Multi-page navigation persists session', async ({ page }) => {
    // Login
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('DAVE04');
    await loginForm.locator('input[name="name"]').fill('Dave Brown');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await loginForm.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    const statusPanel = page.locator('qd-status');
    await statusPanel.waitFor();

    // Navigate to quiz page 1
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    // Verify session persists (status panel visible)
    await expect(statusPanel).toBeVisible();

    // Answer first question
    const quizTable = page.locator('table.qd-quiz');
    await quizTable.locator('.qd-quiz-input').first().selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Navigate to quiz page 2 (numeric)
    await page.goto(`file://${ditaPath}/Pages/quiz-numeric.html`);
    await waitForBootstrap(page);

    // Verify session still active
    await expect(statusPanel).toBeVisible();

    // Verify quiz table is interactive
    const numericTable = page.locator('table.qd-quiz');
    await expect(numericTable).toHaveClass(/qd-quiz-interactive/);

    // Answer numeric question
    await numericTable.locator('.qd-quiz-input').first().fill('100');
    await page.waitForTimeout(500);

    // Navigate back to index
    await page.goto(`file://${ditaPath}/page-index.html`);
    await waitForBootstrap(page);

    // Verify session persists and progress updated
    await expect(statusPanel).toBeVisible();
    const progressText = await statusPanel.locator('.progress-text').textContent();
    expect(progressText).toMatch(/\d+\/\d+/); // Should show "X/Y Correct"
  });

  test('Flow: Progress tracking and badge updates', async ({ page }) => {
    // Login
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('EVE05');
    await loginForm.locator('input[name="name"]').fill('Eve Davis');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await loginForm.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await page.locator('qd-status').waitFor();

    // Verify initial badges are red (unstarted)
    const quizButtons = page.locator('.quizPageBtn');
    const firstButton = quizButtons.first();
    await expect(firstButton).toHaveClass(/qd-badge-red/);

    // Navigate to quiz page
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    // Answer two questions: first correct, second incorrect (partial completion)
    const quizTable = page.locator('table.qd-quiz');

    // Answer first question correctly (assuming option 1 is correct)
    await quizTable.locator('.qd-quiz-input').nth(0).selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Answer second question incorrectly (select wrong option)
    await quizTable.locator('.qd-quiz-input').nth(1).selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Navigate back to index
    await page.goto(`file://${ditaPath}/page-index.html`);
    await waitForBootstrap(page);

    // Verify badge changed from red to amber (incomplete)
    const mcqButton = page.locator('a.quizPageBtn[href*="quiz-mcq"]');
    await expect(mcqButton).toHaveClass(/qd-badge-amber/);

    // Verify status indicator changed from red to amber
    const statusPanel = page.locator('qd-status');
    const indicator = statusPanel.locator('.status-indicator');
    await expect(indicator).toHaveClass(/amber/);
  });

  test('Flow: Answer persistence across browser reload', async ({ page }) => {
    // Login
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('FRANK06');
    await loginForm.locator('input[name="name"]').fill('Frank Miller');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await loginForm.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await page.locator('qd-status').waitFor();

    // Navigate to quiz page and answer question
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    const quizTable = page.locator('table.qd-quiz');
    const firstInput = quizTable.locator('.qd-quiz-input').first();
    await firstInput.selectOption({ index: 2 }); // Select option 2
    await page.waitForTimeout(500);

    // Reload page (simulate browser restart)
    await page.reload();
    await waitForBootstrap(page);

    // Verify session restored from IndexedDB
    const statusPanel = page.locator('qd-status');
    await expect(statusPanel).toBeVisible();

    // Verify quiz table is interactive
    await expect(quizTable).toHaveClass(/qd-quiz-interactive/);

    // Verify answer is pre-filled
    const restoredInput = quizTable.locator('.qd-quiz-input').first();
    const selectedValue = await restoredInput.inputValue();
    expect(selectedValue).toBe('2');

    // Verify validation styling persists
    const firstRow = quizTable.locator('tbody tr').first();
    const answerCell = firstRow.locator('td').nth(1);
    const cellClass = await answerCell.getAttribute('class');
    expect(cellClass).toMatch(/qd-answer-(correct|incorrect)/);
  });

  test('Flow: Logout clears session and shows login form', async ({ page }) => {
    // Login
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('GRACE07');
    await loginForm.locator('input[name="name"]').fill('Grace Lee');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await loginForm.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    const statusPanel = page.locator('qd-status');
    await statusPanel.waitFor();

    // Navigate to quiz and answer
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    const quizTable = page.locator('table.qd-quiz');
    await quizTable.locator('.qd-quiz-input').first().selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Navigate back to index
    await page.goto(`file://${ditaPath}/page-index.html`);
    await waitForBootstrap(page);

    // Click logout
    await statusPanel.locator('.logout-button').click();

    // Verify login form reappears
    await expect(loginForm).toBeVisible({ timeout: 2000 });

    // Verify status panel hidden
    await expect(statusPanel).not.toBeVisible();

    // Verify badges removed (no session)
    const quizButtons = page.locator('.quizPageBtn');
    const firstButton = quizButtons.first();
    await expect(firstButton).not.toHaveClass(/qd-badge-(red|amber|green)/);

    // Login again with different user
    await loginForm.locator('input[name="serviceId"]').fill('HENRY08');
    await loginForm.locator('input[name="name"]').fill('Henry Wilson');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await loginForm.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);

    await statusPanel.waitFor();

    // Verify new session created (progress starts at 0)
    await expect(statusPanel.locator('.progress-text')).toContainText('0/');

    // Navigate to quiz page
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    // Verify quiz table has no pre-filled answers
    const newQuizTable = page.locator('table.qd-quiz');
    const firstInput = newQuizTable.locator('.qd-quiz-input').first();
    const value = await firstInput.inputValue();
    expect(value).toBe(''); // No pre-filled answer
  });

  test('Flow: Analysis table interaction and persistence', async ({ page }) => {
    // Login
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('IVY09');
    await loginForm.locator('input[name="name"]').fill('Ivy Garcia');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await loginForm.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await page.locator('qd-status').waitFor();

    // Navigate to analysis page
    await page.click('a.quizPageBtn[href*="gram-1"]');
    await page.waitForURL(/gram-1\.html/);
    await waitForBootstrap(page);

    // Find analysis table
    const analysisTable = page.locator('table.qd-analysis');
    await expect(analysisTable).toBeVisible();

    // Find editable cell (class="interactive")
    const editableCell = analysisTable.locator('td.interactive').first();
    await expect(editableCell).toBeVisible();

    // Verify cell is contenteditable
    const isEditable = await editableCell.getAttribute('contenteditable');
    expect(isEditable).toBe('true');

    // Enter text
    await editableCell.click();
    await editableCell.fill('Test analysis entry');

    // Wait for auto-save
    await page.waitForTimeout(700); // Analysis has 500ms debounce

    // Reload page
    await page.reload();
    await waitForBootstrap(page);

    // Verify content persists
    const reloadedCell = analysisTable.locator('td.interactive').first();
    const content = await reloadedCell.textContent();
    expect(content).toContain('Test analysis entry');
  });

  // Task 3: Quiz Table Structure Tests
  test('Structure: MCQ quiz table hides detail column and secures answers', async ({ page }) => {
    // Login
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('STRUCT01');
    await loginForm.locator('input[name="name"]').fill('Structure Test');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await loginForm.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await page.locator('qd-status').waitFor();

    // Navigate to MCQ quiz page
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    const quizTable = page.locator('table.qd-quiz');
    await expect(quizTable).toBeVisible();

    // Get header row
    const headerRow = quizTable.locator('thead tr');
    const headerCells = headerRow.locator('th');

    // Table should have 3 columns: Question, Answer, Detail
    const cellCount = await headerCells.count();
    expect(cellCount).toBe(3);

    // Detail column (3rd) should be hidden - contains MCQ options/tolerances
    const detailHeader = headerCells.nth(2);
    await expect(detailHeader).toHaveClass(/qd-hidden/);

    // Verify body cells in detail column are also hidden
    const firstBodyRow = quizTable.locator('tbody tr').first();
    const bodyCells = firstBodyRow.locator('td');
    await expect(bodyCells.nth(2)).toHaveClass(/qd-hidden/);

    // Answer column (2nd) is visible in interactive mode but contains input controls
    // Original answer text should be replaced - verify it contains a select element
    const answerCell = bodyCells.nth(1);
    await expect(answerCell).not.toHaveClass(/qd-hidden/);
    const inputControl = answerCell.locator('.qd-quiz-input');
    await expect(inputControl).toBeVisible();
  });

  test('Structure: Numeric quiz table hides detail column and secures answers', async ({
    page,
  }) => {
    // Login
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('STRUCT02');
    await loginForm.locator('input[name="name"]').fill('Structure Test 2');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await loginForm.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await page.locator('qd-status').waitFor();

    // Navigate to numeric quiz page
    await page.click('a.quizPageBtn[href*="quiz-numeric"]');
    await page.waitForURL(/quiz-numeric\.html/);
    await waitForBootstrap(page);

    const quizTable = page.locator('table.qd-quiz');
    await expect(quizTable).toBeVisible();

    // Get header row
    const headerRow = quizTable.locator('thead tr');
    const headerCells = headerRow.locator('th');

    // Detail column (3rd) should be hidden - contains tolerances
    const detailHeader = headerCells.nth(2);
    await expect(detailHeader).toHaveClass(/qd-hidden/);

    // Answer column (2nd) is visible in interactive mode but contains input controls
    const firstBodyRow = quizTable.locator('tbody tr').first();
    const bodyCells = firstBodyRow.locator('td');
    const answerCell = bodyCells.nth(1);
    await expect(answerCell).not.toHaveClass(/qd-hidden/);
    const inputControl = answerCell.locator('.qd-quiz-input');
    await expect(inputControl).toBeVisible();
  });

  test('Structure: MCQ questions render as select elements', async ({ page }) => {
    // Login
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('STRUCT03');
    await loginForm.locator('input[name="name"]').fill('Structure Test 3');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await loginForm.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await page.locator('qd-status').waitFor();

    // Navigate to MCQ quiz page
    await page.click('a.quizPageBtn[href*="quiz-mcq"]');
    await page.waitForURL(/quiz-mcq\.html/);
    await waitForBootstrap(page);

    const quizTable = page.locator('table.qd-quiz');
    await expect(quizTable).toBeVisible();

    // All inputs in MCQ table should be select elements
    const inputs = quizTable.locator('.qd-quiz-input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);

    // Verify each input is a select element
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
      expect(tagName).toBe('select');
    }
  });

  test('Structure: Numeric questions render as text input elements', async ({ page }) => {
    // Login
    const loginForm = page.locator('qd-login');
    await loginForm.locator('input[name="serviceId"]').fill('STRUCT04');
    await loginForm.locator('input[name="name"]').fill('Structure Test 4');
    await loginForm.locator('input[name="pin"]').fill('1234');
    await loginForm.locator('button[type="submit"]').click();
    await closePinConfirmationDialog(page);
    await page.locator('qd-status').waitFor();

    // Navigate to numeric quiz page
    await page.click('a.quizPageBtn[href*="quiz-numeric"]');
    await page.waitForURL(/quiz-numeric\.html/);
    await waitForBootstrap(page);

    const quizTable = page.locator('table.qd-quiz');
    await expect(quizTable).toBeVisible();

    // All inputs in numeric table should be text input elements
    const inputs = quizTable.locator('.qd-quiz-input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);

    // Verify each input is an input[type="text"] element
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
      expect(tagName).toBe('input');

      const inputType = await input.getAttribute('type');
      expect(inputType).toBe('text');
    }
  });
});
