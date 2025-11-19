/**
 * Instructor scores view component
 * Displays student scores with expandable per-page breakdown
 */

import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
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
      const summary = this.calculateSummary(student);
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
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor-scores': QdInstructorScores;
  }
}
