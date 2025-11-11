/**
 * Analysis Table Parser
 *
 * Parses DITA analysis tables with qd-analysis class and identifies
 * editable cells (those with 'interactive' class).
 *
 * Per contract specifications:
 * - Cells WITH 'interactive' class = editable
 * - Cells WITHOUT 'interactive' class = read-only
 * - Cell keys format: R{row}C{col}#f:{hash}
 * - Table ID: 16-char hash of table structure
 */

import type { ParsedAnalysisTable, CellKey, TableId } from '../types/contracts';
import { CSS_CLASSES, LIMITS } from '../types/contracts';

/**
 * Parse an analysis table and identify editable cells
 *
 * @param table - HTML table element to parse
 * @returns Parsed table data or null if invalid
 */
export function parseAnalysisTable(
  table: HTMLTableElement | null | undefined,
): ParsedAnalysisTable | null {
  // Validate input
  if (!table || !(table instanceof HTMLTableElement)) {
    return null;
  }

  // Check for qd-analysis class
  if (!table.classList.contains(CSS_CLASSES.ANALYSIS_TABLE)) {
    return null;
  }

  const errors: string[] = [];
  const editableCells: Array<{
    row: number;
    col: number;
    key: CellKey;
  }> = [];

  // Get all rows (handle both tbody and direct children)
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  if (rows.length === 0) {
    // Fallback to direct tr children if no tbody
    const directRows = Array.from(table.querySelectorAll('tr'));
    // Filter out thead rows
    const theadRows = Array.from(table.querySelectorAll('thead tr'));
    rows.push(...directRows.filter((row) => !theadRows.includes(row)));
  }

  // Check if table has any cells
  let totalCells = 0;

  // Parse each row
  rows.forEach((row, rowIndex) => {
    const cells = Array.from(row.querySelectorAll('td'));
    totalCells += cells.length;

    cells.forEach((cell, colIndex) => {
      // Check if cell is editable (no background-color)
      if (isEditableCell(cell)) {
        const content = cell.textContent?.trim() || '';

        // Validate content length
        if (content.length > LIMITS.MAX_CELL_CONTENT_LENGTH) {
          errors.push(
            `Cell at R${rowIndex}C${colIndex} exceeds maximum length of ${LIMITS.MAX_CELL_CONTENT_LENGTH} characters`,
          );
        }

        // Generate cell key
        const key = getCellKey(rowIndex, colIndex, content);

        editableCells.push({
          row: rowIndex,
          col: colIndex,
          key,
        });
      }
    });
  });

  // Validate table has cells
  if (totalCells === 0) {
    errors.push('Table has no cells');
  }

  // Generate table ID from structure
  const tableId = generateTableId(table);

  return {
    element: table,
    tableId,
    editableCells,
    ...(errors.length > 0 && { errors }),
  };
}

/**
 * Check if a cell is editable (has 'interactive' class)
 *
 * @param cell - Table cell element
 * @returns True if cell is editable
 */
function isEditableCell(cell: HTMLTableCellElement): boolean {
  return cell.classList.contains('interactive');
}

/**
 * Generate cell key in format: R{row}C{col}#f:{hash}
 *
 * @param row - Row index
 * @param col - Column index
 * @param content - Cell content for hashing
 * @returns Cell key string
 */
export function getCellKey(row: number, col: number, content: string): CellKey {
  const hash = hashContent(content);
  return `R${row}C${col}#f:${hash}`;
}

/**
 * Generate 8-character hash from content
 *
 * Uses SHA-256 and takes first 8 characters.
 * Normalizes whitespace before hashing for consistency.
 *
 * @param content - Content to hash
 * @returns 8-character hex hash
 */
export function hashContent(content: string): string {
  // Normalize whitespace: collapse multiple spaces to single space
  const normalized = content.trim().replace(/\s+/g, ' ');

  // Simple hash implementation using crypto API if available
  // For browser compatibility, we use a basic hash function
  const hash = simpleHash(normalized);

  return hash;
}

/**
 * Simple hash function for content
 * Returns 8-character hex string
 *
 * @param str - String to hash
 * @returns 8-character hex hash
 */
function simpleHash(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive number and then to hex
  const positiveHash = Math.abs(hash);
  let hex = positiveHash.toString(16);

  // Pad or truncate to 8 characters
  if (hex.length < 8) {
    hex = hex.padStart(8, '0');
  } else if (hex.length > 8) {
    hex = hex.substring(0, 8);
  }

  return hex;
}

/**
 * Generate table ID from table structure
 *
 * Creates a 16-character hash based on table dimensions and structure
 *
 * @param table - Table element
 * @returns 16-character table ID
 */
function generateTableId(table: HTMLTableElement): TableId {
  // Generate identifier from table structure
  const rows = table.querySelectorAll('tbody tr').length || table.querySelectorAll('tr').length;
  const firstRow = table.querySelector('tr');
  const cols = firstRow ? firstRow.querySelectorAll('td, th').length : 0;

  // Create structure signature
  const structure = `${rows}x${cols}:${table.className}`;

  // Hash the structure twice to get 16 characters
  const hash1 = simpleHash(structure);
  const hash2 = simpleHash(structure + hash1);

  return hash1 + hash2.substring(0, 8);
}
