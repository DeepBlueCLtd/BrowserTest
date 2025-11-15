/**
 * Comparison Table Builder
 *
 * Generic utility for building side-by-side comparison tables that display
 * student answers or entries across multiple questions/fields.
 *
 * Used by both quiz tables (for answer comparisons) and analysis tables
 * (for free-form entry comparisons).
 */

import type { StudentRecord } from '../types/contracts';

/**
 * Configuration for a table column
 */
export interface ColumnConfig {
  /** Unique key for the column (e.g., question index or cell key) */
  key: string;
  /** Label to display in the header (e.g., "Q1" or "Field 1") */
  label: string;
}

/**
 * Result from getCellValue function
 */
export interface CellValue {
  /** The value to display in the cell */
  value: string;
  /** Optional CSS class to apply to the cell (e.g., "qd-success", "qd-failure") */
  cssClass?: string;
}

/**
 * Options for building a comparison table
 */
export interface ComparisonTableOptions {
  /** Array of student records to display */
  students: StudentRecord[];
  /** Page ID to extract data from */
  pageId: string;
  /** Array of column configurations */
  columns: ColumnConfig[];
  /** CSS class name for the table element */
  className: string;
  /**
   * Function to get the value for a specific cell
   *
   * @param student - The student record
   * @param pageId - The page ID
   * @param columnKey - The column key
   * @returns Cell value with optional CSS class, or null if no value
   */
  getCellValue: (student: StudentRecord, pageId: string, columnKey: string) => CellValue | null;
}

/**
 * Build a comparison table element
 *
 * Creates a table with student IDs in the first column and data cells
 * for each column configuration. Used to display side-by-side comparisons
 * of student work.
 *
 * @param options - Configuration options for the table
 * @returns HTML table element
 */
export function buildComparisonTable(options: ComparisonTableOptions): HTMLTableElement {
  const { students, pageId, columns, className, getCellValue } = options;

  // Create comparison table
  const table = document.createElement('table');
  table.className = className;

  // Create header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  // Student ID column
  const studentIdHeader = document.createElement('th');
  studentIdHeader.textContent = 'Student';
  studentIdHeader.scope = 'col';
  headerRow.appendChild(studentIdHeader);

  // Data columns
  columns.forEach((column) => {
    const columnHeader = document.createElement('th');
    columnHeader.textContent = column.label;
    columnHeader.scope = 'col';
    headerRow.appendChild(columnHeader);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body rows for each student
  const tbody = document.createElement('tbody');

  students.forEach((student) => {
    const row = document.createElement('tr');
    row.className = 'qd-student-row';

    // Student ID cell (first 4 chars)
    const studentIdCell = document.createElement('td');
    studentIdCell.className = 'qd-student-id';
    studentIdCell.textContent = student.serviceId.substring(0, 4);
    row.appendChild(studentIdCell);

    // Add data cells for each column
    columns.forEach((column) => {
      const dataCell = document.createElement('td');
      dataCell.className = 'qd-student-answer';

      const cellValue = getCellValue(student, pageId, column.key);

      if (!cellValue || !cellValue.value) {
        // No value provided
        dataCell.textContent = '—';
        dataCell.classList.add('qd-no-answer');
      } else {
        // Show value with optional CSS class
        dataCell.textContent = cellValue.value;

        if (cellValue.cssClass) {
          dataCell.classList.add(cellValue.cssClass);
        }
      }

      row.appendChild(dataCell);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);

  return table;
}
