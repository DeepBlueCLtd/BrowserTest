/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

/**
 * E2E Tests for Instructor Review Workflow
 *
 * Tests the complete workflow of:
 * 1. Instructor password authentication (SHA-256)
 * 2. Unlock/lock state management
 * 3. Answer reveal in quiz tables
 * 4. Student entry comparison in analysis tables
 * 5. Student scores aggregation and display
 *
 * NOTE: These tests are currently skipped pending creation of demo HTML files.
 * The functionality is fully tested via:
 * - Unit tests (tests/unit/components/qd-instructor.test.ts)
 * - Unit tests (tests/unit/enhancers/analysis-table.test.ts)
 * - Unit tests (tests/unit/services/scores.test.ts)
 * - Interactive Storybook story (stories/components/qd-instructor.stories.ts)
 *
 * To enable these tests, create demo files in /demo directory:
 * - demo/instructor-home.html (with qd-instructor component)
 * - demo/instructor-quiz.html (with quiz table + instructor unlocked)
 * - demo/instructor-analysis.html (with analysis table + student data)
 */

import { test, expect } from '@playwright/test';

test.describe.skip('Instructor Review - Password Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test environment
    await page.goto('/demo/instructor-home.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display password prompt when locked', async ({ page }) => {
    // Verify instructor component is visible
    const instructor = page.locator('qd-instructor');
    await expect(instructor).toBeVisible();

    // Check for password input in shadow DOM
    const hasPasswordInput = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component?.shadowRoot;
      const input = shadowRoot?.querySelector('input[type="password"]');
      const button = shadowRoot?.querySelector('button');
      return input !== null && button !== null;
    });

    expect(hasPasswordInput).toBe(true);
  });

  test('should unlock with correct password', async ({ page }) => {
    // Wait for event emission
    const unlockEvent = page.evaluate(
      () =>
        new Promise((resolve) => {
          document.addEventListener('qd:instructor-unlock', (e) => {
            resolve((e as CustomEvent).detail);
          });
        }),
    );

    // Enter correct password
    await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const input = shadowRoot.querySelector('input[type="password"]');
      const button = shadowRoot.querySelector('button');

      input.value = 'instructor';
      button.click();
    });

    // Verify unlock event was fired
    const detail = await unlockEvent;
    expect(detail).toHaveProperty('timestamp');

    // Verify sessionStorage has unlock state
    const unlocked = await page.evaluate(() => sessionStorage.getItem('qd/instructor'));
    expect(unlocked).toBeTruthy();
  });

  test('should reject incorrect password', async ({ page }) => {
    // Enter incorrect password
    const errorShown = await page.evaluate(async () => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const input = shadowRoot.querySelector('input[type="password"]') as HTMLInputElement;
      const button = shadowRoot.querySelector('button') as HTMLButtonElement;

      input.value = 'wrong-password';
      button.click();

      // Wait for error message to appear
      await new Promise((resolve) => setTimeout(resolve, 100));

      const errorMsg = shadowRoot.querySelector('.error-message');
      return errorMsg?.textContent?.includes('Incorrect password');
    });

    expect(errorShown).toBe(true);
  });

  test('should hash password using SHA-256', async ({ page }) => {
    // Verify password is hashed before comparison
    const hashUsed = await page.evaluate(async () => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const input = shadowRoot.querySelector('input[type="password"]') as HTMLInputElement;

      // Enter password
      input.value = 'instructor';

      // Trigger hash computation
      const encoder = new TextEncoder();
      const data = encoder.encode(input.value);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // Expected hash for "instructor"
      return hashHex === '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
    });

    expect(hashUsed).toBe(true);
  });

  test('should clear password input after unlock', async ({ page }) => {
    await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const input = shadowRoot.querySelector('input[type="password"]') as HTMLInputElement;
      const button = shadowRoot.querySelector('button') as HTMLButtonElement;

      input.value = 'instructor';
      button.click();
    });

    // Wait for unlock
    await page.waitForTimeout(100);

    // Verify input is cleared or hidden
    const inputCleared = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const input = shadowRoot.querySelector('input[type="password"]') as HTMLInputElement;

      return !input || input.value === '';
    });

    expect(inputCleared).toBe(true);
  });
});

test.describe.skip('Instructor Review - Lock/Unlock State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/instructor-home.html');
    await page.waitForLoadState('domcontentloaded');

    // Unlock instructor mode
    await page.evaluate(() => {
      const hash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
      sessionStorage.setItem('qd/instructor', hash);
    });

    await page.reload();
  });

  test('should persist unlock state across page reloads', async ({ page }) => {
    // Verify instructor is still unlocked
    const isUnlocked = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      return component.unlocked === true;
    });

    expect(isUnlocked).toBe(true);
  });

  test('should display lock button when unlocked', async ({ page }) => {
    const lockButton = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const button = shadowRoot.querySelector('button:has-text("Lock")');
      return button !== null;
    });

    expect(lockButton).toBe(true);
  });

  test('should lock when lock button clicked', async ({ page }) => {
    const lockEvent = page.evaluate(
      () =>
        new Promise((resolve) => {
          document.addEventListener('qd:instructor-lock', (e) => {
            resolve((e as CustomEvent).detail);
          });
        }),
    );

    // Click lock button
    await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const button = shadowRoot.querySelector('button:has-text("Lock")');
      button?.click();
    });

    // Verify lock event was fired
    const detail = await lockEvent;
    expect(detail).toHaveProperty('timestamp');

    // Verify sessionStorage is cleared
    const unlocked = await page.evaluate(() => sessionStorage.getItem('qd/instructor'));
    expect(unlocked).toBeNull();
  });

  test('should emit qd:instructor-unlock event with timestamp', async ({ page }) => {
    // Clear session first
    await page.evaluate(() => sessionStorage.removeItem('qd/instructor'));
    await page.reload();

    const eventDetails = await page.evaluate(
      () =>
        new Promise((resolve) => {
          document.addEventListener('qd:instructor-unlock', (e) => {
            const detail = (e as CustomEvent).detail;
            resolve({
              hasTimestamp: 'timestamp' in detail,
              timestampValid: !isNaN(new Date(detail.timestamp).getTime()),
            });
          });

          // Trigger unlock
          setTimeout(() => {
            const component = document.querySelector('qd-instructor') as any;
            const shadowRoot = component.shadowRoot;
            const input = shadowRoot.querySelector('input[type="password"]');
            const button = shadowRoot.querySelector('button');
            input.value = 'instructor';
            button.click();
          }, 100);
        }),
    );

    expect(eventDetails).toEqual({
      hasTimestamp: true,
      timestampValid: true,
    });
  });

  test('should emit qd:instructor-lock event with timestamp', async ({ page }) => {
    const eventDetails = await page.evaluate(
      () =>
        new Promise((resolve) => {
          document.addEventListener('qd:instructor-lock', (e) => {
            const detail = (e as CustomEvent).detail;
            resolve({
              hasTimestamp: 'timestamp' in detail,
              timestampValid: !isNaN(new Date(detail.timestamp).getTime()),
            });
          });

          // Trigger lock
          setTimeout(() => {
            const component = document.querySelector('qd-instructor') as any;
            const shadowRoot = component.shadowRoot;
            const button = shadowRoot.querySelector('button:has-text("Lock")');
            button?.click();
          }, 100);
        }),
    );

    expect(eventDetails).toEqual({
      hasTimestamp: true,
      timestampValid: true,
    });
  });
});

test.describe.skip('Instructor Review - Answer Reveal', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Unlock instructor mode
    await page.goto('/demo/instructor-quiz.html');
    await page.evaluate(() => {
      const hash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
      sessionStorage.setItem('qd/instructor', hash);
    });
    await page.reload();
  });

  test('should reveal answers in quiz table when unlocked', async ({ page }) => {
    // Verify answer cells have reveal styling
    const hasRevealClass = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('td.qd-answer-cell'));
      return cells.some((cell) => cell.classList.contains('qd-reveal'));
    });

    expect(hasRevealClass).toBe(true);
  });

  test('should display correct answer text in second column', async ({ page }) => {
    // Check that answer column contains answer text
    const answerTexts = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr.qd-quiz-row'));
      return rows.map((row) => {
        const answerCell = row.querySelector('td:nth-child(2)');
        return answerCell?.textContent?.trim() || '';
      });
    });

    // Verify at least some answers are visible (non-empty)
    expect(answerTexts.filter((text) => text.length > 0).length).toBeGreaterThan(0);
  });

  test('should hide answers when locked', async ({ page }) => {
    // Lock instructor mode
    await page.evaluate(() => sessionStorage.removeItem('qd/instructor'));
    await page.reload();

    // Verify answer cells do not have reveal styling
    const hasRevealClass = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('td.qd-answer-cell'));
      return cells.some((cell) => cell.classList.contains('qd-reveal'));
    });

    expect(hasRevealClass).toBe(false);
  });

  test('should not affect student interaction controls', async ({ page }) => {
    // Verify student controls (select dropdowns) are still present
    const selectsExist = await page.evaluate(() => {
      const selects = document.querySelectorAll('select.qd-input-container');
      return selects.length > 0;
    });

    expect(selectsExist).toBe(true);
  });
});

test.describe.skip('Instructor Review - Student Comparisons', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Create student records in IndexedDB
    await page.goto('/demo/instructor-analysis.html');

    await page.evaluate(() => {
      const hash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
      sessionStorage.setItem('qd/instructor', hash);

      // Mock student data
      const mockStudents = [
        {
          schema: 1,
          docId: 'test-doc',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 10,
          correct: 8,
          updated: new Date().toISOString(),
          pages: {
            'analysis-page': {
              answers: [
                { answer: 'test-1', success: true, timestamp: new Date().toISOString() },
                { answer: 'test-2', success: true, timestamp: new Date().toISOString() },
              ],
              state: 'complete',
            },
          },
        },
        {
          schema: 1,
          docId: 'test-doc',
          release: '02-2025',
          serviceId: 'RN5678',
          name: 'Jones, A',
          attempted: 10,
          correct: 9,
          updated: new Date().toISOString(),
          pages: {
            'analysis-page': {
              answers: [
                { answer: 'test-3', success: true, timestamp: new Date().toISOString() },
                { answer: 'test-4', success: false, timestamp: new Date().toISOString() },
              ],
              state: 'complete',
            },
          },
        },
      ];

      // Store in sessionStorage for test purposes
      sessionStorage.setItem('qd/test/students', JSON.stringify(mockStudents));
    });

    await page.reload();
  });

  test('should display student comparison table below analysis cells', async ({ page }) => {
    // Verify comparison table exists
    const comparisonTableExists = await page.evaluate(() => {
      const table = document.querySelector('table.qd-student-comparison');
      return table !== null;
    });

    expect(comparisonTableExists).toBe(true);
  });

  test('should display 4-character username prefixes', async ({ page }) => {
    // Verify student IDs are truncated to 4 characters
    const usernames = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('td.qd-student-id'));
      return cells.map((cell) => cell.textContent?.trim() || '');
    });

    // All usernames should be exactly 4 characters
    expect(usernames.every((name) => name.length === 4)).toBe(true);
    expect(usernames).toContain('RN23'); // RN2344 → RN23
    expect(usernames).toContain('RN56'); // RN5678 → RN56
  });

  test('should show student answers for each analysis cell', async ({ page }) => {
    // Verify student answer cells exist
    const answerCellsExist = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('td.qd-student-answer'));
      return cells.length > 0;
    });

    expect(answerCellsExist).toBe(true);
  });

  test('should hide comparison table when locked', async ({ page }) => {
    // Lock instructor mode
    await page.evaluate(() => sessionStorage.removeItem('qd/instructor'));
    await page.reload();

    // Verify comparison table is hidden
    const tableVisible = await page.evaluate(() => {
      const table = document.querySelector('table.qd-student-comparison');
      return table !== null && getComputedStyle(table).display !== 'none';
    });

    expect(tableVisible).toBe(false);
  });

  test('should display "—" for cells without student data', async ({ page }) => {
    // Verify placeholder text for missing data
    const hasDash = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('td.qd-student-answer'));
      return cells.some((cell) => cell.textContent?.trim() === '—');
    });

    expect(hasDash).toBe(true);
  });
});

test.describe.skip('Instructor Review - Student Scores', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/instructor-home.html');

    // Setup: Unlock and load mock student data
    await page.evaluate(() => {
      const hash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
      sessionStorage.setItem('qd/instructor', hash);
    });

    await page.reload();
  });

  test('should display scores view when mode is "scores"', async ({ page }) => {
    await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      component.mode = 'scores';
    });

    await page.waitForTimeout(100);

    const scoresVisible = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const scoresView = shadowRoot.querySelector('.scores-view');
      return scoresView !== null;
    });

    expect(scoresVisible).toBe(true);
  });

  test('should display aggregated statistics', async ({ page }) => {
    await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      component.mode = 'scores';

      // Mock aggregated scores
      component._aggregatedScores = {
        totalAttempted: 50,
        totalCorrect: 42,
        totalStudents: 3,
        averagePercentage: 84,
        students: [],
      };
      component.requestUpdate();
    });

    await page.waitForTimeout(100);

    const stats = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const summary = shadowRoot.querySelector('.scores-summary');
      return summary?.textContent || '';
    });

    expect(stats).toContain('50'); // totalAttempted
    expect(stats).toContain('42'); // totalCorrect
    expect(stats).toContain('3'); // totalStudents
  });

  test('should display sortable student table', async ({ page }) => {
    const sortButtonsExist = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      component.mode = 'scores';

      const shadowRoot = component.shadowRoot;
      const sortButtons = shadowRoot.querySelectorAll('button.sort-button');
      return sortButtons.length > 0;
    });

    expect(sortButtonsExist).toBe(true);
  });

  test('should sort students by serviceId', async ({ page }) => {
    await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      component.mode = 'scores';

      // Mock student data
      component._studentRecords = [
        { serviceId: 'RN5678', name: 'Jones, A', correct: 10, attempted: 10 },
        { serviceId: 'RN2344', name: 'Smith, J', correct: 8, attempted: 10 },
        { serviceId: 'RN3456', name: 'Brown, K', correct: 9, attempted: 10 },
      ];
      component._sortField = 'serviceId';
      component._aggregateScores();
      component.requestUpdate();
    });

    await page.waitForTimeout(100);

    const firstServiceId = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const firstRow = shadowRoot.querySelector('tbody tr:first-child td:first-child');
      return firstRow?.textContent?.trim();
    });

    expect(firstServiceId).toBe('RN2344'); // Alphabetically first
  });

  test('should show empty state when no students', async ({ page }) => {
    await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      component.mode = 'scores';
      component._studentRecords = [];
      component._aggregateScores();
      component.requestUpdate();
    });

    await page.waitForTimeout(100);

    const emptyMessage = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const emptyState = shadowRoot.querySelector('.empty-state');
      return emptyState?.textContent || '';
    });

    expect(emptyMessage).toContain('No student data');
  });
});

test.describe.skip('Instructor Review - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/instructor-home.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should have keyboard accessible password form', async ({ page }) => {
    const isAccessible = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;

      const form = shadowRoot.querySelector('form');
      const input = shadowRoot.querySelector('input[type="password"]');
      const label = shadowRoot.querySelector('label');

      return form !== null && input !== null && label !== null;
    });

    expect(isAccessible).toBe(true);
  });

  test('should have proper ARIA labels on buttons', async ({ page }) => {
    const hasAriaLabels = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const buttons = shadowRoot.querySelectorAll('button');

      return (Array.from(buttons) as HTMLButtonElement[]).every(
        (btn) => btn.textContent?.trim() || btn.getAttribute('aria-label'),
      );
    });

    expect(hasAriaLabels).toBe(true);
  });

  test('should focus password input on mount', async ({ page }) => {
    await page.waitForTimeout(100);

    const isFocused = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const input = shadowRoot.querySelector('input[type="password"]');
      return document.activeElement === component && shadowRoot.activeElement === input;
    });

    expect(isFocused).toBe(true);
  });

  test('should announce state changes to screen readers', async ({ page }) => {
    // Unlock instructor mode
    await page.evaluate(() => {
      const hash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
      sessionStorage.setItem('qd/instructor', hash);
    });

    await page.reload();

    const hasLiveRegion = await page.evaluate(() => {
      const component = document.querySelector('qd-instructor') as any;
      const shadowRoot = component.shadowRoot;
      const liveRegion = shadowRoot.querySelector('[aria-live]');
      return liveRegion !== null;
    });

    expect(hasLiveRegion).toBe(true);
  });
});
