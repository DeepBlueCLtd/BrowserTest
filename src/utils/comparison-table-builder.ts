/**
 * Comparison table builder utility
 *
 * Provides a reusable pattern for building instructor comparison tables
 * that display student data side-by-side. Eliminates ~100 lines of
 * duplicated table-building code across quiz and analysis enhancers.
 *
 * Key features:
 * - Type-safe column and cell configuration
 * - Consistent styling and structure
 * - XSS-safe DOM manipulation (textContent only)
 * - Flexible cell rendering with custom classes
 */

import type { StudentRecord, ServiceId, PageId } from '../types/contracts.js';
import { createElement } from './dom-helpers.js';

/**
 * Configuration for a table column
 */
export interface ColumnConfig {
  /** Column header text */
  label: string;
  /** Optional column header scope (default: 'col') */
  scope?: string;
}

/**
 * Cell rendering result
 */
export interface CellRender {
  /** Cell text content */
  text: string;
  /** Optional CSS classes to add to the cell */
  classes?: string[];
}

/**
 * Function that extracts cell data for a specific student and column
 *
 * @param student - Student record
 * @param columnIndex - Zero-based column index
 * @param pageId - Current page ID
 * @returns Cell render configuration, or null to skip the cell
 */
export type CellExtractor = (
  student: StudentRecord,
  columnIndex: number,
  pageId: PageId,
) => CellRender | null;

/**
 * Comparison table configuration
 */
export interface ComparisonTableConfig {
  /** CSS class name for the table element */
  tableClass: string;
  /** Column configurations (excluding the leading "Student" column) */
  columns: ColumnConfig[];
  /** Function to extract and render cell data */
  cellExtractor: CellExtractor;
  /** Optional CSS class for the student ID column (default: 'qd-student-id') */
  studentIdClass?: string;
  /** Optional CSS class for data cells (default: 'qd-student-answer') */
  dataCellClass?: string;
  /** Number of characters to show from student ID (default: 4) */
  studentIdLength?: number;
}

/**
 * Build a comparison table showing student data side-by-side
 *
 * Creates a table with:
 * - Header row: "Student" | Column 1 | Column 2 | ... | Column N
 * - Body rows: One row per student with ID + extracted cell data
 *
 * @param students - Array of student records to display
 * @param pageId - Current page ID (passed to cell extractor)
 * @param config - Table configuration
 * @returns HTML table element ready for insertion
 *
 * @example
 * ```typescript
 * // Build quiz comparison table
 * const table = buildComparisonTable(students, 'gram-1', {
 *   tableClass: 'qd-student-comparison',
 *   columns: [
 *     { label: 'Q1' },
 *     { label: 'Q2' },
 *     { label: 'Q3' },
 *   ],
 *   cellExtractor: (student, colIndex, pageId) => {
 *     const answers = student.pages[pageId]?.answers || [];
 *     const answer = answers[colIndex];
 *
 *     if (!answer?.answer) {
 *       return { text: '—', classes: ['qd-no-answer'] };
 *     }
 *
 *     return {
 *       text: answer.answer,
 *       classes: [answer.success ? 'qd-success' : 'qd-failure'],
 *     };
 *   },
 * });
 * ```
 */
export function buildComparisonTable(
  students: StudentRecord[],
  pageId: PageId,
  config: ComparisonTableConfig,
): HTMLTableElement {
  const {
    tableClass,
    columns,
    cellExtractor,
    studentIdClass = 'qd-student-id',
    dataCellClass = 'qd-student-answer',
    studentIdLength = 4,
  } = config;

  // Create table element
  const table = createElement('table');
  table.className = tableClass;

  // Create header row
  const thead = createElement('thead');
  const headerRow = createElement('tr');

  // Student ID column header
  const studentIdHeader = createElement('th', 'Student');
  studentIdHeader.scope = 'col';
  headerRow.appendChild(studentIdHeader);

  // Data column headers
  for (const column of columns) {
    const header = createElement('th', column.label);
    header.scope = column.scope || 'col';
    headerRow.appendChild(header);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body rows for each student
  const tbody = createElement('tbody');

  for (const student of students) {
    const row = createElement('tr');
    row.className = 'qd-student-row';

    // Student ID cell (truncated)
    const studentIdCell = createElement('td');
    studentIdCell.className = studentIdClass;
    studentIdCell.textContent = truncateServiceId(student.serviceId, studentIdLength);
    row.appendChild(studentIdCell);

    // Data cells
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const cellData = cellExtractor(student, columnIndex, pageId);

      const cell = createElement('td');
      cell.className = dataCellClass;

      if (cellData) {
        cell.textContent = cellData.text;

        // Add optional CSS classes
        if (cellData.classes) {
          for (const className of cellData.classes) {
            cell.classList.add(className);
          }
        }
      } else {
        // Null cell data - render as empty
        cell.textContent = '—';
        cell.classList.add('qd-no-data');
      }

      row.appendChild(cell);
    }

    tbody.appendChild(row);
  }

  table.appendChild(tbody);

  return table;
}

/**
 * Truncate service ID to specified length
 *
 * @param serviceId - Full service ID
 * @param length - Number of characters to keep
 * @returns Truncated service ID
 */
function truncateServiceId(serviceId: ServiceId, length: number): string {
  return serviceId.substring(0, length);
}

/**
 * Insert comparison table after a source table
 *
 * Helper function to insert a comparison table immediately after
 * the source table in the DOM.
 *
 * @param sourceTable - The table to insert after
 * @param comparisonTable - The comparison table to insert
 * @returns true if inserted successfully, false if parent not found
 *
 * @example
 * ```typescript
 * const comparisonTable = buildComparisonTable(students, pageId, config);
 * insertAfterTable(quizTable, comparisonTable);
 * ```
 */
export function insertAfterTable(
  sourceTable: HTMLTableElement,
  comparisonTable: HTMLTableElement,
): boolean {
  if (!sourceTable.parentElement) {
    return false;
  }

  sourceTable.parentElement.insertBefore(comparisonTable, sourceTable.nextSibling);
  return true;
}

/**
 * Remove all comparison tables from a container
 *
 * Helper function to clean up previously inserted comparison tables.
 * Useful when refreshing instructor views.
 *
 * @param container - Container element to search
 * @param tableClass - CSS class of comparison tables to remove
 * @returns Number of tables removed
 *
 * @example
 * ```typescript
 * // Remove all quiz comparison tables from the page
 * removeComparisonTables(document.body, 'qd-student-comparison');
 * ```
 */
export function removeComparisonTables(container: Element, tableClass: string): number {
  const tables = Array.from(container.querySelectorAll<HTMLTableElement>(`table.${tableClass}`));

  for (const table of tables) {
    table.remove();
  }

  return tables.length;
}
