/**
 * Error banner component
 * Displays validation errors and warnings to users
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Error banner for displaying validation errors and warnings
 *
 * Features:
 * - Auto-dismissable after timeout
 * - Different severity levels (error, warning, info)
 * - Manual close button
 * - Accessible ARIA attributes
 *
 * @example
 * ```html
 * <qd-error-banner
 *   message="Invalid quiz table format"
 *   severity="error"
 * ></qd-error-banner>
 * ```
 */
@customElement('qd-error-banner')
export class QdErrorBanner extends LitElement {
  static override styles = css`
    :host {
      display: block;
      margin: 16px 0;
    }

    .banner {
      padding: 12px 16px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }

    .banner.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .banner.warning {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }

    .banner.info {
      background: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }

    .message {
      flex: 1;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      padding: 0 0 0 16px;
      opacity: 0.5;
      transition: opacity 0.2s;
    }

    .close-button:hover {
      opacity: 1;
    }

    :host([hidden]) {
      display: none;
    }
  `;

  @property({ type: String })
  message = '';

  @property({ type: String })
  severity: 'error' | 'warning' | 'info' = 'error';

  @property({ type: Boolean })
  dismissable = true;

  @property({ type: Number })
  autoDismissMs = 0;

  private dismissTimeout?: number;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.autoDismissMs > 0) {
      this.scheduleDismiss();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.dismissTimeout) {
      window.clearTimeout(this.dismissTimeout);
    }
  }

  private scheduleDismiss(): void {
    if (this.dismissTimeout) {
      window.clearTimeout(this.dismissTimeout);
    }
    this.dismissTimeout = window.setTimeout(() => {
      this.dismiss();
    }, this.autoDismissMs);
  }

  private handleClose = (): void => {
    this.dismiss();
  };

  private dismiss(): void {
    this.dispatchEvent(
      new CustomEvent('dismiss', {
        bubbles: true,
        composed: true,
      }),
    );
    this.hidden = true;
  }

  override render() {
    if (!this.message) {
      return html``;
    }

    return html`
      <div class="banner ${this.severity}" role="alert" aria-live="polite">
        <div class="message">${this.message}</div>
        ${this.dismissable
          ? html`
              <button class="close-button" @click=${this.handleClose} aria-label="Dismiss">
                ✕
              </button>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-error-banner': QdErrorBanner;
  }
}
