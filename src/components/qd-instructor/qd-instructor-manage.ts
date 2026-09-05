/**
 * Instructor data management component
 * Handles clearing/backing up student data
 */

import { LitElement, html, render } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles.js';
import { clearQuizData } from '../../utils/storage-helpers.js';
import { getStorageService } from '../../services/storage-service.js';
import { dispatchEventOn } from '../../utils/event-helpers.js';

/**
 * Data management controls for instructor
 *
 * Features:
 * - Clear all quiz data with confirmation
 * - Safety confirmation dialog
 * - Emits 'qd:data-cleared' event on success
 *
 * @fires qd:data-cleared - Emitted when all data successfully cleared
 */
@customElement('qd-instructor-manage')
export class QdInstructorManage extends LitElement {
  static override styles = sharedStyles;

  @state()
  private showConfirmDialog = false;

  @state()
  private confirmText = '';

  @state()
  private error = '';

  @state()
  private success = '';

  private modalContainer: HTMLDivElement | null = null;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeModalFromBody();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('showConfirmDialog')) {
      if (this.showConfirmDialog) {
        this.renderModalToBody();
      } else {
        this.removeModalFromBody();
      }
    }
    // Re-render modal if confirmText or error changes while dialog is open
    if (
      this.showConfirmDialog &&
      (changedProperties.has('confirmText') || changedProperties.has('error'))
    ) {
      this.renderModalToBody();
    }
  }

  private renderModalToBody(): void {
    if (!this.modalContainer) {
      this.modalContainer = document.createElement('div');
      this.modalContainer.className = 'qd-manage-modal-container';
      document.body.appendChild(this.modalContainer);
    }
    render(this.renderConfirmDialog(), this.modalContainer);
  }

  private removeModalFromBody(): void {
    if (this.modalContainer) {
      this.modalContainer.remove();
      this.modalContainer = null;
    }
  }

  private handleClearRequest = (): void => {
    this.showConfirmDialog = true;
    this.confirmText = '';
    this.error = '';
    this.success = '';
  };

  private handleCancelClear = (): void => {
    this.showConfirmDialog = false;
    this.confirmText = '';
    this.error = '';
  };

  private handleConfirmInput = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    this.confirmText = input.value;
  };

  private handleConfirmClear = async (): Promise<void> => {
    // Require exact match
    if (this.confirmText !== 'DELETE ALL DATA') {
      this.error = 'Confirmation text does not match';
      return;
    }

    try {
      // Clear persisted data (IndexedDB: students, backups, audit log) ...
      await getStorageService().clearAll();
      // ... then the session cache (sessionStorage qd/* keys)
      clearQuizData();

      // Emit event
      dispatchEventOn(this, 'qd:data-cleared', {});

      // Show success
      this.success = 'All quiz data cleared successfully';
      this.showConfirmDialog = false;
      this.confirmText = '';
      this.error = '';

      // Clear success message after 3 seconds
      setTimeout(() => {
        this.success = '';
      }, 3000);
    } catch {
      this.error = 'Failed to clear data';
    }
  };

  override render() {
    return html`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success
        ? html`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          `
        : ''}
    `;
  }

  private renderConfirmDialog() {
    const isValid = this.confirmText === 'DELETE ALL DATA';

    return html`
      <div
        class="qd-manage-modal-overlay"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;"
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) this.handleCancelClear();
        }}
      >
        <div
          style="background: white; border-radius: 8px; padding: 24px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);"
          @click=${(e: Event) => e.stopPropagation()}
        >
          <div
            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"
          >
            <h2 style="font-size: 18px; font-weight: 600; margin: 0; color: #000;">
              Confirm Data Deletion
            </h2>
            <button
              style="padding: 4px 8px; border: none; background: transparent; font-size: 20px; cursor: pointer; color: #666;"
              @click=${this.handleCancelClear}
            >
              ✕
            </button>
          </div>

          <p style="color: #dc3545; font-weight: 600; margin: 12px 0;">
            ⚠️ This will permanently delete all student quiz data, answers, and progress.
          </p>

          <p style="margin: 12px 0; color: #333;">
            This action cannot be undone. All students will need to start over.
          </p>

          <p style="margin: 12px 0; color: #333;">
            Type <strong>DELETE ALL DATA</strong> to confirm:
          </p>

          <input
            type="text"
            .value=${this.confirmText}
            @input=${this.handleConfirmInput}
            placeholder="DELETE ALL DATA"
            style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin: 16px 0; box-sizing: border-box;"
            autocomplete="off"
          />

          ${this.error
            ? html`<div style="color: #dc3545; font-size: 14px; margin: 8px 0;">${this.error}</div>`
            : ''}

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
            <button
              style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer; font-size: 14px;"
              @click=${this.handleCancelClear}
            >
              Cancel
            </button>
            <button
              style="padding: 8px 16px; border: none; border-radius: 4px; background: ${isValid
                ? '#dc3545'
                : '#ccc'}; color: white; cursor: ${isValid
                ? 'pointer'
                : 'not-allowed'}; font-size: 14px;"
              @click=${this.handleConfirmClear}
              ?disabled=${!isValid}
            >
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor-manage': QdInstructorManage;
  }
}
