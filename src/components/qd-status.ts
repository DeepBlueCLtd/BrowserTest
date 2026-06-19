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
import { isStudentLoggedIn } from '../utils/session-state.js';
import { calculateStatusIndicator, calculatePercentage } from '../utils/calculation-helpers.js';
import { SessionService } from '../services/session.js';
import './qd-build-info.js';
import './qd-help-trigger.js';
import './qd-help-popup.js';
import { getHelpContent } from '../config/help-content.js';

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

  /**
   * Student name
   */
  @state()
  private name = '';

  /**
   * Service ID (last 4 digits displayed)
   */
  @state()
  private serviceId = '';

  /**
   * Whether help popup is open
   */
  @state()
  private helpOpen = false;

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
      flex-direction: column;
      gap: 4px;
      padding: 6px 12px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .top-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bottom-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-info {
      font-size: 13px;
      color: #333;
      white-space: nowrap;
    }

    .user-label {
      font-weight: 500;
      color: #555;
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
    // Listen for cache rebuild (fires after async IndexedDB load completes)
    document.addEventListener('qd:cache-rebuild', this.handleCacheRebuild);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('qd:state-changed', this.handleStateChanged);
    document.removeEventListener('qd:login', this.handleLogin);
    document.removeEventListener('qd:logout', this.handleLogoutEvent);
    document.removeEventListener('qd:cache-rebuild', this.handleCacheRebuild);
  }

  render() {
    const last4 = this.serviceId.slice(-4);
    return html`
      <div class="status-panel">
        <div class="top-row">
          <span class="user-info">
            <span class="user-label">Test progress:</span>
            ${this.name} **${last4}
          </span>
          <qd-help-trigger
            panelType="status"
            @qd:help-open=${this.handleHelpOpen}
          ></qd-help-trigger>
          <button class="logout-button" @click=${() => this.handleLogout()}>Logout</button>
          <qd-build-info></qd-build-info>
        </div>
        <div class="bottom-row">
          <div class="status-indicator ${this.statusColor}"></div>
          <div class="progress-text">
            ${this.correct}/${this.total} Correct (${this.percentage}%)
          </div>
        </div>
      </div>
      <qd-help-popup
        .open=${this.helpOpen}
        .title=${getHelpContent('status').title}
        .content=${getHelpContent('status').body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>
    `;
  }

  /**
   * Load cache from storage and update state
   */
  private loadCache() {
    // Load session data for name/serviceId
    const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
    if (session) {
      this.name = session.name || '';
      this.serviceId = session.serviceId || '';
    } else {
      this.name = '';
      this.serviceId = '';
    }

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
    this.percentage = calculatePercentage(cache.totals.correct, cache.totals.total);
    this.statusColor = this.calculateStatusColor(cache.totals.total, cache.totals.correct);
  }

  /**
   * Calculate status indicator color using calculation helper
   * Red: No questions registered or no answers
   * Green: All questions answered correctly
   * Amber: Some answered but not all correct
   */
  private calculateStatusColor(total: number, correct: number): 'red' | 'amber' | 'green' {
    return calculateStatusIndicator(total, correct);
  }

  /**
   * Update visibility based on session state
   * Show only if logged in as student (not instructor)
   */
  private updateVisibility() {
    this.toggleAttribute('data-show', isStudentLoggedIn());
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
   * Handle cache rebuild event (fired after async IndexedDB load completes)
   */
  private handleCacheRebuild = () => {
    this.loadCache();
  };

  /**
   * Handle logout event
   */
  private handleLogoutEvent = () => {
    this.updateVisibility();
  };

  /**
   * Handle help open event
   */
  private handleHelpOpen = (): void => {
    this.helpOpen = true;
  };

  /**
   * Handle help close event
   */
  private handleHelpClose = (): void => {
    this.helpOpen = false;
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
