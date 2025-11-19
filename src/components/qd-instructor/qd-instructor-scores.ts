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

  // Modal DOM element reference
  private modalElement: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleEscape);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleEscape);
    this.removeModalFromBody();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('showModal')) {
      if (this.showModal) {
        this.renderModalToBody();
      } else {
        this.removeModalFromBody();
      }
    }
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

  /**
   * Render modal to document.body (outside shadow DOM) like login modal
   */
  private renderModalToBody(): void {
    // Remove any existing modal first
    this.removeModalFromBody();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'qd-scores-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family: system-ui, -apple-system, sans-serif;
      pointer-events: auto;
    `;
    overlay.onclick = () => this.handleClose();

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'qd-scores-modal';
    modal.style.cssText = `
      background: white;
      color: #333;
      border-radius: 8px;
      padding: 24px;
      max-width: 800px;
      max-height: 80vh;
      overflow: auto;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      pointer-events: auto;
      position: relative;
      z-index: 100000;
    `;
    modal.onclick = (e) => e.stopPropagation();

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    `;
    const title = document.createElement('h2');
    title.textContent = 'Student Scores';
    title.style.cssText = `font-size: 18px; font-weight: 600; color: #000; margin: 0;`;
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.type = 'button';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      color: #666;
      cursor: pointer;
      padding: 4px 8px;
      pointer-events: auto;
    `;
    closeBtn.onclick = () => this.handleClose();
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Content
    const content = document.createElement('div');
    const sortedStudents = [...this.students].sort((a, b) => a.name.localeCompare(b.name));

    if (sortedStudents.length === 0) {
      content.innerHTML = '<p style="color: #333;">No student data available.</p>';
    } else {
      const table = this.createScoresTable(sortedStudents);
      content.appendChild(table);
    }

    modal.appendChild(header);
    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    this.modalElement = overlay;
  }

  /**
   * Remove modal from document.body
   */
  private removeModalFromBody(): void {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }

  /**
   * Create scores table element
   */
  private createScoresTable(sortedStudents: StudentRecord[]): HTMLElement {
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    `;

    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Student</th>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Service ID</th>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Attempted</th>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Correct</th>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Percentage</th>
      </tr>
    `;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    sortedStudents.forEach((student) => {
      const summary = this.getStudentSummary(student);
      const tr = document.createElement('tr');
      tr.style.cssText = 'cursor: default; color: #333;';
      tr.innerHTML = `
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${summary.name}</td>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${summary.serviceId}</td>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${summary.attempted}</td>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${summary.correct}</td>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${summary.percentage}%</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table;
  }

  override render() {
    // Modal is rendered to document.body in renderModalToBody()
    // No shadow DOM content needed
    return html``;

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
