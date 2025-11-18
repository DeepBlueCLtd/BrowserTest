/**
 * Home Page Badge Enhancer
 *
 * Applies R/A/G (Red/Amber/Green) badges to navigation links based on
 * page completion states. Updates badges in real-time when states change.
 *
 * Features:
 * - Queries links with class .quizPageBtn
 * - Reads completion state from SessionCache
 * - Applies CSS classes: qd-badge-red, qd-badge-amber, qd-badge-green
 * - Listens for qd:state-changed events for real-time updates
 * - Handles missing data gracefully
 *
 * Badge Colors:
 * - Red: Unstarted (no answers provided)
 * - Amber: Incomplete (some answered OR any incorrect)
 * - Green: Complete (all answered AND all correct)
 */

import type { PageId, SessionCache, CompletionState } from '../types/contracts.js';
import { getJSON } from '../utils/storage-helpers.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import { info } from '../utils/logger.js';

/**
 * CSS class constants for badges
 */
const BADGE_CLASSES = {
  red: 'qd-badge-red',
  amber: 'qd-badge-amber',
  green: 'qd-badge-green',
} as const;

/**
 * Map completion states to badge colors
 */
const STATE_TO_BADGE: Record<CompletionState, keyof typeof BADGE_CLASSES> = {
  unstarted: 'red',
  incomplete: 'amber',
  complete: 'green',
};

/**
 * Apply badge class to a link element
 *
 * @param link - Link element to apply badge to
 * @param state - Completion state
 */
function applyBadge(link: HTMLElement, state: CompletionState): void {
  // Remove all existing badge classes
  Object.values(BADGE_CLASSES).forEach((className) => {
    link.classList.remove(className);
  });

  // Apply new badge class based on state
  const badgeColor = STATE_TO_BADGE[state];
  const badgeClass = BADGE_CLASSES[badgeColor];
  link.classList.add(badgeClass);
}

/**
 * Get completion state for a page from session cache
 *
 * @param pageId - Page ID to look up
 * @param cache - Session cache
 * @returns Completion state (defaults to 'unstarted' if not found)
 */
function getPageState(pageId: PageId | null, cache: SessionCache | null): CompletionState {
  if (!pageId || !cache?.pages) {
    return 'unstarted';
  }

  const pageData = cache.pages[pageId];
  return pageData?.state ?? 'unstarted';
}

/**
 * Update badge for a single link
 *
 * @param link - Link element with data-page-id attribute
 */
function updateLinkBadge(link: HTMLElement): void {
  const pageId = link.getAttribute('data-page-id');
  const cache = getJSON<SessionCache>(STORAGE_KEYS.CACHE);
  const state = getPageState(pageId, cache);

  applyBadge(link, state);
}

/**
 * Update all badges from current session cache
 * If no session exists, remove all badges
 */
function updateAllBadges(): void {
  const links = document.querySelectorAll<HTMLElement>('.quizPageBtn');
  const cache = getJSON<SessionCache>(STORAGE_KEYS.CACHE);

  // If no cache exists (not logged in), remove all badge styling
  if (!cache) {
    links.forEach((link) => {
      Object.values(BADGE_CLASSES).forEach((className) => {
        link.classList.remove(className);
      });
    });
    info(`Removed badge styling from ${links.length} page links (no session)`);
    return;
  }

  // Cache exists, apply badges based on state
  links.forEach((link) => {
    updateLinkBadge(link);
  });

  info(`Updated ${links.length} page badges`);
}

/**
 * Handle qd:state-changed event
 *
 * @param event - Custom event with pageId and state
 */
function handleStateChanged(event: Event): void {
  const customEvent = event as CustomEvent<{ pageId: PageId; state: CompletionState }>;
  const { pageId } = customEvent.detail;

  // Find link with matching pageId
  const link = document.querySelector<HTMLElement>(`[data-page-id="${pageId}"]`);

  if (link && link.classList.contains('quizPageBtn')) {
    updateLinkBadge(link);
    info(`Updated badge for page ${pageId}`);
  }
}

/**
 * Handle qd:cache-rebuild event - refresh all badges after cache is ready
 */
function handleCacheRebuild(): void {
  info('Cache rebuilt, refreshing all badges');
  updateAllBadges();
}

/**
 * Handle qd:logout event - remove all badge styling
 */
function handleLogout(): void {
  info('Logout detected, removing all badge styling');
  const links = document.querySelectorAll<HTMLElement>('.quizPageBtn');

  links.forEach((link) => {
    // Remove all badge classes to revert to native button styling
    Object.values(BADGE_CLASSES).forEach((className) => {
      link.classList.remove(className);
    });
  });

  info(`Removed badge styling from ${links.length} page links`);
}

/**
 * Extract pageId from link href attribute
 *
 * @param link - Link element with href
 * @returns PageId extracted from href, or null if invalid
 *
 * @example
 * href="Pages/quiz-mcq.html" → "quiz-mcq"
 * href="gram-1.html" → "gram-1"
 */
function extractPageIdFromHref(link: HTMLAnchorElement): PageId | null {
  const href = link.getAttribute('href');
  if (!href) {
    return null;
  }

  // Extract filename from href (last segment after /)
  const filename = href.substring(href.lastIndexOf('/') + 1);

  // Remove .html or .htm extension
  const pageId = filename.replace(/\.html?$/i, '');

  return pageId || null;
}

/**
 * Enhance home page with R/A/G badges on navigation links
 *
 * This function:
 * 1. Queries all links with class .quizPageBtn
 * 2. Extracts pageId from href attribute and sets data-page-id
 * 3. Reads SessionCache to determine page completion states
 * 4. Applies appropriate badge CSS classes
 * 5. Sets up event listener for real-time updates
 *
 * @example
 * ```html
 * <a href="Pages/quiz-mcq.html" class="quizPageBtn">MCQ Questions</a>
 * ```
 *
 * After enhancement:
 * - data-page-id attribute set: data-page-id="quiz-mcq"
 * - Unstarted pages: class="quizPageBtn qd-badge-red"
 * - Incomplete pages: class="quizPageBtn qd-badge-amber"
 * - Complete pages: class="quizPageBtn qd-badge-green"
 */
export function enhanceHomeBadges(): void {
  // Find all navigation links
  const links = document.querySelectorAll<HTMLAnchorElement>('.quizPageBtn');

  // Extract pageId from href and set data-page-id attribute
  links.forEach((link) => {
    const pageId = extractPageIdFromHref(link);
    if (pageId) {
      link.setAttribute('data-page-id', pageId);
      info(`Set data-page-id="${pageId}" for link: ${link.textContent?.trim()}`);
    } else {
      info(`Failed to extract pageId from href: ${link.getAttribute('href')}`);
    }
  });

  // Apply initial badges
  updateAllBadges();

  // Listen for state changes and update badges in real-time
  document.addEventListener('qd:state-changed', handleStateChanged);

  // Listen for cache rebuild (after login) to refresh badges
  document.addEventListener('qd:cache-rebuild', handleCacheRebuild);

  // Listen for logout events to reset badges
  document.addEventListener('qd:logout', handleLogout);

  info('Home page badges enhanced with event listeners');
}
