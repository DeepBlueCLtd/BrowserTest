/**
 * Unit tests for Analysis Table Parser
 *
 * Tests parsing of DITA analysis tables with editable cell detection
 * and cell key generation per contract specifications.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Import the parser (will be implemented next)
import { parseAnalysisTable, getCellKey, hashContent } from '../../../src/services/analysis-parser';

describe('Analysis Table Parser', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('parseAnalysisTable', () => {
    it('should parse a valid analysis table with qd-analysis class', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td>Label:</td>
              <td class="interactive">Editable content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const result = parseAnalysisTable(table);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (!result) return; // Type guard

      expect(result.element).toBe(table);
      expect(result.tableId).toBeTruthy();
      expect(result.editableCells).toHaveLength(1);
      expect(result.errors).toBeUndefined();
    });

    it('should return null for tables without qd-analysis class', () => {
      container.innerHTML = `
        <table>
          <tbody>
            <tr>
              <td class="interactive">Some content</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const result = parseAnalysisTable(table);

      expect(result).toBeNull();
    });

    it('should identify editable cells (with interactive class)', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td>Read-only</td>
              <td class="interactive">Editable 1</td>
              <td class="interactive">Editable 2</td>
            </tr>
            <tr>
              <td>Read-only</td>
              <td class="interactive">Editable 3</td>
              <td>Read-only without interactive</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const result = parseAnalysisTable(table);

      expect(result).toBeDefined();
      expect(result!.editableCells).toHaveLength(3);

      // Check positions of editable cells
      const positions = result!.editableCells.map(c => ({ row: c.row, col: c.col }));
      expect(positions).toContainEqual({ row: 0, col: 1 });
      expect(positions).toContainEqual({ row: 0, col: 2 });
      expect(positions).toContainEqual({ row: 1, col: 1 });
    });

    it('should handle tables with thead and tbody', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <thead>
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Label</td>
              <td class="interactive">Editable</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const result = parseAnalysisTable(table);

      expect(result).toBeDefined();
      // Headers should not be considered editable
      expect(result!.editableCells).toHaveLength(1);
      expect(result!.editableCells[0].row).toBe(0); // First tbody row
      expect(result!.editableCells[0].col).toBe(1);
    });

    it('should generate unique cell keys for each editable cell', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive">Cell A</td>
              <td class="interactive">Cell B</td>
            </tr>
            <tr>
              <td class="interactive">Cell C</td>
              <td class="interactive">Cell D</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const result = parseAnalysisTable(table);

      expect(result).toBeDefined();
      expect(result!.editableCells).toHaveLength(4);

      // Check that all keys are unique
      const keys = result!.editableCells.map(c => c.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(4);

      // Check key format: R{row}C{col}#f:{hash}
      keys.forEach(key => {
        expect(key).toMatch(/^R\d+C\d+#f:[a-f0-9]{8}$/);
      });
    });

    it('should handle empty table (no editable cells)', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td>All</td>
              <td>Read</td>
              <td>Only</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const result = parseAnalysisTable(table);

      expect(result).toBeDefined();
      expect(result!.editableCells).toHaveLength(0);
    });

    it('should detect cells with interactive class', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td>Cell without class</td>
              <td class="other-class">Cell with other class</td>
              <td class="interactive">Cell with interactive class</td>
              <td class="interactive another-class">Cell with multiple classes including interactive</td>
              <td>Another cell without class</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const result = parseAnalysisTable(table);

      expect(result).toBeDefined();
      expect(result!.editableCells).toHaveLength(2);
      expect(result!.editableCells[0].col).toBe(2); // Third cell has interactive class
      expect(result!.editableCells[1].col).toBe(3); // Fourth cell has interactive class
    });

    it('should generate table ID from table structure hash', () => {
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
      const result1 = parseAnalysisTable(table);

      // Parse same structure again
      const result2 = parseAnalysisTable(table);

      expect(result1!.tableId).toBe(result2!.tableId);
      expect(result1!.tableId).toMatch(/^[a-f0-9]{16}$/); // 16-char hash
    });

    it('should handle cells with complex content for hashing', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive">
                <strong>Bold text</strong>
                <em>Italic text</em>
                Line breaks and spaces
              </td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const result = parseAnalysisTable(table);

      expect(result).toBeDefined();
      expect(result!.editableCells).toHaveLength(1);
      expect(result!.editableCells[0].key).toMatch(/^R0C0#f:[a-f0-9]{8}$/);
    });

    it('should skip cells with colspan and rowspan in detection', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td colspan="2">Spanning cell</td>
              <td class="interactive">Regular cell</td>
            </tr>
            <tr>
              <td class="interactive">Cell 1</td>
              <td rowspan="2">Spanning vertically</td>
              <td class="interactive">Cell 3</td>
            </tr>
            <tr>
              <td class="interactive">Cell 4</td>
              <td class="interactive">Cell 6</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const result = parseAnalysisTable(table);

      expect(result).toBeDefined();
      // Should handle spanning cells properly
      expect(result!.editableCells.length).toBeGreaterThan(0);
    });
  });

  describe('getCellKey', () => {
    it('should generate cell key in correct format', () => {
      const key = getCellKey(0, 0, 'Test content');

      expect(key).toMatch(/^R0C0#f:[a-f0-9]{8}$/);
    });

    it('should generate different keys for different positions', () => {
      const content = 'Same content';
      const key1 = getCellKey(0, 0, content);
      const key2 = getCellKey(0, 1, content);
      const key3 = getCellKey(1, 0, content);

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });

    it('should generate different keys for different content', () => {
      const key1 = getCellKey(0, 0, 'Content A');
      const key2 = getCellKey(0, 0, 'Content B');

      expect(key1).not.toBe(key2);
    });

    it('should handle empty content', () => {
      const key = getCellKey(0, 0, '');

      expect(key).toMatch(/^R0C0#f:[a-f0-9]{8}$/);
    });

    it('should handle special characters in content', () => {
      const key = getCellKey(0, 0, '<strong>HTML</strong> & "quotes" and \'apostrophes\'');

      expect(key).toMatch(/^R0C0#f:[a-f0-9]{8}$/);
    });

    it('should be deterministic (same input = same output)', () => {
      const content = 'Deterministic test';
      const key1 = getCellKey(5, 3, content);
      const key2 = getCellKey(5, 3, content);

      expect(key1).toBe(key2);
    });
  });

  describe('hashContent', () => {
    it('should return 8-character hex hash', () => {
      const hash = hashContent('Test content');

      expect(hash).toMatch(/^[a-f0-9]{8}$/);
      expect(hash.length).toBe(8);
    });

    it('should be deterministic', () => {
      const content = 'Consistent content';
      const hash1 = hashContent(content);
      const hash2 = hashContent(content);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different content', () => {
      const hash1 = hashContent('Content A');
      const hash2 = hashContent('Content B');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = hashContent('');

      expect(hash).toMatch(/^[a-f0-9]{8}$/);
    });

    it('should handle unicode characters', () => {
      const hash = hashContent('Unicode: 你好 🎉 ñ');

      expect(hash).toMatch(/^[a-f0-9]{8}$/);
    });

    it('should normalize whitespace before hashing', () => {
      const hash1 = hashContent('Text   with    spaces');
      const hash2 = hashContent('Text with spaces');

      expect(hash1).toBe(hash2);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle table with no tbody', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tr>
            <td class="interactive">Direct child rows</td>
          </tr>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const result = parseAnalysisTable(table);

      expect(result).toBeDefined();
      expect(result!.editableCells).toHaveLength(1);
    });

    it('should return errors if table has no cells', () => {
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody></tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const result = parseAnalysisTable(table);

      expect(result).toBeDefined();
      expect(result!.errors).toBeDefined();
      expect(result!.errors).toContain('Table has no cells');
    });

    it('should handle null input gracefully', () => {
      const result = parseAnalysisTable(null as any);

      expect(result).toBeNull();
    });

    it('should handle undefined input gracefully', () => {
      const result = parseAnalysisTable(undefined as any);

      expect(result).toBeNull();
    });

    it('should validate cell content length', () => {
      const longContent = 'x'.repeat(600); // Exceeds 500 char limit
      container.innerHTML = `
        <table class="qd-analysis">
          <tbody>
            <tr>
              <td class="interactive">${longContent}</td>
            </tr>
          </tbody>
        </table>
      `;

      const table = container.querySelector('table') as HTMLTableElement;
      const result = parseAnalysisTable(table);

      expect(result).toBeDefined();
      expect(result!.errors).toBeDefined();
      expect(result!.errors![0]).toContain('exceeds maximum length');
    });
  });
});
