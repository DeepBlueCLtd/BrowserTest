/**
 * Build Info Component
 *
 * Displays a small info icon (i) that shows build information on hover.
 * Tooltip shows: app name and build date.
 *
 * @element qd-build-info
 *
 * @example
 * ```html
 * <qd-build-info></qd-build-info>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

// Type declaration for Vite build-time constant
declare const __BUILD_DATE__: string;

/**
 * Build info component with tooltip
 */
@customElement('qd-build-info')
export class QdBuildInfo extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }

    .info-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #6c757d;
      color: white;
      font-size: 10px;
      font-weight: bold;
      font-style: italic;
      font-family: Georgia, serif;
      cursor: help;
      user-select: none;
    }

    .info-icon:hover {
      background: #5a6268;
    }

    .tooltip {
      position: absolute;
      top: 50%;
      right: 100%;
      transform: translateY(-50%);
      margin-right: 8px;
      padding: 8px 12px;
      background: #333;
      color: white;
      font-size: 11px;
      font-style: normal;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.2s,
        visibility 0.2s;
      z-index: 1000;
      pointer-events: none;
    }

    .tooltip::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 100%;
      transform: translateY(-50%);
      border: 5px solid transparent;
      border-left-color: #333;
    }

    .info-icon:hover + .tooltip,
    .info-icon:focus + .tooltip {
      opacity: 1;
      visibility: visible;
    }

    .tooltip-line {
      display: block;
      line-height: 1.4;
    }
  `;

  render() {
    const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'Development';

    return html`
      <span class="info-icon" tabindex="0" role="button" aria-label="Build information">i</span>
      <div class="tooltip" role="tooltip">
        <span class="tooltip-line">BrowserTest, from Deep Blue C Ltd</span>
        <span class="tooltip-line">Built ${buildDate}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-build-info': QdBuildInfo;
  }
}
