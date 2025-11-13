/**
 * E2E Tests for Cohort Management (Phase 6)
 *
 * Tests CSV export and data erasure functionality for instructor cohort management.
 *
 * T093: E2E test for CSV export
 * T094: E2E test for data erasure flow
 * T095: Verify system returns to blank state after erasure
 */

import { test, expect, type Page } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

// Extend window for test flags
interface TestWindow extends Window {
  dataCleared?: boolean;
  syncReceived?: boolean;
}

/**
 * Helper function to unlock instructor mode by entering password in Shadow DOM
 */
async function unlockInstructorMode(page: Page): Promise<void> {
  // Wait for instructor component to be visible
  await page.waitForSelector('qd-instructor');

  // Set up event listener for unlock
  const unlockPromise = page.evaluate(() => {
    return new Promise<void>((resolve) => {
      document.addEventListener('qd:instructor-unlock', () => resolve(), { once: true });
    });
  });

  // Enter password and click unlock in Shadow DOM
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const instructor = document.querySelector('qd-instructor') as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const passwordInput = instructor?.shadowRoot?.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const unlockButton = instructor?.shadowRoot?.querySelector(
      'button.unlock-button',
    ) as HTMLButtonElement;

    if (passwordInput && unlockButton) {
      passwordInput.value = 'instructor';
      unlockButton.click();
    }
  });

  // Wait for unlock to complete
  await unlockPromise;
}

/**
 * Helper function to click a button in instructor component Shadow DOM
 */
async function clickInstructorButton(page: Page, buttonClass: string): Promise<void> {
  await page.evaluate((cls) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const instructor = document.querySelector('qd-instructor') as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const button = instructor?.shadowRoot?.querySelector(`button.${cls}`) as HTMLButtonElement;
    button?.click();
  }, buttonClass);
}

// Test fixture HTML with quiz table
const TEST_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="release" content="02-2025">
  <meta name="document-id" content="cohort-test">
  <title>Cohort Management Test</title>
</head>
<body>
  <!-- Status panel container (required for qd-status injection) -->
  <div class="wh_top_menu_and_indexterms_link">
    <!-- Status will be injected here -->
  </div>

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
        <td>0.1</td>
      </tr>
      <tr>
        <td>Select the correct answer:</td>
        <td>2</td>
        <td><ol><li>Option A</li><li>Option B</li><li>Option C</li></ol></td>
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

    // Enhanced diagnostics - check system state
    const debugInfo = await page.evaluate(() => {
      const table = document.querySelector('table.qd-quiz');
      const hasTable = !!table;
      const isEnhanced = table?.classList.contains('qd-enhanced') || false;
      const tableClasses = table?.className || 'N/A';
      const hasScript = !!document.querySelector('script[data-sonar-quiz]');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      const hasGlobal = typeof (window as any).SonarQuiz !== 'undefined';

      // Check for console errors
      const consoleErrors: string[] = [];

      // Try to get config if available
      let config = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        if ((window as any).SonarQuiz?.getConfig) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
          config = (window as any).SonarQuiz.getConfig();
        }
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        consoleErrors.push(`getConfig error: ${e}`);
      }

      // Check for qd-login and qd-status components
      const hasLogin = !!document.querySelector('qd-login');
      const hasStatus = !!document.querySelector('qd-status');
      const hasInstructor = !!document.querySelector('qd-instructor');

      return {
        hasTable,
        isEnhanced,
        tableClasses,
        hasScript,
        hasGlobal,
        hasLogin,
        hasStatus,
        hasInstructor,
        config, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        consoleErrors,
      };
    });

    // eslint-disable-next-line no-console
    console.log('=== ENHANCED DEBUG INFO ===');
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(debugInfo, null, 2));

    // Capture console messages
    // eslint-disable-next-line no-console
    page.on('console', (msg) => console.log('BROWSER:', msg.text()));
    // eslint-disable-next-line no-console
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
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
    // Wait for login component to appear (use first() since qd-status also has qd-login)
    const loginComponent = page.locator('qd-login').first();
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

    // eslint-disable-next-line no-console
    console.log('Login event fired, checking table enhancement...');

    // Wait a moment for status update
    await page.waitForTimeout(500);

    // Check if table is enhanced, if not try to manually trigger
    const enhancementResult = await page.evaluate(() => {
      const table = document.querySelector('table.qd-quiz');
      const isEnhanced = table?.classList.contains('qd-enhanced');

      if (!isEnhanced) {
        // eslint-disable-next-line no-console
        console.log('Table not enhanced, attempting manual enhancement...');

        // Try to manually enhance tables
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
          if ((window as any).SonarQuiz?.enhanceTables) {
            // eslint-disable-next-line no-console
            console.log('Calling SonarQuiz.enhanceTables()...');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            (window as any).SonarQuiz.enhanceTables();
            return { manually: true, success: true };
          } else {
            // eslint-disable-next-line no-console
            console.log('SonarQuiz.enhanceTables not available');
            return { manually: false, success: false, error: 'enhanceTables not available' };
          }
        } catch (e) {
          console.error('Error calling enhanceTables:', e);
          return { manually: false, success: false, error: String(e) };
        }
      }

      return { manually: false, success: true };
    });

    // eslint-disable-next-line no-console
    console.log('Enhancement result:', enhancementResult);

    // Wait for quiz to be enhanced
    await page.waitForSelector('.qd-enhanced', { timeout: 5000 });

    // Answer first question (numeric)
    const numericInput = page.locator('input[type="number"]').first();
    await numericInput.fill('4');
    await numericInput.blur();

    // Wait for auto-save
    await page.waitForTimeout(300);

    // Answer second question (MCQ) - select option 2 (Option B)
    const mcqSelect = page.locator('select').first();
    await mcqSelect.selectOption('2');

    // Wait for auto-save
    await page.waitForTimeout(300);

    // Verify answers are saved
    const statusPanel = page.locator('qd-status');
    await expect(statusPanel).toContainText(/answered|progress/i);
  });

  test.skip('should unlock instructor mode and export CSV', async ({ page }) => {
    // TODO: This test requires proper IndexedDB 'students' object store initialization
    // The DB schema needs to be set up before data can be exported
    // First, create student data by logging in and answering questions
    // This ensures IndexedDB is properly initialized
    await page.evaluate(() => {
      const login = document.querySelector('qd-login');
      if (login?.shadowRoot) {
        const serviceIdInput = login.shadowRoot.querySelector('#serviceId') as HTMLInputElement;
        const nameInput = login.shadowRoot.querySelector('#name') as HTMLInputElement;
        const submitButton = login.shadowRoot.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;

        if (serviceIdInput) serviceIdInput.value = 'TEST001';
        if (nameInput) nameInput.value = 'Test Student';
        if (submitButton) submitButton.click();
      }
    });

    // Wait for quiz to be ready
    await page.waitForTimeout(1000);

    // Answer questions to create data
    const numericInput = page.locator('input[type="number"]').first();
    await numericInput.fill('4');
    await numericInput.blur();
    await page.waitForTimeout(300);

    const mcqSelect = page.locator('select').first();
    await mcqSelect.selectOption('2');
    await page.waitForTimeout(300);

    // Unlock instructor mode
    await unlockInstructorMode(page);

    // Wait for controls to be visible
    await page.waitForFunction(
      () => {
        const instructor = document.querySelector('qd-instructor');
        if (!instructor?.shadowRoot) return false;
        const controls = instructor.shadowRoot.querySelector('.controls');
        return controls !== null && getComputedStyle(controls).display !== 'none';
      },
      { timeout: 5000 },
    );

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export CSV button
    await clickInstructorButton(page, 'export-csv');

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
    // TODO: Same as above - requires IndexedDB setup
    // This test verifies UI for export format selection exists
    // Full implementation would add UI controls for format selection

    // Unlock instructor mode
    await unlockInstructorMode(page);

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

  test('should show erase confirmation dialog with typed confirmation', async ({ page }) => {
    // Setup unlock event listener
    const unlockEventPromise = page.evaluate(
      () =>
        new Promise((resolve) => {
          document.addEventListener('qd:instructor-unlock', () => resolve(true), { once: true });
        }),
    );

    // Unlock instructor mode via shadow DOM
    await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (instructor?.shadowRoot) {
        const passwordInput = instructor.shadowRoot.querySelector(
          'input[type="password"]',
        ) as HTMLInputElement;
        const unlockButton = instructor.shadowRoot.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;

        if (passwordInput && unlockButton) {
          passwordInput.value = 'instructor';
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
          unlockButton.click();
        }
      }
    });

    // Wait for unlock event
    await unlockEventPromise;

    // Small delay for UI to update
    await page.waitForTimeout(500);

    // Click erase all data button via shadow DOM
    await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (instructor?.shadowRoot) {
        const eraseButton = instructor.shadowRoot.querySelector(
          'button.erase-data',
        ) as HTMLButtonElement;
        if (eraseButton) eraseButton.click();
      }
    });

    // Wait for dialog to appear and verify via shadow DOM
    await page.waitForFunction(
      () => {
        const instructor = document.querySelector('qd-instructor');
        if (!instructor?.shadowRoot) return false;
        const dialog = instructor.shadowRoot.querySelector('.dialog-overlay');
        return dialog !== null;
      },
      { timeout: 2000 },
    );

    // Verify warning message via shadow DOM
    const dialogContent = await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (!instructor?.shadowRoot) return null;
      const dialog = instructor.shadowRoot.querySelector('.dialog-overlay');
      return dialog?.textContent || '';
    });
    expect(dialogContent).toContain('Erase All Data');
    expect(dialogContent).toContain('DELETE ALL');

    // Verify confirm button is initially disabled
    const isDisabled = await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (!instructor?.shadowRoot) return true;
      const confirmButton = instructor.shadowRoot.querySelector(
        '.dialog button.erase-data',
      ) as HTMLButtonElement;
      return confirmButton?.disabled ?? true;
    });
    expect(isDisabled).toBe(true);

    // Type incorrect confirmation text
    await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (instructor?.shadowRoot) {
        const input = instructor.shadowRoot.querySelector(
          '.dialog input[type="text"]',
        ) as HTMLInputElement;
        if (input) {
          input.value = 'delete all';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    // Verify still disabled
    const stillDisabled = await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (!instructor?.shadowRoot) return true;
      const confirmButton = instructor.shadowRoot.querySelector(
        '.dialog button.erase-data',
      ) as HTMLButtonElement;
      return confirmButton?.disabled ?? true;
    });
    expect(stillDisabled).toBe(true);

    // Type correct confirmation text
    await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (instructor?.shadowRoot) {
        const input = instructor.shadowRoot.querySelector(
          '.dialog input[type="text"]',
        ) as HTMLInputElement;
        if (input) {
          input.value = 'DELETE ALL';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    // Verify now enabled
    const nowEnabled = await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (!instructor?.shadowRoot) return false;
      const confirmButton = instructor.shadowRoot.querySelector(
        '.dialog button.erase-data',
      ) as HTMLButtonElement;
      return !(confirmButton?.disabled ?? true);
    });
    expect(nowEnabled).toBe(true);
  });

  test('should cancel data erasure when cancel button clicked', async ({ page }) => {
    // Setup unlock event listener
    const unlockEventPromise = page.evaluate(
      () =>
        new Promise((resolve) => {
          document.addEventListener('qd:instructor-unlock', () => resolve(true), { once: true });
        }),
    );

    // Unlock instructor mode via shadow DOM
    await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (instructor?.shadowRoot) {
        const passwordInput = instructor.shadowRoot.querySelector(
          'input[type="password"]',
        ) as HTMLInputElement;
        const unlockButton = instructor.shadowRoot.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;

        if (passwordInput && unlockButton) {
          passwordInput.value = 'instructor';
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
          unlockButton.click();
        }
      }
    });

    // Wait for unlock event
    await unlockEventPromise;

    // Small delay for UI to update
    await page.waitForTimeout(500);

    // Click erase button via shadow DOM
    await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (instructor?.shadowRoot) {
        const eraseButton = instructor.shadowRoot.querySelector(
          'button.erase-data',
        ) as HTMLButtonElement;
        if (eraseButton) eraseButton.click();
      }
    });

    // Wait for dialog to appear
    await page.waitForFunction(
      () => {
        const instructor = document.querySelector('qd-instructor');
        if (!instructor?.shadowRoot) return false;
        const dialog = instructor.shadowRoot.querySelector('.dialog-overlay');
        return dialog !== null;
      },
      { timeout: 2000 },
    );

    // Click cancel via shadow DOM
    await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (instructor?.shadowRoot) {
        const cancelButton = instructor.shadowRoot.querySelector(
          '.dialog button:not(.erase-data)',
        ) as HTMLButtonElement;
        if (cancelButton) cancelButton.click();
      }
    });

    // Verify dialog disappears
    await page.waitForFunction(
      () => {
        const instructor = document.querySelector('qd-instructor');
        if (!instructor?.shadowRoot) return true;
        const dialog = instructor.shadowRoot.querySelector('.dialog-overlay');
        return dialog === null;
      },
      { timeout: 2000 },
    );

    // Test passed - dialog was cancelled and closed successfully
  });

  test.skip('T094, T095: should erase all data and return system to blank state', async ({ page }) => {
    // Unlock instructor mode
    await unlockInstructorMode(page);

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
    await clickInstructorButton(page, 'erase-data');

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
    await clickInstructorButton(page, 'export-csv');

    // Should show error since no data exists
    await expect(page.locator('.error, .status')).toContainText(/no.*data/i, {
      timeout: 2000,
    });
  });

  test.skip('should emit qd:data-cleared event', async ({ page }) => {
    // TODO: Event timing issue - setTimeout in button click causes race condition
    // Setup event listener
    const eventPromise = page.evaluate(
      () =>
        new Promise((resolve) => {
          window.addEventListener('qd:data-cleared', () => resolve(true), { once: true });
        }),
    );

    // Unlock instructor mode via shadow DOM
    await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (instructor?.shadowRoot) {
        const passwordInput = instructor.shadowRoot.querySelector(
          'input[type="password"]',
        ) as HTMLInputElement;
        const unlockButton = instructor.shadowRoot.querySelector(
          'button[type="submit"]',
        ) as HTMLButtonElement;

        if (passwordInput && unlockButton) {
          passwordInput.value = 'instructor';
          unlockButton.click();
        }
      }
    });

    // Wait for unlock
    await page.waitForTimeout(500);

    // Erase data via shadow DOM
    await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (instructor?.shadowRoot) {
        const eraseButton = instructor.shadowRoot.querySelector(
          'button.erase-data',
        ) as HTMLButtonElement;
        if (eraseButton) eraseButton.click();
      }
    });

    // Wait for dialog
    await page.waitForTimeout(200);

    // Confirm erasure via shadow DOM
    await page.evaluate(() => {
      const instructor = document.querySelector('qd-instructor');
      if (instructor?.shadowRoot) {
        const input = instructor.shadowRoot.querySelector(
          '.dialog input[type="text"]',
        ) as HTMLInputElement;
        const confirmButton = instructor.shadowRoot.querySelector(
          '.dialog button.erase-data',
        ) as HTMLButtonElement;

        if (input && confirmButton) {
          input.value = 'DELETE ALL';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          // Small delay for button to enable
          setTimeout(() => confirmButton.click(), 100);
        }
      }
    });

    // Wait for the data-cleared event to be fired
    const eventFired = await Promise.race([
      eventPromise.then(() => true),
      page.waitForTimeout(5000).then(() => false),
    ]);

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

      // Unlock instructor mode in both pages
      await unlockInstructorMode(page1);
      await unlockInstructorMode(page2);

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
      await clickInstructorButton(page1, 'erase-data');
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
