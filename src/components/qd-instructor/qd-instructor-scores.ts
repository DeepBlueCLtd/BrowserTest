/**
 * Instructor scores view component
 * Displays student scores with expandable per-page breakdown
 */

import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles.js';
import type { StudentRecord } from '../../types/contracts.js';
import {
  calculateVirtualListState,
  getVisibleItems,
  type VirtualListState,
} from '../../utils/virtual-list.js';

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

  @state()
  private virtualListState: VirtualListState | null = null;

  // Virtual scrolling configuration
  private readonly ITEM_HEIGHT = 40; // Height of each student row in pixels
  private readonly VIEWPORT_HEIGHT = 400; // Max height of scrollable area
  private readonly BUFFER_SIZE = 5; // Items to render above/below viewport

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleEscape);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleEscape);
  }

  private handleEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.showModal) {
      this.handleClose();
    }
  };

  private handleClose = (): void => {
    this.dispatchEvent(new CustomEvent('close'));
  };

  private handleScroll = (e: Event): void => {
    const target = e.target as HTMLElement;
    const scrollTop = target.scrollTop;

    this.virtualListState = calculateVirtualListState(scrollTop, {
      totalItems: this.students.length,
      itemHeight: this.ITEM_HEIGHT,
      viewportHeight: this.VIEWPORT_HEIGHT,
      bufferSize: this.BUFFER_SIZE,
    });
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
    const useVirtualScrolling = sortedStudents.length >= 100;

    // Initialize virtual list state on first render when needed
    if (useVirtualScrolling && !this.virtualListState) {
      this.virtualListState = calculateVirtualListState(0, {
        totalItems: sortedStudents.length,
        itemHeight: this.ITEM_HEIGHT,
        viewportHeight: this.VIEWPORT_HEIGHT,
        bufferSize: this.BUFFER_SIZE,
      });
    }

    // Get visible students for virtual scrolling
    const visibleStudents = useVirtualScrolling && this.virtualListState
      ? getVisibleItems(sortedStudents, this.virtualListState)
      : sortedStudents;

    const totalHeight = useVirtualScrolling && this.virtualListState
      ? this.virtualListState.totalHeight
      : 0;

    const offsetY = useVirtualScrolling && this.virtualListState
      ? this.virtualListState.offsetY
      : 0;

    return html`
      <div class="modal-overlay" @click=${this.handleClose}>
        <div
          class="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="scores-modal-title"
          @click=${(e: Event) => e.stopPropagation()}
        >
          <div class="modal-header">
            <h2 id="scores-modal-title" class="modal-title">Student Scores</h2>
            <button class="close-button" @click=${this.handleClose} aria-label="Close scores modal">
              ✕
            </button>
          </div>

          ${sortedStudents.length === 0
            ? html`<p>No student data available.</p>`
            : html`
                <div
                  class="table-container"
                  style=${useVirtualScrolling
                    ? `max-height: ${this.VIEWPORT_HEIGHT}px; overflow-y: auto;`
                    : ''}
                  @scroll=${useVirtualScrolling ? this.handleScroll : null}
                >
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
                    <tbody
                      style=${useVirtualScrolling
                        ? `height: ${totalHeight}px; position: relative;`
                        : ''}
                    >
                      ${useVirtualScrolling
                        ? html`
                            <tr style="height: 0;">
                              <td colspan="5" style="padding: 0; border: none;">
                                <div style="height: ${offsetY}px;"></div>
                              </td>
                            </tr>
                          `
                        : ''}
                      ${visibleStudents.map((student) => this.renderStudentRow(student))}
                    </tbody>
                  </table>
                </div>
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
