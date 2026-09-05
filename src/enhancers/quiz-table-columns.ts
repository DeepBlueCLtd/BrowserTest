/**
 * Quiz table column visibility helpers.
 *
 * Pure DOM operations for showing/hiding the Answer and Detail columns and
 * removing the fixed-width colgroup. Extracted from `quiz-table.ts`.
 *
 * SECURITY: {@link hideAnswerColumn} also removes the answer text from the DOM
 * (not just visually hides it) so correct answers cannot be read via
 * view-source/DevTools before login.
 */

import { addClass, removeClass } from '../utils/dom-helpers.js';

/**
 * Original Detail-cell markup, keyed by cell, captured the first time the
 * column is hidden. Lives in memory only so the content (MCQ options, numeric
 * tolerances) is not readable via view-source once hidden; restored for
 * instructors by {@link restoreDetailColumn}.
 */
const detailCellContent = new WeakMap<HTMLTableCellElement, string>();

/**
 * Remove the colgroup element to allow automatic column sizing.
 *
 * Fixed column widths don't work well when columns are hidden or contain
 * interactive controls; removing the colgroup lets the browser auto-size.
 *
 * @param table - Quiz table element
 */
export function removeColgroup(table: HTMLTableElement): void {
  const colgroup = table.querySelector('colgroup');
  if (colgroup) {
    colgroup.remove();
  }
}

/**
 * Hide the answer column (index 1) and strip its content from the DOM.
 *
 * @param table - Quiz table element
 */
export function hideAnswerColumn(table: HTMLTableElement): void {
  // Hide header cell (Answer is column 1)
  const headerCells = table.querySelectorAll('thead th, thead td');
  if (headerCells[1]) {
    addClass(headerCells[1], 'qd-hidden');
  }

  // Hide answer cells and REMOVE content from DOM (security)
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells[1]) {
      addClass(cells[1], 'qd-hidden');
      cells[1].textContent = ''; // Remove answer from DOM
    }
  });
}

/**
 * Show the answer column (index 1) for interactive mode.
 *
 * @param table - Quiz table element
 */
export function showAnswerColumn(table: HTMLTableElement): void {
  // Show header cell (Answer is column 1)
  const headerCells = table.querySelectorAll('thead th, thead td');
  if (headerCells[1]) {
    removeClass(headerCells[1], 'qd-hidden');
  }

  // Show answer cells in all rows
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells[1]) {
      removeClass(cells[1], 'qd-hidden');
    }
  });
}

/**
 * Hide the detail column (index 2), which holds MCQ options / numeric tolerances,
 * and strip its content from the DOM (kept in memory for instructor reveal).
 *
 * Must be called AFTER the table has been parsed: the parser reads the Detail
 * cells, and enhancement caches the parsed result so it never re-reads them.
 *
 * @param table - Quiz table element
 */
export function hideDetailColumn(table: HTMLTableElement): void {
  // Hide header cell (Detail is column 2)
  const headerCells = table.querySelectorAll('thead th, thead td');
  if (headerCells[2]) {
    addClass(headerCells[2], 'qd-hidden');
  }

  // Hide detail cells in all rows and REMOVE content from DOM (security)
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    const cell = cells[2];
    if (cell) {
      addClass(cell, 'qd-hidden');
      if (!detailCellContent.has(cell)) {
        detailCellContent.set(cell, cell.innerHTML);
      }
      cell.textContent = '';
    }
  });
}

/**
 * Show the detail column (index 2) again and restore its original content
 * from memory. Used only on the instructor answer-reveal path.
 *
 * @param table - Quiz table element
 */
export function restoreDetailColumn(table: HTMLTableElement): void {
  const headerCells = table.querySelectorAll('thead th, thead td');
  if (headerCells[2]) {
    removeClass(headerCells[2], 'qd-hidden');
  }

  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    const cell = cells[2];
    if (cell) {
      removeClass(cell, 'qd-hidden');
      const original = detailCellContent.get(cell);
      if (original !== undefined) {
        cell.innerHTML = original;
      }
    }
  });
}
