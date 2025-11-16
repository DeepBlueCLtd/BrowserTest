/**
 * Page utilities for the Sonar Quiz System
 */

import type { PageId } from '../types/contracts';

/**
 * Extract page ID from the current document title
 *
 * The page ID is derived from the HTML <title> element, which is
 * the only reliable metadata that content authors can edit without
 * special tools or metadata editors.
 *
 * @returns The page ID extracted from document.title
 *
 * @example
 * // If document.title is "Sonar Basics - Training Manual"
 * getPageId() // returns "Sonar Basics - Training Manual"
 *
 * @example
 * // If document.title is empty
 * getPageId() // returns "unknown-page"
 */
export function getPageId(): PageId {
  const title = document.title?.trim();
  return title || 'unknown-page';
}
