/**
 * Instructor Login Component
 *
 * Encapsulates the instructor authentication flow: the "Instructor" button, the
 * password modal, and verification. Extracted from `qd-login` so the login
 * component only owns the student flow.
 *
 * @element qd-instructor-login
 * @fires {CustomEvent<{serviceId:'INSTRUCTOR', name:'Instructor', release:string, role:'instructor'}>} qd:login - On successful instructor auth
 */

import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import { SessionService } from '../services/session.js';
import { readRelease } from '../config/dom-config-reader.js';
import {
  getExpectedInstructorHash,
  verifyInstructorPassword,
} from '../services/auth/instructor-auth.js';
import './qd-password-modal.js';

/**
 * Instructor login button + password modal.
 */
@customElement('qd-instructor-login')
export class QdInstructorLogin extends LitElement {
  /** Disable the button (e.g. while the parent form is submitting). */
  @property({ type: Boolean })
  disabled = false;

  @state()
  private showModal = false;

  @state()
  private error = '';

  static styles = css`
    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      background: #6c757d;
      color: white;
    }

    button:hover:not(:disabled) {
      background: #5a6268;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }
  `;

  render() {
    return html`
      <button type="button" class="instructor-btn" @click=${this.open} ?disabled=${this.disabled}>
        Instructor
      </button>

      <qd-password-modal
        .open=${this.showModal}
        title="Instructor Login"
        .error=${this.error}
        @qd:password-submit=${this.handleSubmit}
        @close=${this.handleClose}
      ></qd-password-modal>
    `;
  }

  private open = (): void => {
    this.showModal = true;
    this.error = '';
  };

  private handleClose = (): void => {
    this.showModal = false;
    this.error = '';
  };

  private handleSubmit = (e: CustomEvent<{ password: string }>): void => {
    void this.login(e.detail.password);
  };

  /**
   * Verify the password and, on success, create the instructor session and
   * emit `qd:login`.
   */
  private async login(password: string): Promise<void> {
    const expectedHash = getExpectedInstructorHash();
    if (!expectedHash) {
      this.error = 'Instructor password not configured';
      return;
    }

    try {
      if (!(await verifyInstructorPassword(password))) {
        this.error = 'Incorrect password';
        return;
      }

      const release = readRelease();

      const sessionService = new SessionService();
      sessionService.createSession('INSTRUCTOR', 'Instructor', release || '');
      sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');

      this.dispatchEvent(
        new CustomEvent('qd:login', {
          detail: {
            serviceId: 'INSTRUCTOR',
            name: 'Instructor',
            release: release || '',
            role: 'instructor',
          },
          bubbles: true,
          composed: true,
        }),
      );

      this.showModal = false;
      this.error = '';
    } catch (err) {
      this.error = 'Login failed. Please try again.';
      console.error('Instructor login error:', err);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor-login': QdInstructorLogin;
  }
}
