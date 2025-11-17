/**
 * Analysis Table Enhancer
 *
 * Implements single-phase progressive enhancement for analysis tables.
 * Similar to quiz-table enhancer but for free-form editable content.
 *
 * Features:
 * - Non-interactive mode: Read-only display
 * - Interactive mode: Enable editing for cells with 'interactive' class
 * - Debounced auto-save to prevent excessive writes
 * - Stable cell keys for persistence across page reloads
 * - Uses WeakMap for metadata (not DOM attributes)
 * - Event emission for data changes
 *
 * Author constraints:
 * - Cells WITH class="interactive" = editable (in interactive mode)
 * - Cells WITHOUT 'interactive' class = read-only (always)
 * - Maximum ONE analysis table per page
 */

import type {
  ParsedAnalysisTable,
  AnalysisData,
  PageId,
  SessionData,
  SessionCache,
  CellKey,
} from '../types/contracts.js';
import { parseAnalysisTable, isCellEditable } from '../services/analysis-parser.js';
import { Debouncer } from '../utils/debouncer.js';
import { getTableRows, getRowCells, addClass, getTextContent } from '../utils/dom-helpers.js';
import { emitCustomEvent } from '../utils/event-helpers.js';
import { getJSON, setJSON } from '../utils/storage-helpers.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import { info, error as logError } from '../utils/logger.js';

/**
 * Enhancement options
 */
export interface EnhanceAnalysisTableOptions {
  /** Whether to enable interactive editing */
  interactive: boolean;
  /** Current page ID (required for interactive mode) */
  pageId?: PageId;
}

/**
 * Analysis table metadata (stored in WeakMap)
 */
interface AnalysisTableMetadata {
  /** Parsed analysis data */
  parsed: ParsedAnalysisTable;
  /** Enhancement mode */
  interactive: boolean;
  /** Page ID (if interactive) */
  pageId?: PageId;
  /** Debouncer for auto-save */
  debouncer?: Debouncer;
  /** Cell element to cell key mapping */
  cellKeyMap?: Map<HTMLTableCellElement, CellKey>;
}

// WeakMap to store table metadata without polluting DOM
const tableMetadata = new WeakMap<HTMLTableElement, AnalysisTableMetadata>();

/**
 * Enhance an analysis table with single-phase enhancement
 *
 * @param table - The analysis table element
 * @param options - Enhancement options
 * @returns true if enhancement succeeded, false if errors occurred
 *
 * @example
 * ```typescript
 * // Non-interactive mode (read-only)
 * const table = document.querySelector('table.qd-analysis');
 * if (table instanceof HTMLTableElement) {
 *   enhanceAnalysisTable(table, { interactive: false });
 * }
 *
 * // Interactive mode (enable editing)
 * enhanceAnalysisTable(table, { interactive: true, pageId: 'gram-1' });
 * ```
 */
export function enhanceAnalysisTable(
  table: HTMLTableElement,
  options: EnhanceAnalysisTableOptions,
): boolean {
  // Parse the table
  const parsed = parseAnalysisTable(table);

  // Check for parsing errors
  if (parsed.errors && parsed.errors.length > 0) {
    logError('Analysis table has validation errors:', parsed.errors);
    // Still continue enhancement to show errors visually
  }

  // Store metadata in WeakMap
  const metadata: AnalysisTableMetadata = {
    parsed,
    interactive: options.interactive,
    pageId: options.pageId,
  };

  if (options.interactive) {
    // Validate pageId is provided for interactive mode
    if (!options.pageId) {
      logError('Interactive mode requires pageId option');
      return false;
    }

    // Initialize debouncer for auto-save
    metadata.debouncer = new Debouncer();
    metadata.cellKeyMap = new Map();
  }

  tableMetadata.set(table, metadata);

  // Apply enhancement based on mode
  if (options.interactive) {
    return enhanceInteractive(table, metadata);
  } else {
    return enhanceNonInteractive(table);
  }
}

/**
 * Enhance table in non-interactive mode
 * - Read-only display (no contenteditable)
 * - No interaction enabled
 *
 * @param table - Analysis table element
 * @returns true if successful
 */
function enhanceNonInteractive(table: HTMLTableElement): boolean {
  addClass(table, 'qd-analysis-non-interactive');
  info('Analysis table enhanced in non-interactive mode');

  return true;
}

/**
 * Enhance table in interactive mode
 * - Enable editing for cells without background-color
 * - Setup auto-save with debouncing
 * - Load existing data from storage
 *
 * @param table - Analysis table element
 * @param metadata - Table metadata
 * @returns true if successful
 */
function enhanceInteractive(table: HTMLTableElement, metadata: AnalysisTableMetadata): boolean {
  const { parsed, pageId, debouncer, cellKeyMap } = metadata;

  if (!pageId || !debouncer || !cellKeyMap) {
    logError('Interactive mode requires pageId, debouncer, and cellKeyMap');
    return false;
  }

  // Get session data
  const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
  if (!session) {
    logError('No active session found');
    return false;
  }

  // Get session cache
  const cache = getJSON<SessionCache>(STORAGE_KEYS.CACHE);
  const pageCache = cache?.pages[pageId];
  const existingAnalysis = pageCache?.analysis;

  // Load existing cell data if available
  const existingCells = existingAnalysis?.cells || {};

  // Get all rows
  const rows = getTableRows(table);

  // Enable editing for editable cells
  parsed.editableCells.forEach(({ row, col, key }) => {
    const rowElement = rows[row];
    if (!rowElement) return;

    const cells = getRowCells(rowElement);
    const cell = cells[col];
    if (!cell) return;

    // Verify cell is still editable (defensive check)
    if (!isCellEditable(cell)) {
      logError(`Cell at R${row}C${col} is no longer editable`);
      return;
    }

    // Store cell key mapping
    cellKeyMap.set(cell, key);

    // Load existing content if available
    if (existingCells[key]) {
      cell.textContent = existingCells[key];
    }

    // Make cell editable
    cell.contentEditable = 'true';
    addClass(cell, 'qd-editable');

    // Setup auto-save on input
    cell.addEventListener('input', () => {
      handleCellEdit(metadata, cell, key);
    });

    // Prevent Enter key from creating line breaks (optional - may want multi-line)
    // For now, allow multi-line editing
  });

  addClass(table, 'qd-analysis-interactive');
  info(`Analysis table enhanced in interactive mode for page ${pageId}`);

  return true;
}

/**
 * Handle cell edit
 *
 * @param metadata - Table metadata
 * @param cell - Edited cell element
 * @param cellKey - Cell key
 */
function handleCellEdit(
  metadata: AnalysisTableMetadata,
  cell: HTMLTableCellElement,
  cellKey: CellKey,
): void {
  const { debouncer, pageId } = metadata;

  if (!debouncer || !pageId) {
    return;
  }

  const content = getTextContent(cell);

  // Debounce the save operation (500ms delay - longer than quiz for thoughtful editing)
  debouncer.debounce(
    `save-cell-${cellKey}`,
    () => {
      saveCellData(metadata, cellKey, content);
    },
    500,
  );
}

/**
 * Save cell data to storage
 *
 * @param metadata - Table metadata
 * @param cellKey - Cell key
 * @param content - Cell content
 */
function saveCellData(
  metadata: AnalysisTableMetadata,
  cellKey: CellKey,
  content: string,
): void {
  const { pageId, parsed } = metadata;

  if (!pageId) {
    return;
  }

  // Get session
  const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
  if (!session) {
    logError('No active session found');
    return;
  }

  // Get or create cache
  const cache = getJSON<SessionCache>(STORAGE_KEYS.CACHE) || {
    totals: { answered: 0, correct: 0 },
    pages: {},
  };

  // Get or create page data
  const pageData = cache.pages[pageId] || {
    state: 'unstarted',
    answered: 0,
    correct: 0,
    answers: [],
  };

  // Get or create analysis data
  const analysisData: AnalysisData = pageData.analysis || {
    tableId: parsed.tableId,
    cells: {},
  };

  // Update cell content
  analysisData.cells[cellKey] = content;

  // Update timestamps
  const now = new Date().toISOString();
  if (!analysisData.firstEdited) {
    analysisData.firstEdited = now;
  }
  analysisData.lastEdited = now;

  // Store analysis data
  pageData.analysis = analysisData;
  cache.pages[pageId] = pageData;

  // Save updated cache
  setJSON(STORAGE_KEYS.CACHE, cache);

  // Emit event
  emitCustomEvent('qd:analysis-saved', {
    pageId,
    tableId: parsed.tableId,
    cellKey,
    content,
  });

  info(`Analysis cell saved for ${cellKey} on page ${pageId}`);
}

/**
 * Get analysis table metadata
 *
 * @param table - Analysis table element
 * @returns Metadata if table has been enhanced, undefined otherwise
 */
export function getAnalysisTableMetadata(
  table: HTMLTableElement,
): AnalysisTableMetadata | undefined {
  return tableMetadata.get(table);
}

/**
 * Check if table is enhanced
 *
 * @param table - Analysis table element
 * @returns true if table has been enhanced
 */
export function isAnalysisTableEnhanced(table: HTMLTableElement): boolean {
  return tableMetadata.has(table);
}
