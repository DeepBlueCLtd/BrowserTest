/**
 * PIN Reset Dialog Component
 *
 * Modal dialog for instructors to reset student PINs.
 * Shows student list with search and reset confirmation.
 *
 * @element qd-pin-reset-dialog
 * @fires {CustomEvent<{serviceId: string}>} qd:pin-reset - Emitted when PIN is reset
 * @fires {CustomEvent} close - Emitted when dialog is closed
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
  @property({ type: Boolean })
  showModal = false;

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
      display: block;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .header h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      line-height: 1;
    }

    .close-btn:hover {
      color: #333;
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

    .student-list {
      flex: 1;
      overflow-y: auto;
      max-height: 300px;
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

  private handleClose = () => {
    this.confirmingStudent = null;
    this.confirmDialogOpen = false;
    this.searchText = '';
    this.errorMessage = '';
    this.dispatchEvent(new CustomEvent('close'));
  };

  private handleModalClose = () => {
    // Only close main modal if confirm dialog is not open
    if (!this.confirmDialogOpen) {
      this.handleClose();
    }
  };

  private handleSearchInput = (e: Event) => {
    this.searchText = (e.target as HTMLInputElement).value;
  };

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
   * Show confirmation dialog for PIN reset
   */
  private showConfirmation(student: StudentRecord) {
    this.confirmingStudent = student;
    this.confirmDialogOpen = true;
  }

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

      // Update local data - trigger Lit reactivity
      const index = this.students.findIndex((s) => s.serviceId === student.serviceId);
      if (index >= 0) {
        this.students[index] = updatedStudent;
        this.students = [...this.students];
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

      // Close confirm dialog, clear error
      this.confirmDialogOpen = false;
      this.confirmingStudent = null;
      this.errorMessage = '';
    } catch (err) {
      console.error('PIN reset error:', err);
      this.errorMessage = 'Failed to reset PIN. Please try again.';
      // Close the confirm dialog even on error
      this.confirmDialogOpen = false;
      this.confirmingStudent = null;
    }
  }

  private renderStudentItem(student: StudentRecord) {
    const hasPinHash = student.pinHash && student.pinHash.length > 0;
    return html`
      <div class="student-item">
        <div>
          <div class="student-name">${student.name}</div>
          <div class="student-id">ID: ${student.serviceId}</div>
          <div class="pin-status ${hasPinHash ? 'has-pin' : 'no-pin'}">
            ${hasPinHash ? 'PIN set' : 'No PIN'}
          </div>
        </div>
        <button type="button" class="reset-btn" @click=${() => this.showConfirmation(student)}>
          Reset PIN
        </button>
      </div>
    `;
  }

  private renderStudentList() {
    const filtered = this.filteredStudents;

    if (filtered.length === 0) {
      return html`
        <div class="empty-message">
          ${this.searchText ? 'No matching students' : 'No students found'}
        </div>
      `;
    }

    return filtered.map((student) => this.renderStudentItem(student));
  }

  render() {
    const student = this.confirmingStudent;
    const confirmMessage = student
      ? `Reset PIN for <strong>${student.name}</strong> (${student.serviceId})?<br><span style="font-size: 11px; color: #666;">They will need to create a new PIN on next login.</span>`
      : '';

    return html`
      <qd-modal .open=${this.showModal} @qd:modal-close=${this.handleModalClose}>
        <div class="header">
          <h3>Reset Student PIN</h3>
          <button type="button" class="close-btn" @click=${this.handleClose}>×</button>
        </div>

        <input
          type="text"
          class="search-input"
          placeholder="Search by name or ID..."
          .value=${this.searchText}
          @input=${this.handleSearchInput}
        />

        <div class="student-list">${this.renderStudentList()}</div>

        ${this.errorMessage ? html`<div class="error-message">${this.errorMessage}</div>` : nothing}
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
