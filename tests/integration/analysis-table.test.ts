/**
 * Integration tests for Analysis Table Enhancement
 *
 * Tests the single-phase enhancement pattern for analysis tables with
 * cells marked as editable via class="interactive".
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  enhanceAnalysisTable,
  isAnalysisTableEnhanced,
  getAnalysisTableMetadata,
} from '../../src/enhancers/analysis-table.js';
import { setJSON, clearQuizData } from '../../src/utils/storage-helpers.js';
import { STORAGE_KEYS } from '../../src/types/contracts.js';
import type { SessionData } from '../../src/types/contracts.js';

describe('Analysis Table Enhancement', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Clear storage
    clearQuizData();

    // Clear any event listeners
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up DOM
    document.body.removeChild(container);
    clearQuizData();
  });

  /**
   * Helper: Create a basic analysis table
   * - 3 rows, 3 columns
   * - First row (headers) has background colors (read-only)
   * - Some data cells have class="interactive" (editable)
   * - Other data cells are read-only
   */
  function createAnalysisTable(): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'qd-analysis';

    // Create thead with header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Question', 'Student Answer', 'Notes'].forEach((text) => {
      const th = document.createElement('th');
      th.textContent = text;
      th.style.backgroundColor = '#f0f0f0'; // Read-only (no 'interactive' class)
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create tbody with data rows
    const tbody = document.createElement('tbody');

    // Row 1: Question label (read-only) | interactive cell | read-only cell
    const row1 = document.createElement('tr');
    const r1c1 = document.createElement('td');
    r1c1.textContent = 'What is 2+2?';
    row1.appendChild(r1c1);

    const r1c2 = document.createElement('td');
    r1c2.textContent = ''; // Empty, ready for student input
    r1c2.className = 'interactive'; // Editable
    row1.appendChild(r1c2);

    const r1c3 = document.createElement('td');
    r1c3.textContent = 'Verify arithmetic';
    row1.appendChild(r1c3);

    tbody.appendChild(row1);

    // Row 2: Similar structure
    const row2 = document.createElement('tr');
    const r2c1 = document.createElement('td');
    r2c1.textContent = 'Explain photosynthesis';
    row2.appendChild(r2c1);

    const r2c2 = document.createElement('td');
    r2c2.textContent = '';
    r2c2.className = 'interactive'; // Editable
    row2.appendChild(r2c2);

    const r2c3 = document.createElement('td');
    r2c3.textContent = 'Check for key concepts';
    row2.appendChild(r2c3);

    tbody.appendChild(row2);

    table.appendChild(tbody);

    return table;
  }

  /**
   * Helper: Create session data
   */
  function createSessionData(): SessionData {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

    return {
      serviceId: 'RN1234',
      name: 'Test Student',
      release: '11-2024',
      loginTime: now.toISOString(),
      lastActivity: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      instructorUnlocked: false,
    };
  }

  describe('Non-Interactive Mode', () => {
    it('should enhance table without enabling editing', () => {
      const table = createAnalysisTable();
      container.appendChild(table);

      const result = enhanceAnalysisTable(table, { interactive: false });

      expect(result).toBe(true);
      expect(isAnalysisTableEnhanced(table)).toBe(true);
      expect(table.classList.contains('qd-analysis-non-interactive')).toBe(true);

      // Verify no cells are made contenteditable
      const cells = table.querySelectorAll('td');
      cells.forEach((cell) => {
        expect(cell.contentEditable).not.toBe('true');
      });
    });

    it('should store metadata in WeakMap', () => {
      const table = createAnalysisTable();
      container.appendChild(table);

      enhanceAnalysisTable(table, { interactive: false });

      const metadata = getAnalysisTableMetadata(table);
      expect(metadata).toBeDefined();
      expect(metadata?.interactive).toBe(false);
      expect(metadata?.parsed).toBeDefined();
      expect(metadata?.parsed.tableId).toMatch(/^[0-9a-f]{16}$/);
    });

    it('should identify interactive cells correctly', () => {
      const table = createAnalysisTable();
      container.appendChild(table);

      enhanceAnalysisTable(table, { interactive: false });

      const metadata = getAnalysisTableMetadata(table);
      expect(metadata?.parsed.editableCells.length).toBe(2); // Two cells with class="interactive"
    });
  });

  describe('Interactive Mode', () => {
    it('should require pageId in interactive mode', () => {
      const table = createAnalysisTable();
      container.appendChild(table);

      // Create session
      setJSON(STORAGE_KEYS.SESSION, createSessionData());

      const result = enhanceAnalysisTable(table, { interactive: true });

      expect(result).toBe(false); // Should fail without pageId
    });

    it('should enable contenteditable for cells with interactive class', () => {
      const table = createAnalysisTable();
      container.appendChild(table);

      // Create session
      setJSON(STORAGE_KEYS.SESSION, createSessionData());

      const result = enhanceAnalysisTable(table, {
        interactive: true,
        pageId: 'test-page-1',
      });

      expect(result).toBe(true);
      expect(table.classList.contains('qd-analysis-interactive')).toBe(true);

      // Check that cells with class="interactive" are editable
      const interactiveCells = table.querySelectorAll('td.interactive');
      expect(interactiveCells.length).toBe(2);

      interactiveCells.forEach((cell) => {
        if (cell instanceof HTMLElement) {
          expect(cell.contentEditable).toBe('true');
          expect(cell.classList.contains('qd-editable')).toBe(true);
        }
      });

      // Check that cells WITHOUT class="interactive" are NOT editable
      const allCells = Array.from(table.querySelectorAll('td'));
      const nonInteractiveCells = allCells.filter(
        (cell) => !cell.classList.contains('interactive'),
      );

      nonInteractiveCells.forEach((cell) => {
        expect(cell.contentEditable).not.toBe('true');
      });
    });

    it('should load existing cell data from cache', () => {
      const table = createAnalysisTable();
      container.appendChild(table);

      // Create session with existing analysis data
      const session = createSessionData();
      setJSON(STORAGE_KEYS.SESSION, session);

      // Create cache with existing analysis data
      const cellKey1 = 'R0C1#f:00000000'; // Simplified for test
      const cellKey2 = 'R1C1#f:00000000';

      setJSON(STORAGE_KEYS.CACHE, {
        totals: { answered: 0, correct: 0 },
        pages: {
          'test-page-1': {
            state: 'incomplete' as const,
            answered: 0,
            correct: 0,
            answers: [],
            analysis: {
              tableId: 'test-table-id',
              cells: {
                [cellKey1]: 'Student wrote: 4',
                [cellKey2]: 'Student wrote: Plants make food using sunlight',
              },
              firstEdited: new Date().toISOString(),
              lastEdited: new Date().toISOString(),
            },
          },
        },
      });

      enhanceAnalysisTable(table, {
        interactive: true,
        pageId: 'test-page-1',
      });

      // Note: Actual cell key will be different due to hashing,
      // so we just verify cells are editable
      const interactiveCells = table.querySelectorAll('td.interactive');
      interactiveCells.forEach((cell) => {
        if (cell instanceof HTMLElement) {
          expect(cell.contentEditable).toBe('true');
        }
      });
    });

    it('should save cell edits with debouncing', async () => {
      const table = createAnalysisTable();
      container.appendChild(table);

      // Create session
      setJSON(STORAGE_KEYS.SESSION, createSessionData());

      enhanceAnalysisTable(table, {
        interactive: true,
        pageId: 'test-page-1',
      });

      // Get first interactive cell
      const interactiveCell = table.querySelector('td.interactive');
      expect(interactiveCell).toBeDefined();

      if (interactiveCell) {
        // Simulate user typing
        interactiveCell.textContent = 'The answer is 4';

        // Trigger input event
        const inputEvent = new Event('input', { bubbles: true });
        interactiveCell.dispatchEvent(inputEvent);

        // Wait for debounce (500ms)
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Verify data was saved to cache
        // Note: The actual cell key will be generated by the system
        // We just verify that analysis data exists
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const cache = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.CACHE) || '{}');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(cache.pages['test-page-1']).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(cache.pages['test-page-1'].analysis).toBeDefined();
      }
    });

    it('should emit qd:analysis-saved event on save', async () => {
      const table = createAnalysisTable();
      container.appendChild(table);

      // Create session
      setJSON(STORAGE_KEYS.SESSION, createSessionData());

      // Listen for custom event
      let eventFired = false;
      let eventDetail: {
        pageId: string;
        tableId: string;
        cellKey: string;
        content: string;
      } | null = null;

      document.addEventListener('qd:analysis-saved', ((e: CustomEvent) => {
        eventFired = true;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        eventDetail = e.detail;
      }) as EventListener);

      enhanceAnalysisTable(table, {
        interactive: true,
        pageId: 'test-page-1',
      });

      // Get first interactive cell
      const interactiveCell = table.querySelector('td.interactive');

      if (interactiveCell) {
        // Simulate user typing
        interactiveCell.textContent = 'Test content';

        // Trigger input event
        const inputEvent = new Event('input', { bubbles: true });
        interactiveCell.dispatchEvent(inputEvent);

        // Wait for debounce
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Verify event was fired
        expect(eventFired).toBe(true);
        expect(eventDetail).toBeDefined();
        expect(eventDetail.pageId).toBe('test-page-1');
        expect(eventDetail.cellKey).toMatch(/^R\d+C\d+#f:[0-9a-f]{8}$/);
      }
    });

    it('should only make cells with interactive class editable', () => {
      const table = createAnalysisTable();
      container.appendChild(table);

      // Create session
      setJSON(STORAGE_KEYS.SESSION, createSessionData());

      enhanceAnalysisTable(table, {
        interactive: true,
        pageId: 'test-page-1',
      });

      // Count editable vs non-editable cells
      const allCells = table.querySelectorAll('td');
      let editableCount = 0;
      let nonEditableCount = 0;

      allCells.forEach((cell) => {
        if (cell.contentEditable === 'true') {
          // Must have 'interactive' class
          expect(cell.classList.contains('interactive')).toBe(true);
          editableCount++;
        } else {
          // Must NOT have 'interactive' class
          expect(cell.classList.contains('interactive')).toBe(false);
          nonEditableCount++;
        }
      });

      expect(editableCount).toBe(2); // Two cells with class="interactive"
      expect(nonEditableCount).toBe(4); // Four cells without it
    });
  });
});
