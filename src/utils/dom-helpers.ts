/**
 * DOM Query and Manipulation Helpers
 *
 * Provides utility functions for common DOM operations.
 * Eliminates code duplication and improves readability.
 *
 * Reduces 18+ Array.from(querySelectorAll) patterns across the codebase.
 */

/**
 * Get all table rows from a table's tbody
 *
 * @param table - Table element
 * @returns Array of table rows
 *
 * @example
 * ```typescript
 * const rows = getTableRows(table);
 * rows.forEach((row, index) => {
 *   console.log(`Row ${index}:`, row.textContent);
 * });
 * ```
 */
export function getTableRows(table: HTMLTableElement): HTMLTableRowElement[] {
  return Array.from(table.querySelectorAll('tbody tr'));
}

/**
 * Get all cells from a table row
 *
 * @param row - Table row element
 * @returns Array of table cells
 *
 * @example
 * ```typescript
 * const cells = getRowCells(row);
 * console.log('First cell:', cells[0].textContent);
 * ```
 */
export function getRowCells(row: HTMLTableRowElement): HTMLTableCellElement[] {
  return Array.from(row.cells);
}

/**
 * Get trimmed text content from an element
 *
 * @param element - Element to get text from
 * @returns Trimmed text content or empty string
 *
 * @example
 * ```typescript
 * const text = getCellText(cell);
 * if (text === '') {
 *   console.log('Cell is empty');
 * }
 * ```
 */
export function getCellText(element: HTMLElement): string {
  return element.textContent?.trim() || '';
}

/**
 * Get attribute value with fallback
 *
 * @param element - Element to get attribute from
 * @param name - Attribute name
 * @param defaultValue - Default value if attribute not found
 * @returns Attribute value or default
 *
 * @example
 * ```typescript
 * const tolerance = getAttributeOrDefault(cell, 'data-tolerance', '0');
 * const correctAnswer = getAttributeOrDefault(cell, 'data-answer', '');
 * ```
 */
export function getAttributeOrDefault(
  element: Element,
  name: string,
  defaultValue: string,
): string {
  return element.getAttribute(name) || defaultValue;
}

/**
 * Get numeric attribute value
 *
 * @param element - Element to get attribute from
 * @param name - Attribute name
 * @param defaultValue - Default value if attribute not found or invalid
 * @returns Parsed number or default
 *
 * @example
 * ```typescript
 * const tolerance = getNumberAttribute(cell, 'data-tolerance', 0.01);
 * const maxScore = getNumberAttribute(cell, 'data-max-score', 100);
 * ```
 */
export function getNumberAttribute(
  element: Element,
  name: string,
  defaultValue: number,
): number {
  const value = element.getAttribute(name);
  if (value === null) {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Clear all child nodes from an element
 *
 * @param element - Element to clear
 *
 * @example
 * ```typescript
 * clearElement(container);
 * // container is now empty
 * ```
 */
export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Create element with text content
 *
 * @param tagName - HTML tag name
 * @param textContent - Text content for the element
 * @param className - Optional CSS class name(s)
 * @returns Created element
 *
 * @example
 * ```typescript
 * const header = createElementWithText('h2', 'Quiz Results', 'quiz-header');
 * const paragraph = createElementWithText('p', 'You scored 85%');
 * ```
 */
export function createElementWithText<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  textContent: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  element.textContent = textContent;
  if (className) {
    element.className = className;
  }
  return element;
}

/**
 * Create element with attributes
 *
 * @param tagName - HTML tag name
 * @param attributes - Object with attribute key-value pairs
 * @returns Created element
 *
 * @example
 * ```typescript
 * const input = createElementWithAttributes('input', {
 *   type: 'text',
 *   name: 'answer',
 *   placeholder: 'Enter answer',
 *   'data-question-id': 'q1'
 * });
 * ```
 */
export function createElementWithAttributes<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attributes: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

/**
 * Query all elements and return as array
 *
 * @param selector - CSS selector
 * @param parent - Parent element to query from (default: document)
 * @returns Array of matching elements
 *
 * @example
 * ```typescript
 * const quizTables = queryAll<HTMLTableElement>('table.qd-quiz');
 * const inputs = queryAll<HTMLInputElement>('input[type="text"]', form);
 * ```
 */
export function queryAll<T extends Element>(
  selector: string,
  parent: ParentNode = document,
): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}

/**
 * Query single element with type safety
 *
 * @param selector - CSS selector
 * @param parent - Parent element to query from (default: document)
 * @returns Matching element or null
 *
 * @example
 * ```typescript
 * const loginForm = queryOne<HTMLFormElement>('#login-form');
 * const statusPanel = queryOne<HTMLElement>('qd-status');
 * ```
 */
export function queryOne<T extends Element>(
  selector: string,
  parent: ParentNode = document,
): T | null {
  return parent.querySelector<T>(selector);
}

/**
 * Check if element exists in DOM
 *
 * @param selector - CSS selector
 * @param parent - Parent element to query from (default: document)
 * @returns True if element exists
 *
 * @example
 * ```typescript
 * if (elementExists('qd-login')) {
 *   console.log('Login component is present');
 * }
 * ```
 */
export function elementExists(selector: string, parent: ParentNode = document): boolean {
  return parent.querySelector(selector) !== null;
}

/**
 * Get closest ancestor matching selector
 *
 * @param element - Element to start from
 * @param selector - CSS selector
 * @returns Closest matching ancestor or null
 *
 * @example
 * ```typescript
 * const table = getClosest<HTMLTableElement>(cell, 'table');
 * const form = getClosest<HTMLFormElement>(input, 'form');
 * ```
 */
export function getClosest<T extends Element>(element: Element, selector: string): T | null {
  return element.closest<T>(selector);
}

/**
 * Add event listener with type safety
 *
 * @param element - Element to attach listener to
 * @param event - Event name
 * @param handler - Event handler function
 * @param options - Event listener options
 *
 * @example
 * ```typescript
 * addListener(button, 'click', (e) => {
 *   console.log('Button clicked', e.target);
 * });
 * ```
 */
export function addListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  event: K,
  handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void {
  element.addEventListener(event, handler, options);
}

/**
 * Remove event listener
 *
 * @param element - Element to remove listener from
 * @param event - Event name
 * @param handler - Event handler function to remove
 * @param options - Event listener options
 */
export function removeListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  event: K,
  handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
  options?: boolean | EventListenerOptions,
): void {
  element.removeEventListener(event, handler, options);
}
