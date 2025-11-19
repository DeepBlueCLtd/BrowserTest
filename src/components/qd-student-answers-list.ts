/**
 * Student Answers List Component
 *
 * Container component that displays a list of student answers for a question.
 * Used by instructors to view all student responses in quiz tables.
 *
 * @element qd-student-answers-list
 *
 * @example
 * ```html
 * <qd-student-answers-list
 *   .answers=${[
 *     { name: "John", serviceId: "RN2344", answer: "A", success: true, timestamp: "2025-01-15T10:30:00Z" },
 *     { name: "Jane", serviceId: "RN2345", answer: "B", success: false, timestamp: "2025-01-15T10:31:00Z" }
 *   ]}
 * ></qd-student-answers-list>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './qd-student-answer-item.js';

/**
 * Student answer data structure
 */
export interface StudentAnswer {
  name: string;
  serviceId: string;
  answer: string;
  success: boolean;
  timestamp: string;
}

/**
 * Student answers list component
 */
@customElement('qd-student-answers-list')
export class QdStudentAnswersList extends LitElement {
  /**
   * Array of student answers to display
   */
  @property({ type: Array })
  answers: StudentAnswer[] = [];

  static styles = css`
    :host {
      display: block;
      margin-top: 8px;
    }

    .answers-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .empty-state {
      color: #999;
      font-size: 11px;
      font-style: italic;
      padding: 4px 8px;
    }
  `;

  render() {
    if (this.answers.length === 0) {
      return html`<div class="empty-state">No student answers yet</div>`;
    }

    return html`
      <div class="answers-container">
        ${this.answers.map(
          (answer) => html`
            <qd-student-answer-item
              .name=${answer.name}
              .serviceId=${answer.serviceId}
              .answer=${answer.answer}
              .success=${answer.success}
              .timestamp=${answer.timestamp}
            ></qd-student-answer-item>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-student-answers-list': QdStudentAnswersList;
  }
}
