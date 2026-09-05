/**
 * Storage helper utilities
 *
 * Provides type-safe JSON storage operations for sessionStorage,
 * replacing repetitive try-catch JSON.parse patterns. Saves ~54 lines
 * of duplicated code.
 */

import { warn } from './logger.js';

/**
 * sessionStorage key for the instructor "show student answers" overlay toggle.
 *
 * Tracks whether the instructor answer overlay is active for the current
 * session. Previously inlined as the magic string `'qd/instructor/showAnswers'`
 * across multiple modules. Not part of the frozen STORAGE_KEYS contract in
 * `src/types/contracts.ts`.
 */
export const INSTRUCTOR_SHOW_ANSWERS_KEY = 'qd/instructor/showAnswers';

/**
 * Get and parse JSON data from sessionStorage
 *
 * @param key - Storage key
 * @returns Parsed object of type T, or null if not found or invalid
 *
 * @example
 * ```typescript
 * interface SessionData {
 *   userId: string;
 *   loginTime: string;
 * }
 *
 * const session = getJSON<SessionData>('qd/session');
 * if (session) {
 *   console.log('User ID:', session.userId);
 * }
 * ```
 */
export function getJSON<T>(key: string): T | null {
  try {
    const data = sessionStorage.getItem(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    warn(`Failed to parse JSON from sessionStorage key: ${key}`, error);
    return null;
  }
}

/**
 * Stringify and store JSON data in sessionStorage
 *
 * @param key - Storage key
 * @param value - Data to store
 * @returns true if successful, false if failed
 *
 * @example
 * ```typescript
 * const session = {
 *   userId: 'RN2344',
 *   loginTime: new Date().toISOString(),
 * };
 *
 * setJSON('qd/session', session);
 * ```
 */
export function setJSON<T>(key: string, value: T): boolean {
  try {
    const json = JSON.stringify(value);
    sessionStorage.setItem(key, json);
    return true;
  } catch (error) {
    warn(`Failed to store JSON in sessionStorage key: ${key}`, error);
    return false;
  }
}

/**
 * Remove item from sessionStorage
 *
 * @param key - Storage key to remove
 */
export function removeItem(key: string): void {
  sessionStorage.removeItem(key);
}

/**
 * Check if key exists in sessionStorage
 *
 * @param key - Storage key to check
 * @returns true if key exists
 */
export function hasItem(key: string): boolean {
  return sessionStorage.getItem(key) !== null;
}

/**
 * Clear all quiz data from sessionStorage
 *
 * Only removes keys with 'qd/' prefix, leaving other data intact.
 *
 * @returns Number of items cleared
 *
 * @example
 * ```typescript
 * // Clear all quiz-related session data
 * const cleared = clearQuizData();
 * console.log(`Cleared ${cleared} items`);
 * ```
 */
export function clearQuizData(): number {
  const keysToRemove: string[] = [];

  // Find all keys with 'qd/' prefix (session, cache, instructor flag)
  // or 'qd:' prefix (PIN rate-limit state) — see STORAGE_KEYS in contracts.ts
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith('qd/') || key.startsWith('qd:'))) {
      keysToRemove.push(key);
    }
  }

  // Remove found keys
  for (const key of keysToRemove) {
    sessionStorage.removeItem(key);
  }

  return keysToRemove.length;
}

/**
 * Get all quiz data keys from sessionStorage
 *
 * @returns Array of keys with 'qd/' prefix
 */
export function getQuizDataKeys(): string[] {
  const keys: string[] = [];

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith('qd/')) {
      keys.push(key);
    }
  }

  return keys;
}

/**
 * Clear all sessionStorage data
 *
 * Use with caution - clears everything, not just quiz data.
 */
export function clearAll(): void {
  sessionStorage.clear();
}
