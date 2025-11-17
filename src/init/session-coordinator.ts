/**
 * Session Coordinator
 * Manages session lifecycle and coordinates session-related events
 */

import { SessionService } from '../services/session.js';
import { info, warn } from '../utils/logger.js';
import type { SessionData } from '../types/contracts.js';

/**
 * Session coordinator for managing session lifecycle
 */
export class SessionCoordinator {
  private sessionService: SessionService;
  private expiryTimeoutId?: number;

  constructor() {
    this.sessionService = new SessionService();
  }

  /**
   * Initialize session coordinator
   * - Load existing session from storage
   * - Schedule expiry check
   * - Setup activity tracking
   */
  initialize(): void {
    const session = this.sessionService.getSession();

    if (session) {
      info(`Existing session loaded for ${session.serviceId}`);

      // Check if session is expired
      if (this.sessionService.isExpired()) {
        warn('Session expired, clearing');
        this.sessionService.clearSession();
        return;
      }

      // Schedule expiry check
      this.scheduleExpiryCheck(session);

      // Setup activity tracking
      this.setupActivityTracking();
    } else {
      info('No existing session found');
    }
  }

  /**
   * Schedule expiry check based on session timeout
   */
  private scheduleExpiryCheck(session: SessionData): void {
    // Clear existing timeout
    if (this.expiryTimeoutId !== undefined) {
      window.clearTimeout(this.expiryTimeoutId);
    }

    // Calculate time until expiry
    const now = new Date().getTime();
    const expiresAt = new Date(session.expiresAt).getTime();
    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry <= 0) {
      // Session already expired
      this.sessionService.clearSession();
      return;
    }

    // Schedule expiry
    this.expiryTimeoutId = window.setTimeout(() => {
      info('Session expired (timeout)');
      this.sessionService.clearSession();
    }, timeUntilExpiry);
  }

  /**
   * Setup activity tracking to extend session on user interaction
   */
  private setupActivityTracking(): void {
    const activityHandler = (): void => {
      const session = this.sessionService.getSession();
      if (!session) {
        return;
      }

      // Update activity timestamp and extend expiry
      this.sessionService.updateActivity();

      // Reschedule expiry check
      const updatedSession = this.sessionService.getSession();
      if (updatedSession) {
        this.scheduleExpiryCheck(updatedSession);
      }
    };

    // Track common user activities
    const events = ['click', 'keydown', 'scroll', 'mousemove'];

    // Debounce activity updates to avoid excessive writes
    let activityDebounceTimeout: number | undefined;
    const debouncedHandler = (): void => {
      if (activityDebounceTimeout !== undefined) {
        window.clearTimeout(activityDebounceTimeout);
      }

      activityDebounceTimeout = window.setTimeout(() => {
        activityHandler();
      }, 5000); // Update activity at most once per 5 seconds
    };

    events.forEach(event => {
      document.addEventListener(event, debouncedHandler, { passive: true });
    });
  }

  /**
   * Cleanup session coordinator
   */
  cleanup(): void {
    if (this.expiryTimeoutId !== undefined) {
      window.clearTimeout(this.expiryTimeoutId);
    }
  }

  /**
   * Get the session service instance
   */
  getSessionService(): SessionService {
    return this.sessionService;
  }
}
