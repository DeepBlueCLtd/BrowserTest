/**
 * Confirmation dialog component
 *
 * Reusable confirmation modal using qd-modal base.
 * Supports confirm/cancel buttons with optional destructive styling.
 *
 * Feature: 007-lit-component-refactor
 *
 * @element qd-confirm-dialog
 * @fires {CustomEvent} qd:confirm - Emitted when confirm button is clicked
 * @fires {CustomEvent} qd:cancel - Emitted when cancel button is clicked or dialog is dismissed
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import './qd-modal.js';

/** Inline styles for the slotted dialog body (see the note on `styles`). */
const CONTENT_STYLES = {
  content: 'padding: 8px 0;',
  message: 'font-size: 14px; color: #333; line-height: 1.5; margin-bottom: 16px;',
  label: 'display: block; font-size: 13px; color: #333; margin: 0 0 4px;',
  input:
    'width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin-bottom: 16px;',
  row: 'display: flex; gap: 8px; justify-content: flex-end;',
  button:
    'padding: 8px 16px; border: none; border-radius: 4px; font-size: 13px; font-weight: 500; cursor: pointer;',
  cancel: 'background: #e0e0e0; color: #333;',
  confirm: 'background: #0066cc; color: white;',
  destructive: 'background: #d32f2f; color: white;',
  disabled: 'background: #ccc; color: white; cursor: not-allowed;',
} as const;

@customElement('qd-confirm-dialog')
export class QdConfirmDialog extends LitElement {
  /*
   * The dialog body is slotted into <qd-modal>, which moves itself to
   * document.body when it opens. Slotted light DOM then leaves this
   * component's shadow root, so shadow-scoped styles stop applying and the
   * dialog rendered with browser-default buttons (SRD 013 UX-01). The body is
   * therefore styled inline (see CONTENT_STYLES), which survives the move and
   * adds no global CSS.
   */
  static override styles = css`
    :host {
      display: contents;
    }
  `;

  /**
   * Whether dialog is open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Dialog title
   */
  @property({ type: String })
  title = 'Confirm';

  /**
   * Message to display (supports HTML)
   */
  @property({ type: String })
  message = '';

  /**
   * Text for confirm button
   */
  @property({ type: String })
  confirmText = 'Confirm';

  /**
   * Text for cancel button
   */
  @property({ type: String })
  cancelText = 'Cancel';

  /**
   * Whether this is a destructive action (red confirm button)
   */
  @property({ type: Boolean })
  destructive = false;

  /**
   * Ask for the instructor password before confirming (SRD 013 SEC-03).
   * The typed password is sent in the `qd:confirm` event detail; the caller
   * verifies it.
   */
  @property({ type: Boolean })
  requirePassword = false;

  /** Password typed into the dialog when {@link requirePassword} is set */
  @state()
  private password = '';

  /**
   * Show the dialog
   */
  show(): void {
    this.open = true;
  }

  /**
   * Close the dialog
   */
  close(): void {
    this.open = false;
  }

  /**
   * Handle modal close from qd-modal (backdrop click, Escape)
   */
  private handleModalClose = (): void => {
    this.close();
    this.dispatchEvent(
      new CustomEvent('qd:cancel', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  /**
   * Handle confirm button click
   */
  private handleConfirm = (): void => {
    if (this.requirePassword && !this.password) {
      return;
    }
    const password = this.password;
    this.password = '';
    this.close();
    this.dispatchEvent(
      new CustomEvent('qd:confirm', {
        detail: this.requirePassword ? { password } : undefined,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handlePasswordInput = (e: Event): void => {
    this.password = (e.target as HTMLInputElement).value;
  };

  /**
   * Handle cancel button click
   */
  private handleCancel = (): void => {
    this.password = '';
    this.close();
    this.dispatchEvent(
      new CustomEvent('qd:cancel', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  /** Confirm stays disabled until a required password has been typed. */
  private get confirmBlocked(): boolean {
    return this.requirePassword && !this.password;
  }

  override render() {
    return html`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        <div class="confirm-content" style=${CONTENT_STYLES.content}>
          <div class="message" style=${CONTENT_STYLES.message}>${unsafeHTML(this.message)}</div>

          ${this.requirePassword
            ? html`<label
                  class="password-label"
                  for="qd-confirm-password"
                  style=${CONTENT_STYLES.label}
                  >Instructor password</label
                >
                <input
                  id="qd-confirm-password"
                  class="password-input"
                  type="password"
                  autocomplete="current-password"
                  .value=${this.password}
                  @input=${this.handlePasswordInput}
                  @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.handleConfirm()}
                  style=${CONTENT_STYLES.input}
                />`
            : nothing}

          <div class="button-row" style=${CONTENT_STYLES.row}>
            ${this.cancelText
              ? html`<button
                  type="button"
                  class="cancel-btn"
                  style=${CONTENT_STYLES.button + CONTENT_STYLES.cancel}
                  @click=${this.handleCancel}
                >
                  ${this.cancelText}
                </button>`
              : nothing}
            <button
              type="button"
              class="confirm-btn ${this.destructive ? 'destructive' : ''}"
              style=${CONTENT_STYLES.button +
              (this.confirmBlocked
                ? CONTENT_STYLES.disabled
                : this.destructive
                  ? CONTENT_STYLES.destructive
                  : CONTENT_STYLES.confirm)}
              ?disabled=${this.confirmBlocked}
              @click=${this.handleConfirm}
            >
              ${this.confirmText}
            </button>
          </div>
        </div>
      </qd-modal>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-confirm-dialog': QdConfirmDialog;
  }
}
