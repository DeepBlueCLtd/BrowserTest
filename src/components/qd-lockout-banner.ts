/**
 * Lockout Banner Component
 *
 * Self-contained countdown banner shown while a student account is locked out
 * after too many failed PIN attempts. Owns its own 1s timer and emits
 * `qd:lockout-expired` when the countdown reaches zero. Extracted from
 * `qd-login`.
 *
 * @element qd-lockout-banner
 * @fires {CustomEvent<void>} qd:lockout-expired - When the lockout window ends
 */

import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

/**
 * Countdown banner for PIN lockout.
 */
@customElement('qd-lockout-banner')
export class QdLockoutBanner extends LitElement {
  /** Epoch milliseconds when the lockout ends (0 = not locked). */
  @property({ type: Number })
  untilMs = 0;

  @state()
  private seconds = 0;

  private interval: number | null = null;

  static styles = css`
    .lockout-message {
      width: 100%;
      color: #f57c00;
      font-size: 11px;
      margin-top: 3px;
      padding: 4px 8px;
      background: #fff3e0;
      border-radius: 3px;
      border-left: 3px solid #f57c00;
    }
  `;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearTimer();
  }

  willUpdate(changed: Map<string, unknown>): void {
    if (changed.has('untilMs')) {
      // Reflect the remaining seconds in the same render the property changes.
      const remainingMs = this.untilMs - Date.now();
      this.seconds = remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
    }
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('untilMs')) {
      this.startTimer();
    }
  }

  render() {
    if (this.seconds <= 0) {
      return html``;
    }
    return html`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
      Too many attempts. Try again in ${this.seconds}s
    </div>`;
  }

  /** (Re)start the 1s countdown timer based on the current `seconds`. */
  private startTimer(): void {
    this.clearTimer();
    if (this.seconds <= 0) {
      return;
    }

    this.interval = window.setInterval(() => {
      this.seconds--;
      if (this.seconds <= 0) {
        this.clearTimer();
        this.dispatchEvent(
          new CustomEvent('qd:lockout-expired', { bubbles: true, composed: true }),
        );
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-lockout-banner': QdLockoutBanner;
  }
}
