/**
 * PIN Creation Component
 *
 * Modal component for creating a new 4-digit PIN.
 * Requires confirmation and validates format before accepting.
 *
 * @element qd-pin-create
 * @fires {CustomEvent<{pinHash: string}>} qd:pin-created - Emitted on successful PIN creation
 * @fires {CustomEvent} qd:pin-cancelled - Emitted when creation is cancelled
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { hashPin, validatePinFormat, validatePinConfirmation } from '../services/auth/pin-service.js';
import { PIN_CONSTANTS } from '../types/contracts.js';

@customElement('qd-pin-create')
export class QdPinCreate extends LitElement {
  /**
   * First PIN entry
   */
  @state()
  private pin = '';

  /**
   * Confirmation PIN entry
   */
  @state()
  private confirmPin = '';

  /**
   * Error message to display
   */
  @state()
  private errorMessage = '';

  /**
   * Whether form is submitting
   */
  @state()
  private isSubmitting = false;

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
    }

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
      z-index: 99999;
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
      margin-bottom: 16px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .modal-description {
      font-size: 12px;
      color: #666;
      margin: 0;
      line-height: 1.4;
    }

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    input {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      letter-spacing: 4px;
      text-align: center;
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

    .error-message {
      color: #d32f2f;
      font-size: 11px;
      margin-top: 8px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
      border-left: 3px solid #d32f2f;
    }

    .modal-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }

    .cancel-btn {
      background: #e0e0e0;
      color: #333;
    }

    .cancel-btn:hover {
      background: #d0d0d0;
    }

    .submit-btn {
      background: #0066cc;
      color: white;
    }

    .submit-btn:hover:not(:disabled) {
      background: #0052a3;
    }

    .submit-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .pin-requirements {
      font-size: 11px;
      color: #666;
      margin-top: 4px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleEscape);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleEscape);
  }

  private handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.handleCancel();
    }
  };

  render() {
    return html`
      <div class="modal-overlay" @click=${this.handleOverlayClick}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-header">
            <h3 class="modal-title">Create Your PIN</h3>
            <p class="modal-description">
              Create a ${PIN_CONSTANTS.PIN_LENGTH}-digit PIN to protect your quiz data.
              You'll need this PIN each time you log in.
            </p>
          </div>

          <form @submit=${this.handleSubmit}>
            <div class="form-group">
              <label for="pin">Enter PIN</label>
              <input
                id="pin"
                type="password"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="${PIN_CONSTANTS.PIN_LENGTH}"
                autocomplete="new-password"
                aria-label="Enter your ${PIN_CONSTANTS.PIN_LENGTH}-digit PIN"
                aria-describedby="pin-requirements"
                .value=${this.pin}
                @input=${this.handlePinInput}
                ?disabled=${this.isSubmitting}
                placeholder="••••"
                required
              />
              <div id="pin-requirements" class="pin-requirements">
                Must be exactly ${PIN_CONSTANTS.PIN_LENGTH} digits
              </div>
            </div>

            <div class="form-group">
              <label for="confirm-pin">Confirm PIN</label>
              <input
                id="confirm-pin"
                type="password"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="${PIN_CONSTANTS.PIN_LENGTH}"
                autocomplete="new-password"
                aria-label="Confirm your ${PIN_CONSTANTS.PIN_LENGTH}-digit PIN"
                .value=${this.confirmPin}
                @input=${this.handleConfirmInput}
                ?disabled=${this.isSubmitting}
                placeholder="••••"
                required
              />
            </div>

            ${this.errorMessage
              ? html`<div class="error-message">${this.errorMessage}</div>`
              : ''}

            <div class="modal-footer">
              <button
                type="button"
                class="cancel-btn"
                @click=${this.handleCancel}
                ?disabled=${this.isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="submit-btn"
                ?disabled=${this.isSubmitting || !this.isValid()}
              >
                ${this.isSubmitting ? 'Creating...' : 'Create PIN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private handleOverlayClick = () => {
    // Don't close on overlay click - PIN creation is required
    // Could add shake animation to indicate required
  };

  private handlePinInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    // Filter to digits only
    this.pin = input.value.replace(/\D/g, '');
    this.errorMessage = '';
  };

  private handleConfirmInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    // Filter to digits only
    this.confirmPin = input.value.replace(/\D/g, '');
    this.errorMessage = '';
  };

  private isValid(): boolean {
    return (
      this.pin.length === PIN_CONSTANTS.PIN_LENGTH &&
      this.confirmPin.length === PIN_CONSTANTS.PIN_LENGTH
    );
  }

  private handleSubmit = async (e: Event) => {
    e.preventDefault();

    // Validate PIN format
    const formatResult = validatePinFormat(this.pin);
    if (!formatResult.valid) {
      this.errorMessage = formatResult.error || 'Invalid PIN format';
      return;
    }

    // Validate confirmation matches
    const confirmResult = validatePinConfirmation(this.pin, this.confirmPin);
    if (!confirmResult.valid) {
      this.errorMessage = confirmResult.error || 'PINs do not match';
      return;
    }

    this.isSubmitting = true;

    try {
      // Hash the PIN
      const pinHash = await hashPin(this.pin);

      // Clear PIN from memory
      this.pin = '';
      this.confirmPin = '';

      // Emit success event
      const event = new CustomEvent('qd:pin-created', {
        detail: { pinHash },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    } catch (err) {
      this.errorMessage = 'Failed to create PIN. Please try again.';
      console.error('PIN creation error:', err);
      this.isSubmitting = false;
    }
  };

  private handleCancel = () => {
    // Clear PIN from memory
    this.pin = '';
    this.confirmPin = '';

    const event = new CustomEvent('qd:pin-cancelled', {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-pin-create': QdPinCreate;
  }
}
