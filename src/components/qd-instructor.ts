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
import {
  showStudentAnswersInline,
  hideStudentAnswersInline,
  revealCorrectAnswers,
} from '../enhancers/quiz-table';

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
   * Sort direction (ascending or descending)
   */
  @state()
  private _sortDirection: 'asc' | 'desc' = 'asc';

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
   * Whether to show student answers inline in quiz tables
   */
  @state()
  private _showStudentAnswers = false;

  /**
   * Whether to show answer details in the scores table
   */
  @state()
  private _showAnswerDetails = true;

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

    th.sortable {
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s;
    }

    th.sortable:hover {
      background: #e8e8e8;
    }

    th.sortable.active {
      background: #e0f2ff;
      color: #0066cc;
    }

    .sort-icon {
      display: inline-block;
      margin-left: 0.25rem;
      font-size: 0.75rem;
      color: #999;
    }

    th.sortable.active .sort-icon {
      color: #0066cc;
    }

    .toggle-answers {
      cursor: pointer;
      margin-left: 0.5rem;
      font-size: 0.875rem;
      color: #0066cc;
      text-decoration: underline;
      user-select: none;
    }

    .toggle-answers:hover {
      color: #0052a3;
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

    .answer-details {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #555;
      line-height: 1.4;
    }

    .answer-details-page {
      margin-bottom: 0.25rem;
    }

    .answer-details-page:last-child {
      margin-bottom: 0;
    }

    .answer-details-page-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.125rem;
    }

    .answer-details-answers {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .answer-details-item {
      white-space: nowrap;
    }

    .answer-details-item .correct {
      color: #2e7d32;
    }

    .answer-details-item .incorrect {
      color: #d32f2f;
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

  firstUpdated() {
    // If already unlocked when component first renders, reveal answers
    if (this.unlocked) {
      // Use setTimeout to ensure quiz tables are prepared
      setTimeout(() => {
        this._revealAnswersOnPage();
      }, 100);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up broadcast channel
    if (this._broadcastChannel) {
      this._broadcastChannel.close();
      this._broadcastChannel = null;
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

        <div class="field" style="margin-top: 1.5rem;">
          <label>
            <input
              type="checkbox"
              .checked=${this._showStudentAnswers}
              @change=${() => this._handleToggleStudentAnswers()}
            />
            Show student answers in quiz tables
          </label>
          <p style="margin: 0.5rem 0 0 1.5rem; font-size: 0.875rem; color: #666;">
            When enabled, displays all student answers inline within quiz tables on quiz pages.
          </p>
        </div>
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

        <!-- Scores Table -->
        <table>
          <thead>
            <tr>
              <th
                scope="col"
                class="sortable ${this._sortField === 'serviceId' ? 'active' : ''}"
                @click=${() => this._handleSortChange('serviceId')}
              >
                Service ID<span class="sort-icon">${this._getSortIcon('serviceId')}</span>
              </th>
              <th
                scope="col"
                class="sortable ${this._sortField === 'name' ? 'active' : ''}"
                @click=${() => this._handleSortChange('name')}
              >
                Name<span class="sort-icon">${this._getSortIcon('name')}</span>
              </th>
              <th
                scope="col"
                class="sortable ${this._sortField === 'score' ? 'active' : ''}"
                @click=${() => this._handleSortChange('score')}
              >
                Correct<span class="sort-icon">${this._getSortIcon('score')}</span>
              </th>
              <th
                scope="col"
                class="sortable ${this._sortField === 'percentage' ? 'active' : ''}"
                @click=${() => this._handleSortChange('percentage')}
              >
                Percentage<span class="sort-icon">${this._getSortIcon('percentage')}</span>
              </th>
              <th scope="col">
                Pages Complete<span
                  class="toggle-answers"
                  @click=${() => (this._showAnswerDetails = !this._showAnswerDetails)}
                  >${this._showAnswerDetails ? 'Hide answers' : 'Show answers'}</span
                >
              </th>
            </tr>
          </thead>
          <tbody>
            ${this._aggregatedScores.students.map((student) => this._renderStudentRow(student))}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render a student row with optional inline answer details
   */
  private _renderStudentRow(student: import('../services/scores').AggregatedScores['students'][0]) {
    const fullRecord = this._studentRecords.find((r) => r.serviceId === student.serviceId);

    return html`
      <tr>
        <td>${student.serviceId}</td>
        <td>${student.name}</td>
        <td>${student.totalCorrect} / ${student.totalAttempted}</td>
        <td>${student.percentage.toFixed(1)}%</td>
        <td>
          <div>${student.pagesComplete} / ${student.pagesTotal}</div>
          ${this._showAnswerDetails && fullRecord ? this._renderAnswerDetails(fullRecord) : ''}
        </td>
      </tr>
    `;
  }

  /**
   * Render compact answer details for a student
   */
  private _renderAnswerDetails(student: StudentRecord) {
    const pages = Object.entries(student.pages).sort(([a], [b]) => a.localeCompare(b));

    if (pages.length === 0) {
      return '';
    }

    return html`
      <div class="answer-details">
        ${pages.map(([pageId, pageData]) => this._renderPageAnswers(pageId, pageData))}
      </div>
    `;
  }

  /**
   * Render answers for a single page (compact format)
   */
  private _renderPageAnswers(pageId: string, pageData: import('../types/contracts').PageData) {
    if (!pageData.answers || pageData.answers.length === 0) {
      return '';
    }

    // Show ALL questions, including unanswered (null) ones
    const allQuestions = pageData.answers.map((answer, index) => ({
      answer,
      questionNum: index + 1,
    }));

    return html`
      <div class="answer-details-page">
        <div class="answer-details-page-title">${pageId}:</div>
        <div class="answer-details-answers">
          ${allQuestions.map(
            (item) => html`
              <span class="answer-details-item">
                ${item.answer != null
                  ? html`Q${item.questionNum}:${item.answer.answer}<span
                        class="${item.answer.success ? 'correct' : 'incorrect'}"
                        >${item.answer.success ? '✓' : '✗'}</span
                      >`
                  : html`Q${item.questionNum}:<span style="color: #999;">—</span>`}
              </span>
            `,
          )}
        </div>
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

      // Automatically reveal answers on all quiz tables
      this._revealAnswersOnPage();
    } else {
      this._errorMessage = 'Incorrect password. Please try again.';
      this._password = '';
    }
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
   * Sort students based on selected field and direction
   */
  private _sortStudents(students: StudentRecord[]): StudentRecord[] {
    let sorted: StudentRecord[];

    switch (this._sortField) {
      case 'serviceId':
        sorted = students.sort(sortByServiceId);
        break;
      case 'name':
        sorted = students.sort(sortByName);
        break;
      case 'score':
        sorted = students.sort(sortByScore);
        break;
      case 'percentage':
        sorted = students.sort(sortByPercentage);
        break;
      default:
        sorted = students;
    }

    // Reverse if descending
    return this._sortDirection === 'desc' ? sorted.reverse() : sorted;
  }

  /**
   * Get sort icon for a column header
   */
  private _getSortIcon(field: SortField): string {
    if (this._sortField !== field) {
      return '↕'; // Neutral sort icon when not active
    }
    return this._sortDirection === 'asc' ? '↑' : '↓';
  }

  /**
   * Handle sort field change
   */
  private _handleSortChange(field: SortField): void {
    // If clicking the same field, toggle direction
    if (this._sortField === field) {
      this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New field - reset to ascending
      this._sortField = field;
      this._sortDirection = 'asc';
    }
    this._aggregateScores();
  }

  /**
   * Reveal correct answers on all quiz tables on the current page
   */
  private _revealAnswersOnPage(): void {
    const quizTables = document.querySelectorAll<HTMLTableElement>('table.qd-quiz');

    if (quizTables.length === 0) {
      // No quiz tables on current page
      return;
    }

    quizTables.forEach((table) => {
      // Check if table is enhanced/prepared before revealing
      if (table.classList.contains('qd-prepared')) {
        revealCorrectAnswers(table);
      } else {
        console.warn('Quiz table not prepared yet, skipping reveal');
      }
    });
  }

  /**
   * Handle toggle for showing student answers inline
   */
  private _handleToggleStudentAnswers(): void {
    this._showStudentAnswers = !this._showStudentAnswers;

    if (this._showStudentAnswers) {
      // Show student answers (intentionally not awaited)
      void this._showStudentAnswersOnPage();
    } else {
      // Hide student answers
      this._hideStudentAnswersOnPage();
    }
  }

  /**
   * Show student answers inline on all quiz tables
   */
  private async _showStudentAnswersOnPage(): Promise<void> {
    // Ensure student records are loaded
    if (this._studentRecords.length === 0) {
      await this._loadStudentRecords();
    }

    if (this._studentRecords.length === 0) {
      this._statusMessage = 'No student data available to display';
      return;
    }

    // Get current page ID from URL or data attribute
    const pageId = this._getCurrentPageId();

    if (!pageId) {
      this._statusMessage = 'Unable to determine current page ID';
      return;
    }

    try {
      const quizTables = document.querySelectorAll<HTMLTableElement>('table.qd-quiz');
      quizTables.forEach((table) => {
        showStudentAnswersInline(table, this._studentRecords, pageId);
      });
      this._statusMessage = 'Student answers displayed inline';
    } catch (error) {
      console.error('Failed to show student answers:', error);
      this._errorMessage = 'Failed to display student answers';
    }
  }

  /**
   * Hide student answers from all quiz tables
   */
  private _hideStudentAnswersOnPage(): void {
    try {
      const quizTables = document.querySelectorAll<HTMLTableElement>('table.qd-quiz');
      quizTables.forEach((table) => {
        hideStudentAnswersInline(table);
      });
      this._statusMessage = 'Student answers hidden';
    } catch (error) {
      console.error('Failed to hide student answers:', error);
    }
  }

  /**
   * Get current page ID from URL or data attributes
   *
   * @returns Page ID or empty string if not found
   */
  private _getCurrentPageId(): string {
    // Try to get from data attribute on quiz table
    const quizTable = document.querySelector<HTMLTableElement>('table.qd-quiz');
    if (quizTable) {
      const pageId = quizTable.getAttribute('data-page-id');
      if (pageId) return pageId;
    }

    // Try to extract from URL pathname
    // Expected format: /path/to/page-id.html
    const pathname = window.location.pathname;
    const match = pathname.match(/\/([^/]+)\.html?$/);
    if (match && match[1]) {
      return match[1];
    }

    // Fallback: return empty string
    return '';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor': QdInstructor;
  }
}
