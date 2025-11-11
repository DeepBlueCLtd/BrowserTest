/**
 * Analysis Table Enhancer
 *
 * Enhances analysis tables by injecting text inputs into editable cells,
 * implementing auto-save with debouncing, and managing data persistence.
 *
 * Per requirements:
 * - Editable cells (no background-color) → text inputs
 * - Auto-save on input with debouncing (~200ms)
 * - Data persisted to storage via session service
 * - Cell keys for tracking individual cell data
 */

import type { AnalysisData, CellKey, PageId } from '../types/contracts';
import { parseAnalysisTable } from '../services/analysis-parser';
import { STORAGE_KEYS, LIMITS } from '../types/contracts';

/**
 * Enhancement options
 */
interface EnhancementOptions {
  /** Callback for save operations (for testing) */
  onSave?: (data: AnalysisData) => void;
  /** Custom debounce delay in ms (default: 200) */
  debounceMs?: number;
}

/**
 * Debounce timer map for inputs
 */
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Enhance an analysis table with interactive inputs
 *
 * @param table - Table element to enhance
 * @param options - Enhancement options
 */
export function enhanceAnalysisTable(
  table: HTMLTableElement,
  options: EnhancementOptions = {},
): void {
  // Parse the table
  const parsed = parseAnalysisTable(table);

  // Only enhance valid analysis tables
  if (!parsed) {
    return;
  }

  // Display validation errors if any
  if (parsed.errors && parsed.errors.length > 0) {
    console.warn('Analysis table validation errors:', parsed.errors);
    // Could show banner here in future
    return;
  }

  // Store table ID on element for data loading
  if (!table.dataset.tableId) {
    table.dataset.tableId = parsed.tableId;
  }

  // Load existing data from storage
  const existingData = loadAnalysisData(parsed.tableId);

  // Enhance each editable cell
  parsed.editableCells.forEach((cellInfo) => {
    enhanceCell(table, cellInfo, existingData, parsed.tableId, options);
  });
}

/**
 * Enhance a single cell with text input
 */
function enhanceCell(
  table: HTMLTableElement,
  cellInfo: { row: number; col: number; key: CellKey },
  existingData: AnalysisData | null,
  tableId: string,
  options: EnhancementOptions,
): void {
  // Find the cell in the table
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  if (rows.length === 0) {
    // Fallback to all rows if no tbody
    const allRows = Array.from(table.querySelectorAll('tr'));
    const theadRows = Array.from(table.querySelectorAll('thead tr'));
    rows.push(...allRows.filter((row) => !theadRows.includes(row)));
  }

  const row = rows[cellInfo.row];
  if (!row) return;

  const cells = Array.from(row.querySelectorAll('td'));
  const cell = cells[cellInfo.col];
  if (!cell) return;

  // Get original content
  const originalContent = cell.textContent?.trim() || '';

  // Get saved content if available
  const savedContent = existingData?.cells[cellInfo.key];
  const initialValue = savedContent !== undefined ? savedContent : originalContent;

  // Create text input
  const input = document.createElement('input');
  input.type = 'text';
  input.value = initialValue;
  input.dataset.cellKey = cellInfo.key;
  input.maxLength = LIMITS.MAX_CELL_CONTENT_LENGTH;

  // Style the input to fit the cell
  input.style.width = '100%';
  input.style.boxSizing = 'border-box';
  input.style.padding = '4px 8px';
  input.style.border = '1px solid #ced4da';
  input.style.borderRadius = '4px';
  input.style.fontSize = 'inherit';
  input.style.fontFamily = 'inherit';

  // Add input event listener with debouncing
  input.addEventListener('input', () => {
    handleInputChange(input, tableId, cellInfo.key, options);
  });

  // Replace cell content with input
  cell.innerHTML = '';
  cell.appendChild(input);
}

/**
 * Handle input change with debouncing and auto-save
 */
function handleInputChange(
  input: HTMLInputElement,
  tableId: string,
  cellKey: CellKey,
  options: EnhancementOptions,
): void {
  const debounceMs = options.debounceMs ?? 200;

  // Clear existing timer for this input
  const existingTimer = debounceTimers.get(cellKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set new timer
  const timer = setTimeout(() => {
    saveAnalysisData(tableId, cellKey, input.value, options);
    debounceTimers.delete(cellKey);
  }, debounceMs);

  debounceTimers.set(cellKey, timer);
}

/**
 * Save analysis data to storage
 */
function saveAnalysisData(
  tableId: string,
  cellKey: CellKey,
  value: string,
  options: EnhancementOptions,
): void {
  // Load existing data
  let data = loadAnalysisData(tableId);

  // Create new data structure if none exists
  if (!data) {
    data = {
      tableId,
      cells: {},
      firstEdited: new Date().toISOString(),
    };
  }

  // Update cell value
  data.cells[cellKey] = value;
  data.lastEdited = new Date().toISOString();

  // Save to storage (temporary implementation using sessionStorage)
  // In full implementation, this would go through StorageAdapter
  try {
    const pageId = getPageId();
    const storageKey = `${STORAGE_KEYS.CACHE}/analysis/${pageId}/${tableId}`;
    sessionStorage.setItem(storageKey, JSON.stringify(data));

    // Call custom save callback if provided (for testing)
    if (options.onSave) {
      options.onSave(data);
    }
  } catch (error) {
    console.error('Failed to save analysis data:', error);
  }
}

/**
 * Load analysis data from storage
 */
function loadAnalysisData(tableId: string): AnalysisData | null {
  try {
    const pageId = getPageId();
    const storageKey = `${STORAGE_KEYS.CACHE}/analysis/${pageId}/${tableId}`;
    const stored = sessionStorage.getItem(storageKey);

    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored) as AnalysisData;
    return data;
  } catch (error) {
    console.error('Failed to load analysis data:', error);
    return null;
  }
}

/**
 * Get current page ID from document
 * Simplified version - in full implementation would be more sophisticated
 */
function getPageId(): PageId {
  // Try to extract from URL or document metadata
  const path = window.location.pathname;
  const match = path.match(/([^/]+)\.html?$/);
  return match ? match[1] : 'unknown-page';
}

/**
 * Scan and enhance all analysis tables on the page
 */
export function enhanceAllAnalysisTables(options: EnhancementOptions = {}): void {
  const tables = document.querySelectorAll('table.qd-analysis');
  tables.forEach((table) => {
    if (table instanceof HTMLTableElement) {
      enhanceAnalysisTable(table, options);
    }
  });
}
