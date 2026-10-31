/**
 * Calculation Helpers
 *
 * Pure functions for status indicators, percentages, and totals.
 * Feature: 007-lit-component-refactor
 *
 * These functions have no side effects and no DOM dependencies,
 * making them easy to unit test.
 */

import type { PageData, PageId } from '../types/contracts';

/**
 * Status indicator values for R/A/G progress display.
 */
export type StatusIndicator = 'red' | 'amber' | 'green';

/**
 * Overall progress colour from stored answers (SRD 013 SCO-02, SCO-03).
 *
 * Red until something is answered. Green only when the publication's total
 * is known and every question is answered correctly; with no known total
 * there is no way to say the student has finished, so it stays amber.
 *
 * @param answered - Questions answered
 * @param correct - Questions answered correctly
 * @param total - Publication question total, when known
 * @returns Indicator colour
 */
export function calculateProgressIndicator(
  answered: number,
  correct: number,
  total?: number,
): StatusIndicator {
  if (answered === 0) {
    return 'red';
  }
  return total !== undefined && correct >= total ? 'green' : 'amber';
}

/**
 * One-line progress summary for the student panel (SRD 013 SCO-02, SCO-03).
 *
 * @param answered - Questions answered
 * @param correct - Questions answered correctly
 * @param total - Publication question total, when known
 * @returns e.g. "12 of 40 answered · 9 correct", or "12 answered · 9 correct"
 */
export function formatProgress(answered: number, correct: number, total?: number): string {
  const answeredText =
    total !== undefined ? `${answered} of ${total} answered` : `${answered} answered`;
  return `${answeredText} · ${correct} correct`;
}

/**
 * Calculates percentage with safe division.
 *
 * @param correct - Numerator (correct count)
 * @param attempted - Denominator (attempted count)
 * @returns Rounded percentage (0 if attempted is 0)
 */
export function calculatePercentage(correct: number, attempted: number): number {
  if (attempted === 0) {
    return 0;
  }
  return Math.round((correct / attempted) * 100);
}

/**
 * Totals calculated from page data.
 */
export interface RecalculatedTotals {
  attempted: number;
  correct: number;
}

/**
 * Recalculates totals from all pages in a student record.
 * Only counts answers with non-empty answer strings (excludes placeholder entries).
 *
 * @param pages - Record of page ID to page data
 * @returns Aggregated attempted and correct counts
 */
export function recalculateTotalsFromPages(pages: Record<PageId, PageData>): RecalculatedTotals {
  let attempted = 0;
  let correct = 0;

  for (const pageId in pages) {
    const pageData = pages[pageId];
    if (pageData && pageData.answers && Array.isArray(pageData.answers)) {
      // Filter to only non-empty answers (matches storage-service.ts behavior)
      const answered = pageData.answers.filter((a) => a.answer.trim() !== '');
      attempted += answered.length;
      correct += answered.filter((a) => a.success).length;
    }
  }

  return { attempted, correct };
}

/**
 * Checks if a session has expired.
 *
 * @param expiresAt - ISO 8601 expiration timestamp
 * @param now - Current time (defaults to new Date())
 * @returns True if session has expired
 */
export function isSessionExpired(expiresAt: string, now: Date = new Date()): boolean {
  const expiryDate = new Date(expiresAt);
  // Invalid date -> treat as expired
  if (isNaN(expiryDate.getTime())) {
    return true;
  }
  return now >= expiryDate;
}

/**
 * Masks a service ID for display (shows last N digits).
 *
 * @param serviceId - Full service ID
 * @param visibleDigits - Number of digits to show (default 4)
 * @returns Masked string like "...1234"
 */
export function maskServiceId(serviceId: string, visibleDigits: number = 4): string {
  if (!serviceId) {
    return '';
  }
  if (serviceId.length <= visibleDigits) {
    return serviceId;
  }
  if (visibleDigits === 0) {
    return '...';
  }
  return '...' + serviceId.slice(-visibleDigits);
}
