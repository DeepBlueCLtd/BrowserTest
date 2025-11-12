/**
 * QdStatus Component
 *
 * Displays student quiz progress with color-coded status indicators.
 * Shows attempted questions, correct answers, and completion percentage.
 * Uses ARIA live regions for accessibility.
 *
 * Configuration:
 *   - insertAfterSelector: Specifies id/class to insert after (e.g., "#menu-btn", ".last-button")
 *   - If insertAfterSelector target is not found, component will not be displayed
 *   - Minimum width: 400px
 *
 * States:
 *   - Not logged in: Shows login component with header "Login to view your progress"
 *   - Logged in: Shows progress panel with R/A/G indicators
 *
 * Usage:
 *   <qd-status
 *     state="incomplete"
 *     attempted="5"
 *     correct="3"
 *     total="10"
 *     isLoggedIn="true"
 *     insertAfterSelector="#last-menu-button">
 *   </qd-status>
 *
 * Color Coding:
 *   - Red: Unstarted (no questions answered)
 *   - Amber: Incomplete (some answered OR any incorrect)
 *   - Green: Complete (all answered AND all correct)
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { CompletionState, SessionCache, SessionData } from '../types/contracts';
import './qd-login';

@customElement('qd-status')
export class QdStatus extends LitElement {
  /**
   * Completion state (unstarted | incomplete | complete)
   */
  @property({ type: String })
  state: CompletionState = 'unstarted';

  /**
   * Number of questions attempted
   */
  @property({ type: Number })
  attempted = 0;

  /**
   * Number of correct answers
   */
  @property({ type: Number })
  correct = 0;

  /**
   * Total number of questions
   */
  @property({ type: Number })
  total = 0;

  /**
   * Optional session cache for aggregated totals
   */
  @property({ type: Object })
  sessionCache?: SessionCache;

  /**
   * Whether the user is logged in
   */
  @property({ type: Boolean })
  isLoggedIn = false;

  /**
   * CSS selector (id/class) to insert component after
   * If not found, component will not be displayed
   */
  @property({ type: String })
  insertAfterSelector = '';

  /**
   * Release identifier for login component
   */
  @property({ type: String })
  release = '';

  /**
   * Document identifier for login component
   */
  @property({ type: String })
  docId = '';

  static styles = css`
    :host {
      display: block;
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    :host([hidden]) {
      display: none;
    }

    .status-panel {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 0.5rem 0.75rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      font-size: 0.75rem;
    }

    .login-container {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .login-header {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 1rem 0;
      text-align: center;
    }

    .status-indicator {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      flex-shrink: 0;
      transition: background-color 0.3s;
    }

    .status-indicator.unstarted {
      background-color: #d32f2f;
      box-shadow: 0 0 4px rgba(211, 47, 47, 0.4);
    }

    .status-indicator.incomplete {
      background-color: #ff9800;
      box-shadow: 0 0 4px rgba(255, 152, 0, 0.4);
    }

    .status-indicator.complete {
      background-color: #4caf50;
      box-shadow: 0 0 4px rgba(76, 175, 80, 0.4);
    }

    .status-stats {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.125rem;
      white-space: nowrap;
    }

    .stat-label {
      font-size: 0.5rem;
      font-weight: 400;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .stat-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #333;
    }

    .stat-value.percentage {
      color: #0066cc;
    }

    .logout-button {
      padding: 0.25rem 0.5rem;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 3px;
      font-size: 0.625rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      white-space: nowrap;
      margin-left: auto;
    }

    .logout-button:hover {
      background: #5a6268;
    }

    .logout-button:active {
      background: #4e555b;
    }

    @media (max-width: 480px) {
      .status-panel {
        font-size: 0.625rem;
      }

      .status-stats {
        gap: 0.5rem;
      }

      .stat-value {
        font-size: 0.75rem;
      }

      .logout-button {
        font-size: 0.5625rem;
        padding: 0.2rem 0.4rem;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._checkInsertionTarget();
  }

  render() {
    if (!this.isLoggedIn) {
      return this._renderLoginView();
    }
    return this._renderStatusView();
  }

  private _renderLoginView() {
    return html`
      <div class="login-container" role="region" aria-label="Login to view progress">
        <h2 class="login-header">Login to view your progress</h2>
        <qd-login
          release="${this.release}"
          docId="${this.docId}"
          @qd:login=${(event: CustomEvent<SessionData>) => this._handleLogin(event)}
        >
        </qd-login>
      </div>
    `;
  }

  private _renderStatusView() {
    const percentage = this.calculatePercentage();

    return html`
      <div class="status-panel" role="region" aria-label="Quiz Progress">
        <div class="status-indicator ${this.state}"></div>

        <div class="status-stats">
          <div class="stat">
            <span class="stat-label">attempted</span>
            <span class="stat-value">${this.attempted}/${this.total}</span>
          </div>
          <div class="stat">
            <span class="stat-label">correct</span>
            <span class="stat-value">${this.correct}/${this.total}</span>
          </div>
          <div class="stat">
            <span class="stat-label">score</span>
            <span class="stat-value percentage">${percentage}%</span>
          </div>
        </div>

        <button
          class="logout-button"
          @click=${() => this._handleLogout()}
          aria-label="Logout"
          title="Logout"
        >
          Logout
        </button>
      </div>
    `;
  }

  private _handleLogin(event: CustomEvent<SessionData>) {
    // Set logged in state
    this.isLoggedIn = true;

    // Forward the login event
    this.dispatchEvent(
      new CustomEvent<SessionData>('qd:login', {
        detail: event.detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleLogout() {
    // Clear session storage
    sessionStorage.removeItem('qd/session');
    sessionStorage.removeItem('qd/state');

    // Set logged out state
    this.isLoggedIn = false;

    // Emit logout event
    this.dispatchEvent(
      new CustomEvent('qd:logout', {
        detail: {
          timestamp: new Date().toISOString(),
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _checkInsertionTarget() {
    // If insertAfterSelector is specified, check if target exists
    if (this.insertAfterSelector) {
      const targetElement = document.querySelector(this.insertAfterSelector);
      if (!targetElement) {
        // Hide component if target not found
        this.style.display = 'none';
      } else {
        // Ensure component is visible
        this.style.display = 'block';
      }
    }
  }

  /**
   * Calculate completion percentage
   */
  private calculatePercentage(): number {
    if (this.total === 0) {
      return 0;
    }
    return Math.round((this.correct / this.total) * 100);
  }

  /**
   * Update from session cache
   */
  updateFromCache(cache: SessionCache): void {
    this.attempted = cache.totals.answered;
    this.correct = cache.totals.correct;

    // Calculate total from all pages
    const pageStates = Object.values(cache.pages);
    this.total = pageStates.reduce((sum, page) => sum + page.answered, 0);

    // Determine overall state
    if (this.attempted === 0) {
      this.state = 'unstarted';
    } else if (this.correct === this.total && this.attempted === this.total) {
      this.state = 'complete';
    } else {
      this.state = 'incomplete';
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-status': QdStatus;
  }
}
