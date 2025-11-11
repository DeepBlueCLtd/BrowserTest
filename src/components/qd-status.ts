/**
 * QdStatus Component
 *
 * Displays student quiz progress with color-coded status indicators.
 * Shows attempted questions, correct answers, and completion percentage.
 * Uses ARIA live regions for accessibility.
 *
 * Usage:
 *   <qd-status state="incomplete" attempted="5" correct="3" total="10"></qd-status>
 *
 * Color Coding:
 *   - Red: Unstarted (no questions answered)
 *   - Amber: Incomplete (some answered OR any incorrect)
 *   - Green: Complete (all answered AND all correct)
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { CompletionState, SessionCache } from '../types/contracts';

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

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        'Helvetica Neue', Arial, sans-serif;
    }

    .status-panel {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .status-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
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
      box-shadow: 0 0 8px rgba(211, 47, 47, 0.5);
    }

    .status-indicator.incomplete {
      background-color: #ff9800;
      box-shadow: 0 0 8px rgba(255, 152, 0, 0.5);
    }

    .status-indicator.complete {
      background-color: #4caf50;
      box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
    }

    .status-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .status-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
    }

    .stat-value.percentage {
      color: #0066cc;
    }

    .progress-bar-container {
      background: #f0f0f0;
      border-radius: 8px;
      height: 12px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-bar {
      height: 100%;
      transition: width 0.3s ease, background-color 0.3s;
      border-radius: 8px;
    }

    .progress-bar.unstarted {
      width: 0%;
      background-color: #d32f2f;
    }

    .progress-bar.incomplete {
      background: linear-gradient(90deg, #ff9800 0%, #ffc107 100%);
    }

    .progress-bar.complete {
      background: linear-gradient(90deg, #4caf50 0%, #66bb6a 100%);
    }

    .status-message {
      font-size: 0.875rem;
      color: #666;
      text-align: center;
      font-style: italic;
    }

    .status-message.unstarted {
      color: #d32f2f;
    }

    .status-message.incomplete {
      color: #ff9800;
    }

    .status-message.complete {
      color: #4caf50;
      font-weight: 600;
    }

    @media (max-width: 480px) {
      .status-panel {
        padding: 1rem;
      }

      .status-stats {
        grid-template-columns: 1fr;
      }

      .stat-value {
        font-size: 1.25rem;
      }
    }
  `;

  render() {
    const percentage = this.calculatePercentage();
    const statusMessage = this.getStatusMessage();

    return html`
      <div class="status-panel" role="region" aria-label="Quiz Progress">
        <div class="status-header">
          <div class="status-indicator ${this.state}"></div>
          <h2 class="status-title">Your Progress</h2>
        </div>

        <div class="status-stats">
          <div class="stat">
            <span class="stat-label">Attempted</span>
            <span class="stat-value">${this.attempted}/${this.total}</span>
          </div>

          <div class="stat">
            <span class="stat-label">Correct</span>
            <span class="stat-value">${this.correct}/${this.total}</span>
          </div>

          <div class="stat">
            <span class="stat-label">Score</span>
            <span class="stat-value percentage">${percentage}%</span>
          </div>
        </div>

        <div
          class="progress-bar-container"
          role="progressbar"
          aria-valuenow="${percentage}"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Quiz completion progress"
        >
          <div
            class="progress-bar ${this.state}"
            style="width: ${percentage}%"
          ></div>
        </div>

        <div
          class="status-message ${this.state}"
          aria-live="polite"
          aria-atomic="true"
        >
          ${statusMessage}
        </div>
      </div>
    `;
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
   * Get status message based on state
   */
  private getStatusMessage(): string {
    switch (this.state) {
      case 'unstarted':
        return 'Start answering questions to track your progress';

      case 'incomplete':
        if (this.attempted === 0) {
          return 'No questions answered yet';
        } else if (this.attempted < this.total) {
          return `${this.total - this.attempted} question${this.total - this.attempted === 1 ? '' : 's'} remaining`;
        } else {
          return 'Review your incorrect answers';
        }

      case 'complete':
        return '✓ All questions answered correctly!';

      default:
        return '';
    }
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
