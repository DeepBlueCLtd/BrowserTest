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
import {
  aggregateStudentScores,
  sortByServiceId,
  sortByScore,
  sortByName,
  sortByPercentage,
  type AggregatedScores,
} from '../services/scores';
import {
  exportStudentSummary,
  exportDetailedAnswers,
  downloadCSV,
  generateFilename,
  type ExportFormat,
} from '../services/csv-export';
import { getStorageAdapter } from '../services/storage/indexeddb';
import type { StudentRecord } from '../types/contracts';
import { constantTimeCompare } from '../utils/security';
import { RateLimiter } from '../utils/rate-limiter';

type InstructorMode = 'overview' | 'scores' | 'export' | 'manage';
type SortField = 'serviceId' | 'name' | 'score' | 'percentage';

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
   * Aggregated scores data from scores service
   */
  @state()
  private _aggregatedScores: AggregatedScores | null = null;

  /**
   * Current sort field for scores table
   */
  @state()
  private _sortField: SortField = 'serviceId';

  /**
   * Raw student records (loaded from IndexedDB)
   */
  @state()
  private _studentRecords: StudentRecord[] = [];

  /**
   * Export format selection
   */
  @state()
  private _exportFormat: ExportFormat = 'summary';

  /**
   * Rate limiter for authentication attempts
   */
  private _rateLimiter: RateLimiter;

  /**
   * Lockout time remaining in seconds
   */
  @state()
  private _lockoutSecondsRemaining = 0;

  /**
   * Lockout timer interval ID
   */
  private _lockoutTimer: number | null = null;

  constructor() {
    super();
    this._rateLimiter = new RateLimiter('instructor-auth', {
      maxAttempts: 5,
      windowMs: 30000,
      baseDelayMs: 2000,
      maxDelayMs: 30000,
    });
  }

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

    .scores-summary {
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .scores-summary h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
    }

    .scores-summary p {
      margin: 0;
      color: #555;
    }

    .sort-controls {
      margin-bottom: 1rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .sort-controls label {
      font-weight: 500;
      color: #555;
    }

    .sort-controls button {
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      background: #ffffff;
      color: #333;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
    }

    .sort-controls button:hover {
      background: #f5f5f5;
    }

    .sort-controls button.active {
      background: #0066cc;
      color: #ffffff;
      border-color: #0052a3;
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

  private _broadcastChannel: BroadcastChannel | null = null;

  connectedCallback() {
    super.connectedCallback();
    // Check session for existing unlock status
    const session = getSessionService();
    this.unlocked = session.isInstructorUnlocked();

    // Setup cross-tab sync listener
    this._setupCrossTabSync();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up broadcast channel
    if (this._broadcastChannel) {
      this._broadcastChannel.close();
      this._broadcastChannel = null;
    }
    // Clean up lockout timer
    if (this._lockoutTimer !== null) {
      clearInterval(this._lockoutTimer);
      this._lockoutTimer = null;
    }
  }

  /**
   * Setup cross-tab synchronization for data erasure
   * T092: Listen for data-cleared events from other tabs
   */
  private _setupCrossTabSync(): void {
    try {
      this._broadcastChannel = new BroadcastChannel('qd-system');

      this._broadcastChannel.onmessage = (event) => {
        const data = event.data as { type: string; timestamp?: string };
        if (data.type === 'data-cleared') {
          // Another tab cleared all data - reset our state
          this._studentRecords = [];
          this._aggregatedScores = null;
          this._statusMessage = 'Data was cleared in another window';
          this.requestUpdate();
        }
      };
    } catch (error) {
      // BroadcastChannel might not be supported
      console.warn('Cross-tab sync not available:', error);
    }
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
    const isLockedOut = this._lockoutSecondsRemaining > 0;

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
            ?disabled=${isLockedOut}
            autofocus
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="unlock-button" ?disabled=${isLockedOut}>
          ${isLockedOut
            ? `Locked (${this._lockoutSecondsRemaining}s remaining)`
            : 'Unlock Instructor Mode'}
        </button>
      </form>

      ${this._errorMessage ? html`<div class="error">${this._errorMessage}</div>` : ''}
      ${isLockedOut
        ? html`<div class="warning">
            Account temporarily locked due to multiple failed attempts. Please wait
            ${this._lockoutSecondsRemaining} second${this._lockoutSecondsRemaining === 1 ? '' : 's'}
            before trying again.
          </div>`
        : ''}
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
    // Load data if not already loaded
    if (this._aggregatedScores === null && this._studentRecords.length === 0) {
      // Trigger data loading - intentionally not awaited as this is in render
      void this._loadStudentRecords();
      return html`<p>Loading student data...</p>`;
    }

    if (!this._aggregatedScores || this._aggregatedScores.students.length === 0) {
      return html`<p>No student data available. Students will appear here once they log in.</p>`;
    }

    return html`
      <div>
        <!-- Summary Statistics -->
        <div class="scores-summary">
          <h3>Overall Statistics</h3>
          <p>
            <strong>Total Students:</strong> ${this._aggregatedScores.totalStudents} |
            <strong>Total Attempted:</strong> ${this._aggregatedScores.totalAttempted} |
            <strong>Total Correct:</strong> ${this._aggregatedScores.totalCorrect} |
            <strong>Average:</strong> ${this._aggregatedScores.averagePercentage.toFixed(1)}%
          </p>
        </div>

        <!-- Sort Controls -->
        <div class="sort-controls">
          <label>Sort by:</label>
          <button
            class="${this._sortField === 'serviceId' ? 'active' : ''}"
            @click=${() => this._handleSortChange('serviceId')}
          >
            Service ID
          </button>
          <button
            class="${this._sortField === 'name' ? 'active' : ''}"
            @click=${() => this._handleSortChange('name')}
          >
            Name
          </button>
          <button
            class="${this._sortField === 'score' ? 'active' : ''}"
            @click=${() => this._handleSortChange('score')}
          >
            Score
          </button>
          <button
            class="${this._sortField === 'percentage' ? 'active' : ''}"
            @click=${() => this._handleSortChange('percentage')}
          >
            Percentage
          </button>
        </div>

        <!-- Scores Table -->
        <table>
          <thead>
            <tr>
              <th scope="col">Service ID</th>
              <th scope="col">Name</th>
              <th scope="col">Attempted</th>
              <th scope="col">Correct</th>
              <th scope="col">Percentage</th>
              <th scope="col">Pages Complete</th>
            </tr>
          </thead>
          <tbody>
            ${this._aggregatedScores.students.map(
              (student) => html`
                <tr>
                  <td>${student.serviceId}</td>
                  <td>${student.name}</td>
                  <td>${student.totalAttempted}</td>
                  <td>${student.totalCorrect}</td>
                  <td>${student.percentage.toFixed(1)}%</td>
                  <td>${student.pagesComplete} / ${student.pagesTotal}</td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
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

    // Check rate limiting
    if (!this._rateLimiter.isAllowed()) {
      const remainingMs = this._rateLimiter.getLockoutTimeRemaining();
      this._startLockoutTimer(remainingMs);
      const seconds = Math.ceil(remainingMs / 1000);
      this._errorMessage = `Too many failed attempts. Please wait ${seconds} seconds before trying again.`;
      this._password = '';
      return;
    }

    // Validate password with hash
    const isValid = await this._validatePassword(this._password);

    // Record attempt with rate limiter
    this._rateLimiter.recordAttempt(isValid);

    if (isValid) {
      this.unlocked = true;
      const session = getSessionService();
      session.unlockInstructor();

      // Clear password from memory
      this._password = '';
      this._statusMessage = 'Instructor mode unlocked';
      this._lockoutSecondsRemaining = 0;

      // Clear any lockout timer
      if (this._lockoutTimer !== null) {
        clearInterval(this._lockoutTimer);
        this._lockoutTimer = null;
      }

      // Emit unlock event
      this.dispatchEvent(
        new CustomEvent('qd:instructor-unlock', {
          detail: { timestamp: new Date().toISOString() },
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      const attemptCount = this._rateLimiter.getAttemptCount();
      const maxAttempts = 5;
      const remaining = maxAttempts - attemptCount;

      if (remaining > 0) {
        this._errorMessage = `Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`;
      } else {
        // Start lockout timer
        const lockoutMs = this._rateLimiter.getLockoutTimeRemaining();
        this._startLockoutTimer(lockoutMs);
        const seconds = Math.ceil(lockoutMs / 1000);
        this._errorMessage = `Too many failed attempts. Locked out for ${seconds} seconds.`;
      }

      this._password = '';
    }
  }

  /**
   * Start lockout countdown timer
   */
  private _startLockoutTimer(remainingMs: number): void {
    this._lockoutSecondsRemaining = Math.ceil(remainingMs / 1000);

    if (this._lockoutTimer !== null) {
      clearInterval(this._lockoutTimer);
    }

    this._lockoutTimer = window.setInterval(() => {
      this._lockoutSecondsRemaining--;

      if (this._lockoutSecondsRemaining <= 0) {
        if (this._lockoutTimer !== null) {
          clearInterval(this._lockoutTimer);
          this._lockoutTimer = null;
        }
        this._errorMessage = '';
      }
    }, 1000);
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

  private async _handleExport() {
    // Ensure data is loaded
    if (this._studentRecords.length === 0) {
      await this._loadStudentRecords();
    }

    if (this._studentRecords.length === 0) {
      this._errorMessage = 'No student data to export';
      return;
    }

    try {
      // Generate CSV based on selected format
      let csvContent: string;

      switch (this._exportFormat) {
        case 'summary':
          csvContent = exportStudentSummary(this._studentRecords, this.release);
          break;

        case 'detailed':
          csvContent = exportDetailedAnswers(this._studentRecords, this.release);
          break;

        case 'per-page':
          // For per-page, we'll export all pages for now
          // In future, could add page selection UI
          csvContent = exportDetailedAnswers(this._studentRecords, this.release);
          break;

        default:
          csvContent = exportStudentSummary(this._studentRecords, this.release);
      }

      // Generate filename and trigger download
      const filename = generateFilename(`sonar-quiz-${this._exportFormat}-${this.release}`);
      downloadCSV(csvContent, filename);

      this._statusMessage = `CSV exported successfully: ${filename}`;
      this._errorMessage = '';
    } catch (error) {
      this._errorMessage = `Failed to export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this._statusMessage = '';
    }
  }

  private _handleEraseRequest() {
    this._showEraseDialog = true;
    this._confirmText = '';
  }

  private _handleCancelErase() {
    this._showEraseDialog = false;
    this._confirmText = '';
  }

  private async _handleConfirmErase() {
    if (this._confirmText !== 'DELETE ALL') {
      return;
    }

    try {
      // Clear IndexedDB
      const storage = getStorageAdapter();
      await storage.init();
      await storage.clearAll();

      // Clear sessionStorage
      const session = getSessionService();
      session.clearSession();
      session.clearCache();

      // Clear instructor password
      sessionStorage.removeItem('qd/instructor');

      // T092: Broadcast erasure to other tabs via BroadcastChannel
      this._broadcastDataCleared();

      // Reset local state
      this._studentRecords = [];
      this._aggregatedScores = null;
      this._showEraseDialog = false;
      this._confirmText = '';
      this._statusMessage = 'All data has been permanently erased';
      this._errorMessage = '';

      // Emit data cleared event
      this.dispatchEvent(
        new CustomEvent('qd:data-cleared', {
          detail: { timestamp: new Date().toISOString() },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      this._errorMessage = `Failed to erase data: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this._statusMessage = '';
      this._showEraseDialog = false;
      this._confirmText = '';
    }
  }

  /**
   * Broadcast data cleared event to other tabs
   * T092: Implement cross-tab sync for data erasure
   */
  private _broadcastDataCleared(): void {
    try {
      // Use BroadcastChannel for cross-tab communication
      const channel = new BroadcastChannel('qd-system');
      channel.postMessage({
        type: 'data-cleared',
        timestamp: new Date().toISOString(),
      });
      channel.close();
    } catch (error) {
      // BroadcastChannel might not be supported in all browsers
      console.warn('Failed to broadcast data cleared event:', error);
    }
  }

  /**
   * Validate instructor password using SHA-256 hash
   *
   * Security: Uses environment variable for password hash and constant-time comparison
   * to prevent timing attacks. No hardcoded passwords.
   */
  private async _validatePassword(password: string): Promise<boolean> {
    // Hash the input password
    const hash = await this._hashPassword(password);

    // Get configured password hash from environment variable
    const configuredHash = import.meta.env.VITE_INSTRUCTOR_PASSWORD_HASH;

    if (!configuredHash || configuredHash.length === 0) {
      console.error('VITE_INSTRUCTOR_PASSWORD_HASH not configured');
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    const isValid = constantTimeCompare(hash, configuredHash);

    if (isValid) {
      // Store the hash in sessionStorage for this session
      sessionStorage.setItem('qd/instructor', hash);
    }

    return isValid;
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

  /**
   * Load all student records from IndexedDB
   * T081: Load student data for scores aggregation
   */
  private async _loadStudentRecords(): Promise<void> {
    try {
      const storage = getStorageAdapter();
      await storage.init();

      // Load all students for the current release
      if (this.release) {
        this._studentRecords = await storage.getStudentsByRelease(this.release);
      } else {
        // If no release specified, try to get from session
        const session = getSessionService();
        const sessionData = session.getSession();

        if (sessionData?.release) {
          this._studentRecords = await storage.getStudentsByRelease(sessionData.release);
        } else {
          this._studentRecords = [];
        }
      }

      this._aggregateScores();
      this.requestUpdate(); // Force re-render
    } catch (error) {
      console.error('Failed to load student records:', error);
      this._errorMessage = 'Failed to load student data';
      this._studentRecords = [];
    }
  }

  /**
   * Aggregate scores from loaded student records
   * T081: Use scores service to aggregate data
   */
  private _aggregateScores(): void {
    if (this._studentRecords.length === 0) {
      this._aggregatedScores = null;
      return;
    }

    // Sort students based on current sort field
    const sorted = this._sortStudents([...this._studentRecords]);

    // Aggregate scores
    this._aggregatedScores = aggregateStudentScores(sorted);
  }

  /**
   * Sort students based on selected field
   */
  private _sortStudents(students: StudentRecord[]): StudentRecord[] {
    switch (this._sortField) {
      case 'serviceId':
        return students.sort(sortByServiceId);
      case 'name':
        return students.sort(sortByName);
      case 'score':
        return students.sort(sortByScore);
      case 'percentage':
        return students.sort(sortByPercentage);
      default:
        return students;
    }
  }

  /**
   * Handle sort field change
   */
  private _handleSortChange(field: SortField): void {
    this._sortField = field;
    this._aggregateScores();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor': QdInstructor;
  }
}
