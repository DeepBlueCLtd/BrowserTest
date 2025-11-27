/**
 * Help Popup Component
 *
 * A modal popup that displays contextual help content.
 * Wraps qd-modal to provide help-specific styling and behavior.
 *
 * @element qd-help-popup
 * @fires {CustomEvent} qd:modal-close - Emitted when popup closes
 *
 * @example
 * ```html
 * <qd-help-popup
 *   .open=${this.helpOpen}
 *   title="Login Help"
 *   .content=${helpContent}
 *   @qd:modal-close=${() => this.helpOpen = false}
 * ></qd-help-popup>
 * ```
 *
 * Feature: 008-user-guidance-popups
 */

import { LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

// Help popup styles for portal rendering
const HELP_POPUP_STYLES = `
.qd-help-backdrop{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,-apple-system,sans-serif}
.qd-help-content{background:#fff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:450px;max-height:80vh;overflow:auto}
.qd-help-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eee}
.qd-help-title{font-weight:600;font-size:18px;color:#333;margin:0}
.qd-help-close{background:none;border:none;font-size:24px;color:#666;cursor:pointer;padding:0;line-height:1;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px}
.qd-help-close:hover{background:#f0f0f0;color:#333}
.qd-help-close:focus{outline:2px solid #0066cc;outline-offset:2px}
.qd-help-body{padding:20px;line-height:1.6;color:#444}
.qd-help-body h3{margin-top:0;margin-bottom:12px;color:#333;font-size:16px}
.qd-help-body p{margin:0 0 12px 0}
.qd-help-body p:last-child{margin-bottom:0}
.qd-help-body strong{color:#333}`;

/**
 * Help popup modal component
 */
@customElement('qd-help-popup')
export class QdHelpPopup extends LitElement {
  /**
   * Style element for help popup CSS (injected once)
   */
  private static styleElement: HTMLStyleElement | null = null;

  /**
   * Portal element appended to body
   */
  private portalElement: HTMLDivElement | null = null;

  /**
   * Previously focused element for restoration
   */
  private previouslyFocused: Element | null = null;

  /**
   * Whether the popup is open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Popup title
   */
  @property({ type: String })
  title = 'Help';

  /**
   * HTML content to display (from readHelpContent)
   */
  @property({ type: String })
  content = '';

  /**
   * Track internal open state for portal management
   */
  @state()
  private _isOpen = false;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleKeyDown);
    this.ensureStyles();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleKeyDown);
    this.removePortal();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('open')) {
      if (this.open && !this._isOpen) {
        this.handleOpen();
      } else if (!this.open && this._isOpen) {
        this.handleClose();
      }
    }
  }

  /**
   * Ensure help popup styles are added to document head (once)
   */
  private ensureStyles() {
    if (!QdHelpPopup.styleElement) {
      QdHelpPopup.styleElement = document.createElement('style');
      QdHelpPopup.styleElement.textContent = HELP_POPUP_STYLES;
      document.head.appendChild(QdHelpPopup.styleElement);
    }
  }

  /**
   * Create and show the portal
   */
  private createPortal() {
    this.removePortal();

    // Create backdrop
    this.portalElement = document.createElement('div');
    this.portalElement.className = 'qd-help-backdrop';
    this.portalElement.addEventListener('click', this.handleBackdropClick);

    // Create content container
    const contentEl = document.createElement('div');
    contentEl.className = 'qd-help-content';
    contentEl.setAttribute('role', 'dialog');
    contentEl.setAttribute('aria-modal', 'true');
    contentEl.setAttribute('aria-labelledby', 'qd-help-title');
    contentEl.addEventListener('click', this.stopPropagation);

    // Create header
    const headerEl = document.createElement('div');
    headerEl.className = 'qd-help-header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'qd-help-title';
    titleEl.id = 'qd-help-title';
    titleEl.textContent = this.title;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'qd-help-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', this.handleCloseClick);

    headerEl.appendChild(titleEl);
    headerEl.appendChild(closeBtn);

    // Create body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'qd-help-body';
    bodyEl.innerHTML = this.content;

    contentEl.appendChild(headerEl);
    contentEl.appendChild(bodyEl);
    this.portalElement.appendChild(contentEl);
    document.body.appendChild(this.portalElement);

    // Focus close button
    requestAnimationFrame(() => {
      closeBtn.focus();
    });
  }

  /**
   * Remove portal from DOM
   */
  private removePortal() {
    if (this.portalElement) {
      this.portalElement.remove();
      this.portalElement = null;
    }
  }

  /**
   * Handle opening
   */
  private handleOpen() {
    this._isOpen = true;
    this.previouslyFocused = document.activeElement;
    this.createPortal();
  }

  /**
   * Handle closing
   */
  private handleClose() {
    this._isOpen = false;
    this.removePortal();

    // Restore focus
    if (this.previouslyFocused instanceof HTMLElement) {
      this.previouslyFocused.focus();
    }
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this._isOpen) {
      this.close();
    }
  };

  /**
   * Handle backdrop click
   */
  private handleBackdropClick = () => {
    this.close();
  };

  /**
   * Handle close button click
   */
  private handleCloseClick = () => {
    this.close();
  };

  /**
   * Stop propagation for content clicks
   */
  private stopPropagation = (event: Event) => {
    event.stopPropagation();
  };

  /**
   * Close the popup and emit event
   */
  close() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent('qd:modal-close', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    // Portal renders to body, component renders nothing
    return nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-help-popup': QdHelpPopup;
  }
}
