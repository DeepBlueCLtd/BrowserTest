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

import { LitElement, html, css, nothing } from 'lit';
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
   * Handle form submission (from Lit binding - only works without portal)
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
      }),
    );
  };

  /**
   * Handle forwarded submit from qd-modal portal
   * When form is cloned to portal, qd-modal dispatches this event
   */
  private handleForwardedSubmit = (e: CustomEvent<{ password?: string }>): void => {
    // Stop propagation so event doesn't bubble further
    e.stopPropagation();

    const password = e.detail?.password || '';
    if (!password.trim()) {
      return;
    }

    // Re-dispatch from this component
    this.dispatchEvent(
      new CustomEvent('qd:password-submit', {
        detail: { password },
        bubbles: true,
        composed: true,
      }),
    );
  };

  /**
   * Handle cancel button
   */
  private handleCancel = (): void => {
    this.close();
  };

  /**
   * Sync error message directly to portal DOM
   * Since portal clones content once, we need to inject/update the error div directly
   */
  private syncErrorToPortal(): void {
    // Find the portal backdrop in document.body
    const backdrop = document.querySelector('.qd-modal-backdrop');
    if (!backdrop) return;

    const form = backdrop.querySelector('form.password-form');
    if (!form) return;

    // Find existing error message in portal
    let errorDiv = form.querySelector('.error-message');

    if (this.error) {
      // Create or update error message
      if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        // Apply inline styles (portal is outside shadow DOM, so CSS rules don't apply)
        (errorDiv as HTMLElement).style.cssText = `
          color: #d32f2f;
          font-size: 12px;
          padding: 8px;
          background: #ffebee;
          border-radius: 4px;
          border-left: 3px solid #d32f2f;
        `;
        // Insert before button row
        const buttonRow = form.querySelector('.button-row');
        if (buttonRow) {
          form.insertBefore(errorDiv, buttonRow);
        } else {
          form.appendChild(errorDiv);
        }
      }
      errorDiv.textContent = this.error;
    } else {
      // Remove error message if no error
      errorDiv?.remove();
    }
  }

  /**
   * Focus password input when modal opens, refresh portal when error changes
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

    // When error changes, directly inject error into portal DOM
    // The portal pattern clones content once, so we need to inject the error directly
    if (changedProps.has('error') && this.open) {
      void this.updateComplete.then(() => {
        setTimeout(() => {
          this.syncErrorToPortal();
        }, 0);
      });
    }
  }

  override render() {
    // Don't render form when closed - prevents duplicate submit buttons in parent
    if (!this.open) {
      return nothing;
    }

    return html`
      <qd-modal
        .open=${this.open}
        @qd:modal-close=${this.handleModalClose}
        @qd:password-submit=${this.handleForwardedSubmit}
      >
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
