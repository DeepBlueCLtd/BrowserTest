/**
 * Migration dialog component
 *
 * Shows when storage format mismatch is detected during login.
 * Allows instructor to migrate database to match current build mode.
 *
 * Feature: 009-encrypt-stored-data
 *
 * @element qd-migration-dialog
 * @fires {CustomEvent<{migrated: number, skipped: number}>} qd:migration-complete - Emitted on successful migration
 * @fires {CustomEvent} qd:migration-cancel - Emitted when user cancels
 */

import { LitElement, html, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { migrateObfuscation } from '../services/storage/obfuscation-migration.js';
import { ENCRYPT_STORAGE } from '../config/feature-flags.js';
import {
  getExpectedInstructorHash,
  verifyInstructorPassword,
} from '../services/auth/instructor-auth.js';
import { spinnerStyles } from './shared-styles.js';
import { migrationDialogStyles } from './qd-migration-dialog.styles.js';
import './qd-modal.js';

/** Migration dialog state */
type MigrationState = 'password' | 'migrating' | 'error' | 'success';

@customElement('qd-migration-dialog')
export class QdMigrationDialog extends LitElement {
  static override styles = [spinnerStyles, migrationDialogStyles];

  /**
   * Whether dialog is open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * What format was expected based on ENCRYPT_STORAGE
   */
  @property({ type: String })
  expected: 'obfuscated' | 'plain' = 'plain';

  /**
   * What format was actually found
   */
  @property({ type: String })
  found: 'obfuscated' | 'plain' = 'plain';

  /**
   * Database name for migration
   */
  @property({ type: String })
  dbName = '';

  /**
   * Release ID for key derivation
   */
  @property({ type: String })
  releaseId = '';

  /**
   * Internal state
   */
  @state()
  private dialogState: MigrationState = 'password';

  /**
   * Password input value
   */
  @state()
  private password = '';

  /**
   * Error message
   */
  @state()
  private error = '';

  /**
   * Migration result
   */
  @state()
  private migrationResult: { migrated: number; skipped: number } | null = null;

  /**
   * Reference to password input
   */
  @query('input[type="password"]')
  private passwordInput!: HTMLInputElement;

  /**
   * Reset state when dialog opens
   */
  override updated(changedProps: Map<string, unknown>): void {
    if (changedProps.has('open') && this.open) {
      this.dialogState = 'password';
      this.password = '';
      this.error = '';
      this.migrationResult = null;
      void this.updateComplete.then(() => {
        this.passwordInput?.focus();
      });
    }
  }

  /**
   * Handle modal close
   */
  private handleModalClose = (): void => {
    this.dispatchEvent(
      new CustomEvent('qd:migration-cancel', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  /**
   * Handle password input
   */
  private handleInput = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    this.password = input.value;
    if (this.error) {
      this.error = '';
    }
  };

  /**
   * Handle form submission
   */
  private handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();

    if (!this.password.trim()) {
      return;
    }

    // Validate instructor password
    const isValid = await this.validatePassword(this.password);
    if (!isValid) {
      // Only set generic error if validatePassword didn't set a specific one
      if (!this.error) {
        this.error = 'Incorrect instructor password';
      }
      return;
    }

    // Start migration
    await this.runMigration();
  };

  /**
   * Validate instructor password against configured hash
   */
  private async validatePassword(password: string): Promise<boolean> {
    if (!getExpectedInstructorHash()) {
      this.error = 'Instructor password not configured';
      return false;
    }
    return verifyInstructorPassword(password);
  }

  /**
   * Run the migration
   */
  private async runMigration(): Promise<void> {
    this.dialogState = 'migrating';
    this.error = '';

    try {
      // Determine direction based on ENCRYPT_STORAGE flag
      const direction = ENCRYPT_STORAGE ? 'encrypt' : 'decrypt';

      const result = await migrateObfuscation(this.dbName, direction, {
        releaseId: this.releaseId,
        dryRun: false,
      });

      if (result.errors.length > 0) {
        this.dialogState = 'error';
        this.error = `Migration completed with ${result.errors.length} error(s). Some records may not have been migrated.`;
        return;
      }

      this.migrationResult = {
        migrated: result.migrated,
        skipped: result.skipped,
      };
      this.dialogState = 'success';
    } catch (err) {
      this.dialogState = 'error';
      this.error = `Migration failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  }

  /**
   * Handle continue after success
   */
  private handleContinue = (): void => {
    this.dispatchEvent(
      new CustomEvent('qd:migration-complete', {
        detail: this.migrationResult,
        bubbles: true,
        composed: true,
      }),
    );
  };

  /**
   * Handle cancel button
   */
  private handleCancel = (): void => {
    this.dispatchEvent(
      new CustomEvent('qd:migration-cancel', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  override render() {
    return html`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">Database Migration Required</span>

        ${this.open ? this.renderContent() : nothing}
      </qd-modal>
    `;
  }

  private renderContent() {
    switch (this.dialogState) {
      case 'password':
        return this.renderPasswordForm();
      case 'migrating':
        return this.renderMigrating();
      case 'error':
        return this.renderError();
      case 'success':
        return this.renderSuccess();
    }
  }

  private renderPasswordForm() {
    return html`
      <div class="migration-content">
        <div class="warning-banner">
          <span class="warning-icon">&#9888;</span>
          <div class="warning-text">
            <strong>Storage format mismatch detected</strong>
            <div class="format-info">
              <div class="format-row">
                <span class="format-label">Current data:</span>
                <span class="format-value">${this.found}</span>
              </div>
              <div class="format-row">
                <span class="format-label">Build expects:</span>
                <span class="format-value">${this.expected}</span>
              </div>
            </div>
          </div>
        </div>

        <p>Enter the instructor password to migrate all stored records to the new format.</p>

        <form @submit=${this.handleSubmit}>
          <div class="form-field">
            <label for="migration-password">Instructor Password</label>
            <input
              id="migration-password"
              type="password"
              placeholder="Password"
              .value=${this.password}
              @input=${this.handleInput}
              required
              aria-label="Enter instructor password to authorize migration"
            />
          </div>

          ${this.error ? html`<div class="error-message">${this.error}</div>` : nothing}

          <div class="button-row">
            <button type="button" class="secondary" @click=${this.handleCancel}>Cancel</button>
            <button type="submit" class="primary">Migrate Database</button>
          </div>
        </form>
      </div>
    `;
  }

  private renderMigrating() {
    return html`
      <div class="migration-content">
        <div class="migrating-state">
          <div class="spinner"></div>
          <p>Migrating database records...</p>
          <p class="format-info">Please wait, do not close this window.</p>
        </div>
      </div>
    `;
  }

  private renderError() {
    return html`
      <div class="migration-content">
        <div class="error-message">${this.error}</div>

        <div class="button-row">
          <button type="button" class="secondary" @click=${this.handleCancel}>Cancel</button>
          <button type="button" class="primary" @click=${() => (this.dialogState = 'password')}>
            Try Again
          </button>
        </div>
      </div>
    `;
  }

  private renderSuccess() {
    return html`
      <div class="migration-content">
        <div class="success-message">
          Migration completed successfully!<br />
          <span class="format-info">
            ${this.migrationResult?.migrated ?? 0} record(s) migrated,
            ${this.migrationResult?.skipped ?? 0} already in correct format.
          </span>
        </div>

        <div class="button-row">
          <button type="button" class="primary" @click=${this.handleContinue}>Continue</button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-migration-dialog': QdMigrationDialog;
  }
}
