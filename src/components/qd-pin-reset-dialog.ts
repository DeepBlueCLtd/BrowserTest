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

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { StudentRecord, PinResetEvent } from '../types/contracts.js';
import { getStorageAdapter } from '../services/storage/indexeddb.js';
import { resetPin } from '../services/storage/migration.js';

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

  private modalElement: HTMLElement | null = null;

  static styles = css`
    :host {
      display: block;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleEscape);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleEscape);
    this.removeModalFromBody();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('showModal')) {
      if (this.showModal) {
        this.renderModalToBody();
      } else {
        this.removeModalFromBody();
      }
    }
  }

  private handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.showModal) {
      if (this.confirmingStudent) {
        this.confirmingStudent = null;
      } else {
        this.handleClose();
      }
    }
  };

  private handleClose = () => {
    this.confirmingStudent = null;
    this.searchText = '';
    this.dispatchEvent(new CustomEvent('close'));
  };

  private get filteredStudents(): StudentRecord[] {
    if (!this.searchText.trim()) {
      return this.students;
    }
    const search = this.searchText.toLowerCase().trim();
    return this.students.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.serviceId.toLowerCase().includes(search),
    );
  }

  private renderModalToBody() {
    this.removeModalFromBody();

    const overlay = document.createElement('div');
    overlay.className = 'qd-pin-reset-overlay';
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
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      min-width: 400px;
      max-width: 500px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Reset Student PIN';
    title.style.cssText = `font-size: 18px; font-weight: 600; margin: 0;`;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.type = 'button';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    `;
    closeBtn.onclick = () => this.handleClose();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Search
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search by name or ID...';
    searchInput.style.cssText = `
      width: 100%;
      box-sizing: border-box;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 12px;
    `;
    searchInput.oninput = (e) => {
      this.searchText = (e.target as HTMLInputElement).value;
      this.updateStudentList(modal);
    };

    // Student list container
    const listContainer = document.createElement('div');
    listContainer.className = 'student-list';
    listContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      max-height: 300px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    `;

    modal.appendChild(header);
    modal.appendChild(searchInput);
    modal.appendChild(listContainer);

    // Error message placeholder
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      display: none;
      color: #d32f2f;
      font-size: 11px;
      margin-top: 8px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
    `;
    modal.appendChild(errorDiv);

    overlay.appendChild(modal);
    overlay.onclick = (e) => {
      if (e.target === overlay) this.handleClose();
    };

    document.body.appendChild(overlay);
    this.modalElement = overlay;

    this.updateStudentList(modal);
    searchInput.focus();
  }

  private updateStudentList(modal: HTMLElement) {
    const listContainer = modal.querySelector('.student-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    const filtered = this.filteredStudents;

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = this.searchText ? 'No matching students' : 'No students found';
      empty.style.cssText = `padding: 16px; text-align: center; color: #666; font-size: 12px;`;
      listContainer.appendChild(empty);
      return;
    }

    filtered.forEach((student) => {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid #f0f0f0;
      `;

      const info = document.createElement('div');
      const nameSpan = document.createElement('div');
      nameSpan.textContent = student.name;
      nameSpan.style.cssText = `font-size: 12px; font-weight: 500;`;

      const idSpan = document.createElement('div');
      idSpan.textContent = `ID: ${student.serviceId}`;
      idSpan.style.cssText = `font-size: 10px; color: #666;`;

      const pinStatus = document.createElement('div');
      const hasPinHash = student.pinHash && student.pinHash.length > 0;
      pinStatus.textContent = hasPinHash ? 'PIN set' : 'No PIN';
      pinStatus.style.cssText = `font-size: 10px; color: ${hasPinHash ? '#4caf50' : '#ff9800'};`;

      info.appendChild(nameSpan);
      info.appendChild(idSpan);
      info.appendChild(pinStatus);

      const resetBtn = document.createElement('button');
      resetBtn.textContent = 'Reset PIN';
      resetBtn.type = 'button';
      resetBtn.style.cssText = `
        background: #ff5722;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 10px;
        cursor: pointer;
      `;
      resetBtn.onclick = () => this.showConfirmation(student, modal);

      item.appendChild(info);
      item.appendChild(resetBtn);
      listContainer.appendChild(item);
    });
  }

  private showConfirmation(student: StudentRecord, modal: HTMLElement) {
    this.confirmingStudent = student;

    // Create confirmation overlay
    const confirmOverlay = document.createElement('div');
    confirmOverlay.className = 'confirm-overlay';
    confirmOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    `;

    const confirmText = document.createElement('p');
    confirmText.innerHTML = `Reset PIN for <strong>${student.name}</strong> (${student.serviceId})?`;
    confirmText.style.cssText = `margin: 0 0 16px; text-align: center; font-size: 14px;`;

    const warning = document.createElement('p');
    warning.textContent = 'They will need to create a new PIN on next login.';
    warning.style.cssText = `margin: 0 0 16px; text-align: center; font-size: 11px; color: #666;`;

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `display: flex; gap: 8px;`;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.style.cssText = `
      background: #e0e0e0;
      color: #333;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 12px;
      cursor: pointer;
    `;
    cancelBtn.onclick = () => {
      this.confirmingStudent = null;
      confirmOverlay.remove();
    };

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Reset PIN';
    confirmBtn.type = 'button';
    confirmBtn.style.cssText = `
      background: #ff5722;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 12px;
      cursor: pointer;
    `;
    confirmBtn.onclick = () => this.executeReset(student, confirmOverlay, modal);

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(confirmBtn);

    confirmOverlay.appendChild(confirmText);
    confirmOverlay.appendChild(warning);
    confirmOverlay.appendChild(btnContainer);

    // Make modal position relative for absolute overlay
    const modalDiv = modal.querySelector('div:first-child')?.parentElement || modal;
    modalDiv.style.position = 'relative';
    modalDiv.appendChild(confirmOverlay);
  }

  private async executeReset(
    student: StudentRecord,
    confirmOverlay: HTMLElement,
    modal: HTMLElement,
  ) {
    try {
      const storage = getStorageAdapter();
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

      // Clean up and refresh
      this.confirmingStudent = null;
      confirmOverlay.remove();
      this.updateStudentList(modal);
    } catch (err) {
      console.error('PIN reset error:', err);
      const errorDiv = modal.querySelector('.error-message') as HTMLElement;
      if (errorDiv) {
        errorDiv.textContent = 'Failed to reset PIN. Please try again.';
        errorDiv.style.display = 'block';
      }
    }
  }

  private removeModalFromBody() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }

  render() {
    // Renders nothing to shadow DOM - modal is in document.body
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-pin-reset-dialog': QdPinResetDialog;
  }
}
