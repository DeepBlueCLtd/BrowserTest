/**
 * Password modal component
 *
 * Reusable password entry modal using qd-modal base.
 * Used by qd-login for instructor authentication.
 *
 * Feature: 007-lit-component-refactor
 *
 * @element qd-password-modal
 * @fires {CustomEvent<{password: string}>} qd:password-submit - Emitted on form submission
 * @fires {CustomEvent} close - Emitted when modal closes
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import './qd-modal.js';

@customElement('qd-password-modal')
export class QdPasswordModal extends LitElement {
  static override styles = css`
    :host {
      display: contents;
    }

    .password-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    label {
      font-size: 13px;
      font-weight: 500;
      color: #333;
    }

    input[type='password'] {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      width: 100%;
      box-sizing: border-box;
    }

    input[type='password']:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .error-message {
      color: #d32f2f;
      font-size: 12px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
      border-left: 3px solid #d32f2f;
    }

    .button-row {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button[type='submit'] {
      background: #0066cc;
      color: white;
    }

    button[type='submit']:hover {
      background: #0052a3;
    }

    button[type='button'] {
      background: #e0e0e0;
      color: #333;
    }

    button[type='button']:hover {
      background: #d0d0d0;
    }
  `;

  /**
   * Whether modal is open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Modal title
   */
  @property({ type: String })
  title = 'Enter Password';

  /**
   * Error message to display
   */
  @property({ type: String })
  error = '';

  /**
   * Internal password value
   */
  @state()
  private password = '';

  /**
   * Reference to password input
   */
  @query('input[type="password"]')
  private passwordInput!: HTMLInputElement;

  /**
   * Show the modal
   */
  show(): void {
    this.open = true;
    this.password = '';
    this.error = '';
  }

  /**
   * Close the modal
   */
  close(): void {
    this.open = false;
    this.password = '';
    this.error = '';
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  /**
   * Handle modal close from qd-modal
   */
  private handleModalClose = (): void => {
    this.close();
  };

  /**
   * Handle password input
   */
  private handleInput = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    this.password = input.value;
    // Clear error on input
    if (this.error) {
      this.error = '';
    }
  };

  /**
   * Handle form submission
   */
  private handleSubmit = (e: Event): void => {
    e.preventDefault();

    if (!this.password.trim()) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent('qd:password-submit', {
        detail: { password: this.password },
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Handle cancel button
   */
  private handleCancel = (): void => {
    this.close();
  };

  /**
   * Focus password input when modal opens
   */
  override updated(changedProps: Map<string, unknown>): void {
    if (changedProps.has('open') && this.open) {
      // Reset state when opening
      this.password = '';
      // Focus input after render
      void this.updateComplete.then(() => {
        this.passwordInput?.focus();
      });
    }
  }

  override render() {
    return html`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        <form class="password-form" @submit=${this.handleSubmit}>
          <div class="form-field">
            <label for="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              placeholder="Password"
              .value=${this.password}
              @input=${this.handleInput}
              required
              aria-label="Enter your password"
            />
          </div>

          ${this.error ? html`<div class="error-message">${this.error}</div>` : ''}

          <div class="button-row">
            <button type="button" @click=${this.handleCancel}>Cancel</button>
            <button type="submit">Login</button>
          </div>
        </form>
      </qd-modal>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-password-modal': QdPasswordModal;
  }
}
