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

import type { AnalysisData, CellKey } from '../types/contracts';
import { parseAnalysisTable } from '../services/analysis-parser';
import { STORAGE_KEYS, LIMITS } from '../types/contracts';
import { getPageId } from '../utils/page';

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
    console.warn('[AnalysisTable] Failed to parse table, skipping enhancement');
    return;
  }

  // eslint-disable-next-line no-console
  console.log(
    `[AnalysisTable] Enhancing table ${parsed.tableId} with ${parsed.editableCells.length} editable cells`,
  );

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

  // eslint-disable-next-line no-console
  console.log(`[AnalysisTable] Successfully enhanced table ${parsed.tableId}`);
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
 * Scan and enhance all analysis tables on the page
 */
export function enhanceAllAnalysisTables(options: EnhancementOptions = {}): void {
  const tables = document.querySelectorAll('table.qd-analysis');
  // eslint-disable-next-line no-console
  console.log(`[AnalysisTable] enhanceAllAnalysisTables called, found ${tables.length} tables`);

  tables.forEach((table, index) => {
    if (table instanceof HTMLTableElement) {
      // eslint-disable-next-line no-console
      console.log(`[AnalysisTable] Enhancing table ${index + 1}/${tables.length}`);
      enhanceAnalysisTable(table, options);
    }
  });

  // eslint-disable-next-line no-console
  console.log(`[AnalysisTable] Finished enhancing ${tables.length} tables`);
}

/**
 * Show student analysis entries in a comparison table (instructor mode)
 *
 * T077: Implements student entry display for analysis cells
 * T078: Implements 4-char username prefix display
 *
 * @param table - The analysis table element
 * @param students - Array of student records to display
 * @param pageId - Current page ID to extract analysis data from
 */
export function showStudentAnalysisEntries(
  table: HTMLTableElement | null,
  students: import('../types/contracts').StudentRecord[],
  pageId: string,
): void {
  if (!table || !students || students.length === 0) {
    return;
  }

  // Get table ID (should be set during enhancement)
  const tableId = table.dataset.tableId;
  if (!tableId) {
    console.warn('Analysis table has no tableId - was it enhanced?');
    return;
  }

  // Get cell keys from existing inputs (set during enhancement)
  // This is more reliable than re-parsing after cells have been enhanced
  const inputs = Array.from(table.querySelectorAll<HTMLInputElement>('input[data-cell-key]'));

  if (inputs.length === 0) {
    console.warn('No editable cells found in analysis table');
    return;
  }

  const cellKeys = inputs.map((input) => input.dataset.cellKey || '');

  // Create comparison table
  const comparisonTable = document.createElement('table');
  comparisonTable.className = 'qd-analysis-comparison';

  // Create header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Student ID column
  const studentIdHeader = document.createElement('th');
  studentIdHeader.textContent = 'Student';
  studentIdHeader.scope = 'col';
  headerRow.appendChild(studentIdHeader);

  // Cell columns (one for each editable cell)
  cellKeys.forEach((_, index) => {
    const cellHeader = document.createElement('th');
    cellHeader.textContent = `Field ${index + 1}`;
    cellHeader.scope = 'col';
    headerRow.appendChild(cellHeader);
  });

  thead.appendChild(headerRow);
  comparisonTable.appendChild(thead);

  // Create body rows for each student
  const tbody = document.createElement('tbody');

  students.forEach((student) => {
    const row = document.createElement('tr');
    row.className = 'qd-student-row';

    // T078: Student ID cell (first 4 chars)
    const studentIdCell = document.createElement('td');
    studentIdCell.className = 'qd-student-id';
    studentIdCell.textContent = student.serviceId.substring(0, 4);
    row.appendChild(studentIdCell);

    // Get student's analysis data for this page
    const pageData = student.pages[pageId];
    const analysisData = pageData?.analysis;

    // Check if table IDs match
    const studentCells = analysisData && analysisData.tableId === tableId ? analysisData.cells : {};

    // Add entry cells for each editable cell
    cellKeys.forEach((cellKey) => {
      const entryCell = document.createElement('td');
      entryCell.className = 'qd-student-entry';

      const entry = studentCells[cellKey];

      if (!entry || entry.trim() === '') {
        // No entry provided
        entryCell.textContent = '—';
        entryCell.classList.add('qd-no-entry');
      } else {
        // Show entry
        entryCell.textContent = entry;
      }

      row.appendChild(entryCell);
    });

    tbody.appendChild(row);
  });

  comparisonTable.appendChild(tbody);

  // Insert comparison table after the analysis table
  if (table.parentElement) {
    table.parentElement.insertBefore(comparisonTable, table.nextSibling);
  }
}

/**
 * Inject inline styles for analysis comparison tables
 */
export function injectAnalysisStyles(doc: Document = document): void {
  // Check if styles already injected
  if (doc.getElementById('qd-analysis-styles')) {
    return;
  }

  const style = doc.createElement('style');
  style.id = 'qd-analysis-styles';
  style.textContent = `
    /* Analysis comparison table styling */
    .qd-analysis-comparison {
      width: 100%;
      margin-top: 1rem;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .qd-analysis-comparison th,
    .qd-analysis-comparison td {
      padding: 0.5rem;
      text-align: left;
      border: 1px solid #e0e0e0;
    }

    .qd-analysis-comparison th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
    }

    .qd-student-id {
      font-weight: 500;
      font-family: monospace;
      background-color: #fafafa;
    }

    .qd-student-entry {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .qd-student-entry.qd-no-entry {
      color: #999;
      font-style: italic;
      text-align: center;
    }

    .qd-student-row:hover {
      background-color: #fafafa;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .qd-analysis-comparison {
        font-size: 0.75rem;
      }

      .qd-analysis-comparison th,
      .qd-analysis-comparison td {
        padding: 0.25rem;
      }

      .qd-student-entry {
        max-width: 100px;
      }
    }
  `;

  doc.head.appendChild(style);
}
