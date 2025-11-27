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

import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { STORAGE_KEYS, SCHEMA_VERSION } from '../types/contracts.js';
import type { SessionData, StudentRecord } from '../types/contracts.js';
import { getJSON } from '../utils/storage-helpers.js';
import { validateStudentForm, sanitizePinInput } from '../utils/validation-helpers.js';
import { SessionService } from '../services/session.js';
import { CONFIG_IDS } from '../config/dom-config-reader.js';
import { getStorageAdapter } from '../services/storage/indexeddb.js';
import { needsMigration, hasPinSet, completePinSetup } from '../services/storage/migration.js';
import { verifyPin, hashPin } from '../services/auth/pin-service.js';
import {
  checkLockout,
  recordFailedAttempt,
  clearAttemptState,
  getRemainingAttempts,
} from '../services/auth/rate-limiter.js';
import './qd-build-info.js';
import './qd-password-modal.js';
import './qd-confirm-dialog.js';
import './qd-help-trigger.js';
import './qd-help-popup.js';
import { getHelpContent } from '../config/help-content.js';

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
   * Lockout countdown interval
   */
  private lockoutInterval: number | null = null;

  static styles = css`
    :host {
      display: none; /* Hidden if already logged in */
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
    }

    :host([data-show]) {
      display: block;
    }

    .login-container {
      padding: 8px 12px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      max-width: 480px;
    }

    .title {
      margin: 0 0 8px 0;
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }

    .login-form {
      display: flex;
      gap: 6px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    input {
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 11px;
      width: 110px;
      min-width: 75px;
      max-width: 110px;
    }

    input.pin-input {
      width: 45px;
      min-width: 45px;
      max-width: 45px;
      text-align: center;
      letter-spacing: 1px;
    }

    input:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .login-btn {
      background: #0066cc;
      color: white;
    }

    .login-btn:hover:not(:disabled) {
      background: #0052a3;
    }

    .login-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .instructor-btn {
      background: #6c757d;
      color: white;
    }

    .instructor-btn:hover {
      background: #5a6268;
    }

    .error-message {
      width: 100%;
      color: #d32f2f;
      font-size: 11px;
      margin-top: 3px;
      padding: 4px 8px;
      background: #ffebee;
      border-radius: 3px;
      border-left: 3px solid #d32f2f;
    }

    .lockout-message {
      width: 100%;
      color: #f57c00;
      font-size: 11px;
      margin-top: 3px;
      padding: 4px 8px;
      background: #fff3e0;
      border-radius: 3px;
      border-left: 3px solid #f57c00;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .login-form {
        flex-direction: column;
      }

      input,
      button {
        width: 100%;
      }
    }
  `;

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
          <qd-help-trigger
            panelType="login"
            @qd:help-open=${this.handleHelpOpen}
          ></qd-help-trigger>
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
    // Read title selector from config element
    const selectorElement = document.getElementById(CONFIG_IDS.titleSelector);
    const selector = selectorElement?.textContent?.trim() || '.wh_publication_title .title';

    // Use selector to find title element
    const titleElement = document.querySelector(selector);
    return titleElement?.textContent?.trim() || '';
  }

  /**
   * Handle student login
   */
  private async handleStudentLogin(e: Event) {
    e.preventDefault();

    if (!this.isValid()) {
      this.errorMessage = 'Please enter name, service ID, and 4-digit PIN';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const release = this.getRelease();
      if (!release) {
        this.errorMessage = 'Release not found (missing publication title element)';
        this.isSubmitting = false;
        return;
      }

      const serviceId = this.serviceId.trim();
      const name = this.name.trim();

      // Check for lockout
      const lockout = checkLockout(serviceId);
      if (lockout.isLocked) {
        this.startLockoutCountdown(lockout.remainingMs);
        this.isSubmitting = false;
        return;
      }

      // Get storage adapter with configured db name
      const dbNameElement = document.getElementById(CONFIG_IDS.dbName);
      if (!dbNameElement?.textContent?.trim()) {
        throw new Error(
          `Database name not configured. Add <span id="${CONFIG_IDS.dbName}">dbName</span> to page.`,
        );
      }
      const dbName = dbNameElement.textContent.trim();
      const storage = getStorageAdapter(dbName);
      await storage.init();
      const existingStudent = await storage.getStudent(release, serviceId);

      if (existingStudent) {
        // Check if student needs PIN setup (migration or no PIN)
        if (needsMigration(existingStudent) || !hasPinSet(existingStudent)) {
          // Hash the entered PIN and update student
          const pinHash = await hashPin(this.pin);
          const updatedStudent = completePinSetup(existingStudent, pinHash);
          await storage.saveStudent(updatedStudent);

          // Emit PIN created event
          this.dispatchEvent(
            new CustomEvent('qd:pin-created', {
              detail: { serviceId, timestamp: new Date().toISOString() },
              bubbles: true,
              composed: true,
            }),
          );

          // Show confirmation and complete login
          this.showPinStoredConfirmation();
          this.completeLogin(serviceId, name, release);
          return;
        }

        // Existing student with PIN - verify it
        const isValid = await verifyPin(this.pin, existingStudent.pinHash || '');
        if (!isValid) {
          // Record failed attempt
          const state = recordFailedAttempt(serviceId);
          const remaining = getRemainingAttempts(serviceId);

          if (state.lockoutUntil) {
            const lockoutMs = new Date(state.lockoutUntil).getTime() - Date.now();
            this.startLockoutCountdown(lockoutMs);
          } else {
            this.errorMessage = `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`;
          }

          this.pin = '';
          this.isSubmitting = false;
          return;
        }

        // PIN verified - clear rate limit and emit event
        clearAttemptState(serviceId);
        this.dispatchEvent(
          new CustomEvent('qd:pin-verified', {
            detail: { serviceId, timestamp: new Date().toISOString() },
            bubbles: true,
            composed: true,
          }),
        );
      } else {
        // New student - hash PIN and create record
        const pinHash = await hashPin(this.pin);
        const newStudent: StudentRecord = {
          schema: SCHEMA_VERSION,
          docId: '',
          release,
          serviceId,
          name,
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {},
          pinHash,
          pinCreatedAt: new Date().toISOString(),
        };
        await storage.saveStudent(newStudent);

        // Emit PIN created event
        this.dispatchEvent(
          new CustomEvent('qd:pin-created', {
            detail: { serviceId, timestamp: new Date().toISOString() },
            bubbles: true,
            composed: true,
          }),
        );

        // Show confirmation and complete login
        this.showPinStoredConfirmation();
        this.completeLogin(serviceId, name, release);
        return;
      }

      // Complete the login
      this.completeLogin(serviceId, name, release);
    } catch (err) {
      this.errorMessage = 'Login failed. Please try again.';
      console.error('Student login error:', err);
      this.isSubmitting = false;
    }
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
   * Hash password using SHA-256
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Return first 12 characters for author-friendly Oxygen dialogs
    return hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 12);
  }

  /**
   * Get expected password hash from hidden element
   */
  private getExpectedHash(): string {
    const hashElement = document.getElementById(CONFIG_IDS.instructorHash);
    return hashElement?.textContent?.trim() || '';
  }

  /**
   * Handle instructor login with password
   */
  private async handleInstructorLogin(password: string) {
    try {
      const passwordHash = await this.hashPassword(password);
      const expectedHash = this.getExpectedHash();

      if (!expectedHash) {
        this.instructorError = 'Instructor password not configured';
        return;
      }

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
