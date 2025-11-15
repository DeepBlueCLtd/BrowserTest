/**
 * Error Banner Component
 *
 * Displays validation errors for quiz and analysis tables.
 * Used to show authoring constraint violations per FR-007.
 *
 * @element qd-error-banner
 *
 * @prop {ValidationError[]} errors - Array of validation errors to display
 *
 * @fires {CustomEvent} qd:error-displayed - When errors are shown to user
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ValidationError } from '../services/validation';

@customElement('qd-error-banner')
export class QdErrorBanner extends LitElement {
  /**
   * Array of validation errors to display
   */
  @property({ type: Array })
  errors: ValidationError[] = [];

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .error-banner {
      background-color: #fee;
      border: 2px solid #c00;
      border-radius: 4px;
      padding: 16px;
      margin: 16px 0;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      color: #600;
    }

    .error-banner__title {
      font-weight: bold;
      font-size: 1.1em;
      margin: 0 0 12px 0;
      color: #c00;
    }

    .error-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .error-item {
      padding: 8px 0;
      border-top: 1px solid #fcc;
    }

    .error-item:first-child {
      border-top: none;
      padding-top: 0;
    }

    .error-item:last-child {
      padding-bottom: 0;
    }

    .error-code {
      font-family: monospace;
      font-weight: bold;
      background-color: #fdd;
      padding: 2px 6px;
      border-radius: 3px;
      margin-right: 8px;
      font-size: 0.9em;
    }

    .error-message {
      display: inline;
    }

    .error-row {
      font-weight: bold;
      color: #900;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .error-banner {
        border-width: 3px;
      }

      .error-code {
        border: 1px solid #c00;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  render() {
    // Don't render if no errors
    if (!this.errors || this.errors.length === 0) {
      return html``;
    }

    return html`
      <div class="error-banner" role="alert" aria-live="polite">
        <h3 class="error-banner__title">⚠️ Table Validation Errors</h3>
        <ul class="error-list">
          ${this.errors.map(
            (error) => html`
              <li class="error-item">
                <span class="error-code">[${error.code}]</span>
                <span class="error-message">${error.message}</span>
                ${error.row ? html` <span class="error-row">(Row ${error.row})</span>` : ''}
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }

  updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);

    // Emit event when errors are displayed
    if (changedProperties.has('errors') && this.errors.length > 0) {
      this.dispatchEvent(
        new CustomEvent('qd:error-displayed', {
          detail: { errors: this.errors },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-error-banner': QdErrorBanner;
  }
}
