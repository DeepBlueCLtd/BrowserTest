/**
 * Analysis Table Parser
 *
 * Parses analysis tables and generates stable identifiers for table and cells.
 *
 * Key concepts:
 * - TableId: 16-char hash based on table structure (rows × cols + className)
 * - CellKey: Format "R{row}C{col}#f:{hash}" where hash is 8-char from normalized content
 * - Editable cells: Cells WITH 'interactive' class
 * - Read-only cells: Cells WITHOUT 'interactive' class
 *
 * Author constraints:
 * - Add class="interactive" to cells that should be editable in interactive mode
 * - Cells without this class will always be read-only
 *
 * @example
 * ```typescript
 * const table = document.querySelector('table.qd-analysis');
 * if (table instanceof HTMLTableElement) {
 *   const parsed = parseAnalysisTable(table);
 *   console.log(`Table ID: ${parsed.tableId}`);
 *   console.log(`Editable cells: ${parsed.editableCells.length}`);
 * }
 * ```
 */

import type { ParsedAnalysisTable, TableId, CellKey } from '../types/contracts.js';
import { getTableRows, getRowCells, getTextContent } from '../utils/dom-helpers.js';

/**
 * Generate a hash from a string using a simple but stable hash algorithm
 *
 * Uses a modified DJB2 hash algorithm for simplicity and stability.
 * Not cryptographically secure, but suitable for generating stable identifiers.
 *
 * @param input - String to hash
 * @param length - Desired hash length (default: 16)
 * @returns Hex-encoded hash of specified length
 */
function hashString(input: string, length = 16): string {
  let hash = 5381;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) + hash + char; // hash * 33 + char
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive hex string
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');

  // Repeat and truncate to desired length
  const repeatedHash = hexHash.repeat(Math.ceil(length / hexHash.length));
  return repeatedHash.substring(0, length);
}

/**
 * Generate stable table ID based on structure
 *
 * Format: 16-character hash from "{rows}x{cols}:{className}"
 *
 * @param table - Analysis table element
 * @returns Stable table identifier
 *
 * @example
 * ```typescript
 * const table = document.querySelector('table.qd-analysis');
 * if (table instanceof HTMLTableElement) {
 *   const tableId = generateTableId(table);
 *   console.log(tableId); // "8e2b4a1c9f3d7b6e"
 * }
 * ```
 */
export function generateTableId(table: HTMLTableElement): TableId {
  const rows = getTableRows(table);
  const firstRow = rows[0];
  const cols = firstRow ? getRowCells(firstRow).length : 0;
  const className = table.className || 'qd-analysis';

  // Create structure signature: "3x4:qd-analysis"
  const signature = `${rows.length}x${cols}:${className}`;

  return hashString(signature, 16);
}

/**
 * Generate stable cell key
 *
 * Format: "R{row}C{col}#f:{hash}"
 * - Row and column are 0-indexed
 * - Hash is 8-char from normalized cell content (whitespace collapsed)
 *
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @param content - Cell content
 * @returns Stable cell key
 *
 * @example
 * ```typescript
 * const key = generateCellKey(2, 4, 'Sample content');
 * console.log(key); // "R2C4#f:abc123de"
 * ```
 */
export function generateCellKey(row: number, col: number, content: string): CellKey {
  // Normalize content: collapse whitespace, trim
  const normalized = content.replace(/\s+/g, ' ').trim();

  // Generate 8-char hash from normalized content
  const contentHash = hashString(normalized, 8);

  return `R${row}C${col}#f:${contentHash}`;
}

/**
 * Check if a cell is editable
 *
 * A cell is editable if it HAS the 'interactive' class.
 * Cells without this class are considered read-only (headers or pre-filled content).
 *
 * Author constraint: Add class="interactive" to cells that should be editable.
 *
 * @param cell - Table cell element
 * @returns true if cell has 'interactive' class, false otherwise
 *
 * @example
 * ```typescript
 * const cell = row.cells[0];
 * if (isCellEditable(cell)) {
 *   // Cell has class="interactive", make it editable
 * } else {
 *   // Cell is read-only
 * }
 * ```
 */
export function isCellEditable(cell: HTMLTableCellElement): boolean {
  // Check for 'interactive' class
  return cell.classList.contains('interactive');
}

/**
 * Parse an analysis table
 *
 * Extracts table structure, generates stable identifiers, and identifies editable cells.
 *
 * @param table - Analysis table element
 * @returns Parsed analysis table data
 *
 * @example
 * ```typescript
 * const table = document.querySelector('table.qd-analysis');
 * if (table instanceof HTMLTableElement) {
 *   const parsed = parseAnalysisTable(table);
 *
 *   if (parsed.errors && parsed.errors.length > 0) {
 *     console.error('Validation errors:', parsed.errors);
 *   }
 *
 *   console.log(`Table ID: ${parsed.tableId}`);
 *   console.log(`Editable cells: ${parsed.editableCells.length}`);
 * }
 * ```
 */
export function parseAnalysisTable(table: HTMLTableElement): ParsedAnalysisTable {
  const errors: string[] = [];

  // Validate table structure
  if (!table.querySelector('tbody')) {
    errors.push('Analysis table must have a tbody element');
  }

  const rows = getTableRows(table);
  if (rows.length === 0) {
    errors.push('Analysis table must have at least one row');
  }

  // Generate table ID
  const tableId = generateTableId(table);

  // Identify editable cells
  const editableCells: ParsedAnalysisTable['editableCells'] = [];

  rows.forEach((row, rowIndex) => {
    const cells = getRowCells(row);

    cells.forEach((cell, colIndex) => {
      if (isCellEditable(cell)) {
        const content = getTextContent(cell);
        const key = generateCellKey(rowIndex, colIndex, content);

        editableCells.push({
          row: rowIndex,
          col: colIndex,
          key,
        });
      }
    });
  });

  return {
    element: table,
    tableId,
    editableCells,
    errors: errors.length > 0 ? errors : undefined,
  };
}
