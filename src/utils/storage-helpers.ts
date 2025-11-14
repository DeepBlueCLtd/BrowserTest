/**
 * Storage Helper Utilities
 *
 * Provides safe wrappers for sessionStorage/localStorage operations
 * with automatic JSON parsing/stringification and error handling.
 *
 * Eliminates code duplication across the codebase (18+ occurrences).
 */

/**
 * Get and parse JSON from sessionStorage
 *
 * @param key - Storage key
 * @returns Parsed object or null if not found/invalid
 *
 * @example
 * ```typescript
 * const session = getSessionJSON<SessionData>('qd/session');
 * if (session) {
 *   console.log(session.serviceId);
 * }
 * ```
 */
export function getSessionJSON<T>(key: string): T | null {
  try {
    const data = sessionStorage.getItem(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Failed to parse sessionStorage key "${key}":`, error);
    return null;
  }
}

/**
 * Stringify and save JSON to sessionStorage
 *
 * @param key - Storage key
 * @param value - Value to store (will be JSON.stringify'd)
 *
 * @example
 * ```typescript
 * setSessionJSON('qd/session', {
 *   serviceId: 'RN2344',
 *   name: 'John Doe',
 *   release: '02-2025'
 * });
 * ```
 */
export function setSessionJSON<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save sessionStorage key "${key}":`, error);
    // Re-throw QuotaExceededError to allow caller to handle
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw error;
    }
  }
}

/**
 * Remove item from sessionStorage
 *
 * @param key - Storage key to remove
 */
export function removeSessionItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove sessionStorage key "${key}":`, error);
  }
}

/**
 * Clear all sessionStorage items
 */
export function clearSession(): void {
  try {
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear sessionStorage:', error);
  }
}

/**
 * Get and parse JSON from localStorage
 *
 * @param key - Storage key
 * @returns Parsed object or null if not found/invalid
 *
 * @example
 * ```typescript
 * const settings = getLocalJSON<UserSettings>('app/settings');
 * ```
 */
export function getLocalJSON<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Failed to parse localStorage key "${key}":`, error);
    return null;
  }
}

/**
 * Stringify and save JSON to localStorage
 *
 * @param key - Storage key
 * @param value - Value to store (will be JSON.stringify'd)
 *
 * @example
 * ```typescript
 * setLocalJSON('app/settings', {
 *   theme: 'dark',
 *   fontSize: 14
 * });
 * ```
 */
export function setLocalJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save localStorage key "${key}":`, error);
    // Re-throw QuotaExceededError to allow caller to handle
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw error;
    }
  }
}

/**
 * Remove item from localStorage
 *
 * @param key - Storage key to remove
 */
export function removeLocalItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage key "${key}":`, error);
  }
}

/**
 * Clear all localStorage items
 */
export function clearLocal(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Check if sessionStorage is available
 *
 * @returns True if sessionStorage is available and working
 */
export function isSessionStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if localStorage is available
 *
 * @returns True if localStorage is available and working
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
