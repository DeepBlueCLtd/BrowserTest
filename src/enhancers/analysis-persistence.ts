/**
 * Analysis cell persistence.
 *
 * Handles cell edit → debounce → IndexedDB save → cache update → event for
 * analysis tables. Extracted from `analysis-table.ts`; the record-mutation
 * logic now lives in `storage-service.updateRecordWithAnalysis`.
 */

import type { SessionData, CellKey } from '../types/contracts.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import type { AnalysisTableMetadata } from './analysis-table.js';
import { getStorageService } from '../services/storage-service.js';
import { getJSON, setJSON } from '../utils/storage-helpers.js';
import { getTextContent } from '../utils/dom-helpers.js';
import { emitCustomEvent } from '../utils/event-helpers.js';
import { info, error as logError, warn } from '../utils/logger.js';

/**
 * Handle a cell edit (debounced save).
 *
 * @param metadata - Table metadata
 * @param cell - Edited cell element
 * @param cellKey - Cell key
 */
export function handleCellEdit(
  metadata: AnalysisTableMetadata,
  cell: HTMLTableCellElement,
  cellKey: CellKey,
): void {
  const { debouncer, pageId } = metadata;

  if (!debouncer || !pageId) {
    return;
  }

  const content = getTextContent(cell);

  // Debounce the save (500ms - longer than quiz for thoughtful editing)
  debouncer.debounce(
    `save-cell-${cellKey}`,
    () => {
      void saveCellData(metadata, cellKey, content);
    },
    500,
  );
}

/**
 * Save cell data to storage (sessionStorage cache + IndexedDB).
 *
 * @param metadata - Table metadata
 * @param cellKey - Cell key
 * @param content - Cell content
 */
export async function saveCellData(
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

  // Apply the cell edit to the record
  const updatedRecord = storageService.updateRecordWithAnalysis(
    studentRecord,
    pageId,
    parsed.tableId,
    cellKey,
    content,
  );

  // Save updated record to IndexedDB
  try {
    await storageService.saveStudentRecord(updatedRecord);
  } catch (err) {
    warn('Failed to save student record to IndexedDB', err);
  }

  // Build cache from updated record and persist to sessionStorage
  const cache = storageService.buildCache(updatedRecord);
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
