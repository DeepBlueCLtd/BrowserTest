/**
 * Home Page Badge Enhancement
 *
 * Injects colored progress badges on navigation links to show quiz completion status.
 * Badges use red/amber/green color coding for unstarted/incomplete/complete states.
 */

import type { SessionCache, CompletionState } from '../types/contracts';
import { CSS_CLASSES, STORAGE_KEYS } from '../types/contracts';

/**
 * Extract page ID from link href
 *
 * @param href - Link href attribute
 * @returns Page ID or null if invalid
 */
export function extractPageIdFromHref(href: string): string | null {
  if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('javascript:')) {
    return null;
  }

  // Extract filename without extension
  const filename = href.split('/').pop() ?? '';
  const pageId = filename.replace(/\.html?$/i, '');

  return pageId || null;
}

/**
 * Get badge color from completion state
 *
 * @param state - Page completion state
 * @returns Color identifier (red/amber/green)
 */
export function getBadgeColor(state: CompletionState): string {
  const colorMap: Record<CompletionState, string> = {
    unstarted: 'red',
    incomplete: 'amber',
    complete: 'green',
  };

  return colorMap[state];
}

/**
 * Get badge color for a specific page from cache
 *
 * @param pageId - Page identifier
 * @param cache - Session cache with page states
 * @returns Color identifier (red/amber/green/gray)
 */
export function getPageBadgeColor(pageId: string, cache: SessionCache | null): string {
  if (!cache || !cache.pages[pageId]) {
    return 'gray';
  }

  return getBadgeColor(cache.pages[pageId].state);
}

/**
 * Create a badge element with appropriate styling and accessibility
 *
 * @param color - Badge color (red/amber/green/gray)
 * @returns Badge HTML element
 */
export function createBadgeElement(color: string): HTMLElement {
  const badge = document.createElement('span');
  badge.className = `qd-badge qd-badge--${color}`;

  const ariaLabels: Record<string, string> = {
    red: 'Quiz not started',
    amber: 'Quiz in progress',
    green: 'Quiz complete',
    gray: 'Quiz status unknown',
  };

  badge.setAttribute('aria-label', ariaLabels[color] || 'Quiz status unknown');
  badge.setAttribute('role', 'status');

  // Add inline styles for visibility
  badge.style.display = 'inline-block';
  badge.style.width = '12px';
  badge.style.height = '12px';
  badge.style.borderRadius = '50%';
  badge.style.marginLeft = '8px';

  const colorStyles: Record<string, string> = {
    red: '#dc2626',
    amber: '#f59e0b',
    green: '#16a34a',
    gray: '#9ca3af',
  };

  badge.style.backgroundColor = colorStyles[color] || colorStyles['gray'];

  return badge;
}

/**
 * Inject badges into test links within a container
 *
 * @param container - Container element to search for links
 * @param cache - Session cache with page states
 */
export function injectBadges(container: HTMLElement, cache: SessionCache | null): void {
  const links = container.querySelectorAll(`.${CSS_CLASSES.TEST_LINK}`);

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    const pageId = extractPageIdFromHref(href);
    if (!pageId) return;

    const color = getPageBadgeColor(pageId, cache);

    // Remove existing badge if present
    const existingBadge = link.querySelector('.qd-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    // Create and append new badge
    const badge = createBadgeElement(color);
    link.appendChild(badge);
  });
}

/**
 * Load session cache from sessionStorage
 *
 * @returns Session cache or null if not found
 */
export function loadCacheFromStorage(): SessionCache | null {
  try {
    const cacheData = sessionStorage.getItem(STORAGE_KEYS.CACHE);
    if (!cacheData) {
      return null;
    }

    return JSON.parse(cacheData) as SessionCache;
  } catch (error) {
    console.error('Failed to load cache from storage:', error);
    return null;
  }
}

/**
 * Initialize home page badges by detecting test links and injecting badges
 *
 * This function should be called on DOMContentLoaded for home pages.
 * It loads the cache and injects badges for all navigation links.
 *
 * @param container - Optional container element (defaults to document.body)
 */
export function initializeHomeBadges(container: HTMLElement = document.body): void {
  // Load cache from sessionStorage
  const cache = loadCacheFromStorage();

  // Inject badges into all test links
  injectBadges(container, cache);

  // Listen for state changes to update badges
  window.addEventListener('qd:state-changed', () => {
    const updatedCache = loadCacheFromStorage();
    injectBadges(container, updatedCache);
  });

  // Listen for login events to rebuild badges
  window.addEventListener('qd:login', () => {
    const updatedCache = loadCacheFromStorage();
    injectBadges(container, updatedCache);
  });

  // Listen for logout events to clear badges
  window.addEventListener('qd:logout', () => {
    injectBadges(container, null);
  });
}

/**
 * Update badges for a specific page after state change
 *
 * @param pageId - Page identifier
 * @param container - Optional container element (defaults to document.body)
 */
export function updateBadgeForPage(pageId: string, container: HTMLElement = document.body): void {
  const cache = loadCacheFromStorage();
  const links = container.querySelectorAll(`.${CSS_CLASSES.TEST_LINK}`);

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    const linkPageId = extractPageIdFromHref(href);
    if (linkPageId !== pageId) return;

    const color = getPageBadgeColor(pageId, cache);

    // Remove existing badge
    const existingBadge = link.querySelector('.qd-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    // Create and append new badge
    const badge = createBadgeElement(color);
    link.appendChild(badge);
  });
}
