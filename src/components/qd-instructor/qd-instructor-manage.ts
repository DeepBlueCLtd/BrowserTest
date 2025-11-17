/**
 * Instructor data management component
 * Handles clearing/backing up student data
 */

import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles.js';
import { clearQuizData } from '../../utils/storage-helpers.js';
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

  private handleConfirmClear = (): void => {
    // Require exact match
    if (this.confirmText !== 'DELETE ALL DATA') {
      this.error = 'Confirmation text does not match';
      return;
    }

    try {
      // Clear all quiz data from storage
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

      ${this.showConfirmDialog ? this.renderConfirmDialog() : ''}

      ${this.success ? html`
        <div style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
          ${this.success}
        </div>
      ` : ''}
    `;
  }

  private renderConfirmDialog() {
    const isValid = this.confirmText === 'DELETE ALL DATA';

    return html`
      <div class="modal-overlay" @click=${this.handleCancelClear}>
        <div class="modal-content" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-header">
            <h2 class="modal-title">Confirm Data Deletion</h2>
            <button class="close-button" @click=${this.handleCancelClear}>✕</button>
          </div>

          <p style="color: #dc3545; font-weight: 600;">
            ⚠️ This will permanently delete all student quiz data, answers, and progress.
          </p>

          <p>
            This action cannot be undone. All students will need to start over.
          </p>

          <p>
            Type <strong>DELETE ALL DATA</strong> to confirm:
          </p>

          <input
            type="text"
            .value=${this.confirmText}
            @input=${this.handleConfirmInput}
            placeholder="DELETE ALL DATA"
            style="width: 100%; margin: 16px 0;"
            autocomplete="off"
          />

          ${this.error ? html`<div class="error">${this.error}</div>` : ''}

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
            <button @click=${this.handleCancelClear}>
              Cancel
            </button>
            <button
              @click=${this.handleConfirmClear}
              class="danger"
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
