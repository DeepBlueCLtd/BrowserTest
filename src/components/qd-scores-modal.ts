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

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { StudentRecord } from '../types/contracts.js';
import './qd-modal.js';

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

  /**
   * Set of expanded student service IDs
   */
  @state()
  private expandedStudents = new Set<string>();

  static styles = css`
    :host {
      display: contents;
    }

    .scores-content {
      min-width: 600px;
      max-width: 800px;
    }

    .empty-message {
      color: #666;
      padding: 20px;
      text-align: center;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead th {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
      background: #f5f5f5;
      font-weight: 600;
    }

    .student-row {
      cursor: pointer;
    }

    .student-row:hover {
      background: #f9f9f9;
    }

    .student-row td {
      padding: 8px;
      border-bottom: 1px solid #eee;
    }

    .expand-icon {
      display: inline-block;
      width: 16px;
      margin-right: 4px;
      text-align: center;
    }

    .correct-highlight {
      color: #28a745;
    }

    .incorrect-highlight {
      color: #dc3545;
    }

    .detail-row {
      background: #f9f9f9;
    }

    .detail-row td {
      padding: 8px 8px 8px 40px;
      border-bottom: 1px solid #eee;
    }

    .page-breakdown {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .page-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .page-name {
      font-weight: 600;
      min-width: 120px;
      flex-shrink: 0;
    }

    .answers-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      flex: 1;
    }

    .answer-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 500;
    }

    .answer-badge.correct {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .answer-badge.incorrect {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .answer-badge.unanswered {
      background: #e0e0e0;
      color: #666;
    }

    .no-pages {
      color: #666;
      font-style: italic;
    }
  `;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('open') && this.open) {
      // Expand all students by default when modal opens
      this.expandedStudents = new Set(this.students.map((s) => s.serviceId));
    }
  }

  render() {
    return html`
      <qd-modal
        .open=${this.open}
        @qd:modal-close=${this.handleModalClose}
      >
        <span slot="header">Student Scores</span>
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
            <th>Attempted</th>
            <th>Correct</th>
            <th>Percentage</th>
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
    const isExpanded = this.expandedStudents.has(student.serviceId);

    return html`
      <tr class="student-row" @click=${() => this.toggleStudent(student.serviceId)}>
        <td>
          <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
          ${summary.name}
        </td>
        <td>${summary.serviceId}</td>
        <td>${summary.attempted}</td>
        <td class=${summary.correct === summary.attempted && summary.attempted > 0 ? 'correct-highlight' : ''}>
          ${summary.correct}
        </td>
        <td class=${this.getPercentageClass(summary.percentage)}>
          ${summary.percentage}%
        </td>
      </tr>
      ${isExpanded ? this.renderDetailRow(student) : nothing}
    `;
  }

  private renderDetailRow(student: StudentRecord) {
    const pages = Object.entries(student.pages);

    return html`
      <tr class="detail-row">
        <td colspan="5">
          ${pages.length === 0
            ? html`<span class="no-pages">No quiz pages attempted</span>`
            : html`
                <div class="page-breakdown">
                  ${pages.map(([pageId, pageData]) => html`
                    <div class="page-row">
                      <span class="page-name">${pageId}</span>
                      <div class="answers-list">
                        ${pageData.answers.map((answer, index) => html`
                          <span class="answer-badge ${this.getAnswerClass(answer)}">
                            Q${index + 1}: ${answer ? answer.answer : '—'}
                          </span>
                        `)}
                      </div>
                    </div>
                  `)}
                </div>
              `}
        </td>
      </tr>
    `;
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

  private getPercentageClass(percentage: number): string {
    if (percentage === 100) return 'correct-highlight';
    if (percentage === 0) return 'incorrect-highlight';
    return '';
  }

  private getAnswerClass(answer: { success: boolean } | null): string {
    if (!answer) return 'unanswered';
    return answer.success ? 'correct' : 'incorrect';
  }

  private toggleStudent(serviceId: string) {
    const newSet = new Set(this.expandedStudents);
    if (newSet.has(serviceId)) {
      newSet.delete(serviceId);
    } else {
      newSet.add(serviceId);
    }
    this.expandedStudents = newSet;
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
