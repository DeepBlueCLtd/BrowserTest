/**
 * Scores Modal Component
 *
 * Displays student scores in a modal with expandable per-page breakdown.
 * Uses qd-modal as base for modal behavior.
 *
 * @element qd-scores-modal
 * @fires {CustomEvent} close - Emitted when modal closes
 * @fires {CustomEvent} qd:modal-close - Bubbles from qd-modal
 *
 * Feature: 007-lit-component-refactor
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { StudentRecord, AnalysisData } from '../types/contracts.js';
import { countFilledCells } from '../services/state-calculator.js';
import './qd-modal.js';
import { summariseFirstAttempts } from '../services/scores-service.js';
import { readQuestionTotal } from '../config/dom-config-reader.js';

interface StudentSummary {
  serviceId: string;
  name: string;
  attempted: number;
  correct: number;
  percentage: number;
}

/**
 * Modal component for displaying student scores with expandable details
 */
@customElement('qd-scores-modal')
export class QdScoresModal extends LitElement {
  /**
   * Whether the modal is open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Student records to display
   */
  @property({ type: Array })
  students: StudentRecord[] = [];

  // Styles are in light DOM (render method) since content is slotted into qd-modal which moves to body
  static styles = css`
    :host {
      display: contents;
    }
  `;

  render() {
    // Styles must be in light DOM since content is slotted into qd-modal which moves to body
    return html`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">Student Scores</span>
        <style>
          .scores-content {
            min-width: 500px;
            max-width: 800px;
          }
          .scores-content .empty-message {
            color: #666;
            padding: 20px;
            text-align: center;
          }
          .scores-content table {
            width: 100%;
            border-collapse: collapse;
          }
          .scores-content thead th {
            padding: 6px 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            background: #f5f5f5;
            font-weight: 600;
            font-size: 12px;
          }
          .scores-content .student-row td {
            padding: 4px 8px;
            border-bottom: 1px solid #eee;
            vertical-align: middle;
            font-size: 12px;
          }
          .scores-content .student-row:nth-child(even) {
            background: #e8e8e8;
          }
          .scores-content .student-row:hover {
            background: #f0f0f0;
          }
          .scores-content .score-perfect {
            color: #28a745;
            font-weight: 500;
          }
          .scores-content .score-zero {
            color: #dc3545;
          }
          .scores-content .answers-cell {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .scores-content .page-row {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .scores-content .page-name {
            font-weight: 500;
            font-size: 10px;
            color: #555;
            min-width: 80px;
          }
          .scores-content .page-answers {
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
          }
          .scores-content .answer-badge {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 500;
          }
          .scores-content .answer-badge.correct {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          .scores-content .answer-badge.incorrect {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
          .scores-content .analysis-badge {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            background: #e8eaf6;
            color: #283593;
          }

          .scores-content .no-answers {
            color: #999;
            font-style: italic;
            font-size: 11px;
          }
        </style>
        <div class="scores-content">
          ${this.students.length === 0
            ? html`<p class="empty-message">No student data available.</p>`
            : this.renderScoresTable()}
        </div>
      </qd-modal>
    `;
  }

  private renderScoresTable() {
    const sortedStudents = [...this.students].sort((a, b) => a.name.localeCompare(b.name));

    return html`
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Service ID</th>
            <th>Answered</th>
            <th>Correct</th>
            <th>Right first time</th>
            <th>Answers</th>
          </tr>
        </thead>
        <tbody>
          ${sortedStudents.map((student) => this.renderStudentRow(student))}
        </tbody>
      </table>
    `;
  }

  private renderStudentRow(student: StudentRecord) {
    const summary = this.calculateSummary(student);
    const pages = Object.entries(student.pages);

    return html`
      <tr class="student-row">
        <td>${summary.name}</td>
        <td>${summary.serviceId}</td>
        <td>${this.answeredText(summary.attempted)}</td>
        <td class=${this.getScoreClass(summary)}>
          ${summary.attempted > 0 ? `${summary.correct} (${summary.percentage}% of answered)` : '0'}
        </td>
        <td>${this.firstTimeText(student)}</td>
        <td>
          ${pages.length === 0
            ? html`<span class="no-answers">—</span>`
            : html`
                <div class="answers-cell">
                  ${pages.map(
                    ([pageId, pageData]) => html`
                      <div class="page-row">
                        <span class="page-name">${pageId}</span>
                        <div class="page-answers">
                          ${pageData.analysis
                            ? html`<span class="analysis-badge"
                                >${this.analysisSummary(pageData.analysis)}</span
                              >`
                            : ''}
                          ${pageData.answers.map(
                            (answer, idx) => html`
                              <span
                                class="answer-badge ${answer?.success ? 'correct' : 'incorrect'}"
                              >
                                Q${idx + 1}:
                                ${answer?.answer ?? '—'}${answer?.attempts && answer.attempts > 1
                                  ? ` (${answer.attempts} tries)`
                                  : ''}
                              </span>
                            `,
                          )}
                        </div>
                      </div>
                    `,
                  )}
                </div>
              `}
        </td>
      </tr>
    `;
  }

  /**
   * "2 of 6 cells" for a page's analysis table, so analysis work shows in the
   * scores view (SRD 013 ANA-05). Older records lack the cell count.
   */
  private analysisSummary(analysis: AnalysisData): string {
    const filled = countFilledCells(analysis);
    return analysis.totalCells !== undefined
      ? `Analysis: ${filled} of ${analysis.totalCells} cells`
      : `Analysis: ${filled} cell${filled === 1 ? '' : 's'}`;
  }

  /**
   * Questions answered, against the publication total when it is known
   * (SRD 013 SCO-04). Scores used to divide by answered questions only, so
   * one right answer read as 100%.
   */
  private answeredText(answered: number): string {
    const total = readQuestionTotal();
    return total !== undefined ? `${answered} of ${total}` : String(answered);
  }

  /**
   * Right-first-time count. Answers from before attempts were tracked show
   * as unknown rather than guessed (SCO-04, SCO-07).
   */
  private firstTimeText(student: StudentRecord): string {
    const { tracked, correctFirstTime, untracked } = summariseFirstAttempts(student);
    if (tracked === 0) {
      return '–';
    }
    const text = `${correctFirstTime} of ${tracked}`;
    return untracked > 0
      ? `${text} (${untracked} older answer${untracked === 1 ? '' : 's'} –)`
      : text;
  }

  private getScoreClass(summary: StudentSummary): string {
    if (summary.attempted === 0) return '';
    if (summary.percentage === 100) return 'score-perfect';
    if (summary.percentage === 0) return 'score-zero';
    return '';
  }

  private calculateSummary(student: StudentRecord): StudentSummary {
    const percentage =
      student.attempted > 0 ? Math.round((student.correct / student.attempted) * 100) : 0;

    return {
      serviceId: student.serviceId,
      name: student.name,
      attempted: student.attempted,
      correct: student.correct,
      percentage,
    };
  }

  private handleModalClose = () => {
    this.open = false;
    this.dispatchEvent(new CustomEvent('close'));
  };

  /**
   * Open the modal
   */
  show() {
    this.open = true;
  }

  /**
   * Close the modal
   */
  close() {
    this.open = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-scores-modal': QdScoresModal;
  }
}
