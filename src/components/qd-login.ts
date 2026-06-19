/**
 * Login Component
 *
 * Compact authentication for both students and instructors.
 * Horizontal layout with Name + Service ID fields, Login + Instructor buttons.
 * Release is read from document title (.wh_publication_title .title).
 *
 * @element qd-login
 * @fires {CustomEvent<{serviceId: string, name: string, release: string, role: 'student' | 'instructor'}>} qd:login - Emitted on successful auth
 *
 * @example
 * ```html
 * <div class="wh_publication_title">
 *   <span class="title">TRV Connectors Autumn 2025</span>
 * </div>
 * <qd-login title="Sonar Quiz System"></qd-login>
 * ```
 */

import { LitElement, html } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { loginStyles } from './qd-login.styles.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import type { SessionData } from '../types/contracts.js';
import { getJSON } from '../utils/storage-helpers.js';
import { validateStudentForm, sanitizePinInput } from '../utils/validation-helpers.js';
import { SessionService } from '../services/session.js';
import { readTitleSelector, readDbName } from '../config/dom-config-reader.js';
import { hashPassword, getExpectedInstructorHash } from '../services/auth/instructor-auth.js';
import { AuthService } from '../services/auth/auth-service.js';
import type { LoginResult } from '../services/auth/auth-service.js';
import './qd-build-info.js';
import './qd-password-modal.js';
import './qd-confirm-dialog.js';
import './qd-help-trigger.js';
import './qd-help-popup.js';
import './qd-migration-dialog.js';
import { getHelpContent } from '../config/help-content.js';
import { StorageFormatError } from '../services/storage/adapter-utils.js';

/**
 * Login event data
 */
interface LoginData {
  serviceId: string;
  name: string;
  release: string;
  role: 'student' | 'instructor';
}

/**
 * Login component for student and instructor authentication
 */
@customElement('qd-login')
export class QdLogin extends LitElement {
  /**
   * Title text (configurable via init())
   */
  @property({ type: String })
  title = 'Sonar Quiz System';

  /**
   * Form field: Student name
   */
  @state()
  private name = '';

  /**
   * Form field: Service ID (2-10 alphanumeric)
   */
  @state()
  private serviceId = '';

  /**
   * Whether instructor modal is open
   */
  @state()
  private showInstructorModal = false;

  /**
   * Instructor modal error message
   */
  @state()
  private instructorError = '';

  /**
   * Error message to display
   */
  @state()
  private errorMessage = '';

  /**
   * Whether form is currently submitting
   */
  @state()
  private isSubmitting = false;

  /**
   * PIN input
   */
  @state()
  private pin = '';

  /**
   * Lockout countdown in seconds
   */
  @state()
  private lockoutSeconds = 0;

  /**
   * Whether PIN stored confirmation is shown
   */
  @state()
  private showPinConfirmation = false;

  /**
   * Whether help popup is open
   */
  @state()
  private helpOpen = false;

  /**
   * Whether migration dialog is shown
   */
  @state()
  private showMigrationDialog = false;

  /**
   * Storage format error that triggered migration dialog
   */
  @state()
  private migrationError: StorageFormatError | null = null;

  /**
   * Pending login data to retry after migration
   */
  @state()
  private pendingLoginData: {
    serviceId: string;
    name: string;
    release: string;
    pin: string;
    dbName: string;
  } | null = null;

  /**
   * Lockout countdown interval
   */
  private lockoutInterval: number | null = null;

  /**
   * Student authentication service (storage/crypto/rate-limit logic)
   */
  private authService = new AuthService();

  static styles = loginStyles;

  connectedCallback() {
    super.connectedCallback();
    this.updateVisibility();
    document.addEventListener('qd:logout', this.handleLogoutEvent);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('qd:logout', this.handleLogoutEvent);
    if (this.lockoutInterval) {
      clearInterval(this.lockoutInterval);
      this.lockoutInterval = null;
    }
  }

  /**
   * Lifecycle: Called after first render completes (shadow DOM ready)
   */
  firstUpdated() {
    this.setAttribute('data-ready', '');
  }

  /**
   * Update visibility - show only if NOT logged in
   */
  private updateVisibility(): void {
    const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
    if (!session) {
      this.setAttribute('data-show', '');
    } else {
      this.removeAttribute('data-show');
    }
  }

  /**
   * Handle logout event - show login form again
   */
  private handleLogoutEvent = (): void => {
    // Reset component state
    this.name = '';
    this.serviceId = '';
    this.errorMessage = '';
    this.isSubmitting = false;
    this.showInstructorModal = false;
    this.instructorError = '';
    this.pin = '';
    this.lockoutSeconds = 0;
    this.showPinConfirmation = false;
    this.helpOpen = false;

    // Clean up lockout interval
    if (this.lockoutInterval) {
      clearInterval(this.lockoutInterval);
      this.lockoutInterval = null;
    }

    // Show login form
    this.updateVisibility();
  };

  render() {
    return html`
      <div class="login-container">
        <div class="title">
          ${this.title}
          <qd-build-info></qd-build-info>
          <qd-help-trigger panelType="login" @qd:help-open=${this.handleHelpOpen}></qd-help-trigger>
        </div>

        <form class="login-form" @submit=${(e: Event) => this.handleStudentLogin(e)}>
          <input
            type="text"
            name="name"
            placeholder="Name (J Smith)"
            .value=${this.name}
            @input=${(e: Event) => this.handleNameInput(e)}
            ?disabled=${this.isSubmitting}
            required
          />

          <input
            type="text"
            name="serviceId"
            placeholder="Service ID (30012345)"
            .value=${this.serviceId}
            @input=${(e: Event) => this.handleServiceIdInput(e)}
            ?disabled=${this.isSubmitting}
            pattern="[A-Za-z0-9]{2,10}"
            title="2-10 alphanumeric characters"
            required
          />

          <input
            type="password"
            name="pin"
            class="pin-input"
            placeholder="PIN"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="4"
            autocomplete="off"
            aria-label="Enter your 4-digit PIN"
            .value=${this.pin}
            @input=${(e: Event) => this.handlePinInput(e)}
            ?disabled=${this.isSubmitting || this.lockoutSeconds > 0}
            required
          />

          <button
            type="submit"
            class="login-btn"
            ?disabled=${this.isSubmitting || !this.isValid() || this.lockoutSeconds > 0}
          >
            Login
          </button>

          <button
            type="button"
            class="instructor-btn"
            @click=${() => this.openInstructorModal()}
            ?disabled=${this.isSubmitting}
          >
            Instructor
          </button>

          ${this.errorMessage ? html`<div class="error-message">${this.errorMessage}</div>` : ''}
          ${this.lockoutSeconds > 0
            ? html`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
                Too many attempts. Try again in ${this.lockoutSeconds}s
              </div>`
            : ''}
        </form>
      </div>

      <qd-password-modal
        .open=${this.showInstructorModal}
        title="Instructor Login"
        .error=${this.instructorError}
        @qd:password-submit=${this.handleInstructorPasswordSubmit}
        @close=${this.handleInstructorModalClose}
      ></qd-password-modal>

      <qd-confirm-dialog
        .open=${this.showPinConfirmation}
        title="PIN Stored"
        message="Your PIN has been saved. Use it with your name and service ID on future logins."
        confirmText="OK"
        cancelText=""
        @qd:confirm=${this.handlePinConfirmationDismiss}
        @qd:cancel=${this.handlePinConfirmationDismiss}
      ></qd-confirm-dialog>

      <qd-help-popup
        .open=${this.helpOpen}
        .title=${getHelpContent('login').title}
        .content=${getHelpContent('login').body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>

      <qd-migration-dialog
        .open=${this.showMigrationDialog}
        .expected=${this.migrationError?.expected ?? 'plain'}
        .found=${this.migrationError?.found ?? 'plain'}
        .dbName=${this.pendingLoginData?.dbName ?? ''}
        .releaseId=${this.pendingLoginData?.release ?? ''}
        @qd:migration-complete=${this.handleMigrationComplete}
        @qd:migration-cancel=${this.handleMigrationCancel}
      ></qd-migration-dialog>
    `;
  }

  /**
   * Handle help trigger click - open help popup
   */
  private handleHelpOpen = (): void => {
    this.helpOpen = true;
  };

  /**
   * Handle help popup close
   */
  private handleHelpClose = (): void => {
    this.helpOpen = false;
  };

  /**
   * Handle password submission from modal
   */
  private handleInstructorPasswordSubmit = (e: CustomEvent<{ password: string }>): void => {
    void this.handleInstructorLogin(e.detail.password);
  };

  /**
   * Handle modal close
   */
  private handleInstructorModalClose = (): void => {
    this.showInstructorModal = false;
    this.instructorError = '';
  };

  /**
   * Handle name input
   */
  private handleNameInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.name = input.value;
    this.errorMessage = '';
  }

  /**
   * Handle service ID input
   */
  private handleServiceIdInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.serviceId = input.value;
    this.errorMessage = '';
  }

  /**
   * Handle PIN input
   */
  private handlePinInput(e: Event) {
    const input = e.target as HTMLInputElement;
    // Filter to digits only using validation helper
    this.pin = sanitizePinInput(input.value);
    this.errorMessage = '';
  }

  /**
   * Check if student form is valid using validation helper
   */
  private isValid(): boolean {
    const errors = validateStudentForm(this.name, this.serviceId, this.pin);
    return errors.length === 0;
  }

  /**
   * Get release from document title
   * Reads selector from config, then queries document
   */
  private getRelease(): string {
    // Read title selector from centralized config reader
    const selector = readTitleSelector();

    // Use selector to find title element
    const titleElement = document.querySelector(selector);
    return titleElement?.textContent?.trim() || '';
  }

  /**
   * Handle student login.
   *
   * Validation, release/db-name resolution, session creation, events, and UI
   * state live here; all storage/crypto/rate-limit logic is delegated to
   * {@link AuthService} (one shared path with {@link retryLoginAfterMigration}).
   */
  private async handleStudentLogin(e: Event) {
    e.preventDefault();

    if (!this.isValid()) {
      this.errorMessage = 'Please enter name, service ID, and 4-digit PIN';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const release = this.getRelease();
    if (!release) {
      this.errorMessage = 'Release not found (missing publication title element)';
      this.isSubmitting = false;
      return;
    }

    const serviceId = this.serviceId.trim();
    const name = this.name.trim();
    const dbName = readDbName();
    const pin = this.pin;

    const result = await this.authService.loginStudent({ serviceId, name, pin, release, dbName });

    if (result.kind === 'needs-migration') {
      this.migrationError = result.error;
      this.pendingLoginData = { serviceId, name, release, pin, dbName };
      this.showMigrationDialog = true;
      this.isSubmitting = false;
      return;
    }

    this.applyLoginResult(result);
  }

  /**
   * Translate an {@link AuthService} result into session creation, events, and
   * UI state. Shared by the initial and post-migration login paths.
   */
  private applyLoginResult(result: LoginResult): void {
    switch (result.kind) {
      case 'pin-created':
        this.dispatchPinEvent('qd:pin-created', result.serviceId);
        this.showPinStoredConfirmation();
        this.completeLogin(result.serviceId, result.name, result.release);
        break;
      case 'pin-verified':
        this.dispatchPinEvent('qd:pin-verified', result.serviceId);
        this.completeLogin(result.serviceId, result.name, result.release);
        break;
      case 'lockout':
        this.startLockoutCountdown(result.lockoutMs);
        this.isSubmitting = false;
        break;
      case 'bad-pin':
        this.errorMessage = `Incorrect PIN. ${result.remaining} attempt${
          result.remaining !== 1 ? 's' : ''
        } remaining`;
        this.pin = '';
        this.isSubmitting = false;
        break;
      case 'error':
        this.errorMessage = result.message;
        this.isSubmitting = false;
        break;
    }
  }

  /**
   * Dispatch a PIN lifecycle event (`qd:pin-created` / `qd:pin-verified`).
   */
  private dispatchPinEvent(name: 'qd:pin-created' | 'qd:pin-verified', serviceId: string): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: { serviceId, timestamp: new Date().toISOString() },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Show confirmation popup that PIN has been stored
   */
  private showPinStoredConfirmation(): void {
    this.showPinConfirmation = true;
  }

  /**
   * Handle PIN confirmation dialog dismiss
   */
  private handlePinConfirmationDismiss = (): void => {
    this.showPinConfirmation = false;
  };

  /**
   * Handle migration complete - retry login with pending data
   */
  private handleMigrationComplete = (): void => {
    this.showMigrationDialog = false;
    this.migrationError = null;

    // Retry login with pending data
    if (this.pendingLoginData) {
      const { serviceId, name, release } = this.pendingLoginData;
      this.pendingLoginData = null;

      // Re-trigger login process by submitting form programmatically
      // We already have validated data, so complete the login directly
      void this.retryLoginAfterMigration(serviceId, name, release);
    }
  };

  /**
   * Retry login after successful migration.
   *
   * Delegates to {@link AuthService.retryAfterMigration} (skips the lockout
   * pre-check) and reuses the shared result handling.
   */
  private async retryLoginAfterMigration(
    serviceId: string,
    name: string,
    release: string,
  ): Promise<void> {
    this.isSubmitting = true;
    this.errorMessage = '';

    const dbName = readDbName();
    const result = await this.authService.retryAfterMigration({
      serviceId,
      name,
      pin: this.pin,
      release,
      dbName,
    });

    this.applyLoginResult(result);
  }

  /**
   * Handle migration cancel - show contact instructor message
   */
  private handleMigrationCancel = (): void => {
    this.showMigrationDialog = false;
    this.migrationError = null;
    this.pendingLoginData = null;
    this.errorMessage = 'Data migration cancelled. Please contact your instructor for assistance.';
    this.isSubmitting = false;
  };

  /**
   * Start lockout countdown timer
   */
  private startLockoutCountdown(remainingMs: number): void {
    this.lockoutSeconds = Math.ceil(remainingMs / 1000);
    this.errorMessage = '';

    if (this.lockoutInterval) {
      clearInterval(this.lockoutInterval);
    }

    this.lockoutInterval = window.setInterval(() => {
      this.lockoutSeconds--;
      if (this.lockoutSeconds <= 0) {
        if (this.lockoutInterval) {
          clearInterval(this.lockoutInterval);
          this.lockoutInterval = null;
        }
      }
    }, 1000);
  }

  /**
   * Complete the login process
   */
  private completeLogin(serviceId: string, name: string, release: string): void {
    // Create session in storage
    const sessionService = new SessionService();
    sessionService.createSession(serviceId, name, release);

    const loginData: LoginData = {
      serviceId,
      name,
      release,
      role: 'student',
    };

    const event = new CustomEvent('qd:login', {
      detail: loginData,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);

    // Reset state
    this.pin = '';
    this.isSubmitting = false;

    // Hide component on successful login
    this.updateVisibility();
  }

  /**
   * Open instructor modal
   */
  private openInstructorModal() {
    this.showInstructorModal = true;
    this.instructorError = '';
  }

  /**
   * Handle instructor login with password
   */
  private async handleInstructorLogin(password: string) {
    try {
      const expectedHash = getExpectedInstructorHash();

      if (!expectedHash) {
        this.instructorError = 'Instructor password not configured';
        return;
      }

      const passwordHash = await hashPassword(password);
      if (passwordHash !== expectedHash) {
        this.instructorError = 'Incorrect password';
        // TODO: Implement rate limiting (5 attempts per 60 seconds)
        return;
      }

      // Success
      const release = this.getRelease();

      // Create session in storage
      const sessionService = new SessionService();
      sessionService.createSession('INSTRUCTOR', 'Instructor', release || '');

      // Set instructor flag
      sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');

      const loginData: LoginData = {
        serviceId: 'INSTRUCTOR',
        name: 'Instructor',
        release: release || '',
        role: 'instructor',
      };

      const event = new CustomEvent('qd:login', {
        detail: loginData,
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);

      // Close modal and hide component
      this.showInstructorModal = false;
      this.instructorError = '';
      this.updateVisibility();
    } catch (err) {
      this.instructorError = 'Login failed. Please try again.';
      console.error('Instructor login error:', err);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-login': QdLogin;
  }
}
