/**
 * Instructor scores view component
 * Displays student scores with expandable per-page breakdown
 */

import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles.js';
import type { StudentRecord } from '../../types/contracts.js';

interface StudentSummary {
  serviceId: string;
  name: string;
  attempted: number;
  correct: number;
  percentage: number;
}

/**
 * Scores table component showing all student progress
 *
 * Features:
 * - Summary view with attempted/correct/percentage
 * - Expandable per-student breakdown
 * - Color-coded correct/incorrect answers
 * - Modal display with close button
 */
@customElement('qd-instructor-scores')
export class QdInstructorScores extends LitElement {
  static override styles = sharedStyles;

  @property({ type: Array })
  students: StudentRecord[] = [];

  @property({ type: Boolean })
  showModal = false;

  @state()
  private expandedStudents = new Set<string>();

  private handleClose = (): void => {
    this.dispatchEvent(new CustomEvent('close'));
  };

  private toggleStudent = (serviceId: string): void => {
    if (this.expandedStudents.has(serviceId)) {
      this.expandedStudents.delete(serviceId);
    } else {
      this.expandedStudents.add(serviceId);
    }
    this.requestUpdate();
  };

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

  private renderStudentRow(student: StudentRecord): unknown {
    const summary = this.calculateSummary(student);
    const isExpanded = this.expandedStudents.has(student.serviceId);

    return html`
      <tr>
        <td>
          <button
            @click=${() => this.toggleStudent(student.serviceId)}
            style="border: none; background: none; cursor: pointer; padding: 0;"
          >
            ${isExpanded ? '▼' : '▶'}
          </button>
          ${summary.name}
        </td>
        <td>${summary.serviceId}</td>
        <td>${summary.attempted}</td>
        <td class=${summary.correct === summary.attempted ? 'correct' : ''}>${summary.correct}</td>
        <td>
          <span
            class=${summary.percentage === 100
              ? 'correct'
              : summary.percentage === 0
                ? 'incorrect'
                : ''}
          >
            ${summary.percentage}%
          </span>
        </td>
      </tr>
      ${isExpanded ? this.renderExpandedDetails(student) : ''}
    `;
  }

  private renderExpandedDetails(student: StudentRecord): unknown {
    const pages = Object.entries(student.pages);
    if (pages.length === 0) {
      return html`
        <tr>
          <td colspan="5" style="padding-left: 40px; color: #666;">No quiz pages attempted</td>
        </tr>
      `;
    }

    return html`
      <tr>
        <td colspan="5" style="padding: 0;">
          <table style="margin: 0; width: 100%;">
            <thead>
              <tr>
                <th style="padding-left: 40px;">Page</th>
                <th>Attempted</th>
                <th>Correct</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${pages.map(([pageId, pageData]) => {
                const answers = pageData.answers || [];
                const attempted = answers.filter((a) => a !== null).length;
                const correct = answers.filter((a) => a?.success === true).length;
                const percentage = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

                return html`
                  <tr>
                    <td style="padding-left: 40px;">${pageId}</td>
                    <td>${attempted}</td>
                    <td class=${correct === attempted ? 'correct' : ''}>${correct}</td>
                    <td>
                      <span
                        class=${percentage === 100
                          ? 'correct'
                          : percentage === 0
                            ? 'incorrect'
                            : ''}
                      >
                        ${percentage}%
                      </span>
                    </td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </td>
      </tr>
    `;
  }

  override render() {
    if (!this.showModal) {
      return html``;
    }

    const sortedStudents = [...this.students].sort((a, b) => a.name.localeCompare(b.name));

    return html`
      <div class="modal-overlay" @click=${this.handleClose}>
        <div class="modal-content" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-header">
            <h2 class="modal-title">Student Scores</h2>
            <button class="close-button" @click=${this.handleClose}>✕</button>
          </div>

          ${sortedStudents.length === 0
            ? html`<p>No student data available.</p>`
            : html`
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
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
              `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor-scores': QdInstructorScores;
  }
}
