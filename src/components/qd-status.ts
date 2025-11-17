/**
 * Status Component
 *
 * Displays student quiz progress with R/A/G badges and logout control.
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
 * R/A/G state counts
 */
interface StateCount {
  red: number; // unstarted
  amber: number; // incomplete
  green: number; // complete
}

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
   * R/A/G state counts
   */
  @state()
  private stateCounts: StateCount = { red: 0, amber: 0, green: 0 };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .status-panel {
      padding: 16px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    h2 {
      margin: 0;
      font-size: 20px;
      color: #333;
    }

    .progress-section {
      margin-bottom: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 12px;
    }

    .stat-card {
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
      text-align: center;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    .percentage {
      font-size: 32px;
      font-weight: 700;
      text-align: center;
      color: #0066cc;
      margin: 16px 0;
    }

    .badge-section {
      margin-bottom: 16px;
    }

    .badge-label {
      font-size: 14px;
      font-weight: 500;
      color: #555;
      margin-bottom: 8px;
    }

    .badge-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .badge-count {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 14px;
    }

    .badge-indicator {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      margin-right: 8px;
    }

    .badge-indicator.green {
      background: #4caf50;
    }

    .badge-indicator.amber {
      background: #ff9800;
    }

    .badge-indicator.red {
      background: #d32f2f;
    }

    .logout-button {
      width: 100%;
      padding: 10px 16px;
      background: #d32f2f;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
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
        <div class="header">
          <h2>Your Progress</h2>
        </div>

        <div class="progress-section">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${this.answered}</div>
              <div class="stat-label">Answered</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this.correct}</div>
              <div class="stat-label">Correct</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this.answered - this.correct}</div>
              <div class="stat-label">Incorrect</div>
            </div>
          </div>

          <div class="percentage">${this.percentage}%</div>
        </div>

        <div class="badge-section">
          <div class="badge-label">Page Status</div>
          <div class="badge-grid">
            <div class="badge-count">
              <div class="badge-indicator green"></div>
              <span>${this.stateCounts.green} Complete</span>
            </div>
            <div class="badge-count">
              <div class="badge-indicator amber"></div>
              <span>${this.stateCounts.amber} In Progress</span>
            </div>
            <div class="badge-count">
              <div class="badge-indicator red"></div>
              <span>${this.stateCounts.red} Not Started</span>
            </div>
          </div>
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
      this.stateCounts = { red: 0, amber: 0, green: 0 };
      return;
    }

    this.answered = cache.totals.answered;
    this.correct = cache.totals.correct;
    this.percentage = this.calculatePercentage(cache.totals.answered, cache.totals.correct);
    this.stateCounts = this.calculateStateCounts(cache);
  }

  /**
   * Calculate percentage from answered/correct
   */
  private calculatePercentage(answered: number, correct: number): number {
    if (answered === 0) return 0;
    return Math.round((correct / answered) * 100);
  }

  /**
   * Calculate R/A/G state counts from cache
   */
  private calculateStateCounts(cache: SessionCache): StateCount {
    const counts: StateCount = { red: 0, amber: 0, green: 0 };

    Object.values(cache.pages).forEach((page) => {
      const state = page.state;
      if (state === 'complete') {
        counts.green++;
      } else if (state === 'incomplete') {
        counts.amber++;
      } else {
        counts.red++;
      }
    });

    return counts;
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
