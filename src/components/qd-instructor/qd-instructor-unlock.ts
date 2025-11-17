/**
 * Instructor unlock component with password verification and rate limiting
 */

import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles.js';
import { RateLimiter } from '../../utils/security.js';
import { constantTimeCompare } from '../../utils/security.js';
import { getInstructorPasswordHash } from '../../config/instructor-password.js';
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

  private rateLimiter = new RateLimiter();
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
      const expectedHash = getInstructorPasswordHash();

      // Hash the entered password
      const encoder = new TextEncoder();
      const data = encoder.encode(this.password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Constant-time comparison
      const valid = await constantTimeCompare(actualHash, expectedHash);

      if (valid) {
        // Success - reset limiter and emit event
        this.rateLimiter.reset();
        this.password = '';
        this.error = '';
        dispatchEventOn(this, 'qd:instructor-unlock', {});
      } else {
        // Failure - show error
        this.error = 'Invalid password';
        this.password = '';
      }
    } catch (err) {
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

          ${this.error ? html`<div class="error">${this.error}</div>` : ''}

          <button
            type="submit"
            class="primary"
            ?disabled=${isLocked || !this.password}
          >
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
