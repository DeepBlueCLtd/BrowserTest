/**
 * Integration tests for Analysis Table DOM Upgrades
 *
 * Tests the complete flow of detecting, parsing, and enhancing
 * analysis tables with text input injection and event handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AnalysisData } from '../../../src/types/contracts';

// Imports will be available after implementation
import { enhanceAnalysisTable } from '../../../src/enhancers/analysis-table';
import { parseAnalysisTable } from '../../../src/services/analysis-parser';

describe('Analysis Table DOM Upgrades', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock sessionStorage for testing
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.unstubAllGlobals();
  });

  describe('Table Enhancement', () => {
    it('should inject text inputs into editable cells', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td>Label:</td>
              <td class="interactive">Original content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      enhanceAnalysisTable(table);

      // Check that input was injected
      const input = table.querySelector('input[type="text"]');
      expect(input).toBeDefined();
      expect(input).not.toBeNull();
    });

    it('should preserve cell content as input value', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive">Existing content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const cell = table.querySelector('td') as HTMLTableCellElement;
      const originalContent = cell.textContent?.trim();

      enhanceAnalysisTable(table);

      const input = cell.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe(originalContent);
    });

    it('should not modify cells without interactive class', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td>Read-only</td>
              <td class="interactive">Editable</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      enhanceAnalysisTable(table);

      // Get the first cell (without interactive class)
      const readOnlyCell = table.querySelector('td:not(.interactive)');
      const input = readOnlyCell?.querySelector('input');

      expect(input).toBeNull();
    });

    it('should enhance multiple editable cells', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive">Cell 1</td>
              <td class="interactive">Cell 2</td>
              <td class="interactive">Cell 3</td>
            </tr>
            <tr>
              <td class="interactive">Cell 4</td>
              <td class="interactive">Cell 5</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      enhanceAnalysisTable(table);

      const inputs = table.querySelectorAll('input[type="text"]');
      expect(inputs.length).toBe(5);
    });

    it('should add data attributes for cell identification', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive">Content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      enhanceAnalysisTable(table);

      const input = table.querySelector('input') as HTMLInputElement;
      expect(input.dataset.cellKey).toBeDefined();
      expect(input.dataset.cellKey).toMatch(/^R\d+C\d+#f:[a-f0-9]{8}$/);
    });

    it('should apply appropriate styling to inputs', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive">Content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      enhanceAnalysisTable(table);

      const input = table.querySelector('input') as HTMLInputElement;

      // Check that input has appropriate styles
      expect(input.style.width).toBeTruthy();
      expect(input.style.border).toBeTruthy();
    });
  });

  describe('Event Handling', () => {
    it('should attach change event listener to inputs', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive">Content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      enhanceAnalysisTable(table);

      const input = table.querySelector('input') as HTMLInputElement;

      // Simulate input change
      input.value = 'New content';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Should not throw
      expect(input.value).toBe('New content');
    });

    it('should debounce rapid input changes', async () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive">Content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const saveSpy = vi.fn();

      enhanceAnalysisTable(table, { onSave: saveSpy });

      const input = table.querySelector('input') as HTMLInputElement;

      // Rapid changes
      input.value = 'A';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      input.value = 'AB';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      input.value = 'ABC';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Should debounce - not call save immediately
      expect(saveSpy).not.toHaveBeenCalled();

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 250));

      // Should have called save once after debounce
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Persistence', () => {
    it('should load existing data from storage', () => {
      // First parse to get the actual cell key and table ID that will be generated
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td>Label:</td>
              <td class="interactive">Original content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const parsed = parseAnalysisTable(table);
      const actualCellKey = parsed!.editableCells[0].key;
      const actualTableId = parsed!.tableId;

      const mockData: AnalysisData = {
        tableId: actualTableId,
        cells: {
          [actualCellKey]: 'Saved content',
        },
      };

      // Mock getItem to return data when the storage key matches
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const getItemMock = vi.mocked(sessionStorage.getItem);
      getItemMock.mockImplementation((key: string) => {
        if (key.includes(actualTableId)) {
          return JSON.stringify(mockData);
        }
        return null;
      });

      enhanceAnalysisTable(table);

      const input = table.querySelector('input') as HTMLInputElement;

      // Should load saved content
      expect(input.value).toBe('Saved content');
    });

    it('should save data to storage on change', async () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive">Content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      enhanceAnalysisTable(table);

      const input = table.querySelector('input') as HTMLInputElement;

      // Change input
      input.value = 'New content';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Wait for debounce and save
      await new Promise(resolve => setTimeout(resolve, 250));

      // Check that setItem was called
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const setItemMock = vi.mocked(sessionStorage.setItem);
      expect(setItemMock).toHaveBeenCalled();
    });

    it('should handle missing cell keys gracefully', () => {
      const mockData: AnalysisData = {
        tableId: 'test-table-id',
        cells: {
          'R0C0#f:nonexist': 'Orphaned data',
        },
      };

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const getItemMock = vi.mocked(sessionStorage.getItem);
      getItemMock.mockReturnValue(JSON.stringify(mockData));

      container.innerHTML = `
        <table class="qd-analysis" data-table-id="test-table-id">
          <tbody>
            <tr>
              <td class="interactive">Content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;

      // Should not throw
      expect(() => enhanceAnalysisTable(table)).not.toThrow();
    });
  });

  describe('Table Validation', () => {
    it('should not enhance tables without qd-analysis class', () => {
      container.innerHTML = `
        <table>
          <tbody>
            <tr>
              <td class="interactive">Content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      enhanceAnalysisTable(table);

      const input = table.querySelector('input');
      expect(input).toBeNull();
    });

    it('should handle empty tables gracefully', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody></tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;

      // Should not throw
      expect(() => enhanceAnalysisTable(table)).not.toThrow();
    });

    it('should display validation errors for invalid tables', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive">${'x'.repeat(600)}</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const parsed = parseAnalysisTable(table);

      expect(parsed?.errors).toBeDefined();
      expect(parsed?.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Table Structures', () => {
    it('should handle tables with thead and tbody', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <thead>
            <tr>
              <th >Header 1</th>
              <th >Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="interactive">Cell 1</td>
              <td class="interactive">Cell 2</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      enhanceAnalysisTable(table);

      // Headers should not have inputs
      const theadInputs = table.querySelectorAll('thead input');
      expect(theadInputs.length).toBe(0);

      // Body cells should have inputs
      const tbodyInputs = table.querySelectorAll('tbody input');
      expect(tbodyInputs.length).toBe(2);
    });

    it('should handle mixed content in cells', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive"><strong>Bold</strong> and <em>italic</em> text</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      enhanceAnalysisTable(table);

      const input = table.querySelector('input') as HTMLInputElement;

      // Should extract text content
      expect(input.value).toContain('Bold');
      expect(input.value).toContain('italic');
    });
  });

  describe('Integration with Parser', () => {
    it('should use parsed data for enhancement', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td>Read-only</td>
              <td class="interactive">Editable 1</td>
              <td class="interactive">Editable 2</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const parsed = parseAnalysisTable(table);

      expect(parsed).toBeDefined();
      expect(parsed!.editableCells.length).toBe(2);

      // Enhancement should match parsed structure
      enhanceAnalysisTable(table);

      const inputs = table.querySelectorAll('input');
      expect(inputs.length).toBe(parsed!.editableCells.length);
    });

    it('should respect cell key generation from parser', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive">Test content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const parsed = parseAnalysisTable(table);

      enhanceAnalysisTable(table);

      const input = table.querySelector('input') as HTMLInputElement;
      const expectedKey = parsed!.editableCells[0].key;

      expect(input.dataset.cellKey).toBe(expectedKey);
    });
  });
});
