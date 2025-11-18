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
      z-index: 1000;
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
    this.updateVisibility();
  };

  render() {
    return html`
      <div class="login-container">
        <div class="title">${this.title}</div>

        <form class="login-form" @submit=${(e: Event) => this.handleStudentLogin(e)}>
          <input
            type="text"
            placeholder="Name (J Smith)"
            .value=${this.name}
            @input=${(e: Event) => this.handleNameInput(e)}
            ?disabled=${this.isSubmitting}
            required
          />

          <input
            type="text"
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

      ${this.showInstructorModal ? this.renderInstructorModal() : ''}
    `;
  }

  private renderInstructorModal() {
    return html`
      <div class="modal-overlay" @click=${() => this.handleOverlayClick()}>
        <div class="modal" @click=${(e: Event) => this.stopPropagation(e)}>
          <div class="modal-header">
            <h3 class="modal-title">Instructor Login</h3>
            <button type="button" class="close-btn" @click=${() => this.closeInstructorModal()}>
              ×
            </button>
          </div>

          <form @submit=${(e: Event) => this.handleInstructorLogin(e)}>
            <div class="modal-body">
              <input
                type="password"
                placeholder="Password"
                .value=${this.instructorPassword}
                @input=${(e: Event) => this.handleInstructorPasswordInput(e)}
                required
                autofocus
              />

              ${this.instructorError
                ? html`<div class="error-message">${this.instructorError}</div>`
                : ''}
            </div>

            <div class="modal-footer">
              <button type="button" class="cancel-btn" @click=${() => this.closeInstructorModal()}>
                Cancel
              </button>
              <button type="submit" class="login-btn">Login</button>
            </div>
          </form>
        </div>
      </div>
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
   * Handle instructor password input
   */
  private handleInstructorPasswordInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.instructorPassword = input.value;
    this.instructorError = '';
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
   * Looks for: .wh_publication_title .title span
   */
  private getRelease(): string {
    const titleElement = document.querySelector('.wh_publication_title .title');
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
        this.errorMessage = 'Release not found (missing .wh_publication_title .title element)';
        this.isSubmitting = false;
        return;
      }

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

      // Remove component from DOM on successful login
      this.remove();
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
    this.instructorPassword = '';
    this.instructorError = '';
  }

  /**
   * Close instructor modal
   */
  private closeInstructorModal() {
    this.showInstructorModal = false;
    this.instructorPassword = '';
    this.instructorError = '';
  }

  /**
   * Handle click on modal overlay
   */
  private handleOverlayClick() {
    this.closeInstructorModal();
  }

  /**
   * Stop event propagation (prevent closing on modal click)
   */
  private stopPropagation(e: Event) {
    e.stopPropagation();
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
    const hashElement = document.getElementById('instructor.password.hash');
    return hashElement?.textContent?.trim() || '';
  }

  /**
   * Handle instructor login
   */
  private async handleInstructorLogin(e: Event) {
    e.preventDefault();

    if (!this.instructorPassword) {
      this.instructorError = 'Password is required';
      return;
    }

    try {
      const passwordHash = await this.hashPassword(this.instructorPassword);
      const expectedHash = this.getExpectedHash();

      if (!expectedHash) {
        this.instructorError = 'Instructor password not configured';
        return;
      }

      if (passwordHash !== expectedHash) {
        this.instructorError = 'Incorrect password';
        this.instructorPassword = '';
        // TODO: Implement rate limiting (5 attempts per 60 seconds)
        return;
      }

      // Success
      const release = this.getRelease();
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

      // Close modal and remove component
      this.closeInstructorModal();
      this.remove();
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
