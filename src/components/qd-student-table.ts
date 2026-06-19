/**
 * Student Table Component
 *
 * Reusable, searchable table of students that emits a per-row action event.
 * Shadow-DOM-isolated (styles in `static styles`, auto-escaped bindings).
 * Extracted from `qd-pin-reset-dialog` for reuse.
 *
 * @element qd-student-table
 * @fires {CustomEvent<StudentRecord>} select - Emitted when a row's action button is clicked
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { StudentRecord } from '../types/contracts.js';

/**
 * Searchable student list with a per-row action button.
 */
@customElement('qd-student-table')
export class QdStudentTable extends LitElement {
  /** Students to display. */
  @property({ type: Array })
  students: StudentRecord[] = [];

  /** Label for the per-row action button. */
  @property({ type: String })
  actionLabel = 'Select';

  @state()
  private searchText = '';

  static override styles = css`
    :host {
      display: block;
    }

    .search-input {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 12px;
    }

    .search-input:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .student-table-container {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .student-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .student-table th {
      text-align: left;
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 500;
      position: sticky;
      top: 0;
    }

    .student-table td {
      padding: 6px 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .student-table tbody tr:nth-child(even) {
      background: #f8f8f8;
    }

    .student-table tbody tr:hover {
      background: #f0f0f0;
    }

    .student-table tr:last-child td {
      border-bottom: none;
    }

    .action-btn {
      background: #ff5722;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 10px;
      cursor: pointer;
    }

    .action-btn:hover {
      background: #e64a19;
    }

    .empty-message {
      padding: 16px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  `;

  private get filteredStudents(): StudentRecord[] {
    const search = this.searchText.toLowerCase().trim();
    if (!search) {
      return this.students;
    }
    return this.students.filter(
      (s) => s.name.toLowerCase().includes(search) || s.serviceId.toLowerCase().includes(search),
    );
  }

  private handleSearchInput = (e: Event): void => {
    this.searchText = (e.target as HTMLInputElement).value;
  };

  private emitSelect(student: StudentRecord): void {
    this.dispatchEvent(
      new CustomEvent('select', { detail: student, bubbles: true, composed: true }),
    );
  }

  override render() {
    const filtered = this.filteredStudents;
    return html`
      <input
        type="text"
        class="search-input"
        placeholder="Search by name or ID..."
        .value=${this.searchText}
        @input=${this.handleSearchInput}
      />
      <div class="student-table-container">
        ${filtered.length === 0
          ? html`<div class="empty-message">
              ${this.searchText ? 'No matching students' : 'No students found'}
            </div>`
          : html`<table class="student-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Service ID</th>
                  <th>${this.actionLabel}</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(
                  (s) =>
                    html`<tr>
                      <td>${s.name}</td>
                      <td>${s.serviceId}</td>
                      <td>
                        <button class="action-btn" type="button" @click=${() => this.emitSelect(s)}>
                          ${this.actionLabel}
                        </button>
                      </td>
                    </tr>`,
                )}
              </tbody>
            </table>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-student-table': QdStudentTable;
  }
}
