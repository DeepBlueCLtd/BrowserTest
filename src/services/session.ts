/**
 * Session Management Service
 *
 * Handles user session lifecycle, timeout management, and instructor mode.
 */

import type { SessionData, SessionCache, ServiceId, ReleaseId } from '../types/contracts';
import { STORAGE_KEYS, SESSION_TIMEOUT_MS } from '../types/contracts';

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
        console.warn('Invalid session data, missing required fields');
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to parse session data:', error);
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
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(STORAGE_KEYS.CACHE);
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
    } catch (error) {
      console.error('Failed to parse cache data:', error);
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
  private saveSession(session: SessionData): void {
    try {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
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
