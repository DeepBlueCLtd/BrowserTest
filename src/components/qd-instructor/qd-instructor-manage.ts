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
import {
  confirmInstructorPassword,
  reauthErrorMessage,
} from '../../services/auth/instructor-session.js';

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

  /** Instructor password, re-entered for this action (SRD 013 SEC-03) */
  @state()
  private password = '';

  /** Whether the password re-check is in progress */
  @state()
  private checking = false;

  @state()
  private error = '';

  @state()
  private success = '';

  private modalContainer: HTMLDivElement | null = null;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeModalFromBody();
    document.removeEventListener('keydown', this.handleKeydown);
  }

  /** Close the dialog on Escape, like the other dialogs (SRD 013 UX-07). */
  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.showConfirmDialog) {
      this.handleCancelClear();
    }
  };

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('showConfirmDialog')) {
      if (this.showConfirmDialog) {
        this.renderModalToBody();
        document.addEventListener('keydown', this.handleKeydown);
        this.modalContainer?.querySelector<HTMLInputElement>('input')?.focus();
      } else {
        this.removeModalFromBody();
        document.removeEventListener('keydown', this.handleKeydown);
      }
    }
    // Re-render the modal when its inputs or messages change while it is open
    if (
      this.showConfirmDialog &&
      (changedProperties.has('confirmText') ||
        changedProperties.has('password') ||
        changedProperties.has('checking') ||
        changedProperties.has('error'))
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
    this.password = '';
    this.error = '';
    this.success = '';
  };

  private handleCancelClear = (): void => {
    this.showConfirmDialog = false;
    this.confirmText = '';
    this.password = '';
    this.error = '';
  };

  private handleConfirmInput = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    this.confirmText = input.value;
  };

  private handlePasswordInput = (e: Event): void => {
    this.password = (e.target as HTMLInputElement).value;
    this.error = '';
  };

  private handleConfirmClear = async (): Promise<void> => {
    // Require exact match
    if (this.confirmText !== 'DELETE ALL DATA') {
      this.error = 'Confirmation text does not match';
      return;
    }

    // Re-enter the instructor password at the moment of the action, so a
    // faked or abandoned instructor session cannot erase the class (SEC-03)
    this.checking = true;
    const reauth = await confirmInstructorPassword(this.password);
    this.checking = false;
    if (!reauth.ok) {
      this.error = reauthErrorMessage(reauth);
      this.password = '';
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
      this.password = '';
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
    const isValid =
      this.confirmText === 'DELETE ALL DATA' && this.password.length > 0 && !this.checking;

    return html`
      <div
        class="qd-manage-modal-overlay"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;"
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) this.handleCancelClear();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qd-erase-title"
          style="background: white; border-radius: 8px; padding: 24px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);"
          @click=${(e: Event) => e.stopPropagation()}
        >
          <div
            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"
          >
            <h2
              id="qd-erase-title"
              style="font-size: 18px; font-weight: 600; margin: 0; color: #000;"
            >
              Confirm Data Deletion
            </h2>
            <button
              aria-label="Close"
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

          <label for="qd-erase-confirm" style="display: block; margin: 12px 0 0; color: #333;">
            Type <strong>DELETE ALL DATA</strong> to confirm:
          </label>

          <input
            id="qd-erase-confirm"
            type="text"
            .value=${this.confirmText}
            @input=${this.handleConfirmInput}
            placeholder="DELETE ALL DATA"
            style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin: 8px 0 16px; box-sizing: border-box;"
            autocomplete="off"
          />

          <label for="qd-erase-password" style="display: block; margin: 0; color: #333;">
            Instructor password:
          </label>

          <input
            id="qd-erase-password"
            type="password"
            .value=${this.password}
            @input=${this.handlePasswordInput}
            style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin: 8px 0 16px; box-sizing: border-box;"
            autocomplete="current-password"
          />

          ${this.error
            ? html`<div role="alert" style="color: #dc3545; font-size: 14px; margin: 8px 0;">
                ${this.error}
              </div>`
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
