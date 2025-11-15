/**
 * Rate limiter for authentication attempts
 *
 * Implements exponential backoff to prevent brute force attacks.
 * State is persisted to localStorage to survive page refreshes.
 */

import { getJSON, setJSON, removeItem } from './storage-helpers';

/**
 * Rate limit state stored in localStorage
 */
interface RateLimitState {
  attemptCount: number;
  firstAttemptTime: string;
  lastAttemptTime: string;
  lockoutUntil: string | null;
  attemptHistory: Array<{
    timestamp: string;
    success: boolean;
  }>;
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterOptions {
  /**
   * Maximum number of attempts allowed in the time window
   * @default 5
   */
  maxAttempts?: number;

  /**
   * Time window in milliseconds
   * @default 30000 (30 seconds)
   */
  windowMs?: number;

  /**
   * Base delay for exponential backoff in milliseconds
   * @default 2000 (2 seconds)
   */
  baseDelayMs?: number;

  /**
   * Maximum delay for exponential backoff in milliseconds
   * @default 30000 (30 seconds)
   */
  maxDelayMs?: number;
}

/**
 * Rate limiter with exponential backoff
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter('auth', { maxAttempts: 5 });
 *
 * if (limiter.isAllowed()) {
 *   const success = attemptLogin(password);
 *   limiter.recordAttempt(success);
 * } else {
 *   const remaining = limiter.getLockoutTimeRemaining();
 *   showError(`Please wait ${remaining}ms before trying again`);
 * }
 * ```
 */
export class RateLimiter {
  private key: string;
  private maxAttempts: number;
  private windowMs: number;
  private baseDelayMs: number;
  private maxDelayMs: number;

  constructor(key: string, options: RateLimiterOptions = {}) {
    this.key = `qd/rateLimit/${key}`;
    this.maxAttempts = options.maxAttempts ?? 5;
    this.windowMs = options.windowMs ?? 30000;
    this.baseDelayMs = options.baseDelayMs ?? 2000;
    this.maxDelayMs = options.maxDelayMs ?? 30000;
  }

  /**
   * Check if an attempt is currently allowed
   *
   * @returns true if attempt is allowed, false if rate limited
   */
  isAllowed(): boolean {
    const state = this.getState();
    if (!state) {
      return true;
    }

    // Check if locked out
    if (state.lockoutUntil) {
      const lockoutTime = new Date(state.lockoutUntil).getTime();
      if (Date.now() < lockoutTime) {
        return false;
      }
      // Lockout expired, reset state
      this.reset();
      return true;
    }

    // Check if window expired
    const firstAttempt = new Date(state.firstAttemptTime).getTime();
    if (Date.now() - firstAttempt > this.windowMs) {
      this.reset();
      return true;
    }

    // Check attempt count
    return state.attemptCount < this.maxAttempts;
  }

  /**
   * Record an authentication attempt
   *
   * @param success - Whether the attempt was successful
   */
  recordAttempt(success: boolean): void {
    if (success) {
      // Successful attempt - reset everything
      this.reset();
      return;
    }

    const now = new Date().toISOString();
    const state = this.getState() || this.createInitialState(now);

    // Add to history
    state.attemptHistory.push({ timestamp: now, success });
    state.attemptCount++;
    state.lastAttemptTime = now;

    // Calculate lockout if max attempts exceeded
    if (state.attemptCount >= this.maxAttempts) {
      const delay = this.calculateBackoffDelay(state.attemptCount);
      state.lockoutUntil = new Date(Date.now() + delay).toISOString();
    }

    this.setState(state);
  }

  /**
   * Get current attempt count
   */
  getAttemptCount(): number {
    const state = this.getState();
    if (!state) {
      return 0;
    }

    // Check if window expired
    const firstAttempt = new Date(state.firstAttemptTime).getTime();
    if (Date.now() - firstAttempt > this.windowMs) {
      return 0;
    }

    return state.attemptCount;
  }

  /**
   * Get remaining lockout time in milliseconds
   *
   * @returns Milliseconds remaining, or 0 if not locked out
   */
  getLockoutTimeRemaining(): number {
    const state = this.getState();
    if (!state || !state.lockoutUntil) {
      return 0;
    }

    const lockoutTime = new Date(state.lockoutUntil).getTime();
    const remaining = Math.max(0, lockoutTime - Date.now());
    return remaining;
  }

  /**
   * Reset rate limit state
   */
  reset(): void {
    removeItem(this.key, localStorage);
  }

  /**
   * Get current state from localStorage
   */
  private getState(): RateLimitState | null {
    return getJSON<RateLimitState>(this.key, localStorage);
  }

  /**
   * Save state to localStorage
   */
  private setState(state: RateLimitState): void {
    setJSON(this.key, state, localStorage);
  }

  /**
   * Create initial state
   */
  private createInitialState(timestamp: string): RateLimitState {
    return {
      attemptCount: 0,
      firstAttemptTime: timestamp,
      lastAttemptTime: timestamp,
      lockoutUntil: null,
      attemptHistory: [],
    };
  }

  /**
   * Calculate exponential backoff delay
   *
   * Delay = baseDelay * 2^(attempts - maxAttempts)
   * Capped at maxDelayMs
   */
  private calculateBackoffDelay(attempts: number): number {
    const exponent = attempts - this.maxAttempts + 1;
    const delay = this.baseDelayMs * Math.pow(2, Math.max(0, exponent - 1));
    return Math.min(delay, this.maxDelayMs);
  }
}
