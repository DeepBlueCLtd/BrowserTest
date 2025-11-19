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
import type { SessionCache, SessionData } from '../types/contracts.js';
import { getJSON } from '../utils/storage-helpers.js';
import { SessionService } from '../services/session.js';

/**
 * Status panel component for student progress tracking
 */
@customElement('qd-status')
export class QdStatus extends LitElement {
  /**
   * Total questions registered
   */
  @state()
  private total = 0;

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
      display: none; /* Hidden by default, shown when logged in */
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
    }

    :host([data-show]) {
      display: block;
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
    this.updateVisibility();
    this.loadCache();

    // Listen for state changes and login/logout
    document.addEventListener('qd:state-changed', this.handleStateChanged);
    document.addEventListener('qd:login', this.handleLogin);
    document.addEventListener('qd:logout', this.handleLogoutEvent);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('qd:state-changed', this.handleStateChanged);
    document.removeEventListener('qd:login', this.handleLogin);
    document.removeEventListener('qd:logout', this.handleLogoutEvent);
  }

  render() {
    return html`
      <div class="status-panel">
        <div class="status-indicator ${this.statusColor}"></div>
        <div class="progress-label">Progress:</div>
        <div class="progress-text">${this.correct}/${this.total} Correct (${this.percentage}%)</div>
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
      this.total = 0;
      this.correct = 0;
      this.percentage = 0;
      this.statusColor = 'red';
      return;
    }

    this.total = cache.totals.total;
    this.correct = cache.totals.correct;
    this.percentage = this.calculatePercentage(cache.totals.total, cache.totals.correct);
    this.statusColor = this.calculateStatusColor(cache.totals.total, cache.totals.correct);
  }

  /**
   * Calculate percentage from total/correct
   */
  private calculatePercentage(total: number, correct: number): number {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }

  /**
   * Calculate status indicator color
   * Red: No questions registered or no answers
   * Green: All questions answered correctly
   * Amber: Some answered but not all correct
   */
  private calculateStatusColor(total: number, correct: number): 'red' | 'amber' | 'green' {
    if (total === 0 || correct === 0) return 'red';
    if (correct === total) return 'green';
    return 'amber';
  }

  /**
   * Update visibility based on session state
   * Show only if logged in as student (not instructor)
   */
  private updateVisibility() {
    const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
    const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === 'true';

    if (session && !isInstructor) {
      this.setAttribute('data-show', '');
    } else {
      this.removeAttribute('data-show');
    }
  }

  /**
   * Handle state changed event
   */
  private handleStateChanged = () => {
    this.loadCache();
  };

  /**
   * Handle login event
   */
  private handleLogin = () => {
    this.updateVisibility();
    this.loadCache();
  };

  /**
   * Handle logout event
   */
  private handleLogoutEvent = () => {
    this.updateVisibility();
  };

  /**
   * Handle logout button click
   */
  private handleLogout() {
    const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);

    // Clear session from storage
    const sessionService = new SessionService();
    sessionService.clearSession();

    const event = new CustomEvent('qd:logout', {
      detail: {
        serviceId: session?.serviceId || 'unknown',
      },
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
