/**
 * QdLogin Component
 *
 * Web component for student and instructor login.
 * Supports two login modes: Student (service ID + name) and Instructor (password).
 *
 * Features compact vertical stack layout with button to the right.
 *
 * Usage:
 *   <qd-login release="02-2025" docId="core-acs" title="Core Skills Assessment"></qd-login>
 *
 * Properties:
 *   - release: Release identifier (e.g., "02-2025")
 *   - docId: Document identifier (e.g., "core-acs")
 *   - title: Fieldset title (default: "Core Skills Assessment")
 *
 * Emits:
 *   qd:login - Custom event with SessionData in detail (student login)
 *   qd:instructor-login - Custom event for instructor login
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { SessionData } from '../types/contracts';
import { LIMITS, SESSION_TIMEOUT_MS } from '../types/contracts';

type LoginMode = 'student' | 'instructor';

@customElement('qd-login')
export class QdLogin extends LitElement {
  /**
   * Release identifier (e.g., "02-2025")
   */
  @property({ type: String })
  release = '';

  /**
   * Document identifier (e.g., "core-acs")
   */
  @property({ type: String })
  docId = '';

  /**
   * Title displayed as fieldset legend (e.g., "Core Skills Assessment")
   */
  @property({ type: String })
  title = 'Core Skills Assessment';

  /**
   * Internal state for form validation
   */
  @state()
  private _isSubmitting = false;

  /**
   * Current login mode (student or instructor)
   */
  @state()
  private _loginMode: LoginMode = 'student';

  /**
   * Error message for failed login attempts
   */
  @state()
  private _errorMessage = '';

  static styles = css`
    :host {
      display: block;
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .mode-selector {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .mode-tab {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #666;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }

    .mode-tab:hover {
      background: #e8e8e8;
      color: #333;
    }

    .mode-tab.active {
      background: #0066cc;
      color: #ffffff;
      border-color: #0052a3;
    }

    form {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      gap: 0.75rem;
    }

    .inputs-stack {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    input {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      transition: border-color 0.2s;
      font-family: inherit;
      width: 100%;
    }

    input:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    input:invalid:not(:focus) {
      border-color: #d32f2f;
    }

    input:valid {
      border-color: #4caf50;
    }

    button[type='submit'] {
      padding: 0.5rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #ffffff;
      background-color: #0066cc;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
      font-family: inherit;
      white-space: nowrap;
      align-self: stretch;
    }

    button[type='submit']:hover:not(:disabled) {
      background-color: #0052a3;
    }

    button[type='submit']:active:not(:disabled) {
      background-color: #004080;
    }

    button[type='submit']:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .error {
      color: #d32f2f;
      font-size: 0.8125rem;
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #ffebee;
      border: 1px solid #ffcdd2;
      border-radius: 4px;
    }

    @media (max-width: 480px) {
      form {
        flex-direction: column;
      }

      button[type='submit'] {
        align-self: stretch;
      }
    }
  `;

  render() {
    return html`
      <div class="mode-selector">
        <button
          type="button"
          class="mode-tab ${this._loginMode === 'student' ? 'active' : ''}"
          @click=${() => this._handleModeChange('student')}
        >
          Student
        </button>
        <button
          type="button"
          class="mode-tab ${this._loginMode === 'instructor' ? 'active' : ''}"
          @click=${() => this._handleModeChange('instructor')}
        >
          Instructor
        </button>
      </div>

      <form @submit=${(e: Event) => this._handleSubmit(e)} novalidate>
        <div class="inputs-stack">${this._renderFormFields()}</div>

        <button type="submit" ?disabled=${this._isSubmitting}>
          ${this._isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      ${this._errorMessage ? html`<div class="error">${this._errorMessage}</div>` : ''}
    `;
  }

  private _renderFormFields() {
    if (this._loginMode === 'instructor') {
      return html`
        <input
          type="password"
          id="password"
          name="password"
          required
          placeholder="Instructor password"
          autocomplete="current-password"
          autofocus
          aria-label="Instructor password"
        />
      `;
    }

    return html`
      <input
        type="text"
        id="serviceId"
        name="serviceId"
        required
        minlength="2"
        maxlength="${LIMITS.MAX_SERVICE_ID_LENGTH}"
        placeholder="Service ID (e.g., RN2344)"
        autocomplete="off"
        autofocus
        pattern="[A-Za-z0-9]+"
        title="Service ID must be alphanumeric, 2-10 characters"
        aria-label="Service ID"
      />

      <input
        type="text"
        id="name"
        name="name"
        required
        minlength="1"
        maxlength="${LIMITS.MAX_NAME_LENGTH}"
        placeholder="Name (e.g., J Corner)"
        autocomplete="off"
        title="Name is required (1-100 characters)"
        aria-label="Name"
      />
    `;
  }

  private _handleModeChange(mode: LoginMode) {
    this._loginMode = mode;
    this._errorMessage = '';
  }

  private _handleSubmit(e: Event) {
    e.preventDefault();

    if (this._loginMode === 'instructor') {
      void this._handleInstructorLogin(e);
    } else {
      this._handleStudentLogin(e);
    }
  }

  private _handleStudentLogin(e: Event) {
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const serviceId = (formData.get('serviceId') as string | null)?.trim() || '';
    const name = (formData.get('name') as string | null)?.trim() || '';

    // Validate inputs
    if (!this._validateInputs(serviceId, name)) {
      return;
    }

    // Set submitting state
    this._isSubmitting = true;
    this._errorMessage = '';

    // Create session data
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString();

    const sessionData: SessionData = {
      serviceId,
      name,
      release: this.release || this._inferRelease(),
      loginTime: now,
      lastActivity: now,
      expiresAt,
      instructorUnlocked: false,
    };

    // Emit login event
    this.dispatchEvent(
      new CustomEvent('qd:login', {
        detail: sessionData,
        bubbles: true,
        composed: true,
      }),
    );

    // Reset submitting state after short delay
    setTimeout(() => {
      this._isSubmitting = false;
    }, 500);
  }

  private async _handleInstructorLogin(e: Event) {
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const password = (formData.get('password') as string | null)?.trim() || '';

    if (!password) {
      this._errorMessage = 'Please enter the instructor password';
      return;
    }

    // Set submitting state
    this._isSubmitting = true;
    this._errorMessage = '';

    // Validate password against stored hash
    const isValid = await this._validateInstructorPassword(password);

    if (isValid) {
      // Emit instructor login event with release info
      this.dispatchEvent(
        new CustomEvent('qd:instructor-login', {
          detail: {
            timestamp: new Date().toISOString(),
            release: this.release || this._inferRelease(),
          },
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      this._errorMessage = 'Incorrect instructor password';
    }

    // Reset submitting state
    this._isSubmitting = false;
  }

  private async _validateInstructorPassword(password: string): Promise<boolean> {
    try {
      // Hash the input password using SHA-256 (first 12 characters)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 12);

      // Get stored hash from DOM (injected by Oxygen publishing)
      const hashSpan = document.getElementById('instructor.password.hash');
      const storedHash = hashSpan?.textContent?.trim();

      if (!storedHash) {
        // No hash configured, use default for demo
        console.warn('No instructor password hash found, using default');
        const defaultHash = await this._hashPassword('instructor');
        return hashHex === defaultHash;
      }

      return hashHex === storedHash;
    } catch (error) {
      console.error('Failed to validate instructor password:', error);
      return false;
    }
  }

  private async _hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Return first 12 characters for author-friendly Oxygen dialogs
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 12);
  }

  private _validateInputs(serviceId: string, name: string): boolean {
    // Service ID validation
    if (serviceId.length < 2 || serviceId.length > LIMITS.MAX_SERVICE_ID_LENGTH) {
      this._showError('Service ID must be 2-10 characters');
      return false;
    }

    if (!/^[A-Za-z0-9]+$/.test(serviceId)) {
      this._showError('Service ID must be alphanumeric');
      return false;
    }

    // Name validation
    if (name.length < 1 || name.length > LIMITS.MAX_NAME_LENGTH) {
      this._showError(`Name must be 1-${LIMITS.MAX_NAME_LENGTH} characters`);
      return false;
    }

    return true;
  }

  private _showError(message: string) {
    // For now, use browser's built-in validation UI
    // Could enhance with custom error display later
    console.warn('Login validation error:', message);
  }

  private _inferRelease(): string {
    // Try to infer release from document title or filename
    // Default to current month-year if not found
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${month}-${year}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-login': QdLogin;
  }
}
