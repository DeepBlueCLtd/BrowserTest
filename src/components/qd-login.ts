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
   * Instructor modal: Password field
   */
  @state()
  private instructorPassword = '';

  /**
   * Whether instructor modal is open
   */
  @state()
  private showInstructorModal = false;

  /**
   * Reference to modal overlay element in document.body
   */
  private modalOverlay: HTMLDivElement | null = null;

  /**
   * Reference to modal error div for updating
   */
  private modalErrorDiv: HTMLDivElement | null = null;

  /**
   * Reference to modal password input for updating
   */
  private modalPasswordInput: HTMLInputElement | null = null;

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

    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001; /* Above storage monitor (10000) */
    }

    .modal {
      background: white;
      border-radius: 8px;
      padding: 24px;
      min-width: 320px;
      max-width: 400px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 28px;
      height: 28px;
      line-height: 1;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      margin-bottom: 20px;
    }

    .modal-body input {
      width: 100%;
      box-sizing: border-box;
    }

    .modal-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .cancel-btn {
      background: #e0e0e0;
      color: #333;
    }

    .cancel-btn:hover {
      background: #d0d0d0;
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
    // Listen for Escape key to close modal
    document.addEventListener('keydown', this.handleEscape);
    document.addEventListener('qd:logout', this.handleLogoutEvent);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleEscape);
    document.removeEventListener('qd:logout', this.handleLogoutEvent);
    this.cleanupModal();
    if (this.lockoutInterval) {
      clearInterval(this.lockoutInterval);
      this.lockoutInterval = null;
    }
  }

  /**
   * Remove modal from document.body if present
   */
  private cleanupModal(): void {
    if (this.modalOverlay) {
      this.modalOverlay.remove();
      this.modalOverlay = null;
    }
    this.modalErrorDiv = null;
    this.modalPasswordInput = null;
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
    this.instructorPassword = '';
    this.errorMessage = '';
    this.isSubmitting = false;
    this.showInstructorModal = false;
    this.pin = '';
    this.lockoutSeconds = 0;

    // Clean up lockout interval
    if (this.lockoutInterval) {
      clearInterval(this.lockoutInterval);
      this.lockoutInterval = null;
    }

    // Clean up any lingering modal
    this.cleanupModal();

    // Show login form
    this.updateVisibility();
  };

  render() {
    return html`
      <div class="login-container">
        <div class="title">${this.title} <qd-build-info></qd-build-info></div>

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
    `;
  }

  /**
   * Render instructor modal to document.body (outside shadow DOM)
   */
  private renderInstructorModalToBody(): void {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'qd-instructor-modal-overlay';
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

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'qd-instructor-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      min-width: 320px;
      max-width: 400px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      pointer-events: auto;
      position: relative;
      z-index: 100000;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    `;
    const title = document.createElement('h3');
    title.textContent = 'Instructor Login';
    title.style.cssText = `font-size: 18px; font-weight: 600; color: #333; margin: 0;`;
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.type = 'button';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 28px;
      height: 28px;
      line-height: 1;
      pointer-events: auto;
      position: relative;
      z-index: 1;
    `;
    closeBtn.onclick = () => this.closeInstructorModal();
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Form
    const form = document.createElement('form');
    const bodyDiv = document.createElement('div');
    bodyDiv.style.marginBottom = '20px';

    const input = document.createElement('input');
    input.id = 'qd-instructor-password';
    input.type = 'password';
    input.placeholder = 'Password';
    input.required = true;
    input.style.cssText = `
      width: 100%;
      box-sizing: border-box;
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 11px;
      pointer-events: auto;
      position: relative;
      z-index: 1;
    `;
    input.oninput = (e) => {
      this.instructorPassword = (e.target as HTMLInputElement).value;
      // Hide error when user types
      if (this.modalErrorDiv) {
        this.modalErrorDiv.style.display = 'none';
        this.modalErrorDiv.textContent = '';
      }
    };
    bodyDiv.appendChild(input);

    // Store reference to password input
    this.modalPasswordInput = input;

    // Always create error div (hidden by default)
    const errorDiv = document.createElement('div');
    // give the new div an id for easier testing
    errorDiv.id = 'qd-instructor-modal-error';
    errorDiv.style.cssText = `
      color: #d32f2f;
      font-size: 11px;
      margin-top: 8px;
      padding: 4px 8px;
      background: #ffebee;
      border-radius: 3px;
      border-left: 3px solid #d32f2f;
      display: none;
    `;
    bodyDiv.appendChild(errorDiv);
    this.modalErrorDiv = errorDiv;

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `display: flex; gap: 8px; justify-content: flex-end;`;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.style.cssText = `
      background: #e0e0e0;
      color: #333;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      padding: 6px 12px;
      pointer-events: auto;
      position: relative;
      z-index: 1;
    `;
    cancelBtn.onclick = () => this.closeInstructorModal();

    const loginBtn = document.createElement('button');
    loginBtn.id = 'qd-instructor-submit';
    loginBtn.textContent = 'Login';
    loginBtn.type = 'submit';
    loginBtn.style.cssText = `
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      padding: 6px 12px;
      pointer-events: auto;
      position: relative;
      z-index: 1;
    `;

    footer.appendChild(cancelBtn);
    footer.appendChild(loginBtn);

    form.appendChild(bodyDiv);
    form.appendChild(footer);
    form.onsubmit = (e) => {
      e.preventDefault();
      void this.handleInstructorLogin(e);
    };

    // Assemble
    modal.appendChild(header);
    modal.appendChild(form);
    overlay.appendChild(modal);

    // Click outside to close
    overlay.onclick = (e) => {
      if (e.target === overlay) this.closeInstructorModal();
    };

    // Append to body
    document.body.appendChild(overlay);
    this.modalOverlay = overlay;

    // Focus input
    setTimeout(() => input.focus(), 50);
  }

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
    // Filter to digits only
    this.pin = input.value.replace(/\D/g, '');
    this.errorMessage = '';
  }

  /**
   * Check if student form is valid
   */
  private isValid(): boolean {
    const name = this.name.trim();
    const serviceId = this.serviceId.trim();

    // Name: non-empty
    if (!name) return false;

    // Service ID: 2-10 alphanumeric
    const serviceIdPattern = /^[A-Za-z0-9]{2,10}$/;
    if (!serviceIdPattern.test(serviceId)) return false;

    // PIN: must be 4 digits
    if (this.pin.length !== 4) return false;

    return true;
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
    // Create overlay
    const overlay = document.createElement('div');
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
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 320px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    modal.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 12px;">✓</div>
      <h3 style="margin: 0 0 8px 0; font-size: 16px;">PIN Stored</h3>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #666;">
        Your PIN has been saved. Use it with your name and service ID on future logins.
      </p>
      <button id="qd-pin-confirmation-ok" style="
        background: #0066cc;
        color: white;
        border: none;
        padding: 8px 24px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      ">OK</button>
    `;

    // Close on button click
    const button = modal.querySelector('button');
    button?.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Auto-close after 3 seconds
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 30000);
  }

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

    // Clean up any modal overlays before hiding component
    this.cleanupModal();

    // Hide component on successful login
    this.updateVisibility();
  }

  /**
   * Open instructor modal
   */
  private openInstructorModal() {
    this.showInstructorModal = true;
    this.instructorPassword = '';
    this.renderInstructorModalToBody();
  }

  /**
   * Close instructor modal
   */
  private closeInstructorModal() {
    this.showInstructorModal = false;
    this.instructorPassword = '';
    this.cleanupModal();
  }

  /**
   * Handle Escape key
   */
  private handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.showInstructorModal) {
      this.closeInstructorModal();
    }
  };

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
   * Show error in modal
   */
  private showModalError(message: string): void {
    if (this.modalErrorDiv) {
      this.modalErrorDiv.textContent = message;
      this.modalErrorDiv.style.display = 'block';
    }
  }

  /**
   * Handle instructor login
   */
  private async handleInstructorLogin(e: Event) {
    e.preventDefault();

    if (!this.instructorPassword) {
      this.showModalError('Password is required');
      return;
    }

    try {
      const passwordHash = await this.hashPassword(this.instructorPassword);
      const expectedHash = this.getExpectedHash();

      if (!expectedHash) {
        this.showModalError('Instructor password not configured');
        return;
      }

      if (passwordHash !== expectedHash) {
        this.showModalError('Incorrect password');
        this.instructorPassword = '';
        // Clear the password input field
        if (this.modalPasswordInput) {
          this.modalPasswordInput.value = '';
          this.modalPasswordInput.focus();
        }
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

      // Close modal and hide component (don't remove - need to show again on logout)
      this.closeInstructorModal();
      this.updateVisibility();
    } catch (err) {
      this.showModalError('Login failed. Please try again.');
      console.error('Instructor login error:', err);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-login': QdLogin;
  }
}
