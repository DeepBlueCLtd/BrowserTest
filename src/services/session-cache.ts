/**
 * Session Cache Math
 *
 * Pure, DOM-free helpers for building and incrementally updating the
 * {@link SessionCache} that backs the status panel and R/A/G badges.
 *
 * Extracted from `session.ts` so that `SessionService` retains only session
 * lifecycle responsibilities. These functions are consumed independently by
 * `storage-service.ts` and the quiz enhancer.
 */

import type {
  SessionCache,
  StudentRecord,
  PageCache,
  PageData,
  CompletionState,
} from '../types/contracts.js';

/**
 * Build session cache from a student record
 *
 * This creates a SessionCache structure that provides quick access to
 * page states and totals without querying IndexedDB.
 *
 * @param record - Student record to build cache from
 * @returns Session cache with totals and page entries
 */
export function buildCacheFromRecord(record: StudentRecord): SessionCache {
  const cache: SessionCache = {
    totals: {
      total: 0,
      answered: 0,
      correct: 0,
    },
    pages: {},
  };

  // Build cache entry for each page
  for (const [pageId, pageData] of Object.entries(record.pages)) {
    const pageCache = buildPageCache(pageId, pageData);
    cache.pages[pageId] = pageCache;

    // Accumulate totals
    cache.totals.total += pageCache.total;
    cache.totals.answered += pageCache.answered;
    cache.totals.correct += pageCache.correct;
  }

  return cache;
}

/**
 * Build a page cache entry from page data
 *
 * @param _pageId - Page identifier (unused, kept for API consistency)
 * @param pageData - Page data from student record
 * @returns Page cache entry
 */
export function buildPageCache(_pageId: string, pageData: PageData): PageCache {
  // Total is the length of answers array (includes empty/placeholder answers)
  const total = pageData.answers.length;
  const answered = pageData.answers.filter((a) => a.answer.trim() !== '').length;
  const correct = pageData.answers.filter((a) => a.success).length;

  return {
    state: pageData.state,
    total,
    answered,
    correct,
    last: pageData.lastAttempted,
    answers: pageData.answers,
    analysis: pageData.analysis, // Preserve analysis data from analysis tables
  };
}

/**
 * Register page questions in cache
 *
 * Called when a quiz page loads to register the total number of questions.
 * This ensures the status panel shows total registered questions, not just answered.
 *
 * @param cache - Current cache to update
 * @param pageId - Page identifier
 * @param totalQuestions - Total number of questions on the page
 * @returns Updated cache
 */
export function registerPageQuestions(
  cache: SessionCache,
  pageId: string,
  totalQuestions: number,
): SessionCache {
  // Get existing page cache or create new one
  const existingPage = cache.pages[pageId];

  // If page already registered with same or higher total, don't update
  if (existingPage && existingPage.total >= totalQuestions) {
    return cache;
  }

  // Calculate delta for totals update
  const oldTotal = existingPage?.total || 0;
  const delta = totalQuestions - oldTotal;

  // Create/update page entry
  const updatedPage: PageCache = {
    state: existingPage?.state || ('unstarted' as const),
    total: totalQuestions,
    answered: existingPage?.answered || 0,
    correct: existingPage?.correct || 0,
    last: existingPage?.last,
    answers: existingPage?.answers,
    analysis: existingPage?.analysis,
  };

  return {
    totals: {
      total: cache.totals.total + delta,
      answered: cache.totals.answered,
      correct: cache.totals.correct,
    },
    pages: {
      ...cache.pages,
      [pageId]: updatedPage,
    },
  };
}

/**
 * Update cache with a new answer
 *
 * This incrementally updates the cache when a new answer is submitted,
 * avoiding the need to rebuild the entire cache.
 *
 * @param cache - Current cache to update
 * @param pageId - Page where answer was submitted
 * @param isCorrect - Whether the answer is correct
 * @param newState - New completion state for the page
 * @returns Updated cache
 */
export function updateCacheWithAnswer(
  cache: SessionCache,
  pageId: string,
  isCorrect: boolean,
  newState: CompletionState,
): SessionCache {
  const now = new Date().toISOString();

  // Get or create page entry
  const pageCache = cache.pages[pageId] || {
    state: 'incomplete' as const,
    total: 0,
    answered: 0,
    correct: 0,
  };

  // Update page counts
  const updatedPage: PageCache = {
    ...pageCache,
    state: newState,
    answered: pageCache.answered + 1,
    correct: pageCache.correct + (isCorrect ? 1 : 0),
    last: now,
  };

  // Update totals
  const updatedTotals = {
    total: cache.totals.total,
    answered: cache.totals.answered + 1,
    correct: cache.totals.correct + (isCorrect ? 1 : 0),
  };

  return {
    totals: updatedTotals,
    pages: {
      ...cache.pages,
      [pageId]: updatedPage,
    },
  };
}
