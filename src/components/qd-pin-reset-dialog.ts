/**
 * PIN Reset Dialog Component
 *
 * Modal dialog for instructors to reset student PINs.
 * Shows student list with search and reset confirmation.
 * Uses qd-modal base for consistent modal behavior.
 *
 * @element qd-pin-reset-dialog
 * @fires {CustomEvent<{serviceId: string}>} qd:pin-reset - Emitted when PIN is reset
 * @fires {CustomEvent} close - Emitted when dialog is closed
 *
 * Feature: 007-lit-component-refactor
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { StudentRecord, PinResetEvent } from '../types/contracts.js';
import { getStorageAdapter } from '../services/storage/indexeddb.js';
import { resetPin } from '../services/storage/migration.js';
import { CONFIG_IDS } from '../config/dom-config-reader.js';
import './qd-modal.js';
import './qd-confirm-dialog.js';

@customElement('qd-pin-reset-dialog')
export class QdPinResetDialog extends LitElement {
  /**
   * Students available for PIN reset
   */
  @property({ type: Array })
  students: StudentRecord[] = [];

  /**
   * Whether dialog is visible
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Search filter text
   */
  @state()
  private searchText = '';

  /**
   * Student being confirmed for reset
   */
  @state()
  private confirmingStudent: StudentRecord | null = null;

  /**
   * Whether confirmation dialog is open
   */
  @state()
  private confirmDialogOpen = false;

  /**
   * Error message to display
   */
  @state()
  private errorMessage = '';

  static styles = css`
    :host {
      display: contents;
    }

    .pin-reset-content {
      min-width: 400px;
      max-width: 500px;
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

    .student-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .student-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .student-item:last-child {
      border-bottom: none;
    }

    .student-name {
      font-size: 12px;
      font-weight: 500;
    }

    .student-id {
      font-size: 10px;
      color: #666;
    }

    .pin-status {
      font-size: 10px;
    }

    .pin-status.has-pin {
      color: #4caf50;
    }

    .pin-status.no-pin {
      color: #ff9800;
    }

    .reset-btn {
      background: #ff5722;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 10px;
      cursor: pointer;
    }

    .reset-btn:hover {
      background: #e64a19;
    }

    .empty-message {
      padding: 16px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }

    .error-message {
      color: #d32f2f;
      font-size: 11px;
      margin-top: 8px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
    }
  `;

  /**
   * Backward compatibility: Support both 'open' and 'showModal' props
   */
  @property({ type: Boolean })
  set showModal(value: boolean) {
    this.open = value;
  }
  get showModal(): boolean {
    return this.open;
  }

  private get filteredStudents(): StudentRecord[] {
    if (!this.searchText.trim()) {
      return this.students;
    }
    const search = this.searchText.toLowerCase().trim();
    return this.students.filter(
      (s) => s.name.toLowerCase().includes(search) || s.serviceId.toLowerCase().includes(search),
    );
  }

  /**
   * Close the modal
   */
  close(): void {
    this.open = false;
    this.confirmingStudent = null;
    this.confirmDialogOpen = false;
    this.searchText = '';
    this.errorMessage = '';
  }

  /**
   * Show the modal
   */
  show(): void {
    this.open = true;
  }

  /**
   * Handle modal close from qd-modal
   */
  private handleModalClose = (): void => {
    // Don't close main modal if confirm dialog is open
    if (this.confirmDialogOpen) {
      return;
    }
    this.close();
    this.dispatchEvent(new CustomEvent('close'));
  };

  /**
   * Handle search input
   */
  private handleSearchInput = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    this.searchText = input.value;
  };

  /**
   * Show confirmation dialog for PIN reset
   */
  private handleResetClick = (student: StudentRecord): void => {
    this.confirmingStudent = student;
    this.confirmDialogOpen = true;
  };

  /**
   * Handle confirm button click in confirmation dialog
   */
  private handleConfirmReset = (): void => {
    if (this.confirmingStudent) {
      void this.executeReset(this.confirmingStudent);
    }
  };

  /**
   * Handle cancel button click in confirmation dialog
   */
  private handleCancelReset = (): void => {
    this.confirmDialogOpen = false;
    this.confirmingStudent = null;
  };

  private async executeReset(student: StudentRecord) {
    try {
      const dbNameElement = document.getElementById(CONFIG_IDS.dbName);
      if (!dbNameElement?.textContent?.trim()) {
        throw new Error(
          `Database name not configured. Add <span id="${CONFIG_IDS.dbName}">dbName</span> to page.`,
        );
      }
      const dbName = dbNameElement.textContent.trim();
      const storage = getStorageAdapter(dbName);
      await storage.init();

      // Reset the PIN
      const updatedStudent = resetPin(student);
      await storage.saveStudent(updatedStudent);

      // Create audit log entry
      const auditEvent: PinResetEvent = {
        eventId: crypto.randomUUID(),
        serviceId: student.serviceId,
        resetBy: 'instructor',
        resetAt: new Date().toISOString(),
        release: student.release,
      };
      await storage.saveAuditEvent(auditEvent);

      // Update local data
      const index = this.students.findIndex((s) => s.serviceId === student.serviceId);
      if (index >= 0) {
        this.students[index] = updatedStudent;
        this.students = [...this.students]; // Trigger reactivity
      }

      // Emit event
      this.dispatchEvent(
        new CustomEvent('qd:pin-reset', {
          detail: {
            serviceId: student.serviceId,
            resetBy: 'instructor',
            timestamp: new Date().toISOString(),
          },
          bubbles: true,
          composed: true,
        }),
      );

      // Close confirm dialog
      this.confirmDialogOpen = false;
      this.confirmingStudent = null;
      this.errorMessage = '';
    } catch (err) {
      console.error('PIN reset error:', err);
      this.errorMessage = 'Failed to reset PIN. Please try again.';
      this.confirmDialogOpen = false;
      this.confirmingStudent = null;
    }
  }

  override render() {
    // Don't render when closed
    if (!this.open) {
      return nothing;
    }

    const student = this.confirmingStudent;
    const confirmMessage = student
      ? `Reset PIN for <strong>${student.name}</strong> (${student.serviceId})?<br><span style="font-size: 11px; color: #666;">They will need to create a new PIN on next login.</span>`
      : '';

    return html`
      <qd-modal
        .open=${this.open && !this.confirmDialogOpen}
        @qd:modal-close=${this.handleModalClose}
      >
        <span slot="header">Reset Student PIN</span>

        <div class="pin-reset-content">
          <input
            type="text"
            class="search-input"
            placeholder="Search by name or ID..."
            .value=${this.searchText}
            @input=${this.handleSearchInput}
          />

          <div class="student-list">
            ${this.filteredStudents.length === 0
              ? html`<div class="empty-message">
                  ${this.searchText ? 'No matching students' : 'No students found'}
                </div>`
              : this.filteredStudents.map(
                  (s) => html`
                    <div class="student-item">
                      <div>
                        <div class="student-name">${s.name}</div>
                        <div class="student-id">ID: ${s.serviceId}</div>
                        <div class="pin-status ${s.pinHash ? 'has-pin' : 'no-pin'}">
                          ${s.pinHash ? 'PIN set' : 'No PIN'}
                        </div>
                      </div>
                      <button
                        class="reset-btn"
                        type="button"
                        @click=${() => this.handleResetClick(s)}
                      >
                        Reset PIN
                      </button>
                    </div>
                  `,
                )}
          </div>

          ${this.errorMessage ? html`<div class="error-message">${this.errorMessage}</div>` : ''}
        </div>
      </qd-modal>

      <qd-confirm-dialog
        .open=${this.confirmDialogOpen}
        title="Reset PIN"
        .message=${confirmMessage}
        confirmText="Reset PIN"
        cancelText="Cancel"
        destructive
        @qd:confirm=${this.handleConfirmReset}
        @qd:cancel=${this.handleCancelReset}
      ></qd-confirm-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-pin-reset-dialog': QdPinResetDialog;
  }
}
