/**
 * Base Modal Component
 *
 * Reusable modal with backdrop, keyboard handling, and focus trap.
 * Used as base for scores modal, password modal, and confirm dialogs.
 *
 * @element qd-modal
 * @fires {CustomEvent} qd:modal-close - Emitted when modal closes via Escape or backdrop click
 *
 * @slot - Default slot for modal content
 * @slot header - Optional header slot for modal title
 *
 * Feature: 007-lit-component-refactor
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Track currently open modal for collision handling
let currentOpenModal: QdModal | null = null;

/**
 * Base modal component with common modal behavior
 */
@customElement('qd-modal')
export class QdModal extends LitElement {
  /**
   * Whether the modal is open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Whether the modal can be closed via Escape/backdrop click
   */
  @property({ type: Boolean })
  closable = true;

  /**
   * Previously focused element (for focus restoration)
   */
  private previouslyFocused: Element | null = null;

  static styles = css`
    :host {
      display: contents;
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      animation: slideIn 0.15s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
      font-weight: 600;
      font-size: 18px;
    }

    .modal-header:empty {
      display: none;
    }

    .modal-body {
      padding: 20px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.handleKeyDown);

    // Clean up if this was the open modal
    if (currentOpenModal === this) {
      currentOpenModal = null;
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('open')) {
      if (this.open) {
        this.handleOpen();
      } else {
        this.handleClose();
      }
    }
  }

  render() {
    if (!this.open) {
      return nothing;
    }

    return html`
      <div class="modal-backdrop" @click=${this.handleBackdropClick}>
        <div class="modal-content" role="dialog" aria-modal="true" @click=${this.stopPropagation}>
          <div class="modal-header">
            <slot name="header"></slot>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Open the modal
   */
  show() {
    this.open = true;
  }

  /**
   * Close the modal
   */
  close() {
    this.open = false;
  }

  /**
   * Handle modal opening
   */
  private handleOpen() {
    // Modal collision: close any existing open modal
    if (currentOpenModal && currentOpenModal !== this) {
      currentOpenModal.close();
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- needed for modal collision tracking
    currentOpenModal = this;

    // Store currently focused element for restoration
    this.previouslyFocused = document.activeElement;

    // Focus first focusable element after render
    void this.updateComplete.then(() => {
      this.focusFirstElement();
    });
  }

  /**
   * Handle modal closing
   */
  private handleClose() {
    if (currentOpenModal === this) {
      currentOpenModal = null;
    }

    // Restore focus
    if (this.previouslyFocused instanceof HTMLElement) {
      this.previouslyFocused.focus();
    }
  }

  /**
   * Focus the first focusable element in the modal
   */
  private focusFirstElement() {
    // Look for focusable elements in slotted content
    const focusable = this.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable) {
      focusable.focus();
    }
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.open && this.closable) {
      this.emitCloseEvent();
      this.close();
    }
  };

  /**
   * Handle backdrop click
   */
  private handleBackdropClick = () => {
    if (this.closable) {
      this.emitCloseEvent();
      this.close();
    }
  };

  /**
   * Stop propagation for content clicks
   */
  private stopPropagation = (event: Event) => {
    event.stopPropagation();
  };

  /**
   * Emit close event
   */
  private emitCloseEvent() {
    const event = new CustomEvent('qd:modal-close', {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-modal': QdModal;
  }
}
