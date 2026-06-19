/**
 * Page ID extraction utility
 *
 * Derives the `PageId` for the current document from a URL by taking the final
 * path segment (the filename) and stripping its `.html`/`.htm` extension.
 * Consolidates the inline pathname→filename→strip-extension parses previously
 * duplicated across `bootstrap.ts` and `event-coordinator.ts`.
 */

import type { PageId } from '../types/contracts.js';

/**
 * Extract the page ID from a URL.
 *
 * @param url - Optional URL or path to parse. When omitted, the current
 *   document's `window.location.pathname` is used (preserving the original
 *   inline behavior). Query strings and hash fragments are ignored.
 * @returns The filename without its `.html`/`.htm` extension. Returns an empty
 *   string when the URL ends in a trailing slash (no filename).
 *
 * @example
 * getPageIdFromUrl('/training/gram-1.html'); // 'gram-1'
 * getPageIdFromUrl('quiz-index.html?x=1#top'); // 'quiz-index'
 */
export function getPageIdFromUrl(url?: string): PageId {
  // Strip query string and hash fragment, then isolate the path portion.
  // window.location.pathname never contains '?' or '#', so this is a no-op for
  // the default (current-document) case and preserves the original behavior.
  const path = (url ?? window.location.pathname).split(/[?#]/)[0] ?? '';
  const filename = path.substring(path.lastIndexOf('/') + 1);
  return filename.replace(/\.html?$/i, '');
}
