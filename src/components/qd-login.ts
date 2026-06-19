/**
 * Login Component
 *
 * Presentational student-login view: renders the form and maps
 * {@link AuthService} results to UI state. The instructor flow and lockout
 * countdown live in the `<qd-instructor-login>` and `<qd-lockout-banner>`
 * child components. Release is read from the document title.
 *
 * @element qd-login
 * @fires {CustomEvent<{serviceId,name,release,role}>} qd:login - On successful auth
 */

import { LitElement, html } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { loginStyles } from './qd-login.styles.js';
import { hasActiveSession } from '../utils/session-state.js';
import { validateStudentForm, sanitizePinInput } from '../utils/validation-helpers.js';
import { SessionService } from '../services/session.js';
import { readRelease, readDbName } from '../config/dom-config-reader.js';
import { AuthService } from '../services/auth/auth-service.js';
import type { LoginResult } from '../services/auth/auth-service.js';
import './qd-build-info.js';
import './qd-instructor-login.js';
import './qd-lockout-banner.js';
import './qd-confirm-dialog.js';
import './qd-help-trigger.js';
import './qd-help-popup.js';
import './qd-migration-dialog.js';
import { getHelpContent } from '../config/help-content.js';
import { StorageFormatError } from '../services/storage/adapter-utils.js';

/** Login event data */
interface LoginData {
  serviceId: string;
  name: string;
  release: string;
  role: 'student' | 'instructor';
}

/** Login component for student and instructor authentication */
@customElement('qd-login')
export class QdLogin extends LitElement {
  /** Title text (configurable via init()) */
  @property({ type: String })
  title = 'Sonar Quiz System';

  /** Form field: Student name */
  @state() private name = '';
  /** Form field: Service ID (2-10 alphanumeric) */
  @state() private serviceId = '';
  /** Error message to display */
  @state() private errorMessage = '';
  /** Whether the form is currently submitting */
  @state() private isSubmitting = false;
  /** PIN input */
  @state() private pin = '';
  /** Epoch milliseconds when the current lockout ends (0 = not locked) */
  @state() private lockoutUntil = 0;
  /** Whether the "PIN stored" confirmation is shown */
  @state() private showPinConfirmation = false;
  /** Whether the help popup is open */
  @state() private helpOpen = false;
  /** Whether the migration dialog is shown */
  @state() private showMigrationDialog = false;
  /** Storage format error that triggered the migration dialog */
  @state() private migrationError: StorageFormatError | null = null;
  /** Pending login data to retry after migration */
  @state() private pendingLoginData: {
    serviceId: string;
    name: string;
    release: string;
    pin: string;
    dbName: string;
  } | null = null;

  /** Student authentication service (storage/crypto/rate-limit logic) */
  private authService = new AuthService();

  static styles = loginStyles;

  connectedCallback() {
    super.connectedCallback();
    this.updateVisibility();
    document.addEventListener('qd:logout', this.handleLogoutEvent);
    // Instructor login is emitted by the child <qd-instructor-login>; hide on it.
    document.addEventListener('qd:login', this.handleLoginEvent);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('qd:logout', this.handleLogoutEvent);
    document.removeEventListener('qd:login', this.handleLoginEvent);
  }

  /** Hide the form whenever a login succeeds (student or instructor). */
  private handleLoginEvent = (): void => {
    this.updateVisibility();
  };

  /** Lifecycle: signal readiness once the shadow DOM is rendered. */
  firstUpdated() {
    this.setAttribute('data-ready', '');
  }

  /** Show the form only when NOT logged in. */
  private updateVisibility(): void {
    this.toggleAttribute('data-show', !hasActiveSession());
  }

  /** On logout, reset state and show the login form again. */
  private handleLogoutEvent = (): void => {
    this.name = '';
    this.serviceId = '';
    this.errorMessage = '';
    this.isSubmitting = false;
    this.pin = '';
    this.lockoutUntil = 0;
    this.showPinConfirmation = false;
    this.helpOpen = false;
    this.updateVisibility();
  };

  /** Whether the account is currently within its lockout window. */
  private isLockedOut(): boolean {
    return this.lockoutUntil > Date.now();
  }

  /** Clear the lockout once the banner's countdown ends. */
  private handleLockoutExpired = (): void => {
    this.lockoutUntil = 0;
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
            ?disabled=${this.isSubmitting || this.isLockedOut()}
            required
          />
          <button
            type="submit"
            class="login-btn"
            ?disabled=${this.isSubmitting || !this.isValid() || this.isLockedOut()}
          >
            Login
          </button>
          <qd-instructor-login ?disabled=${this.isSubmitting}></qd-instructor-login>
          ${this.errorMessage ? html`<div class="error-message">${this.errorMessage}</div>` : ''}
          <qd-lockout-banner
            .untilMs=${this.lockoutUntil}
            @qd:lockout-expired=${this.handleLockoutExpired}
          ></qd-lockout-banner>
        </form>
      </div>
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

  private handleHelpOpen = (): void => {
    this.helpOpen = true;
  };
  private handleHelpClose = (): void => {
    this.helpOpen = false;
  };

  private handleNameInput(e: Event) {
    this.name = (e.target as HTMLInputElement).value;
    this.errorMessage = '';
  }
  private handleServiceIdInput(e: Event) {
    this.serviceId = (e.target as HTMLInputElement).value;
    this.errorMessage = '';
  }
  private handlePinInput(e: Event) {
    // Filter to digits only using validation helper
    this.pin = sanitizePinInput((e.target as HTMLInputElement).value);
    this.errorMessage = '';
  }

  /** Whether the student form passes validation. */
  private isValid(): boolean {
    return validateStudentForm(this.name, this.serviceId, this.pin).length === 0;
  }

  /**
   * Handle student login: validate, resolve release/db-name, delegate to
   * {@link AuthService}, and apply the result (or open the migration dialog).
   */
  private async handleStudentLogin(e: Event) {
    e.preventDefault();

    if (!this.isValid()) {
      this.errorMessage = 'Please enter name, service ID, and 4-digit PIN';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const release = readRelease();
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

  /** Map an {@link AuthService} result to session/events/UI state. */
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
        this.lockoutUntil = Date.now() + result.lockoutMs;
        this.errorMessage = '';
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

  /** Dispatch a PIN lifecycle event (`qd:pin-created` / `qd:pin-verified`). */
  private dispatchPinEvent(name: 'qd:pin-created' | 'qd:pin-verified', serviceId: string): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: { serviceId, timestamp: new Date().toISOString() },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private showPinStoredConfirmation(): void {
    this.showPinConfirmation = true;
  }
  private handlePinConfirmationDismiss = (): void => {
    this.showPinConfirmation = false;
  };

  /** On successful migration, retry login with the pending (validated) data. */
  private handleMigrationComplete = (): void => {
    this.showMigrationDialog = false;
    this.migrationError = null;

    if (this.pendingLoginData) {
      const { serviceId, name, release } = this.pendingLoginData;
      this.pendingLoginData = null;
      void this.retryLoginAfterMigration(serviceId, name, release);
    }
  };

  /** Retry login after migration (skips the lockout pre-check). */
  private async retryLoginAfterMigration(
    serviceId: string,
    name: string,
    release: string,
  ): Promise<void> {
    this.isSubmitting = true;
    this.errorMessage = '';

    const result = await this.authService.retryAfterMigration({
      serviceId,
      name,
      pin: this.pin,
      release,
      dbName: readDbName(),
    });

    this.applyLoginResult(result);
  }

  /** On migration cancel, show a contact-instructor message. */
  private handleMigrationCancel = (): void => {
    this.showMigrationDialog = false;
    this.migrationError = null;
    this.pendingLoginData = null;
    this.errorMessage = 'Data migration cancelled. Please contact your instructor for assistance.';
    this.isSubmitting = false;
  };

  /** Create the student session, emit `qd:login`, and hide the form. */
  private completeLogin(serviceId: string, name: string, release: string): void {
    new SessionService().createSession(serviceId, name, release);

    const loginData: LoginData = { serviceId, name, release, role: 'student' };
    this.dispatchEvent(
      new CustomEvent('qd:login', { detail: loginData, bubbles: true, composed: true }),
    );

    this.pin = '';
    this.isSubmitting = false;
    this.updateVisibility();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-login': QdLogin;
  }
}
