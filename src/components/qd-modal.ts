/**
 * Base Modal Component
 *
 * Reusable modal with backdrop, keyboard handling, and focus trap.
 * Uses fixed positioning with high z-index for proper stacking.
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

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Track currently open modal for collision handling
// Using globalThis to ensure state persists across module re-imports in test environments
const MODAL_STATE_KEY = '__qdModalCurrentRef__';

function getCurrentModal(): QdModal | null {
  return ((globalThis as Record<string, unknown>)[MODAL_STATE_KEY] as QdModal) ?? null;
}

function setCurrentModal(modal: QdModal | null): void {
  (globalThis as Record<string, unknown>)[MODAL_STATE_KEY] = modal;
}

/**
 * Base modal component with common modal behavior
 * Moves entire element to document.body when open to escape stacking context issues
 */
@customElement('qd-modal')
export class QdModal extends LitElement {
  static override styles = css`
    :host {
      display: contents;
    }

    .backdrop {
      display: none;
    }

    :host([open]) .backdrop {
      display: flex;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      animation: qd-modal-fadeIn 0.15s ease-out;
    }

    @keyframes qd-modal-fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      animation: qd-modal-slideIn 0.15s ease-out;
    }

    @keyframes qd-modal-slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
      font-weight: 600;
      font-size: 18px;
    }

    .header ::slotted(*) {
      margin: 0;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      font-size: 20px;
      color: #666;
      line-height: 1;
      border-radius: 4px;
      transition:
        background-color 0.2s,
        color 0.2s;
      margin-left: auto;
    }

    .close-button:hover {
      background: #f0f0f0;
      color: #333;
    }

    .close-button:focus {
      outline: 2px solid #0066cc;
      outline-offset: 2px;
    }

    .body {
      padding: 20px;
    }
  `;

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

  /**
   * Original parent element (for restoration when closing)
   */
  private originalParent: ParentNode | null = null;

  /**
   * Original next sibling (to restore position in DOM)
   */
  private originalNextSibling: Node | null = null;

  /**
   * Whether we're currently in body (to prevent double-moves)
   */
  private isInBody = false;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleKeyDown);

    // Clean up if this was the open modal
    // But NOT if we're just moving to body (isInBody will be true during that move)
    if (getCurrentModal() === this && !this.isInBody) {
      setCurrentModal(null);
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('open')) {
      if (this.open) {
        this.handleOpen();
      } else {
        this.handleClose();
      }
    }
  }

  /**
   * Move this element to document.body to escape stacking contexts
   */
  private moveToBody(): void {
    if (this.isInBody) return;

    // Store original location for restoration
    this.originalParent = this.parentNode;
    this.originalNextSibling = this.nextSibling;

    // Set flag BEFORE move so disconnectedCallback knows we're just relocating
    this.isInBody = true;

    // Move to body
    document.body.appendChild(this);
  }

  /**
   * Restore this element to its original position in the DOM
   */
  private restorePosition(): void {
    if (!this.isInBody || !this.originalParent) return;

    // Restore to original position
    if (this.originalNextSibling) {
      this.originalParent.insertBefore(this, this.originalNextSibling);
    } else {
      this.originalParent.appendChild(this);
    }

    this.originalParent = null;
    this.originalNextSibling = null;
    this.isInBody = false;
  }

  override render() {
    return html`
      <div class="backdrop" @click=${this.handleBackdropClick}>
        <div class="content" role="dialog" aria-modal="true" @click=${this.stopPropagation}>
          <div class="header">
            <span class="header-title"><slot name="header"></slot></span>
            ${this.closable
              ? html`<button
                  type="button"
                  class="close-button"
                  @click=${this.handleCloseClick}
                  aria-label="Close"
                  title="Close"
                >
                  ×
                </button>`
              : ''}
          </div>
          <div class="body">
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
    const currentModal = getCurrentModal();
    if (currentModal && currentModal !== this) {
      currentModal.close();
    }
    setCurrentModal(this);

    // Store currently focused element for restoration
    this.previouslyFocused = document.activeElement;

    // Move element to body to escape stacking contexts
    this.moveToBody();

    // Focus first element after render
    requestAnimationFrame(() => {
      this.focusFirstElement();
    });
  }

  /**
   * Handle modal closing
   */
  private handleClose() {
    if (getCurrentModal() === this) {
      setCurrentModal(null);
    }

    // Restore element to original position
    this.restorePosition();

    // Restore focus
    if (this.previouslyFocused instanceof HTMLElement) {
      this.previouslyFocused.focus();
    }
  }

  /**
   * Focus the first focusable element in the modal
   */
  private focusFirstElement() {
    const content = this.shadowRoot?.querySelector('.content');
    if (!content) return;

    // Check slotted content for focusable elements
    const slot = this.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement;
    if (slot) {
      const assignedElements = slot.assignedElements({ flatten: true });
      for (const el of assignedElements) {
        const focusable = el.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable) {
          focusable.focus();
          return;
        }
        // Check if element itself is focusable
        if (
          el instanceof HTMLElement &&
          el.matches('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ) {
          el.focus();
          return;
        }
      }
    }

    // Fall back to close button
    const closeBtn = this.shadowRoot?.querySelector<HTMLElement>('.close-button');
    if (closeBtn) {
      closeBtn.focus();
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
   * Handle close button click
   */
  private handleCloseClick = () => {
    this.emitCloseEvent();
    this.close();
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
