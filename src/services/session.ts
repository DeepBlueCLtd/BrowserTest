/**
 * Session Management Service
 *
 * Handles user session lifecycle, timeout management, and instructor mode.
 * All session data is encrypted in sessionStorage to protect PII.
 */

import type { SessionData, SessionCache, ServiceId, ReleaseId } from '../types/contracts';
import { STORAGE_KEYS, SESSION_TIMEOUT_MS } from '../types/contracts';
import { getEncryptedJSON, setEncryptedJSON } from '../utils/storage-helpers';
import { generateEncryptionKey } from '../utils/crypto';

/**
 * Session Service for managing user sessions
 */
export class SessionService {
  private enableEncryption: boolean;

  constructor(options?: { enableEncryption?: boolean }) {
    this.enableEncryption = options?.enableEncryption ?? true;
  }

  /**
   * Get or generate the encryption key for this session
   *
   * The key is stored in sessionStorage and used to encrypt/decrypt
   * all session data to protect PII.
   *
   * @returns Encryption key
   */
  private async getOrCreateEncryptionKey(): Promise<string> {
    // Try to get existing key from sessionStorage
    const storedKey = sessionStorage.getItem(STORAGE_KEYS.ENCRYPTION_KEY);
    if (storedKey) {
      return Promise.resolve(storedKey);
    }

    // Generate new key if none exists
    const newKey = generateEncryptionKey();
    sessionStorage.setItem(STORAGE_KEYS.ENCRYPTION_KEY, newKey);
    return Promise.resolve(newKey);
  }

  /**
   * Create a new session
   *
   * @param serviceId - Student service ID
   * @param name - Student name
   * @param release - Current release ID
   * @returns Created session data
   */
  async createSession(
    serviceId: ServiceId,
    name: string,
    release: ReleaseId,
  ): Promise<SessionData> {
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

    await this.saveSession(session);
    return session;
  }

  /**
   * Get the current session
   *
   * Attempts to decrypt encrypted session data. If decryption fails,
   * tries to parse as plaintext (for migration), then re-encrypts.
   *
   * @returns Session data or null if no session exists
   */
  async getSession(): Promise<SessionData | null> {
    try {
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      if (!sessionData) {
        return null;
      }

      // Try to decrypt if encryption is enabled
      if (this.enableEncryption) {
        const encryptionKey = await this.getOrCreateEncryptionKey();
        const decryptedSession = await getEncryptedJSON<SessionData>(
          STORAGE_KEYS.SESSION,
          encryptionKey,
        );

        if (decryptedSession) {
          // Validate required fields
          if (
            !decryptedSession.serviceId ||
            !decryptedSession.release ||
            !decryptedSession.expiresAt
          ) {
            console.warn('Invalid session data, missing required fields');
            return null;
          }
          return decryptedSession;
        }

        // Decryption failed - try plaintext migration
        console.warn('Attempting plaintext session migration...');
      }

      // Try parsing as plaintext (for migration or if encryption disabled)
      const session = JSON.parse(sessionData) as SessionData;

      // Validate required fields
      if (!session.serviceId || !session.release || !session.expiresAt) {
        console.warn('Invalid session data, missing required fields');
        return null;
      }

      // Re-encrypt plaintext session if encryption is enabled
      if (this.enableEncryption) {
        console.warn('Migrating plaintext session to encrypted format...');
        await this.saveSession(session);
      }

      return session;
    } catch (error) {
      console.error('Failed to get session data:', error);
      return null;
    }
  }

  /**
   * Update last activity time and extend session expiry
   */
  async updateActivity(): Promise<void> {
    const session = await this.getSession();
    if (!session) {
      return;
    }

    const now = new Date();
    session.lastActivity = now.toISOString();
    session.expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MS).toISOString();

    await this.saveSession(session);
  }

  /**
   * Check if the current session is expired
   *
   * @returns True if session is expired or doesn't exist
   */
  async isExpired(): Promise<boolean> {
    const session = await this.getSession();
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
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(STORAGE_KEYS.CACHE);
    sessionStorage.removeItem(STORAGE_KEYS.ENCRYPTION_KEY);
  }

  /**
   * Unlock instructor mode
   */
  async unlockInstructor(): Promise<void> {
    const session = await this.getSession();
    if (!session) {
      return;
    }

    session.instructorUnlocked = true;
    session.unlockTime = new Date().toISOString();

    await this.saveSession(session);

    // Emit custom event
    this.emitEvent('qd:instructor-unlock', { timestamp: session.unlockTime });
  }

  /**
   * Lock instructor mode
   */
  async lockInstructor(): Promise<void> {
    const session = await this.getSession();
    if (!session) {
      return;
    }

    session.instructorUnlocked = false;
    delete session.unlockTime;

    await this.saveSession(session);

    // Emit custom event
    this.emitEvent('qd:instructor-lock', { timestamp: new Date().toISOString() });
  }

  /**
   * Check if instructor mode is unlocked
   *
   * @returns True if instructor mode is unlocked
   */
  async isInstructorUnlocked(): Promise<boolean> {
    const session = await this.getSession();
    return session?.instructorUnlocked === true;
  }

  /**
   * Get session cache from sessionStorage
   *
   * Attempts to decrypt encrypted cache data. If decryption fails,
   * tries to parse as plaintext (for migration), then re-encrypts.
   *
   * @returns Session cache or null if not found
   */
  async getCache(): Promise<SessionCache | null> {
    try {
      const cacheData = sessionStorage.getItem(STORAGE_KEYS.CACHE);
      if (!cacheData) {
        return null;
      }

      // Try to decrypt if encryption is enabled
      if (this.enableEncryption) {
        const encryptionKey = await this.getOrCreateEncryptionKey();
        const decryptedCache = await getEncryptedJSON<SessionCache>(
          STORAGE_KEYS.CACHE,
          encryptionKey,
        );

        if (decryptedCache) {
          return decryptedCache;
        }

        // Decryption failed - try plaintext migration
        console.warn('Attempting plaintext cache migration...');
      }

      // Try parsing as plaintext (for migration or if encryption disabled)
      const cache = JSON.parse(cacheData) as SessionCache;

      // Re-encrypt plaintext cache if encryption is enabled
      if (import.meta.env.VITE_ENABLE_ENCRYPTION !== false) {
        console.warn('Migrating plaintext cache to encrypted format...');
        await this.saveCache(cache);
      }

      return cache;
    } catch (error) {
      console.error('Failed to get cache data:', error);
      return null;
    }
  }

  /**
   * Save session cache to sessionStorage
   *
   * @param cache - Cache data to save
   */
  async saveCache(cache: SessionCache): Promise<void> {
    try {
      // Encrypt if enabled
      if (this.enableEncryption) {
        const encryptionKey = await this.getOrCreateEncryptionKey();
        await setEncryptedJSON(STORAGE_KEYS.CACHE, cache, encryptionKey);
      } else {
        // Fallback to plaintext if encryption disabled
        sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));
      }
    } catch (error) {
      console.error('Failed to save cache:', error);
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
  private async saveSession(session: SessionData): Promise<void> {
    try {
      // Encrypt if enabled
      if (this.enableEncryption) {
        const encryptionKey = await this.getOrCreateEncryptionKey();
        await setEncryptedJSON(STORAGE_KEYS.SESSION, session, encryptionKey);
      } else {
        // Fallback to plaintext if encryption disabled
        sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Failed to save session:', error);
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
    } catch (error) {
      console.error(`Failed to emit event ${eventName}:`, error);
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
export function buildCacheFromRecord(
  record: import('../types/contracts').StudentRecord,
): SessionCache {
  const cache: SessionCache = {
    totals: {
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
export function buildPageCache(
  _pageId: string,
  pageData: import('../types/contracts').StudentRecord['pages'][string],
): import('../types/contracts').PageCache {
  const answered = pageData.answers.length;
  const correct = pageData.answers.filter((a) => a.success).length;

  return {
    state: pageData.state,
    answered,
    correct,
    last: pageData.lastAttempted,
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
 * @returns Updated cache
 */
export function updateCacheWithAnswer(
  cache: SessionCache,
  pageId: string,
  isCorrect: boolean,
): SessionCache {
  const now = new Date().toISOString();

  // Get or create page entry
  const pageCache = cache.pages[pageId] || {
    state: 'incomplete' as const,
    answered: 0,
    correct: 0,
  };

  // Update page counts
  const updatedPage = {
    ...pageCache,
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

/**
 * Create and return a singleton instance of the session service
 */
let sessionInstance: SessionService | null = null;

export function getSessionService(): SessionService {
  if (!sessionInstance) {
    sessionInstance = new SessionService({
      enableEncryption: import.meta.env.VITE_ENABLE_ENCRYPTION !== false,
    });
  }
  return sessionInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetSessionService(): void {
  sessionInstance = null;
}
