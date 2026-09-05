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
import type { StudentRecord } from '../types/contracts.js';
import { resetStudentPin } from '../services/pin-reset-service.js';
import './qd-modal.js';
import './qd-confirm-dialog.js';
import './qd-student-table.js';
import { escapeHtml } from '../utils/dom-helpers.js';

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

  /**
   * Close the modal
   */
  close(): void {
    this.open = false;
    this.confirmingStudent = null;
    this.confirmDialogOpen = false;
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
    const result = await resetStudentPin(student);

    this.confirmDialogOpen = false;
    this.confirmingStudent = null;

    if (!result.ok) {
      this.errorMessage = result.error ?? 'Failed to reset PIN. Please try again.';
      return;
    }

    // Update local data to trigger reactivity
    if (result.updated) {
      const index = this.students.findIndex((s) => s.serviceId === student.serviceId);
      if (index >= 0) {
        this.students[index] = result.updated;
        this.students = [...this.students];
      }
    }

    this.errorMessage = '';
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
  }

  override render() {
    const student = this.confirmingStudent;
    // Student name and service ID come from stored records: escape them before
    // they reach qd-confirm-dialog, which renders the message with unsafeHTML.
    const confirmMessage = student
      ? `Reset PIN for <strong>${escapeHtml(student.name)}</strong> (${escapeHtml(student.serviceId)})?<br><span style="font-size: 11px; color: #666;">They will need to create a new PIN on next login.</span>`
      : '';

    // Always render qd-modal so it can properly restore position when closing
    return html`
      <qd-modal
        .open=${this.open && !this.confirmDialogOpen}
        @qd:modal-close=${this.handleModalClose}
      >
        <span slot="header">Reset Student PIN</span>

        ${this.open
          ? html`
              <div class="pin-reset-content">
                <qd-student-table
                  .students=${this.students}
                  actionLabel="Reset"
                  @select=${(e: CustomEvent<StudentRecord>) => this.handleResetClick(e.detail)}
                ></qd-student-table>

                ${this.errorMessage
                  ? html`<div class="error-message">${this.errorMessage}</div>`
                  : ''}
              </div>
            `
          : nothing}
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
