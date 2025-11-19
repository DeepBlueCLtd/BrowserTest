/**
 * Student Answer Item Component
 *
 * Displays a single student's answer with formatting for correctness,
 * student identification, and timestamp.
 *
 * @element qd-student-answer-item
 *
 * @example
 * ```html
 * <qd-student-answer-item
 *   .name=${"John Smith"}
 *   .serviceId=${"RN2344"}
 *   .answer=${"A"}
 *   .success=${true}
 *   .timestamp=${"2025-01-15T10:30:00Z"}
 * ></qd-student-answer-item>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Student answer item component
 */
@customElement('qd-student-answer-item')
export class QdStudentAnswerItem extends LitElement {
  /**
   * Student name
   */
  @property({ type: String })
  name = '';

  /**
   * Student service ID (full)
   */
  @property({ type: String })
  serviceId = '';

  /**
   * Student's answer text
   */
  @property({ type: String })
  answer = '';

  /**
   * Whether the answer is correct
   */
  @property({ type: Boolean })
  success = false;

  /**
   * ISO 8601 timestamp of when answer was submitted
   */
  @property({ type: String })
  timestamp = '';

  static styles = css`
    :host {
      display: block;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
    }

    .answer-item {
      padding: 4px 8px;
      margin: 2px 0;
      border-radius: 3px;
      font-size: 11px;
      line-height: 1.4;
    }

    .answer-item.correct {
      background-color: #e8f5e9;
      border-left: 3px solid #4caf50;
    }

    .answer-item.incorrect {
      background-color: #ffebee;
      border-left: 3px solid #f44336;
    }

    .student-name {
      font-weight: 600;
      color: #333;
    }

    .answer-text {
      color: #555;
      margin: 0 4px;
    }

    .timestamp {
      color: #999;
      font-size: 10px;
      margin-left: 4px;
    }
  `;

  /**
   * Format timestamp for display
   */
  private formatTimestamp(): string {
    if (!this.timestamp) return '';

    try {
      const date = new Date(this.timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  /**
   * Get last 4 digits of service ID
   */
  private getLast4(): string {
    return this.serviceId.slice(-4);
  }

  render() {
    const statusClass = this.success ? 'correct' : 'incorrect';
    const last4 = this.getLast4();
    const formattedTime = this.formatTimestamp();

    return html`
      <div class="answer-item ${statusClass}">
        <span class="student-name">${this.name} (${last4})</span>:
        <span class="answer-text">${this.answer}</span>
        <span class="timestamp">${formattedTime}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-student-answer-item': QdStudentAnswerItem;
  }
}
