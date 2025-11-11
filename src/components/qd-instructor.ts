/**
 * QdInstructor Component
 *
 * Web component for instructor features including password unlock,
 * answer review, scores view, CSV export, and data management.
 *
 * Usage:
 *   <qd-instructor release="02-2025"></qd-instructor>
 *
 * Emits:
 *   qd:instructor-unlock - When instructor mode is unlocked
 *   qd:instructor-lock - When instructor mode is locked
 *   qd:data-cleared - When all data is erased
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { getSessionService } from '../services/session';

type InstructorMode = 'overview' | 'scores' | 'export' | 'manage';

@customElement('qd-instructor')
export class QdInstructor extends LitElement {
  /**
   * Release identifier (e.g., "02-2025")
   */
  @property({ type: String })
  release = '';

  /**
   * Whether instructor mode is unlocked
   */
  @property({ type: Boolean })
  unlocked = false;

  /**
   * Current view mode
   */
  @property({ type: String })
  mode: InstructorMode = 'overview';

  /**
   * Password input value
   */
  @state()
  private _password = '';

  /**
   * Error message for failed unlock attempts
   */
  @state()
  private _errorMessage = '';

  /**
   * Status message for successful operations
   */
  @state()
  private _statusMessage = '';

  /**
   * Confirmation text for data erasure
   */
  @state()
  private _confirmText = '';

  /**
   * Whether showing erase confirmation dialog
   */
  @state()
  private _showEraseDialog = false;

  /**
   * Student summaries for scores view
   */
  @state()
  private _studentSummaries: import('../types/contracts').StudentSummary[] = [];

  static styles = css`
    :host {
      display: block;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .container {
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h2 {
      margin: 0 0 1.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .unlock-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 400px;
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

    input[type='password'],
    input[type='text'] {
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

    button {
      padding: 0.75rem 1.5rem;
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

    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .unlock-button {
      background-color: #2e7d32;
    }

    .unlock-button:hover:not(:disabled) {
      background-color: #1b5e20;
    }

    .lock-button {
      background-color: #757575;
    }

    .lock-button:hover:not(:disabled) {
      background-color: #616161;
    }

    .erase-data {
      background-color: #d32f2f;
    }

    .erase-data:hover:not(:disabled) {
      background-color: #b71c1c;
    }

    .error {
      color: #d32f2f;
      font-size: 0.875rem;
      padding: 0.75rem;
      background: #ffebee;
      border: 1px solid #ffcdd2;
      border-radius: 4px;
      margin-top: 0.5rem;
    }

    .status {
      color: #2e7d32;
      font-size: 0.875rem;
      padding: 0.75rem;
      background: #e8f5e9;
      border: 1px solid #c8e6c9;
      border-radius: 4px;
      margin-top: 0.5rem;
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .controls button {
      flex: 0 0 auto;
    }

    .nav-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e0e0e0;
      margin-bottom: 1.5rem;
    }

    .tab {
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: #666;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab:hover {
      background: #f5f5f5;
      color: #333;
    }

    .tab.active {
      color: #0066cc;
      border-bottom-color: #0066cc;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    th {
      background: #f5f5f5;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e0e0e0;
      color: #333;
    }

    td {
      padding: 0.75rem;
      border-bottom: 1px solid #f0f0f0;
    }

    tr:hover {
      background: #fafafa;
    }

    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 500px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .dialog h3 {
      margin: 0 0 1rem 0;
      color: #d32f2f;
    }

    .dialog-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
      justify-content: flex-end;
    }

    .warning {
      background: #fff3e0;
      border: 1px solid #ffe0b2;
      padding: 1rem;
      border-radius: 4px;
      margin: 1rem 0;
      color: #e65100;
    }

    [aria-live] {
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    // Check session for existing unlock status
    const session = getSessionService();
    this.unlocked = session.isInstructorUnlocked();
  }

  render() {
    return html`
      <div class="container">
        ${this.unlocked ? this._renderUnlockedView() : this._renderLockedView()}
        <div aria-live="polite">${this._statusMessage}</div>
      </div>
      ${this._showEraseDialog ? this._renderEraseDialog() : ''}
    `;
  }

  private _renderLockedView() {
    return html`
      <h2>Instructor Access</h2>
      <p>Enter the instructor password to unlock advanced features.</p>

      <form class="unlock-form" @submit=${(e: Event) => this._handleUnlock(e)}>
        <div class="field">
          <label for="password">Instructor Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            .value=${this._password}
            @input=${(e: Event) => (this._password = (e.target as HTMLInputElement).value)}
            autofocus
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="unlock-button">Unlock Instructor Mode</button>
      </form>

      ${this._errorMessage ? html`<div class="error">${this._errorMessage}</div>` : ''}
    `;
  }

  private _renderUnlockedView() {
    return html`
      <h2>Instructor Dashboard</h2>

      <div class="controls">
        <button type="button" class="lock-button" @click=${() => this._handleLock()}>
          Lock Instructor Mode
        </button>
        <button type="button" class="export-csv" @click=${() => this._handleExport()}>
          Export CSV
        </button>
        <button type="button" class="erase-data" @click=${() => this._handleEraseRequest()}>
          Erase All Data
        </button>
      </div>

      <div class="nav-tabs">
        <button
          type="button"
          class="tab ${this.mode === 'overview' ? 'active' : ''}"
          @click=${() => (this.mode = 'overview')}
        >
          Overview
        </button>
        <button
          type="button"
          class="tab ${this.mode === 'scores' ? 'active' : ''}"
          @click=${() => (this.mode = 'scores')}
        >
          Student Scores
        </button>
      </div>

      ${this._renderModeContent()}
      ${this._statusMessage ? html`<div class="status">${this._statusMessage}</div>` : ''}
    `;
  }

  private _renderModeContent() {
    switch (this.mode) {
      case 'scores':
        return this._renderScoresView();
      case 'overview':
      default:
        return this._renderOverview();
    }
  }

  private _renderOverview() {
    return html`
      <div>
        <p>
          Instructor mode is active. You can now view correct answers, review student progress,
          export data, and manage the system.
        </p>
        <p>Use the tabs above to navigate between different views.</p>
      </div>
    `;
  }

  private _renderScoresView() {
    if (this._studentSummaries.length === 0) {
      return html`<p>No student data available. Students will appear here once they log in.</p>`;
    }

    return html`
      <table>
        <thead>
          <tr>
            <th scope="col">Service ID</th>
            <th scope="col">Name</th>
            <th scope="col">Attempted</th>
            <th scope="col">Correct</th>
            <th scope="col">Percentage</th>
            <th scope="col">Last Active</th>
          </tr>
        </thead>
        <tbody>
          ${this._studentSummaries.map(
            (student) => html`
              <tr>
                <td>${student.serviceId}</td>
                <td>${student.name}</td>
                <td>${student.attempted}</td>
                <td>${student.correct}</td>
                <td>${student.percentage.toFixed(1)}%</td>
                <td>${new Date(student.lastActive).toLocaleString()}</td>
              </tr>
            `,
          )}
        </tbody>
      </table>
    `;
  }

  private _renderEraseDialog() {
    return html`
      <div class="dialog-overlay" @click=${() => this._handleCancelErase()}>
        <div class="dialog" @click=${(e: Event) => e.stopPropagation()}>
          <h3>⚠️ Erase All Data</h3>
          <div class="warning">
            This action will permanently delete all student records, quiz answers, and analysis
            data. This cannot be undone.
          </div>
          <p>Type <strong>DELETE ALL</strong> to confirm:</p>
          <div class="field">
            <input
              type="text"
              .value=${this._confirmText}
              @input=${(e: Event) => (this._confirmText = (e.target as HTMLInputElement).value)}
              placeholder="DELETE ALL"
              autofocus
            />
          </div>
          <div class="dialog-actions">
            <button type="button" @click=${() => this._handleCancelErase()}>Cancel</button>
            <button
              type="button"
              class="erase-data"
              ?disabled=${this._confirmText !== 'DELETE ALL'}
              @click=${() => this._handleConfirmErase()}
            >
              Erase Everything
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private async _handleUnlock(e: Event) {
    e.preventDefault();
    this._errorMessage = '';

    if (!this._password) {
      this._errorMessage = 'Please enter a password';
      return;
    }

    // Validate password with hash
    const isValid = await this._validatePassword(this._password);

    if (isValid) {
      this.unlocked = true;
      const session = getSessionService();
      session.unlockInstructor();

      // Clear password from memory
      this._password = '';
      this._statusMessage = 'Instructor mode unlocked';

      // Emit unlock event
      this.dispatchEvent(
        new CustomEvent('qd:instructor-unlock', {
          detail: { timestamp: new Date().toISOString() },
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      this._errorMessage = 'Incorrect password. Please try again.';
      this._password = '';
    }
  }

  private _handleLock() {
    this.unlocked = false;
    const session = getSessionService();
    session.lockInstructor();

    this._statusMessage = 'Instructor mode locked';
    this.mode = 'overview';

    // Emit lock event
    this.dispatchEvent(
      new CustomEvent('qd:instructor-lock', {
        detail: { timestamp: new Date().toISOString() },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleExport() {
    this._statusMessage = 'CSV export functionality coming soon';
    // Full implementation in T086-T088
  }

  private _handleEraseRequest() {
    this._showEraseDialog = true;
    this._confirmText = '';
  }

  private _handleCancelErase() {
    this._showEraseDialog = false;
    this._confirmText = '';
  }

  private _handleConfirmErase() {
    if (this._confirmText !== 'DELETE ALL') {
      return;
    }

    // Full implementation in T089-T092
    this._showEraseDialog = false;
    this._confirmText = '';
    this._statusMessage = 'Data erasure functionality coming soon';

    // Emit data cleared event
    this.dispatchEvent(
      new CustomEvent('qd:data-cleared', {
        detail: { timestamp: new Date().toISOString() },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Validate instructor password using SHA-256 hash
   *
   * T070: Implements password validation with hashed storage
   */
  private async _validatePassword(password: string): Promise<boolean> {
    // Hash the input password
    const hash = await this._hashPassword(password);

    // Get stored hash from sessionStorage
    const storedHash = sessionStorage.getItem('qd/instructor');

    if (!storedHash) {
      // First time - set the password
      // In production, this should be configured differently
      // For now, we'll use a default password "instructor" for demo
      const defaultHash = await this._hashPassword('instructor');

      if (hash === defaultHash) {
        sessionStorage.setItem('qd/instructor', hash);
        return true;
      }
      return false;
    }

    // Compare hashes
    return hash === storedHash;
  }

  /**
   * Hash password using SHA-256
   */
  private async _hashPassword(password: string): Promise<string> {
    // Use Web Crypto API for hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor': QdInstructor;
  }
}
