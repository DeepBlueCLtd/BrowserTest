/**
 * Session Coordinator
 * Manages session lifecycle and coordinates session-related events
 */

import { SessionService } from '../services/session.js';
import { info, warn } from '../utils/logger.js';
import type { SessionData } from '../types/contracts.js';
import { STORAGE_KEYS } from '../types/contracts.js';

/**
 * Session coordinator for managing session lifecycle
 */
export class SessionCoordinator {
  private sessionService: SessionService;
  private expiryTimeoutId?: number;
  private activityTrackingActive = false;

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
        this.expireSession();
        return;
      }

      // Schedule expiry check
      this.scheduleExpiryCheck(session);

      // Setup activity tracking
      this.setupActivityTracking();
    } else {
      info('No existing session found');
    }

    // A login on this page starts a session that the checks above never saw,
    // so start the timer and activity tracking for it too
    document.addEventListener('qd:login', this.handleLogin);
  }

  /** Start expiry and activity tracking for a session created on this page. */
  private handleLogin = (): void => {
    const session = this.sessionService.getSession();
    if (!session) {
      return;
    }
    this.scheduleExpiryCheck(session);
    this.setupActivityTracking();
  };

  /**
   * End a session that timed out, leaving a marker so the login form can
   * explain why the student was logged out (SRD 013 SEC-10).
   */
  private expireSession(): void {
    sessionStorage.setItem(STORAGE_KEYS.SESSION_EXPIRED, new Date().toISOString());
    document.dispatchEvent(
      new CustomEvent('qd:session-expired', { bubbles: true, composed: true }),
    );
    this.sessionService.clearSession();
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
      this.expireSession();
      return;
    }

    // Schedule expiry
    this.expiryTimeoutId = window.setTimeout(() => {
      info('Session expired (timeout)');
      this.expireSession();
    }, timeUntilExpiry);
  }

  /**
   * Setup activity tracking to extend session on user interaction
   */
  private setupActivityTracking(): void {
    if (this.activityTrackingActive) {
      return;
    }
    this.activityTrackingActive = true;
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

    events.forEach((event) => {
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
    document.removeEventListener('qd:login', this.handleLogin);
  }

  /**
   * Get the session service instance
   */
  getSessionService(): SessionService {
    return this.sessionService;
  }
}
