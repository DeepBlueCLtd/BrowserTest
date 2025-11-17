/**
 * DOM helper utilities
 *
 * Provides type-safe DOM query and manipulation helpers, eliminating
 * repetitive querySelector patterns. Saves ~80 lines of duplicated code.
 *
 * All functions use textContent instead of innerHTML to prevent XSS vulnerabilities.
 */

/**
 * Get all rows from a table body
 *
 * @param table - Table element
 * @returns Array of table row elements
 *
 * @example
 * ```typescript
 * const table = document.querySelector('table.qd-quiz');
 * if (table instanceof HTMLTableElement) {
 *   const rows = getTableRows(table);
 *   console.log(`Table has ${rows.length} rows`);
 * }
 * ```
 */
export function getTableRows(table: HTMLTableElement): HTMLTableRowElement[] {
  const tbody = table.querySelector('tbody');
  if (!tbody) {
    return [];
  }
  return Array.from(tbody.querySelectorAll('tr'));
}

/**
 * Get all cells from a table row
 *
 * @param row - Table row element
 * @returns Array of table cell elements
 *
 * @example
 * ```typescript
 * const row = table.querySelector('tr');
 * if (row instanceof HTMLTableRowElement) {
 *   const cells = getRowCells(row);
 *   console.log(`Row has ${cells.length} cells`);
 * }
 * ```
 */
export function getRowCells(row: HTMLTableRowElement): HTMLTableCellElement[] {
  return Array.from(row.cells);
}

/**
 * Get trimmed text content from an element
 *
 * Returns empty string if element is null or has no text content.
 *
 * @param element - Element to get text from
 * @returns Trimmed text content
 *
 * @example
 * ```typescript
 * const cell = row.cells[0];
 * const text = getTextContent(cell);
 * console.log('Cell text:', text);
 * ```
 */
export function getTextContent(element: Element | null): string {
  if (!element) {
    return '';
  }
  return element.textContent?.trim() || '';
}

/**
 * Set text content on an element (XSS-safe)
 *
 * Uses textContent instead of innerHTML to prevent XSS attacks.
 *
 * @param element - Element to set text on
 * @param text - Text content to set
 *
 * @example
 * ```typescript
 * const div = document.createElement('div');
 * setTextContent(div, 'Safe text content');
 * ```
 */
export function setTextContent(element: Element, text: string): void {
  element.textContent = text;
}

/**
 * Create an element with optional text and class name (XSS-safe)
 *
 * Uses textContent instead of innerHTML for XSS protection.
 *
 * @param tag - HTML tag name
 * @param text - Optional text content
 * @param className - Optional class name
 * @returns Created element
 *
 * @example
 * ```typescript
 * const div = createElement('div', 'Hello, World!', 'greeting');
 * document.body.appendChild(div);
 * ```
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (text !== undefined) {
    element.textContent = text;
  }

  if (className !== undefined) {
    element.className = className;
  }

  return element;
}

/**
 * Create multiple child elements and append to parent (XSS-safe)
 *
 * @param parent - Parent element
 * @param children - Array of child elements to append
 *
 * @example
 * ```typescript
 * const div = createElement('div');
 * appendChildren(div, [
 *   createElement('span', 'First'),
 *   createElement('span', 'Second'),
 * ]);
 * ```
 */
export function appendChildren(parent: Element, children: Element[]): void {
  for (const child of children) {
    parent.appendChild(child);
  }
}

/**
 * Query selector with type safety
 *
 * @param selector - CSS selector
 * @param parent - Parent element (default: document)
 * @returns Element or null
 *
 * @example
 * ```typescript
 * const table = querySelector<HTMLTableElement>('table.qd-quiz');
 * if (table) {
 *   const rows = getTableRows(table);
 * }
 * ```
 */
export function querySelector<T extends Element = Element>(
  selector: string,
  parent: ParentNode = document,
): T | null {
  return parent.querySelector<T>(selector);
}

/**
 * Query selector all with type safety
 *
 * @param selector - CSS selector
 * @param parent - Parent element (default: document)
 * @returns Array of elements
 *
 * @example
 * ```typescript
 * const tables = querySelectorAll<HTMLTableElement>('table.qd-quiz');
 * console.log(`Found ${tables.length} quiz tables`);
 * ```
 */
export function querySelectorAll<T extends Element = Element>(
  selector: string,
  parent: ParentNode = document,
): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}

/**
 * Get element by ID with type safety
 *
 * @param id - Element ID
 * @returns Element or null
 *
 * @example
 * ```typescript
 * const status = getElementById<HTMLDivElement>('qd-status');
 * if (status) {
 *   status.style.display = 'block';
 * }
 * ```
 */
export function getElementById<T extends HTMLElement = HTMLElement>(id: string): T | null {
  const element = document.getElementById(id);
  return element as T | null;
}

/**
 * Remove all children from an element
 *
 * @param element - Element to clear
 *
 * @example
 * ```typescript
 * const container = getElementById('results');
 * if (container) {
 *   removeAllChildren(container);
 * }
 * ```
 */
export function removeAllChildren(element: Element): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Replace all children of an element with new children
 *
 * @param element - Element to update
 * @param children - New children to add
 *
 * @example
 * ```typescript
 * const container = getElementById('results');
 * if (container) {
 *   replaceChildren(container, [
 *     createElement('div', 'Result 1'),
 *     createElement('div', 'Result 2'),
 *   ]);
 * }
 * ```
 */
export function replaceChildren(element: Element, children: Element[]): void {
  removeAllChildren(element);
  appendChildren(element, children);
}

/**
 * Check if element has a specific class
 *
 * @param element - Element to check
 * @param className - Class name to look for
 * @returns true if element has the class
 */
export function hasClass(element: Element, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * Add one or more classes to an element
 *
 * @param element - Element to modify
 * @param classNames - Class names to add
 */
export function addClass(element: Element, ...classNames: string[]): void {
  element.classList.add(...classNames);
}

/**
 * Remove one or more classes from an element
 *
 * @param element - Element to modify
 * @param classNames - Class names to remove
 */
export function removeClass(element: Element, ...classNames: string[]): void {
  element.classList.remove(...classNames);
}

/**
 * Toggle a class on an element
 *
 * @param element - Element to modify
 * @param className - Class name to toggle
 * @returns true if class was added, false if removed
 */
export function toggleClass(element: Element, className: string): boolean {
  return element.classList.toggle(className);
}
