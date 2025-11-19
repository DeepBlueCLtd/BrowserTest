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
import { STORAGE_KEYS } from '../types/contracts.js';
import type { SessionData } from '../types/contracts.js';
import { getJSON } from '../utils/storage-helpers.js';
import { SessionService } from '../services/session.js';
import { CONFIG_IDS } from '../config/dom-config-reader.js';
import { hashPassword } from '../utils/security.js';
import './qd-instructor-login-modal.js';

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
   * Error message to display
   */
  @state()
  private errorMessage = '';

  /**
   * Instructor error message
   */
  @state()
  private instructorError = '';

  /**
   * Whether form is currently submitting
   */
  @state()
  private isSubmitting = false;

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
    document.addEventListener('qd:logout', this.handleLogoutEvent);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('qd:logout', this.handleLogoutEvent);
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
    this.instructorError = '';
    this.isSubmitting = false;
    this.showInstructorModal = false;

    // Show login form
    this.updateVisibility();
  };

  render() {
    return html`
      <div class="login-container">
        <div class="title">${this.title}</div>

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

          <button type="submit" class="login-btn" ?disabled=${this.isSubmitting || !this.isValid()}>
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
        </form>
      </div>

      <qd-instructor-login-modal
        ?open=${this.showInstructorModal}
        .error=${this.instructorError}
        @submit=${(e: CustomEvent<{ password: string }>) => this.handleInstructorModalSubmit(e)}
        @close=${() => this.closeInstructorModal()}
        @clear-error=${() => this.clearInstructorError()}
      ></qd-instructor-login-modal>
    `;
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
  private handleStudentLogin(e: Event) {
    e.preventDefault();

    if (!this.isValid()) {
      this.errorMessage = 'Please enter valid name and service ID (2-10 alphanumeric)';
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

      // Create session in storage
      const sessionService = new SessionService();
      sessionService.createSession(this.serviceId.trim(), this.name.trim(), release);

      const loginData: LoginData = {
        serviceId: this.serviceId.trim(),
        name: this.name.trim(),
        release,
        role: 'student',
      };

      const event = new CustomEvent('qd:login', {
        detail: loginData,
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);

      // Hide component on successful login (don't remove - need to show again on logout)
      this.updateVisibility();
    } catch (err) {
      this.errorMessage = 'Login failed. Please try again.';
      console.error('Student login error:', err);
      this.isSubmitting = false;
    }
  }

  /**
   * Open instructor modal
   */
  private openInstructorModal() {
    this.showInstructorModal = true;
    this.instructorError = '';
  }

  /**
   * Close instructor modal
   */
  private closeInstructorModal = () => {
    this.showInstructorModal = false;
    this.instructorError = '';
  };

  /**
   * Clear instructor error message
   */
  private clearInstructorError = () => {
    this.instructorError = '';
  };

  /**
   * Get expected password hash from hidden element
   */
  private getExpectedHash(): string {
    const hashElement = document.getElementById(CONFIG_IDS.instructorHash);
    return hashElement?.textContent?.trim() || '';
  }

  /**
   * Handle instructor modal submit event
   */
  private async handleInstructorModalSubmit(e: CustomEvent<{ password: string }>) {
    const password = e.detail.password;

    if (!password) {
      this.instructorError = 'Password is required';
      return;
    }

    try {
      // Hash password with 12-character truncation for Oxygen compatibility
      const passwordHash = await hashPassword(password, 12);
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

      // Close modal and hide component (don't remove - need to show again on logout)
      this.closeInstructorModal();
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
