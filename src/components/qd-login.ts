/**
 * QdLogin Component
 *
 * Web component for student login. Captures service ID and name,
 * validates inputs, and emits qd:login event on successful submission.
 *
 * Usage:
 *   <qd-login release="02-2025" docId="core-acs"></qd-login>
 *
 * Emits:
 *   qd:login - Custom event with SessionData in detail
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { SessionData } from '../types/contracts';
import { LIMITS, SESSION_TIMEOUT_MS } from '../types/contracts';

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
   * Internal state for form validation
   */
  @state()
  private _isSubmitting = false;

  static styles = css`
    :host {
      display: block;
      max-width: 400px;
      margin: 0 auto;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        'Helvetica Neue', Arial, sans-serif;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h2 {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      text-align: center;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #555;
    }

    input {
      padding: 0.75rem;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      transition: border-color 0.2s;
      font-family: inherit;
    }

    input:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }

    input:invalid:not(:focus) {
      border-color: #d32f2f;
    }

    input:valid {
      border-color: #4caf50;
    }

    .hint {
      font-size: 0.75rem;
      color: #666;
      margin-top: -0.25rem;
    }

    button {
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: #ffffff;
      background-color: #0066cc;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
      font-family: inherit;
    }

    button:hover:not(:disabled) {
      background-color: #0052a3;
    }

    button:active:not(:disabled) {
      background-color: #004080;
    }

    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .error {
      color: #d32f2f;
      font-size: 0.875rem;
      text-align: center;
    }

    @media (max-width: 480px) {
      :host {
        padding: 1rem;
      }

      form {
        padding: 1.5rem;
      }
    }
  `;

  render() {
    return html`
      <form @submit=${this._handleSubmit} novalidate>
        <h2>Student Login</h2>

        <div class="field">
          <label for="serviceId">Service ID</label>
          <input
            type="text"
            id="serviceId"
            name="serviceId"
            required
            minlength="2"
            maxlength="${LIMITS.MAX_SERVICE_ID_LENGTH}"
            placeholder="e.g., RN2344"
            autocomplete="username"
            autofocus
            pattern="[A-Za-z0-9]+"
            title="Service ID must be alphanumeric, 2-10 characters"
          />
          <span class="hint">Enter your service ID (2-10 alphanumeric characters)</span>
        </div>

        <div class="field">
          <label for="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            minlength="1"
            maxlength="${LIMITS.MAX_NAME_LENGTH}"
            placeholder="e.g., Smith, J"
            autocomplete="name"
            title="Name is required (1-100 characters)"
          />
          <span class="hint">Enter your name (e.g., Last, First Initial)</span>
        </div>

        <button type="submit" ?disabled=${this._isSubmitting}>
          ${this._isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    `;
  }

  private _handleSubmit(e: Event) {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const serviceId = formData.get('serviceId')?.toString().trim() || '';
    const name = formData.get('name')?.toString().trim() || '';

    // Validate inputs
    if (!this._validateInputs(serviceId, name)) {
      return;
    }

    // Set submitting state
    this._isSubmitting = true;

    // Create session data
    const now = new Date().toISOString();
    const expiresAt = new Date(
      Date.now() + SESSION_TIMEOUT_MS,
    ).toISOString();

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

// Export type for use in tests and other modules
export type { QdLogin };

declare global {
  interface HTMLElementTagNameMap {
    'qd-login': QdLogin;
  }
}
