/**
 * Instructor unlock component with password verification and rate limiting
 */

import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles.js';
import { RateLimiter, constantTimeCompare } from '../../utils/security.js';
import { getExpectedInstructorHash, hashPassword } from '../../services/auth/instructor-auth.js';
import { PIN_CONSTANTS } from '../../types/contracts.js';
import { dispatchEventOn } from '../../utils/event-helpers.js';

/**
 * Password unlock UI with rate limiting for instructor access
 *
 * Features:
 * - Password input with masked field
 * - Rate limiting: 2s, 4s, 8s, 16s, 30s lockout on failures
 * - Constant-time password comparison
 * - Emits 'qd:instructor-unlock' on success
 *
 * @fires qd:instructor-unlock - Emitted when password verified successfully
 */
@customElement('qd-instructor-unlock')
export class QdInstructorUnlock extends LitElement {
  static override styles = sharedStyles;

  @state()
  private password = '';

  @state()
  private error = '';

  @state()
  private remainingSeconds = 0;

  // Same allowance as the student PIN policy (PIN_CONSTANTS.MAX_ATTEMPTS): the
  // third consecutive wrong password starts the exponential lockout.
  private rateLimiter = new RateLimiter(PIN_CONSTANTS.MAX_ATTEMPTS - 1);
  private countdownInterval?: number;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.countdownInterval) {
      window.clearInterval(this.countdownInterval);
    }
  }

  private handlePasswordInput = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    this.password = input.value;
    this.error = '';
  };

  private handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();

    // Check rate limit
    const allowed = this.rateLimiter.attempt();
    if (!allowed) {
      this.remainingSeconds = this.rateLimiter.getRemainingSeconds();
      this.startCountdown();
      this.error = `Too many attempts. Try again in ${this.remainingSeconds}s`;
      return;
    }

    // Validate password
    try {
      // Same config element and hash format as the login modal (#qd-instructor-hash,
      // SHA-256 truncated to 12 hex chars) so the two unlock paths cannot disagree.
      const expectedHash = getExpectedInstructorHash();
      if (!expectedHash) {
        throw new Error('Instructor password hash not configured');
      }
      const actualHash = await hashPassword(this.password);

      // Constant-time comparison
      const valid = await constantTimeCompare(actualHash, expectedHash);

      if (valid) {
        // Success - reset limiter and emit event
        this.rateLimiter.reset();
        this.password = '';
        this.error = '';
        dispatchEventOn(this, 'qd:instructor-unlock', {});
      } else {
        // Failure - count it (this path previously never recorded failures, so
        // the limiter never engaged) and show the error
        this.rateLimiter.recordFailure();
        this.error = 'Invalid password';
        this.password = '';
      }
    } catch {
      this.error = 'Authentication failed';
      this.password = '';
    }
  };

  private startCountdown(): void {
    if (this.countdownInterval) {
      window.clearInterval(this.countdownInterval);
    }

    this.countdownInterval = window.setInterval(() => {
      this.remainingSeconds = this.rateLimiter.getRemainingSeconds();
      if (this.remainingSeconds === 0) {
        if (this.countdownInterval) {
          window.clearInterval(this.countdownInterval);
          this.countdownInterval = undefined;
        }
        this.error = '';
      } else {
        this.error = `Too many attempts. Try again in ${this.remainingSeconds}s`;
      }
    }, 1000);
  }

  override render() {
    const isLocked = this.remainingSeconds > 0;

    return html`
      <div class="unlock-container">
        <h3>Instructor Access</h3>
        <p>Enter the instructor password to unlock administrative features.</p>

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="password">Password:</label>
            <input
              type="password"
              id="password"
              .value=${this.password}
              @input=${this.handlePasswordInput}
              ?disabled=${isLocked}
              autocomplete="current-password"
              required
            />
          </div>

          ${this.error
            ? html`<div class="error" role="alert" aria-live="polite">${this.error}</div>`
            : ''}

          <button type="submit" class="primary" ?disabled=${isLocked || !this.password}>
            ${isLocked ? `Locked (${this.remainingSeconds}s)` : 'Unlock'}
          </button>
        </form>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor-unlock': QdInstructorUnlock;
  }
}
