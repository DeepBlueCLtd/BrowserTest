/**
 * Analysis display logic (pure).
 *
 * DOM-free helpers for collecting and ordering instructor-view student entries
 * for analysis tables. Extracted from `analysis-table.ts`.
 */

import type { StudentRecord, PageId, CellKey, ServiceId } from '../types/contracts.js';

/**
 * A single student's entry for an analysis cell (instructor view).
 */
export interface CellEntry {
  serviceId: ServiceId;
  name: string;
  content: string;
  timestamp: string;
}

/**
 * Group student entries by cell key (FR-012).
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
 * Sort entries by timestamp in descending order (newest first) (FR-012).
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
