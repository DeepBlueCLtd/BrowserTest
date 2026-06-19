/**
 * Student Answers Component
 *
 * Reusable, Shadow-DOM-isolated display of student quiz answers for the
 * instructor overlay. Bindings are auto-escaped (no `innerHTML`), and all
 * styles live in `static styles` (no global CSS).
 *
 * @element qd-student-answers
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { StudentAnswerDisplay } from '../services/answer-display.js';

/**
 * Renders the list of student answers for a single question.
 */
@customElement('qd-student-answers')
export class QdStudentAnswers extends LitElement {
  /** Formatted student answers to display. */
  @property({ attribute: false })
  answers: StudentAnswerDisplay[] = [];

  static override styles = css`
    :host {
      display: block;
      margin-top: 12px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #dee2e6;
    }

    .qd-student-answer {
      font-size: 12px;
      padding: 4px 0;
      line-height: 1.4;
    }

    .qd-student-answer.qd-correct {
      color: #28a745;
    }

    .qd-student-answer.qd-incorrect {
      color: #dc3545;
    }

    .qd-student-name {
      font-weight: 600;
    }

    .qd-student-answer-text {
      margin: 0 4px;
    }

    .qd-timestamp {
      color: #6c757d;
      font-size: 11px;
      margin-left: 8px;
    }
  `;

  override render() {
    return this.answers.map(
      (sa) =>
        html`<div class="qd-student-answer ${sa.cssClass}">
          <span class="qd-student-name">${sa.name} (${sa.maskedServiceId})</span>:
          <span class="qd-student-answer-text">${sa.answer}</span>
          <span class="qd-timestamp">${sa.formattedTimestamp}</span>
        </div>`,
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-student-answers': QdStudentAnswers;
  }
}
