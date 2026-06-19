/**
 * Analysis instructor overlay.
 *
 * Renders (and clears) the per-cell list of student entries shown when an
 * instructor toggles "show answers" on an analysis table. Extracted from
 * `analysis-table.ts`.
 */

import type { SessionData, PageId, StudentRecord } from '../types/contracts.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import type { AnalysisTableMetadata } from './analysis-table.js';
import type { CellEntry } from '../services/analysis-display.js';
import { groupEntriesByCell } from '../services/analysis-display.js';
import { getStorageService } from '../services/storage-service.js';
import { getTableRows, getRowCells } from '../utils/dom-helpers.js';
import { getJSON } from '../utils/storage-helpers.js';
import { info, error as logError, warn } from '../utils/logger.js';
import '../components/qd-student-entries.js';
import type { QdStudentEntries } from '../components/qd-student-entries.js';

/**
 * Create the reusable {@link QdStudentEntries} component for a cell's entries
 * (FR-012, FR-013). Styles and escaping are handled by the component.
 *
 * @param entries - Student entries for a cell (sorted internally)
 * @returns A `<qd-student-entries>` element
 */
export function createStudentEntriesDisplay(entries: CellEntry[]): QdStudentEntries {
  const el = document.createElement('qd-student-entries');
  el.entries = entries;
  return el;
}

/**
 * Show student entries for all editable cells in the table (instructor view).
 *
 * @param table - Analysis table element
 * @param metadata - Table metadata for the table
 */
export async function showStudentEntriesForTable(
  table: HTMLTableElement,
  metadata: AnalysisTableMetadata,
): Promise<void> {
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
 * Hide student entries for all cells in the table.
 *
 * @param table - Analysis table element
 */
export function hideStudentEntriesForTable(table: HTMLTableElement): void {
  const displays = table.querySelectorAll('[data-qd-student-entries]');
  displays.forEach((display) => display.remove());

  info('Hidden student entries from analysis table');
}

/**
 * Get the current page ID from the document (body data attribute or URL).
 *
 * @returns Page ID or undefined
 */
export function getCurrentPageId(): PageId | undefined {
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
