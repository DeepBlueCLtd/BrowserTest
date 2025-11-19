/**
 * Instructor Login Modal Component
 *
 * Modal dialog for instructor authentication with password input.
 * Displayed as overlay above all other content when open.
 * Supports Escape key and click-outside to close.
 *
 * @element qd-instructor-login-modal
 * @fires {CustomEvent<{password: string}>} submit - Emitted when login form submitted
 * @fires {CustomEvent<void>} close - Emitted when modal is closed
 *
 * @example
 * ```html
 * <qd-instructor-login-modal
 *   ?open=${this.showModal}
 *   .error=${this.errorMessage}
 *   @submit=${this.handleSubmit}
 *   @close=${this.handleClose}
 * ></qd-instructor-login-modal>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

/**
 * Instructor login modal component
 */
@customElement('qd-instructor-login-modal')
export class QdInstructorLoginModal extends LitElement {
  /**
   * Whether modal is visible
   */
  @property({ type: Boolean })
  open = false;

  /**
   * Error message to display below password field
   */
  @property({ type: String })
  error = '';

  /**
   * Password field value (internal state)
   */
  @state()
  private password = '';

  /**
   * Reference to password input element
   */
  @query('input[type="password"]')
  private passwordInput?: HTMLInputElement;

  static styles = css`
    :host {
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
    }

    .overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      align-items: center;
      justify-content: center;
      z-index: 10001; /* Above storage monitor (10000) */
    }

    :host([open]) .overlay {
      display: flex;
    }

    .modal {
      background: white;
      border-radius: 8px;
      padding: 24px;
      min-width: 320px;
      max-width: 400px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 10002;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 28px;
      height: 28px;
      line-height: 1;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      margin-bottom: 20px;
    }

    .modal-body input {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 11px;
    }

    .modal-body input:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .error-message {
      color: #d32f2f;
      font-size: 11px;
      margin-top: 8px;
      padding: 4px 8px;
      background: #ffebee;
      border-radius: 3px;
      border-left: 3px solid #d32f2f;
    }

    .modal-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      white-space: nowrap;
    }

    .cancel-btn {
      background: #e0e0e0;
      color: #333;
    }

    .cancel-btn:hover {
      background: #d0d0d0;
    }

    .login-btn {
      background: #0066cc;
      color: white;
    }

    .login-btn:hover {
      background: #0052a3;
    }

    .login-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleEscape);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleEscape);
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Focus password input when modal opens
    if (changedProperties.has('open') && this.open) {
      // Wait for next frame to ensure input is rendered
      requestAnimationFrame(() => {
        this.passwordInput?.focus();
      });
    }

    // Clear password when modal closes
    if (changedProperties.has('open') && !this.open) {
      this.password = '';
    }
  }

  render() {
    return html`
      <div class="overlay" @click=${(e: Event) => this.handleOverlayClick(e)}>
        <div class="modal" @click=${(e: Event) => this.stopPropagation(e)}>
          <div class="modal-header">
            <h3 class="modal-title">Instructor Login</h3>
            <button
              type="button"
              class="close-btn"
              @click=${() => this.handleClose()}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          <form @submit=${(e: Event) => this.handleSubmit(e)}>
            <div class="modal-body">
              <input
                type="password"
                placeholder="Password"
                .value=${this.password}
                @input=${(e: Event) => this.handlePasswordInput(e)}
                required
                aria-label="Instructor password"
              />
              ${this.error ? html`<div class="error-message">${this.error}</div>` : ''}
            </div>

            <div class="modal-footer">
              <button type="button" class="cancel-btn" @click=${() => this.handleClose()}>
                Cancel
              </button>
              <button type="submit" class="login-btn" ?disabled=${!this.password}>Login</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * Handle password input changes
   */
  private handlePasswordInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.password = input.value;

    // Clear error when user types
    if (this.error) {
      this.dispatchEvent(new CustomEvent('clear-error', { bubbles: true, composed: true }));
    }
  }

  /**
   * Handle form submission
   */
  private handleSubmit(e: Event) {
    e.preventDefault();

    if (!this.password) {
      return;
    }

    const event = new CustomEvent('submit', {
      detail: { password: this.password },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /**
   * Handle close button click
   */
  private handleClose() {
    const event = new CustomEvent('close', {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /**
   * Handle overlay click (close on click outside modal)
   */
  private handleOverlayClick(e: Event) {
    // Only close if clicking directly on overlay, not on modal content
    if (e.target === e.currentTarget) {
      this.handleClose();
    }
  }

  /**
   * Stop event propagation to prevent overlay click when clicking inside modal
   */
  private stopPropagation(e: Event) {
    e.stopPropagation();
  }

  /**
   * Handle Escape key press
   */
  private handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.open) {
      this.handleClose();
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor-login-modal': QdInstructorLoginModal;
  }
}
