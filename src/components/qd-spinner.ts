/**
 * Spinner Component
 *
 * Reusable loading indicator with encapsulated styles (Shadow DOM). Shares the
 * spinner CSS fragment from `shared-styles.ts` so its appearance matches the
 * inline spinners it replaces.
 *
 * @element qd-spinner
 */

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { spinnerStyles } from './shared-styles.js';

/**
 * Standalone loading spinner.
 */
@customElement('qd-spinner')
export class QdSpinner extends LitElement {
  static override styles = [spinnerStyles];

  override render() {
    return html`<div class="spinner" role="status" aria-label="Loading"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-spinner': QdSpinner;
  }
}
