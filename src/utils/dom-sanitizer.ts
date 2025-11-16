/**
 * DOM sanitization utilities
 *
 * Prevents XSS attacks by safely escaping HTML and creating DOM elements
 * without using dangerous innerHTML operations.
 */

/**
 * Sanitizes user input by escaping HTML entities
 *
 * This function escapes all HTML special characters to prevent XSS attacks.
 * Use this before displaying any user-generated content.
 *
 * @param input - String to sanitize
 * @returns Sanitized string with HTML entities escaped
 *
 * @example
 * ```typescript
 * const userInput = '<script>alert("XSS")</script>';
 * const safe = sanitizeInput(userInput);
 * // safe = '&lt;script&gt;alert("XSS")&lt;/script&gt;'
 * element.innerHTML = safe; // Safe - renders as text
 * ```
 *
 * @remarks
 * - Escapes: < > & " '
 * - Preserves newlines and whitespace
 * - Handles unicode correctly
 */
export function sanitizeInput(input: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'\/]/g, (char) => escapeMap[char]);
}

/**
 * Creates a DOM element with safe text content
 *
 * This function creates an element and sets its textContent (not innerHTML),
 * ensuring that any HTML in the content is rendered as text, not executed.
 *
 * @param tagName - Element tag name (default: 'span')
 * @param content - Text content (will be safely escaped)
 * @param className - Optional class name
 * @returns Created DOM element with safe content
 *
 * @example
 * ```typescript
 * const el = createSafeElement('div', userInput, 'message');
 * document.body.appendChild(el);
 * ```
 *
 * @remarks
 * - Uses textContent, never innerHTML
 * - Content is treated as plain text
 * - Scripts and HTML are not executed
 */
export function createSafeElement(
  tagName: string = 'span',
  content: string,
  className?: string,
): HTMLElement {
  const element = document.createElement(tagName);
  element.textContent = content; // textContent auto-escapes
  if (className) {
    element.className = className;
  }
  return element;
}

/**
 * Safely sets element text content
 *
 * @param element - Target element
 * @param content - Text content to set
 *
 * @example
 * ```typescript
 * const div = document.querySelector('.message');
 * setSafeText(div, userInput);
 * ```
 */
export function setSafeText(element: HTMLElement, content: string): void {
  element.textContent = content;
}

/**
 * Safely appends text node to element
 *
 * @param parent - Parent element
 * @param content - Text content
 * @returns Created text node
 *
 * @example
 * ```typescript
 * const div = document.querySelector('.container');
 * appendSafeText(div, userGeneratedText);
 * ```
 */
export function appendSafeText(parent: HTMLElement, content: string): Text {
  const textNode = document.createTextNode(content);
  parent.appendChild(textNode);
  return textNode;
}
