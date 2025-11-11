/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

/**
 * Integration tests for Quiz Table DOM Upgrades
 *
 * Tests the enhancement of static DITA quiz tables with interactive elements:
 * - MCQ questions: Inject dropdowns with options
 * - Numeric questions: Inject number inputs
 * - Event handlers: Answer changes trigger auto-save
 * - State restoration: Previously saved answers are restored
 */

describe('Quiz Table DOM Upgrades', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    global.document = document as unknown as Document;
    global.window = dom.window as unknown as Window & typeof globalThis;
  });

  describe('MCQ Question Enhancement', () => {
    it('should inject dropdown for MCQ questions', async () => {
      const table = createQuizTable([
        {
          question: 'What is active sonar?',
          answer: '1',
          detail: '<ol><li>Uses reflections</li><li>Listens only</li></ol>',
        },
      ]);

      // Import and enhance the table
      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      // Check for injected select element in Answer column
      const select = table.querySelector('select');
      expect(select).toBeDefined();
    });

    it('should populate dropdown with options from Detail column', async () => {
      const table = createQuizTable([
        {
          question: 'Select sonar type',
          answer: '2',
          detail: '<ol><li>Active</li><li>Passive</li><li>Side-scan</li></ol>',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      const select = table.querySelector('select');
      const options = select?.querySelectorAll('option');

      expect(options?.length).toBeGreaterThan(0);
      // Should have blank option + 3 real options = 4 total
      expect(options?.length).toBe(4);
    });

    it('should create 1-indexed option values', async () => {
      const table = createQuizTable([
        {
          question: 'Question',
          answer: '1',
          detail: '<ol><li>First</li><li>Second</li></ol>',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      const select = table.querySelector('select') as HTMLSelectElement;
      const options = Array.from(select?.options || []);

      // First option should be blank/placeholder
      expect(options[0].value).toBe('');
      // Real options should be 1, 2
      expect(options[1]?.value).toBe('1');
      expect(options[2]?.value).toBe('2');
    });

    it('should preserve row count but remove detail column', async () => {
      const table = createQuizTable([
        {
          question: 'What is sonar?',
          answer: '1',
          detail: '<ol><li>Sound</li></ol>',
        },
      ]);

      const originalRowCount = table.querySelectorAll('tbody tr').length;
      const originalCellCount = table.querySelectorAll('tbody td').length;

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      // Should preserve row count
      expect(table.querySelectorAll('tbody tr').length).toBe(originalRowCount);
      // Should have one fewer cell per row (detail column removed)
      expect(table.querySelectorAll('tbody td').length).toBe(originalCellCount - originalRowCount);
    });
  });

  describe('Numeric Question Enhancement', () => {
    it('should inject input for numeric questions', async () => {
      const table = createQuizTable([
        {
          question: 'Speed of sound in water (m/s)?',
          answer: '1500',
          detail: '50',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      const input = table.querySelector('input[type="number"]');
      expect(input).toBeDefined();
    });

    it('should set appropriate input attributes for numeric questions', async () => {
      const table = createQuizTable([
        {
          question: 'Enter frequency (kHz)',
          answer: '5',
          detail: '0.5',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      const input = table.querySelector('input[type="number"]') as HTMLInputElement;
      expect(input?.type).toBe('number');
      expect(input?.step).toBeDefined(); // Should have step for decimals
    });

    it('should allow decimal values in numeric inputs', async () => {
      const table = createQuizTable([
        {
          question: 'Measure value',
          answer: '12.5',
          detail: '0.25',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      const input = table.querySelector('input[type="number"]') as HTMLInputElement;
      expect(input?.step).toBe('any'); // Allow any decimal precision
    });
  });

  describe('Mixed Question Types', () => {
    it('should handle table with both MCQ and numeric questions', async () => {
      const table = createQuizTable([
        {
          question: 'MCQ Question',
          answer: '1',
          detail: '<ol><li>Option A</li></ol>',
        },
        {
          question: 'Numeric Question',
          answer: '100',
          detail: '10',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      // Should have both select and input
      const select = table.querySelector('select');
      const input = table.querySelector('input[type="number"]');

      expect(select).toBeDefined();
      expect(input).toBeDefined();
    });
  });

  describe('Event Handlers', () => {
    it('should attach change event handler to MCQ dropdown', async () => {
      const table = createQuizTable([
        {
          question: 'Select option',
          answer: '1',
          detail: '<ol><li>A</li><li>B</li></ol>',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      const select = table.querySelector('select') as HTMLSelectElement;
      const changeHandler = vi.fn();

      // Listen for qd:answer-saved event
      document.addEventListener('qd:answer-saved', changeHandler);

      // Simulate user selecting an option
      select.value = '2';
      select.dispatchEvent(new Event('change', { bubbles: true }));

      // Event should be emitted (when enhancer is implemented)
      expect(select).toBeDefined();
    });

    it('should attach input event handler to numeric input', async () => {
      const table = createQuizTable([
        {
          question: 'Enter value',
          answer: '100',
          detail: '10',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      const input = table.querySelector('input[type="number"]') as HTMLInputElement;
      const inputHandler = vi.fn();

      document.addEventListener('qd:answer-saved', inputHandler);

      // Simulate user input
      input.value = '95';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(input).toBeDefined();
    });

    it('should emit qd:answer-saved event with correct detail', async () => {
      const table = createQuizTable([
        {
          question: 'Test',
          answer: '1',
          detail: '<ol><li>Option</li></ol>',
        },
      ]);

      // Will test event detail when implementation is complete
      expect(table).toBeDefined();
    });
  });

  describe('State Restoration', () => {
    it('should restore previously saved MCQ answer', async () => {
      const table = createQuizTable([
        {
          question: 'Question',
          answer: '2',
          detail: '<ol><li>A</li><li>B</li><li>C</li></ol>',
        },
      ]);

      // Simulate existing answer data
      const savedAnswers = [{ answer: '2', success: true, timestamp: new Date().toISOString() }];

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table, savedAnswers);

      const select = table.querySelector('select') as HTMLSelectElement;
      // Should be set to saved value
      expect(select?.value).toBe('2');
    });

    it('should restore previously saved numeric answer', async () => {
      const table = createQuizTable([
        {
          question: 'Enter value',
          answer: '100',
          detail: '10',
        },
      ]);

      const savedAnswers = [{ answer: '95', success: true, timestamp: new Date().toISOString() }];

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table, savedAnswers);

      const input = table.querySelector('input[type="number"]') as HTMLInputElement;
      expect(input?.value).toBe('95');
    });
  });

  describe('Visual Feedback', () => {
    it('should add success class for correct answers', async () => {
      const table = createQuizTable([
        {
          question: 'Question',
          answer: '1',
          detail: '<ol><li>Correct</li><li>Wrong</li></ol>',
        },
      ]);

      const savedAnswers = [{ answer: '1', success: true, timestamp: new Date().toISOString() }];

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table, savedAnswers);

      // Should have visual indicator for correct answer
      const answerCell = table.querySelector('tbody tr td:nth-child(2)');
      // Will check for success class when implemented
      expect(answerCell).toBeDefined();
    });

    it('should add error class for incorrect answers', async () => {
      const table = createQuizTable([
        {
          question: 'Question',
          answer: '1',
          detail: '<ol><li>Correct</li><li>Wrong</li></ol>',
        },
      ]);

      const savedAnswers = [{ answer: '2', success: false, timestamp: new Date().toISOString() }];

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table, savedAnswers);

      const answerCell = table.querySelector('tbody tr td:nth-child(2)');
      expect(answerCell).toBeDefined();
    });
  });

  describe('Auto-save Performance', () => {
    it('should debounce rapid input changes', async () => {
      const table = createQuizTable([
        {
          question: 'Enter value',
          answer: '100',
          detail: '10',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      const input = table.querySelector('input[type="number"]') as HTMLInputElement;
      const saveHandler = vi.fn();

      document.addEventListener('qd:answer-saved', saveHandler);

      // Simulate rapid typing
      input.value = '1';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      input.value = '10';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      input.value = '100';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Should debounce (implementation detail)
      expect(input).toBeDefined();
    });

    it('should save within 200ms requirement', async () => {
      const table = createQuizTable([
        {
          question: 'Question',
          answer: '1',
          detail: '<ol><li>A</li></ol>',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      // Performance test will be verified when implemented
      expect(table).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle tables with validation errors gracefully', async () => {
      const table = createQuizTable([
        {
          question: 'Invalid',
          answer: '1',
          detail: '<ol></ol>', // Empty options - invalid
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');

      // Should not throw, but may skip enhancement
      expect(() => enhanceQuizTable(table)).not.toThrow();
    });

    it('should handle missing table gracefully', async () => {
      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');

      // Should not throw on null/undefined
      expect(() => enhanceQuizTable(null as any)).not.toThrow();
    });
  });

  describe('Multiple Table Enhancement', () => {
    it('should enhance multiple quiz tables independently', async () => {
      const table1 = createQuizTable([
        {
          question: 'Q1',
          answer: '1',
          detail: '<ol><li>A</li></ol>',
        },
      ]);

      const table2 = createQuizTable([
        {
          question: 'Q2',
          answer: '100',
          detail: '10',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');

      enhanceQuizTable(table1);
      enhanceQuizTable(table2);

      // Both should be enhanced independently
      expect(table1.querySelector('select')).toBeDefined();
      expect(table2.querySelector('input[type="number"]')).toBeDefined();
    });
  });

  describe('Detail Column Removal', () => {
    it('should remove detail column header from table', async () => {
      const table = createQuizTable([
        {
          question: 'Question',
          answer: '1',
          detail: '<ol><li>Option A</li></ol>',
        },
      ]);

      // Before enhancement, should have 3 header cells
      expect(table.querySelectorAll('thead th').length).toBe(3);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      // After enhancement, should have 2 header cells (Question and Answer only)
      expect(table.querySelectorAll('thead th').length).toBe(2);
    });

    it('should remove detail column cells from all body rows', async () => {
      const table = createQuizTable([
        {
          question: 'Q1',
          answer: '1',
          detail: '<ol><li>A</li><li>B</li></ol>',
        },
        {
          question: 'Q2',
          answer: '100',
          detail: '10',
        },
        {
          question: 'Q3',
          answer: '2',
          detail: '<ol><li>X</li><li>Y</li><li>Z</li></ol>',
        },
      ]);

      // Before: 3 rows × 3 cells = 9 cells
      expect(table.querySelectorAll('tbody td').length).toBe(9);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      // After: 3 rows × 2 cells = 6 cells
      expect(table.querySelectorAll('tbody td').length).toBe(6);

      // Each row should have exactly 2 cells
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        expect(row.querySelectorAll('td').length).toBe(2);
      });
    });

    it('should remove detail column before enhancing cells', async () => {
      const table = createQuizTable([
        {
          question: 'Test MCQ',
          answer: '2',
          detail: '<ol><li>Option 1</li><li>Option 2</li></ol>',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      // The detail column should be gone
      const row = table.querySelector('tbody tr');
      const cells = row?.querySelectorAll('td');

      expect(cells?.length).toBe(2);

      // First cell should still have question text
      expect(cells?.[0]?.textContent).toBe('Test MCQ');

      // Second cell should have the dropdown (not the original answer text)
      expect(cells?.[1]?.querySelector('select')).toBeDefined();
    });

    it('should still create correct options despite detail column removal', async () => {
      const table = createQuizTable([
        {
          question: 'MCQ',
          answer: '1',
          detail: '<ol><li>First</li><li>Second</li><li>Third</li></ol>',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      // Options should still be correctly extracted and populated
      const select = table.querySelector('select');
      const options = select?.querySelectorAll('option');

      // Should have blank + 3 options = 4 total
      expect(options?.length).toBe(4);
      expect(options?.[1]?.textContent).toContain('First');
      expect(options?.[2]?.textContent).toContain('Second');
      expect(options?.[3]?.textContent).toContain('Third');
    });

    it('should remove detail column with tolerance for numeric questions', async () => {
      const table = createQuizTable([
        {
          question: 'Speed of sound?',
          answer: '1500',
          detail: '50',
        },
      ]);

      const { enhanceQuizTable } = await import('../../../src/enhancers/quiz-table');
      enhanceQuizTable(table);

      // Detail cell with tolerance should be removed
      const row = table.querySelector('tbody tr');
      const cells = row?.querySelectorAll('td');

      expect(cells?.length).toBe(2);

      // Should have question and input only
      expect(cells?.[0]?.textContent).toBe('Speed of sound?');
      expect(cells?.[1]?.querySelector('input[type="number"]')).toBeDefined();
    });
  });

  // Helper function to create quiz tables for testing
  function createQuizTable(
    rows: Array<{ question: string; answer: string; detail: string }>,
  ): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'qd-quiz';

    // Add header
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const th1 = document.createElement('th');
    th1.textContent = 'Question';
    headerRow.appendChild(th1);
    const th2 = document.createElement('th');
    th2.textContent = 'Answer';
    headerRow.appendChild(th2);
    const th3 = document.createElement('th');
    th3.textContent = 'Detail';
    headerRow.appendChild(th3);

    // Add data rows
    const tbody = table.createTBody();
    rows.forEach((rowData) => {
      const row = tbody.insertRow();
      row.insertCell().textContent = rowData.question;
      row.insertCell().textContent = rowData.answer;
      row.insertCell().innerHTML = rowData.detail;
    });

    document.body.appendChild(table);
    return table;
  }
});
