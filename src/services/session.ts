/**
 * Session Management Service
 *
 * Handles user session lifecycle, timeout management, and instructor mode.
 * Integrates with encrypted session storage for secure session data.
 */

import type {
  SessionData,
  SessionCache,
  ServiceId,
  ReleaseId,
  StudentRecord,
  PageCache,
  PageData,
  CompletionState,
} from '../types/contracts.js';
import { STORAGE_KEYS, SESSION_TIMEOUT_MS } from '../types/contracts.js';
import { info, warn, error } from '../utils/logger.js';

/**
 * Session Service for managing user sessions
 */
export class SessionService {
  /**
   * Create a new session
   *
   * @param serviceId - Student service ID
   * @param name - Student name
   * @param release - Current release ID
   * @returns Created session data
   */
  createSession(serviceId: ServiceId, name: string, release: ReleaseId): SessionData {
    const now = new Date();
    const loginTime = now.toISOString();
    const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString();

    const session: SessionData = {
      serviceId,
      name,
      release,
      loginTime,
      lastActivity: loginTime,
      expiresAt,
      instructorUnlocked: false,
    };

    this.saveSession(session);
    info(`Session created for ${serviceId} (${name})`);

    // Emit login event
    this.emitEvent('qd:login', { serviceId, name, release, loginTime });

    return session;
  }

  /**
   * Get the current session
   *
   * @returns Session data or null if no session exists
   */
  getSession(): SessionData | null {
    try {
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData) as SessionData;

      // Validate required fields
      if (!session.serviceId || !session.release || !session.expiresAt) {
        warn('Invalid session data, missing required fields');
        return null;
      }

      return session;
    } catch (err) {
      error('Failed to parse session data', err as Error);
      return null;
    }
  }

  /**
   * Update last activity time and extend session expiry
   */
  updateActivity(): void {
    const session = this.getSession();
    if (!session) {
      return;
    }

    const now = new Date();
    session.lastActivity = now.toISOString();
    session.expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString();

    this.saveSession(session);
  }

  /**
   * Check if the current session is expired
   *
   * @returns True if session is expired or doesn't exist
   */
  isExpired(): boolean {
    const session = this.getSession();
    if (!session) {
      return true;
    }

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    return now >= expiresAt;
  }

  /**
   * Clear the current session
   */
  clearSession(): void {
    const session = this.getSession();
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(STORAGE_KEYS.CACHE);

    if (session) {
      info(`Session cleared for ${session.serviceId}`);

      // Emit logout event
      this.emitEvent('qd:logout', {
        serviceId: session.serviceId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Unlock instructor mode
   */
  unlockInstructor(): void {
    const session = this.getSession();
    if (!session) {
      return;
    }

    session.instructorUnlocked = true;
    session.unlockTime = new Date().toISOString();

    this.saveSession(session);

    info('Instructor mode unlocked');

    // Emit custom event
    this.emitEvent('qd:instructor-unlock', { timestamp: session.unlockTime });
  }

  /**
   * Lock instructor mode
   */
  lockInstructor(): void {
    const session = this.getSession();
    if (!session) {
      return;
    }

    session.instructorUnlocked = false;
    delete session.unlockTime;

    this.saveSession(session);

    info('Instructor mode locked');

    // Emit custom event
    this.emitEvent('qd:instructor-lock', { timestamp: new Date().toISOString() });
  }

  /**
   * Check if instructor mode is unlocked
   *
   * @returns True if instructor mode is unlocked
   */
  isInstructorUnlocked(): boolean {
    const session = this.getSession();
    return session?.instructorUnlocked === true;
  }

  /**
   * Get session cache from sessionStorage
   *
   * @returns Session cache or null if not found
   */
  getCache(): SessionCache | null {
    try {
      const cacheData = sessionStorage.getItem(STORAGE_KEYS.CACHE);
      if (!cacheData) {
        return null;
      }

      return JSON.parse(cacheData) as SessionCache;
    } catch (err) {
      error('Failed to parse cache data', err);
      return null;
    }
  }

  /**
   * Save session cache to sessionStorage
   *
   * @param cache - Cache data to save
   */
  saveCache(cache: SessionCache): void {
    try {
      sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));
    } catch (err) {
      error('Failed to save cache', err);
    }
  }

  /**
   * Clear the session cache
   */
  clearCache(): void {
    sessionStorage.removeItem(STORAGE_KEYS.CACHE);
  }

  /**
   * Save session to sessionStorage
   *
   * @param session - Session data to save
   */
  private saveSession(session: SessionData): void {
    try {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch (err) {
      error('Failed to save session', err);
    }
  }

  /**
   * Emit a custom event
   *
   * @param eventName - Name of the event
   * @param detail - Event detail data
   */
  private emitEvent(eventName: string, detail: unknown): void {
    try {
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
    } catch (err) {
      error(`Failed to emit event ${eventName}`, err);
    }
  }
}

// ============================================================================
// CACHE BUILDING UTILITIES
// ============================================================================

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

// ============================================================================
// SINGLETON PATTERN
// ============================================================================

/**
 * Create and return a singleton instance of the session service
 */
let sessionInstance: SessionService | null = null;

export function getSessionService(): SessionService {
  if (!sessionInstance) {
    sessionInstance = new SessionService();
  }
  return sessionInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetSessionService(): void {
  sessionInstance = null;
}
