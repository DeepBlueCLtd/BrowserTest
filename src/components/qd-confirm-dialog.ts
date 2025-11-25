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

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import './qd-modal.js';

@customElement('qd-confirm-dialog')
export class QdConfirmDialog extends LitElement {
  static override styles = css`
    :host {
      display: contents;
    }

    .confirm-content {
      padding: 8px 0;
    }

    .message {
      font-size: 14px;
      color: #333;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .button-row {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
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

    .cancel-btn {
      background: #e0e0e0;
      color: #333;
    }

    .cancel-btn:hover {
      background: #d0d0d0;
    }

    .confirm-btn {
      background: #0066cc;
      color: white;
    }

    .confirm-btn:hover {
      background: #0052a3;
    }

    .confirm-btn.destructive {
      background: #d32f2f;
    }

    .confirm-btn.destructive:hover {
      background: #b71c1c;
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
    this.close();
    this.dispatchEvent(
      new CustomEvent('qd:confirm', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  /**
   * Handle cancel button click
   */
  private handleCancel = (): void => {
    this.close();
    this.dispatchEvent(
      new CustomEvent('qd:cancel', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  override render() {
    return html`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        <div class="confirm-content">
          <div class="message">${unsafeHTML(this.message)}</div>

          <div class="button-row">
            <button type="button" class="cancel-btn" @click=${this.handleCancel}>
              ${this.cancelText}
            </button>
            <button
              type="button"
              class="confirm-btn ${this.destructive ? 'destructive' : ''}"
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
