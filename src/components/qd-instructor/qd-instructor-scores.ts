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
        // Expand all students by default
        this.expandedStudents.clear();
        this.students.forEach((student) => {
          this.expandedStudents.add(student.serviceId);
        });
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
    overlay.onclick = (e) => {
      if (e.target === overlay) this.handleClose();
    };

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
   * Toggle student expansion
   */
  private toggleStudent(serviceId: string): void {
    if (this.expandedStudents.has(serviceId)) {
      this.expandedStudents.delete(serviceId);
    } else {
      this.expandedStudents.add(serviceId);
    }
    // Re-render modal with updated expansion state
    if (this.showModal) {
      this.renderModalToBody();
    }
  }

  /**
   * Create scores table element with expandable rows
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
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">PIN</th>
      </tr>
    `;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    sortedStudents.forEach((student) => {
      const summary = this.calculateSummary(student);
      const isExpanded = this.expandedStudents.has(student.serviceId);

      // Main student row
      const tr = document.createElement('tr');
      tr.style.cssText = 'cursor: pointer; color: #333;';

      // Name cell (clickable for expand)
      const nameCell = document.createElement('td');
      nameCell.style.cssText = 'padding: 8px; text-align: left; border-bottom: 1px solid #ddd;';
      nameCell.innerHTML = `<span style="display: inline-block; width: 16px; margin-right: 4px;">${isExpanded ? '▼' : '▶'}</span>${summary.name}`;
      nameCell.onclick = () => this.toggleStudent(student.serviceId);
      tr.appendChild(nameCell);

      // Other data cells (clickable for expand)
      const serviceIdCell = document.createElement('td');
      serviceIdCell.style.cssText =
        'padding: 8px; text-align: left; border-bottom: 1px solid #ddd;';
      serviceIdCell.textContent = summary.serviceId;
      serviceIdCell.onclick = () => this.toggleStudent(student.serviceId);
      tr.appendChild(serviceIdCell);

      const attemptedCell = document.createElement('td');
      attemptedCell.style.cssText =
        'padding: 8px; text-align: left; border-bottom: 1px solid #ddd;';
      attemptedCell.textContent = String(summary.attempted);
      attemptedCell.onclick = () => this.toggleStudent(student.serviceId);
      tr.appendChild(attemptedCell);

      const correctCell = document.createElement('td');
      correctCell.style.cssText = `padding: 8px; text-align: left; border-bottom: 1px solid #ddd; ${summary.correct === summary.attempted ? 'color: #28a745;' : ''}`;
      correctCell.textContent = String(summary.correct);
      correctCell.onclick = () => this.toggleStudent(student.serviceId);
      tr.appendChild(correctCell);

      const percentCell = document.createElement('td');
      percentCell.style.cssText = `padding: 8px; text-align: left; border-bottom: 1px solid #ddd; ${summary.percentage === 100 ? 'color: #28a745;' : summary.percentage === 0 ? 'color: #dc3545;' : ''}`;
      percentCell.textContent = `${summary.percentage}%`;
      percentCell.onclick = () => this.toggleStudent(student.serviceId);
      tr.appendChild(percentCell);

      // Reset PIN button cell
      const resetCell = document.createElement('td');
      resetCell.style.cssText = 'padding: 8px; text-align: left; border-bottom: 1px solid #ddd;';
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.textContent = 'Reset';
      resetBtn.style.cssText = `
        background: #6c757d;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 11px;
        cursor: pointer;
      `;
      resetBtn.onclick = (e) => {
        e.stopPropagation();
        this.dispatchEvent(
          new CustomEvent('reset-pin', {
            detail: { serviceId: student.serviceId, release: student.release },
            bubbles: true,
            composed: true,
          }),
        );
      };
      resetCell.appendChild(resetBtn);
      tr.appendChild(resetCell);

      tbody.appendChild(tr);

      // Expanded details row
      if (isExpanded) {
        const detailRow = this.createExpandedRow(student);
        tbody.appendChild(detailRow);
      }
    });
    table.appendChild(tbody);

    return table;
  }

  /**
   * Create expanded detail row for a student showing per-page answers
   * Compact layout: page name on left, answers horizontally on right
   */
  private createExpandedRow(student: StudentRecord): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.style.backgroundColor = '#f9f9f9';

    const td = document.createElement('td');
    td.colSpan = 6;
    td.style.cssText = 'padding: 8px 8px 8px 40px; border-bottom: 1px solid #ddd;';

    const pages = Object.entries(student.pages);
    if (pages.length === 0) {
      td.innerHTML = '<em style="color: #666;">No quiz pages attempted</em>';
    } else {
      const detailDiv = document.createElement('div');
      detailDiv.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

      pages.forEach(([pageId, pageData]) => {
        const pageRow = document.createElement('div');
        pageRow.style.cssText = 'display: flex; align-items: center; gap: 12px;';

        // Page name
        const pageName = document.createElement('span');
        pageName.style.cssText = 'font-weight: 600; color: #000; min-width: 120px; flex-shrink: 0;';
        pageName.textContent = pageId;
        pageRow.appendChild(pageName);

        // Answers (horizontal)
        const answersList = document.createElement('div');
        answersList.style.cssText = 'display: flex; flex-wrap: wrap; gap: 4px; flex: 1;';

        pageData.answers.forEach((answer, index) => {
          const answerBadge = document.createElement('span');
          answerBadge.style.cssText = `
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            ${
              answer === null
                ? 'background: #e0e0e0; color: #666;'
                : answer.success
                  ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;'
                  : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
            }
          `;
          answerBadge.textContent = `Q${index + 1}: ${answer ? answer.answer : '—'}`;
          answersList.appendChild(answerBadge);
        });

        pageRow.appendChild(answersList);
        detailDiv.appendChild(pageRow);
      });

      td.appendChild(detailDiv);
    }

    tr.appendChild(td);
    return tr;
  }

  override render() {
    // Modal is rendered to document.body in renderModalToBody()
    // No shadow DOM content needed
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor-scores': QdInstructorScores;
  }
}
