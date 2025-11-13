/**
 * QdLogin Component
 *
 * Web component for student login. Captures service ID and name,
 * validates inputs, and emits qd:login event on successful submission.
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
   * Title displayed as fieldset legend (e.g., "Core Skills Assessment")
   */
  @property({ type: String })
  title = 'Core Skills Assessment';

  /**
   * Internal state for form validation
   */
  @state()
  private _isSubmitting = false;

  static styles = css`
    :host {
      display: block;
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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

    button {
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

    @media (max-width: 480px) {
      form {
        flex-direction: column;
      }

      button {
        align-self: stretch;
      }
    }
  `;

  render() {
    return html`
      <form @submit=${(e: Event) => this._handleSubmit(e)} novalidate>
        <div class="inputs-stack">
          <input
            type="text"
            id="serviceId"
            name="serviceId"
            required
            minlength="2"
            maxlength="${LIMITS.MAX_SERVICE_ID_LENGTH}"
            placeholder="Service ID (e.g., RN2344)"
            autocomplete="username"
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
            autocomplete="name"
            title="Name is required (1-100 characters)"
            aria-label="Name"
          />
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

    const serviceId = (formData.get('serviceId') as string | null)?.trim() || '';
    const name = (formData.get('name') as string | null)?.trim() || '';

    // Validate inputs
    if (!this._validateInputs(serviceId, name)) {
      return;
    }

    // Set submitting state
    this._isSubmitting = true;

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
