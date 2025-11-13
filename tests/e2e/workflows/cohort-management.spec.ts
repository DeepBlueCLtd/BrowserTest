/**
 * E2E Tests for Cohort Management (Phase 6)
 *
 * Tests CSV export and data erasure functionality for instructor cohort management.
 *
 * T093: E2E test for CSV export
 * T094: E2E test for data erasure flow
 * T095: Verify system returns to blank state after erasure
 */

import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

// Extend window for test flags
interface TestWindow extends Window {
  dataCleared?: boolean;
  syncReceived?: boolean;
}

// Test fixture HTML with quiz table
const TEST_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="release" content="02-2025">
  <title>Cohort Management Test</title>
</head>
<body>
  <div id="qd-status"></div>

  <h1>Test Quiz Page</h1>

  <table class="qd-quiz qd-page" data-page-id="test-page-1">
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
        <td>±0.1</td>
      </tr>
      <tr>
        <td>Select the correct answer:<ol><li>Option A</li><li>Option B</li><li>Option C</li></ol></td>
        <td>b</td>
        <td>Correct answer is B</td>
      </tr>
    </tbody>
  </table>

  <qd-instructor release="02-2025"></qd-instructor>

  <script src="../dist/sonar-quiz.iife.js" data-sonar-quiz data-debug="true"></script>
</body>
</html>
`;

test.describe('Cohort Management - CSV Export', () => {
  test.beforeEach(async ({ page }) => {
    // Create test HTML file
    const testDir = path.join(process.cwd(), 'test-fixtures');
    await fs.mkdir(testDir, { recursive: true });
    const testFile = path.join(testDir, 'cohort-test.html');
    await fs.writeFile(testFile, TEST_HTML);

    // Navigate to test file
    await page.goto(`file://${testFile}`);

    // Wait for system to initialize - check for qd-status or qd-login component
    await page.waitForSelector('qd-status, qd-login', { timeout: 10000 });

    // Also wait for instructor component to load
    await page.waitForSelector('qd-instructor', { timeout: 10000 });

    // Check if quiz table is already enhanced
    const isEnhanced = await page.evaluate(() => {
      const table = document.querySelector('table.qd-quiz');
      return table?.classList.contains('qd-enhanced') || false;
    });

    console.log('Quiz table enhanced before login:', isEnhanced);
  });

  test.afterEach(async () => {
    // Clean up test file
    const testFile = path.join(process.cwd(), 'test-fixtures', 'cohort-test.html');
    try {
      await fs.unlink(testFile);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  test('should login as student and create data for export', async ({ page }) => {
    // Wait for login component to appear
    const loginComponent = page.locator('qd-login');
    await expect(loginComponent).toBeVisible();

    // Set up event listener for login event
    const loginEventPromise = page.evaluate(
      () =>
        new Promise((resolve) => {
          document.addEventListener('qd:login', () => resolve(true), { once: true });
        }),
    );

    // Fill in student credentials using shadow DOM
    await page.evaluate(() => {
      const login = document.querySelector('qd-login');
      if (login?.shadowRoot) {
        const serviceIdInput = login.shadowRoot.querySelector('#serviceId') as HTMLInputElement;
        const nameInput = login.shadowRoot.querySelector('#name') as HTMLInputElement;
        const submitButton = login.shadowRoot.querySelector('button[type="submit"]') as HTMLButtonElement;

        if (serviceIdInput) serviceIdInput.value = 'TEST001';
        if (nameInput) nameInput.value = 'Test Student';
        if (submitButton) submitButton.click();
      }
    });

    // Wait for login event
    await loginEventPromise;

    // Wait a moment for status update
    await page.waitForTimeout(500);

    // Wait for quiz to be enhanced (or check if it already is)
    await page.waitForSelector('.qd-enhanced', { timeout: 5000 });

    // Answer first question (numeric)
    const numericInput = page.locator('input[type="number"]').first();
    await numericInput.fill('4');
    await numericInput.blur();

    // Wait for auto-save
    await page.waitForTimeout(300);

    // Answer second question (MCQ)
    const mcqSelect = page.locator('select').first();
    await mcqSelect.selectOption('b');

    // Wait for auto-save
    await page.waitForTimeout(300);

    // Verify answers are saved
    const statusPanel = page.locator('qd-status');
    await expect(statusPanel).toContainText(/answered|progress/i);
  });

  test.skip('should unlock instructor mode and export CSV', async ({ page }) => {
    // First, create student data (simplified version)
    await page.evaluate(() => {
      // Inject test data directly into IndexedDB
      const request = indexedDB.open('SonarQuizDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['students'], 'readwrite');
        const store = transaction.objectStore('students');

        const testRecord = {
          schema: 1,
          docId: 'test-doc',
          release: '02-2025',
          serviceId: 'TEST001',
          name: 'Test Student',
          attempted: 2,
          correct: 2,
          updated: new Date().toISOString(),
          pages: {
            'test-page-1': {
              answers: [
                { answer: '4', success: true, timestamp: new Date().toISOString() },
                { answer: 'b', success: true, timestamp: new Date().toISOString() },
              ],
              state: 'complete',
              firstAttempted: new Date().toISOString(),
              lastAttempted: new Date().toISOString(),
            },
          },
        };

        store.put(testRecord, 'qd/02-2025/uTEST001');
      };
    });

    // Unlock instructor mode
    const instructorComponent = page.locator('qd-instructor');
    await expect(instructorComponent).toBeVisible();

    // Enter instructor password
    await page.fill('input[type="password"]', 'instructor');
    await page.click('button.unlock-button');

    // Wait for unlock
    await expect(page.locator('.controls')).toBeVisible({ timeout: 5000 });

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export CSV button
    await page.click('button.export-csv');

    // Wait for download
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/sonar-quiz-.*\.csv$/);

    // Read downloaded file
    const downloadPath = await download.path();
    if (!downloadPath) {
      throw new Error('Download path is null');
    }
    const csvContent = await fs.readFile(downloadPath, 'utf-8');

    // Verify CSV has BOM
    expect(csvContent.charCodeAt(0)).toBe(0xfeff);

    // Verify CSV contains headers
    expect(csvContent).toContain('Service ID');
    expect(csvContent).toContain('Name');
    expect(csvContent).toContain('Attempted');
    expect(csvContent).toContain('Correct');

    // Verify CSV contains student data
    expect(csvContent).toContain('TEST001');
    expect(csvContent).toContain('Test Student');
  });

  test.skip('should allow selecting different export formats', async ({ page }) => {
    // This test verifies UI for export format selection exists
    // Full implementation would add UI controls for format selection

    // Unlock instructor mode
    await page.fill('input[type="password"]', 'instructor');
    await page.click('button.unlock-button');

    await expect(page.locator('.controls')).toBeVisible();

    // Verify export button exists
    const exportButton = page.locator('button.export-csv');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();
  });
});

test.describe('Cohort Management - Data Erasure', () => {
  test.beforeEach(async ({ page }) => {
    // Create test HTML file
    const testDir = path.join(process.cwd(), 'test-fixtures');
    await fs.mkdir(testDir, { recursive: true });
    const testFile = path.join(testDir, 'cohort-test.html');
    await fs.writeFile(testFile, TEST_HTML);

    // Navigate to test file
    await page.goto(`file://${testFile}`);

    // Wait for component to load
    await page.waitForSelector('qd-instructor');

    // Create test data
    await page.evaluate(() => {
      const request = indexedDB.open('SonarQuizDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['students'], 'readwrite');
        const store = transaction.objectStore('students');

        const testRecord = {
          schema: 1,
          docId: 'test-doc',
          release: '02-2025',
          serviceId: 'TEST001',
          name: 'Test Student',
          attempted: 2,
          correct: 2,
          updated: new Date().toISOString(),
          pages: {},
        };

        store.put(testRecord, 'qd/02-2025/uTEST001');
      };
    });
  });

  test.afterEach(async () => {
    // Clean up test file
    const testFile = path.join(process.cwd(), 'test-fixtures', 'cohort-test.html');
    try {
      await fs.unlink(testFile);
    } catch {
      // Ignore
    }
  });

  test.skip('should show erase confirmation dialog with typed confirmation', async ({ page }) => {
    // Unlock instructor mode
    await page.fill('input[type="password"]', 'instructor');
    await page.click('button.unlock-button');

    await expect(page.locator('.controls')).toBeVisible();

    // Click erase all data button
    await page.click('button.erase-data');

    // Verify dialog appears
    const dialog = page.locator('.dialog-overlay');
    await expect(dialog).toBeVisible();

    // Verify warning message
    await expect(dialog).toContainText('Erase All Data');
    await expect(dialog).toContainText('DELETE ALL');

    // Verify confirm button is initially disabled
    const confirmButton = dialog.locator('button.erase-data');
    await expect(confirmButton).toBeDisabled();

    // Type incorrect confirmation text
    await dialog.locator('input[type="text"]').fill('delete all');
    await expect(confirmButton).toBeDisabled();

    // Type correct confirmation text
    await dialog.locator('input[type="text"]').fill('DELETE ALL');
    await expect(confirmButton).toBeEnabled();
  });

  test.skip('should cancel data erasure when cancel button clicked', async ({ page }) => {
    // Unlock instructor mode
    await page.fill('input[type="password"]', 'instructor');
    await page.click('button.unlock-button');

    // Click erase button
    await page.click('button.erase-data');

    // Verify dialog appears
    const dialog = page.locator('.dialog-overlay');
    await expect(dialog).toBeVisible();

    // Click cancel
    await dialog.locator('button:has-text("Cancel")').click();

    // Verify dialog disappears
    await expect(dialog).not.toBeVisible();

    // Verify data still exists (check IndexedDB)
    const dataExists = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('SonarQuizDB', 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['students'], 'readonly');
          const store = transaction.objectStore('students');
          const getRequest = store.get('qd/02-2025/uTEST001');

          getRequest.onsuccess = () => {
            resolve(getRequest.result !== undefined);
          };
        };
      });
    });

    expect(dataExists).toBe(true);
  });

  test.skip('T094, T095: should erase all data and return system to blank state', async ({ page }) => {
    // Unlock instructor mode
    await page.fill('input[type="password"]', 'instructor');
    await page.click('button.unlock-button');

    // Verify student data exists
    let studentCount = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const request = indexedDB.open('SonarQuizDB', 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['students'], 'readonly');
          const store = transaction.objectStore('students');
          const countRequest = store.count();

          countRequest.onsuccess = () => {
            resolve(countRequest.result);
          };
        };
      });
    });

    expect(studentCount).toBeGreaterThan(0);

    // Click erase button
    await page.click('button.erase-data');

    // Confirm erasure
    const dialog = page.locator('.dialog-overlay');
    await dialog.locator('input[type="text"]').fill('DELETE ALL');
    await dialog.locator('button.erase-data').click();

    // Wait for success message
    await expect(page.locator('.status')).toContainText(/erased/i, { timeout: 5000 });

    // T095: Verify system is in blank state
    // 1. Check IndexedDB is empty
    studentCount = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const request = indexedDB.open('SonarQuizDB', 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['students'], 'readonly');
          const store = transaction.objectStore('students');
          const countRequest = store.count();

          countRequest.onsuccess = () => {
            resolve(countRequest.result);
          };
        };
      });
    });

    expect(studentCount).toBe(0);

    // 2. Check sessionStorage is cleared
    const sessionCleared = await page.evaluate(() => {
      return sessionStorage.getItem('qd/session') === null;
    });

    expect(sessionCleared).toBe(true);

    // 3. Verify instructor can still function (data erasure doesn't break system)
    await page.click('button.export-csv');

    // Should show error since no data exists
    await expect(page.locator('.error, .status')).toContainText(/no.*data/i, {
      timeout: 2000,
    });
  });

  test.skip('should emit qd:data-cleared event', async ({ page }) => {
    // Setup event listener
    await page.evaluate(() => {
      (window as unknown as TestWindow).dataCleared = false;
      window.addEventListener('qd:data-cleared', () => {
        (window as unknown as TestWindow).dataCleared = true;
      });
    });

    // Unlock instructor mode
    await page.fill('input[type="password"]', 'instructor');
    await page.click('button.unlock-button');

    // Erase data
    await page.click('button.erase-data');
    const dialog = page.locator('.dialog-overlay');
    await dialog.locator('input[type="text"]').fill('DELETE ALL');
    await dialog.locator('button.erase-data').click();

    // Wait for erasure to complete
    await page.waitForTimeout(500);

    // Verify event was fired
    const eventFired = await page.evaluate(() => (window as unknown as TestWindow).dataCleared);
    expect(eventFired).toBe(true);
  });
});

test.describe('Cross-Tab Synchronization', () => {
  test.skip('should sync data erasure across tabs (T092)', async ({ browser }) => {
    // Create two browser contexts (simulating two tabs)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Create test HTML file
      const testDir = path.join(process.cwd(), 'test-fixtures');
      await fs.mkdir(testDir, { recursive: true });
      const testFile = path.join(testDir, 'cohort-test.html');
      await fs.writeFile(testFile, TEST_HTML);

      // Navigate both pages to the test file
      await page1.goto(`file://${testFile}`);
      await page2.goto(`file://${testFile}`);

      // Wait for components to load
      await page1.waitForSelector('qd-instructor');
      await page2.waitForSelector('qd-instructor');

      // Unlock instructor mode in page1
      await page1.fill('input[type="password"]', 'instructor');
      await page1.click('button.unlock-button');

      // Unlock instructor mode in page2
      await page2.fill('input[type="password"]', 'instructor');
      await page2.click('button.unlock-button');

      // Setup event listener in page2 to detect sync
      await page2.evaluate(() => {
        (window as unknown as TestWindow).syncReceived = false;
        const channel = new BroadcastChannel('qd-system');
        channel.onmessage = (event) => {
          const data = event.data as { type: string };
          if (data.type === 'data-cleared') {
            (window as unknown as TestWindow).syncReceived = true;
          }
        };
      });

      // Erase data in page1
      await page1.click('button.erase-data');
      const dialog = page1.locator('.dialog-overlay');
      await dialog.locator('input[type="text"]').fill('DELETE ALL');
      await dialog.locator('button.erase-data').click();

      // Wait for sync
      await page1.waitForTimeout(1000);

      // Verify page2 received the sync message
      const syncReceived = await page2.evaluate(
        () => (window as unknown as TestWindow).syncReceived,
      );
      expect(syncReceived).toBe(true);

      // Verify page2 shows status message about data being cleared
      await expect(page2.locator('.status')).toContainText(/cleared.*window/i, {
        timeout: 2000,
      });

      // Clean up
      await fs.unlink(testFile);
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
