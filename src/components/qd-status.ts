/**
 * Status Component
 *
 * Compact single-line display of student quiz progress and logout button.
 * Shows: "X/Y Correct (Z%)" format.
 *
 * @element qd-status
 * @fires {CustomEvent} qd:logout - Emitted when user clicks logout
 *
 * @example
 * ```html
 * <qd-status></qd-status>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import type { SessionCache } from '../types/contracts.js';
import { getJSON } from '../utils/storage-helpers.js';

/**
 * Status panel component for student progress tracking
 */
@customElement('qd-status')
export class QdStatus extends LitElement {
  /**
   * Total questions answered
   */
  @state()
  private answered = 0;

  /**
   * Total correct answers
   */
  @state()
  private correct = 0;

  /**
   * Success percentage
   */
  @state()
  private percentage = 0;

  /**
   * Overall status indicator color
   */
  @state()
  private statusColor: 'red' | 'amber' | 'green' = 'red';

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .status-panel {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-indicator.red {
      background: #d32f2f;
    }

    .status-indicator.amber {
      background: #ff9800;
    }

    .status-indicator.green {
      background: #4caf50;
    }

    .progress-label {
      font-size: 13px;
      font-weight: 500;
      color: #555;
      white-space: nowrap;
    }

    .progress-text {
      font-size: 13px;
      color: #333;
      white-space: nowrap;
    }

    .logout-button {
      padding: 5px 10px;
      background: #d32f2f;
      color: white;
      border: none;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      white-space: nowrap;
    }

    .logout-button:hover {
      background: #b71c1c;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadCache();

    // Listen for state changes
    document.addEventListener('qd:state-changed', this.handleStateChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('qd:state-changed', this.handleStateChanged);
  }

  render() {
    return html`
      <div class="status-panel">
        <div class="status-indicator ${this.statusColor}"></div>
        <div class="progress-label">Progress:</div>
        <div class="progress-text">
          ${this.correct}/${this.answered} Correct (${this.percentage}%)
        </div>
        <button class="logout-button" @click=${() => this.handleLogout()}>Logout</button>
      </div>
    `;
  }

  /**
   * Load cache from storage and update state
   */
  private loadCache() {
    const cache = getJSON<SessionCache>(STORAGE_KEYS.CACHE);
    if (!cache) {
      this.answered = 0;
      this.correct = 0;
      this.percentage = 0;
      this.statusColor = 'red';
      return;
    }

    this.answered = cache.totals.answered;
    this.correct = cache.totals.correct;
    this.percentage = this.calculatePercentage(cache.totals.answered, cache.totals.correct);
    this.statusColor = this.calculateStatusColor(cache.totals.answered, cache.totals.correct);
  }

  /**
   * Calculate percentage from answered/correct
   */
  private calculatePercentage(answered: number, correct: number): number {
    if (answered === 0) return 0;
    return Math.round((correct / answered) * 100);
  }

  /**
   * Calculate status indicator color
   * Red: No answers
   * Green: All correct
   * Amber: Some answered but not all correct
   */
  private calculateStatusColor(answered: number, correct: number): 'red' | 'amber' | 'green' {
    if (answered === 0) return 'red';
    if (correct === answered) return 'green';
    return 'amber';
  }

  /**
   * Handle state changed event
   */
  private handleStateChanged = () => {
    this.loadCache();
  };

  /**
   * Handle logout button click
   */
  private handleLogout() {
    const event = new CustomEvent('qd:logout', {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-status': QdStatus;
  }
}
