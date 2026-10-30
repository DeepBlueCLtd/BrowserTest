/**
 * Instructor CSV export component
 * Generates and downloads CSV export of all student data
 */

import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles.js';
import { countFilledCells } from '../../services/state-calculator.js';
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
    let str = String(field);

    // Formula injection: a field beginning with = + - @ or a control character is
    // executed as a formula by Excel/Sheets. Student names and free-text answers are
    // untrusted, so prefix a single quote to force text interpretation.
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }

    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Build the CSV.
   *
   * The first eight columns keep their original order so existing
   * spreadsheets still line up; new columns are appended (SRD 013 ANA-02).
   * Analysis entries get one row each, with the row label (or the cell key
   * when no label was stored) in the Question Index column, an empty Success
   * and the table's last-edited time (SRD 013 ANA-01).
   */
  generateCSV(): string {
    const rows: string[] = [];

    // Header row
    rows.push('Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp,Kind');

    // Data rows
    for (const student of this.students) {
      const who = [student.serviceId, student.name, student.release];
      for (const [pageId, pageData] of Object.entries(student.pages)) {
        const answers = pageData.answers || [];
        answers.forEach((answer, index) => {
          if (answer) {
            rows.push(
              this.csvRow([
                ...who,
                pageId,
                index,
                answer.answer,
                answer.success,
                answer.timestamp,
                'quiz',
              ]),
            );
          }
        });

        const analysis = pageData.analysis;
        if (analysis) {
          for (const [cellKey, text] of Object.entries(analysis.cells)) {
            if (text.trim() === '') continue;
            rows.push(
              this.csvRow([
                ...who,
                pageId,
                analysis.labels?.[cellKey] ?? cellKey,
                text,
                '',
                analysis.lastEdited ?? '',
                'analysis',
              ]),
            );
          }
        }
      }
    }

    return rows.join('\n');
  }

  private csvRow(fields: (string | number | boolean)[]): string {
    return fields.map((field) => this.escapeCSVField(field)).join(',');
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
    // Check if any student has answered at least one question (FR-006)
    // Analysis entries count as data too (SRD 013 ANA-01)
    const hasData =
      this.students.length > 0 &&
      this.students.some(
        (student) =>
          student.attempted > 0 ||
          Object.values(student.pages).some((page) => countFilledCells(page.analysis) > 0),
      );

    const tooltip = hasData
      ? `Export ${this.students.length} student${this.students.length === 1 ? '' : 's'} to CSV`
      : this.students.length > 0
        ? 'No answers to export (students have not answered any questions)'
        : 'No data to export';

    return html`
      <button
        @click=${this.handleExport}
        ?disabled=${!hasData}
        class="primary compact"
        title=${tooltip}
      >
        Export CSV
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor-export': QdInstructorExport;
  }
}
