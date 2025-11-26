/**
 * Base Modal Component
 *
 * Reusable modal with backdrop, keyboard handling, and focus trap.
 * Uses portal pattern to render to document.body for proper z-index stacking.
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

import { LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Track currently open modal for collision handling
let currentOpenModal: QdModal | null = null;

// Modal styles as inline CSS for portal rendering
const MODAL_STYLES = `
  .qd-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    font-family: system-ui, -apple-system, sans-serif;
    animation: qd-modal-fadeIn 0.15s ease-out;
  }

  @keyframes qd-modal-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .qd-modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    animation: qd-modal-slideIn 0.15s ease-out;
  }

  @keyframes qd-modal-slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .qd-modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
    font-weight: 600;
    font-size: 18px;
  }

  .qd-modal-header:empty {
    display: none;
  }

  .qd-modal-body {
    padding: 20px;
  }
`;

/**
 * Base modal component with common modal behavior
 * Renders to document.body for proper z-index stacking
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

  /**
   * Portal element appended to body
   */
  private portalElement: HTMLDivElement | null = null;

  /**
   * Style element for modal CSS
   */
  private static styleElement: HTMLStyleElement | null = null;

  /**
   * Map of original elements to their clones for event forwarding
   */
  private cloneMap: Map<Element, Element> = new Map();

  /**
   * Observer for child mutations to auto-refresh portal
   */
  private childObserver: MutationObserver | null = null;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleKeyDown);
    this.ensureStyles();

    // Observe child changes to auto-refresh portal
    this.childObserver = new MutationObserver(() => {
      if (this.open && this.portalElement) {
        this.createPortal();
      }
    });
    this.childObserver.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleKeyDown);
    this.removePortal();

    // Disconnect child observer
    this.childObserver?.disconnect();
    this.childObserver = null;

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

  /**
   * Ensure modal styles are added to document head (once)
   */
  private ensureStyles() {
    if (!QdModal.styleElement) {
      QdModal.styleElement = document.createElement('style');
      QdModal.styleElement.textContent = MODAL_STYLES;
      document.head.appendChild(QdModal.styleElement);
    }
  }

  /**
   * Create and append portal to body
   */
  private createPortal() {
    this.removePortal();
    this.cloneMap.clear();

    // Create portal container
    this.portalElement = document.createElement('div');
    this.portalElement.className = 'qd-modal-backdrop';
    this.portalElement.addEventListener('click', this.handleBackdropClick);

    // Create content wrapper
    const content = document.createElement('div');
    content.className = 'qd-modal-content';
    content.setAttribute('role', 'dialog');
    content.setAttribute('aria-modal', 'true');
    content.addEventListener('click', this.stopPropagation);

    // Create header
    const header = document.createElement('div');
    header.className = 'qd-modal-header';

    // Create body
    const body = document.createElement('div');
    body.className = 'qd-modal-body';

    // Move slotted content to portal
    const headerSlot = this.querySelector('[slot="header"]');
    if (headerSlot) {
      header.appendChild(headerSlot.cloneNode(true));
    }

    // Clone all non-header slotted content and track mappings
    Array.from(this.children).forEach((child) => {
      if (!child.hasAttribute('slot') || child.getAttribute('slot') !== 'header') {
        const clone = child.cloneNode(true) as Element;
        this.cloneMap.set(child, clone);
        body.appendChild(clone);
      }
    });

    content.appendChild(header);
    content.appendChild(body);
    this.portalElement.appendChild(content);
    document.body.appendChild(this.portalElement);

    // Add event forwarding for forms in the portal
    this.setupFormEventForwarding(body);
  }

  /**
   * Setup event forwarding for forms in cloned content
   * Since cloneNode() loses Lit event bindings, we add native listeners
   * that dispatch events to the original elements
   */
  private setupFormEventForwarding(container: HTMLElement) {
    const forms = container.querySelectorAll('form');
    forms.forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        // Get form data to include in forwarded event
        const formData = new FormData(form);
        const data: Record<string, string> = {};
        formData.forEach((value, key) => {
          data[key] = value.toString();
        });

        // Find password input specifically for password modals
        const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;
        if (passwordInput) {
          data['password'] = passwordInput.value;
        }

        // Dispatch event from the qd-modal element so parent can listen
        const submitEvent = new CustomEvent('qd:password-submit', {
          detail: data,
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(submitEvent);
      });
    });
  }

  /**
   * Remove portal from body
   */
  private removePortal() {
    if (this.portalElement) {
      this.portalElement.remove();
      this.portalElement = null;
    }
  }

  render() {
    // Portal renders to body, so component itself renders nothing
    return nothing;
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
   * Refresh portal content by re-cloning from source
   * Call this when slotted content changes and needs to sync to portal
   */
  refreshPortal() {
    if (this.open && this.portalElement) {
      this.createPortal();
    }
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

    // Create portal
    this.createPortal();

    // Focus first focusable element after render
    requestAnimationFrame(() => {
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

    // Remove portal
    this.removePortal();

    // Restore focus
    if (this.previouslyFocused instanceof HTMLElement) {
      this.previouslyFocused.focus();
    }
  }

  /**
   * Focus the first focusable element in the modal
   */
  private focusFirstElement() {
    if (!this.portalElement) return;

    const focusable = this.portalElement.querySelector<HTMLElement>(
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
