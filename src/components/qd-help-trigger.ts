/**
 * Help Trigger Component
 *
 * A small help icon button (?) that triggers contextual help popups.
 * Emits qd:help-open event when activated via click or keyboard (Enter/Space).
 *
 * @element qd-help-trigger
 * @fires {CustomEvent<{panelType: string}>} qd:help-open - Emitted when help is requested
 *
 * @example
 * ```html
 * <qd-help-trigger panelType="login"></qd-help-trigger>
 * ```
 *
 * Feature: 008-user-guidance-popups
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Help trigger button component
 */
@customElement('qd-help-trigger')
export class QdHelpTrigger extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    .help-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #0066cc;
      color: white;
      font-size: 12px;
      font-weight: bold;
      font-family: system-ui, -apple-system, sans-serif;
      cursor: pointer;
      border: none;
      padding: 0;
      transition: background 0.15s ease;
    }

    .help-icon:hover {
      background: #0052a3;
    }

    .help-icon:focus {
      outline: 2px solid #0066cc;
      outline-offset: 2px;
    }

    .help-icon:active {
      background: #004080;
    }
  `;

  /**
   * Which panel this trigger belongs to
   */
  @property({ type: String })
  panelType: 'login' | 'status' | 'instructor' = 'login';

  /**
   * Handle click/activation
   */
  private handleClick = () => {
    this.dispatchEvent(
      new CustomEvent('qd:help-open', {
        detail: { panelType: this.panelType },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    return html`
      <button
        class="help-icon"
        @click=${this.handleClick}
        aria-label="Help"
        title="Help"
      >
        ?
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-help-trigger': QdHelpTrigger;
  }
}
