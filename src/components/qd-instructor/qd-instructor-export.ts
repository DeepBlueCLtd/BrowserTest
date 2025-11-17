/**
 * Instructor CSV export component
 * Generates and downloads CSV export of all student data
 */

import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles.js';
import type { StudentRecord } from '../../types/contracts.js';

/**
 * CSV export controls for instructor
 *
 * Features:
 * - Generates RFC 4180 compliant CSV
 * - Includes all student answers with timestamps
 * - Downloads as file with timestamp in filename
 * - Proper escaping of special characters
 */
@customElement('qd-instructor-export')
export class QdInstructorExport extends LitElement {
  static override styles = sharedStyles;

  @property({ type: Array })
  students: StudentRecord[] = [];

  private escapeCSVField(field: string | number | boolean): string {
    const str = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private generateCSV(): string {
    const rows: string[] = [];

    // Header row
    rows.push('Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp');

    // Data rows
    for (const student of this.students) {
      for (const [pageId, pageData] of Object.entries(student.pages)) {
        const answers = pageData.answers || [];
        answers.forEach((answer, index) => {
          if (answer) {
            rows.push([
              this.escapeCSVField(student.serviceId),
              this.escapeCSVField(student.name),
              this.escapeCSVField(student.release),
              this.escapeCSVField(pageId),
              this.escapeCSVField(index),
              this.escapeCSVField(answer.answer),
              this.escapeCSVField(answer.success),
              this.escapeCSVField(answer.timestamp),
            ].join(','));
          }
        });
      }
    }

    return rows.join('\n');
  }

  private handleExport = (): void => {
    const csv = this.generateCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement('a');
    link.href = url;

    // Generate filename with timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `quiz-data-${timestamp}.csv`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  };

  override render() {
    const hasData = this.students.length > 0;

    return html`
      <div class="export-container">
        <h4>Export Data</h4>
        <p>
          Download all student answers and scores as CSV.
          ${hasData ? `(${this.students.length} students)` : '(No data)'}
        </p>

        <button
          @click=${this.handleExport}
          ?disabled=${!hasData}
          class="primary"
        >
          📥 Export to CSV
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor-export': QdInstructorExport;
  }
}
