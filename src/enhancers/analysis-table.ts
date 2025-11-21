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
  StudentRecord,
  ServiceId,
} from '../types/contracts.js';
import { parseAnalysisTable, isCellEditable } from '../services/analysis-parser.js';
import { Debouncer } from '../utils/debouncer.js';
import { getTableRows, getRowCells, addClass, getTextContent } from '../utils/dom-helpers.js';
import { emitCustomEvent } from '../utils/event-helpers.js';
import { getJSON, setJSON } from '../utils/storage-helpers.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import { info, error as logError, warn } from '../utils/logger.js';
import { getStorageService } from '../services/storage-service.js';
import { formatStoredTimestamp } from '../utils/date-helpers.js';

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

/**
 * Student entry for a cell (used in instructor view)
 */
export interface CellEntry {
  serviceId: ServiceId;
  name: string;
  content: string;
  timestamp: string;
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
 * - Listen for instructor view events to display student entries
 *
 * @param table - Analysis table element
 * @returns true if successful
 */
function enhanceNonInteractive(table: HTMLTableElement): boolean {
  addClass(table, 'qd-analysis-non-interactive');

  // Add event listeners for instructor view
  const showHandler = () => {
    void showStudentEntriesForTable(table);
  };

  const hideHandler = () => {
    hideStudentEntriesForTable(table);
  };

  document.addEventListener('qd:instructor-show-answers', showHandler);
  document.addEventListener('qd:instructor-hide-answers', hideHandler);

  info('Analysis table enhanced in non-interactive mode with instructor view support');

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
      void saveCellData(metadata, cellKey, content);
    },
    500,
  );
}

/**
 * Save cell data to storage (sessionStorage + IndexedDB)
 *
 * @param metadata - Table metadata
 * @param cellKey - Cell key
 * @param content - Cell content
 */
async function saveCellData(
  metadata: AnalysisTableMetadata,
  cellKey: CellKey,
  content: string,
): Promise<void> {
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

  // Load student record from IndexedDB
  const storageService = getStorageService();
  let studentRecord;
  try {
    studentRecord = await storageService.loadStudentRecord(session);
  } catch (err) {
    warn('Failed to load student record, analysis not saved', err);
    return;
  }

  // Get or create page data in student record
  const pageData = studentRecord.pages[pageId] || {
    answers: [],
    state: 'unstarted' as const,
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

  // Store analysis data in page
  pageData.analysis = analysisData;

  // Update student record
  studentRecord.pages[pageId] = pageData;
  studentRecord.updated = now;

  // Save updated record to IndexedDB
  try {
    await storageService.saveStudentRecord(studentRecord);
  } catch (err) {
    warn('Failed to save student record to IndexedDB', err);
  }

  // Build cache from updated record
  const cache = storageService.buildCache(studentRecord);

  // Save cache to sessionStorage for quick access
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

/**
 * Group student entries by cell key (FR-012)
 *
 * @param students - All student records
 * @param pageId - Page ID to filter by
 * @returns Map of cell key to array of student entries
 */
export function groupEntriesByCell(
  students: StudentRecord[],
  pageId: PageId,
): Record<CellKey, CellEntry[]> {
  const grouped: Record<CellKey, CellEntry[]> = {};

  students.forEach((student) => {
    const pageData = student.pages[pageId];
    if (!pageData || !pageData.analysis) {
      return;
    }

    const { cells } = pageData.analysis;
    const timestamp = pageData.analysis.lastEdited || student.updated;

    Object.entries(cells).forEach(([cellKey, content]) => {
      if (!grouped[cellKey]) {
        grouped[cellKey] = [];
      }

      grouped[cellKey].push({
        serviceId: student.serviceId,
        name: student.name,
        content,
        timestamp,
      });
    });
  });

  return grouped;
}

/**
 * Sort entries by timestamp in descending order (newest first) (FR-012)
 *
 * @param entries - Cell entries to sort
 * @returns Sorted entries (newest first)
 */
export function sortByTimestamp(entries: CellEntry[]): CellEntry[] {
  return [...entries].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateB - dateA; // Descending (newest first)
  });
}

/**
 * Create display element for student entries (FR-012, FR-013)
 *
 * @param entries - Student entries for a cell (should already be sorted)
 * @returns HTML div element with entries or placeholder
 */
export function createStudentEntriesDisplay(entries: CellEntry[]): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'qd-student-entries';

  if (entries.length === 0) {
    // FR-013: Placeholder for empty cells
    container.className += ' qd-no-entries';
    container.textContent = '(No entries yet)';
    container.style.cssText =
      'color: #9ca3af; font-style: italic; font-size: 13px; padding: 8px 0;';
    return container;
  }

  // Sort entries before displaying (newest first)
  const sortedEntries = sortByTimestamp(entries);

  // FR-012: Display each student entry (single line format)
  sortedEntries.forEach((entry) => {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'qd-entry';
    entryDiv.style.cssText =
      'padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #1f2937;';

    // Student name with last 4 digits of serviceId
    const last4 = entry.serviceId.slice(-4);
    const timestamp = formatStoredTimestamp(entry.timestamp);

    // Single line: name (id) • timestamp: content
    const nameSpan = document.createElement('span');
    nameSpan.style.cssText = 'font-weight: 600; color: #374151;';
    nameSpan.textContent = `${entry.name} (${last4}) • ${timestamp}: `;

    const contentSpan = document.createElement('span');
    contentSpan.style.cssText = 'white-space: pre-wrap;';
    contentSpan.textContent = entry.content;

    entryDiv.appendChild(nameSpan);
    entryDiv.appendChild(contentSpan);
    container.appendChild(entryDiv);
  });

  container.style.cssText = 'margin-top: 12px; padding-top: 8px; border-top: 2px solid #3b82f6;';

  return container;
}

/**
 * Show student entries for all cells in the table (instructor view)
 *
 * @param table - Analysis table element
 */
async function showStudentEntriesForTable(table: HTMLTableElement): Promise<void> {
  const metadata = tableMetadata.get(table);
  if (!metadata) {
    warn('Cannot show student entries: table not enhanced');
    return;
  }

  // Get current page ID from metadata (if interactive) or from document
  const pageId = metadata.pageId || getCurrentPageId();
  if (!pageId) {
    warn('Cannot show student entries: page ID not found');
    return;
  }

  // Get session to determine release
  const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
  if (!session) {
    warn('Cannot show student entries: no active session');
    return;
  }

  // Load all students for this release
  const storageService = getStorageService();
  let students: StudentRecord[];
  try {
    students = await storageService.getStudentsByRelease(session.release);
  } catch (err) {
    logError('Failed to load students for instructor view:', err);
    return;
  }

  // Group entries by cell
  const grouped = groupEntriesByCell(students, pageId);

  // Get all editable cells from parsed data
  const { editableCells } = metadata.parsed;
  const rows = getTableRows(table);

  // Display entries for each editable cell
  editableCells.forEach(({ row, col, key }) => {
    const rowElement = rows[row];
    if (!rowElement) return;

    const cells = getRowCells(rowElement);
    const cell = cells[col];
    if (!cell) return;

    // Get entries for this cell
    const entries = grouped[key] || [];

    // Create and append display element
    const displayElement = createStudentEntriesDisplay(entries);
    displayElement.setAttribute('data-qd-student-entries', 'true');

    // Remove any existing display
    const existing = cell.querySelector('[data-qd-student-entries]');
    if (existing) {
      existing.remove();
    }

    cell.appendChild(displayElement);
  });

  info(`Displayed student entries for ${editableCells.length} cells`);
}

/**
 * Hide student entries for all cells in the table
 *
 * @param table - Analysis table element
 */
function hideStudentEntriesForTable(table: HTMLTableElement): void {
  // Remove all student entry displays
  const displays = table.querySelectorAll('[data-qd-student-entries]');
  displays.forEach((display) => display.remove());

  info('Hidden student entries from analysis table');
}

/**
 * Reset analysis table to non-interactive mode
 * Called on logout to clear student/instructor UI state
 *
 * @param table - Analysis table element
 */
export function resetAnalysisTableToNonInteractive(table: HTMLTableElement): void {
  const metadata = tableMetadata.get(table);
  if (!metadata) return;

  // Hide any displayed student entries (instructor view)
  hideStudentEntriesForTable(table);

  // If table was interactive, disable editing and clear content
  if (metadata.interactive) {
    // Find all editable cells, clear content, and disable contentEditable
    const editableCells = table.querySelectorAll('.qd-editable');
    editableCells.forEach((cell) => {
      if (cell instanceof HTMLTableCellElement) {
        cell.contentEditable = 'false';
        cell.classList.remove('qd-editable');
        // Clear student-entered content on logout
        cell.textContent = '';
      }
    });

    // Remove interactive class from table
    table.classList.remove('qd-analysis-interactive');

    // Cancel any pending saves
    metadata.debouncer?.cancelAll();
  }

  // Update metadata to mark as non-interactive
  metadata.interactive = false;
  metadata.pageId = undefined;
  metadata.debouncer = undefined;
  metadata.cellKeyMap = undefined;

  info('Reset analysis table to non-interactive mode');
}

/**
 * Get current page ID from document
 * Extracts from body data attribute or URL
 *
 * @returns Page ID or undefined
 */
function getCurrentPageId(): PageId | undefined {
  // Try body data attribute first
  const bodyPageId = document.body.dataset.pageId;
  if (bodyPageId) {
    return bodyPageId;
  }

  // Fallback: extract from URL filename
  const path = window.location.pathname;
  const filename = path.split('/').pop() || '';
  const pageId = filename.replace('.html', '');

  return pageId || undefined;
}
