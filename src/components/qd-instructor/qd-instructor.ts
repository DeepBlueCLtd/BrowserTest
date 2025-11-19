/**
 * Instructor component orchestrator
 * Delegates to sub-components based on unlock state
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles.js';
import type { StudentRecord, SessionData } from '../../types/contracts.js';
import { STORAGE_KEYS } from '../../types/contracts.js';
import { getJSON } from '../../utils/storage-helpers.js';
import { SessionService } from '../../services/session.js';
import './qd-instructor-unlock.js';
import './qd-instructor-scores.js';
import './qd-instructor-export.js';
import './qd-instructor-manage.js';

/**
 * Main instructor panel orchestrating all sub-components
 *
 * State management:
 * - unlocked: false → shows unlock component
 * - unlocked: true → shows scores/export/manage controls
 *
 * @fires qd:instructor-unlock - Forwarded from unlock component
 * @fires qd:data-cleared - Forwarded from manage component
 */
@customElement('qd-instructor')
export class QdInstructor extends LitElement {
  static override styles = [
    sharedStyles,
    css`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `,
  ];

  @state()
  private unlocked = false;

  @state()
  private showScores = false;

  @state()
  private students: StudentRecord[] = [];

  @state()
  private showStudentAnswers = false;

  connectedCallback() {
    super.connectedCallback();
    this.updateVisibility();

    // Auto-unlock if instructor is already logged in
    const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === 'true';
    if (isInstructor) {
      this.unlock();
    }

    // Restore toggle state from sessionStorage
    const savedState = sessionStorage.getItem('qd/instructor/showAnswers');
    if (savedState !== null) {
      this.showStudentAnswers = savedState === 'true';
    }

    document.addEventListener('qd:login', this.handleLoginEvent);
    document.addEventListener('qd:logout', this.handleLogoutEvent);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('qd:login', this.handleLoginEvent);
    document.removeEventListener('qd:logout', this.handleLogoutEvent);
  }

  /**
   * Update visibility based on instructor session state
   */
  private updateVisibility(): void {
    const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === 'true';
    if (isInstructor) {
      this.setAttribute('data-show', '');
    } else {
      this.removeAttribute('data-show');
    }
  }

  private handleLoginEvent = (event: Event): void => {
    const customEvent = event as CustomEvent<{ role?: string }>;
    const role = customEvent.detail?.role;

    this.updateVisibility();

    // Auto-unlock if instructor logged in
    if (role === 'instructor') {
      this.unlock();
    }
  };

  private handleLogoutEvent = (): void => {
    this.updateVisibility();
    this.lock();
  };

  /**
   * Set student data for display
   */
  setStudents(students: StudentRecord[]): void {
    this.students = students;
  }

  /**
   * Unlock instructor panel (call after successful auth)
   */
  unlock(): void {
    this.unlocked = true;
  }

  /**
   * Lock instructor panel (call on logout)
   */
  lock(): void {
    this.unlocked = false;
    this.showScores = false;
  }

  private handleUnlock = (): void => {
    this.unlocked = true;
    // Forward event to parent
    this.dispatchEvent(
      new CustomEvent('qd:instructor-unlock', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handleViewScores = async (): Promise<void> => {
    // Load all students for current release before showing scores
    const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
    if (!session) return;

    try {
      const { getStorageService } = await import('../../services/storage-service.js');
      const storageService = getStorageService();
      const students = await storageService.getStudentsByRelease(session.release);
      this.students = students;
    } catch (err) {
      console.error('Failed to load students:', err);
      this.students = [];
    }

    this.showScores = true;
  };

  private handleCloseScores = (): void => {
    this.showScores = false;
  };

  private handleDataCleared = (): void => {
    // Forward event to parent
    this.dispatchEvent(
      new CustomEvent('qd:data-cleared', {
        bubbles: true,
        composed: true,
      }),
    );
    // Refresh students list
    this.students = [];
  };

  private handleLogout = (): void => {
    const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);

    // Clear session from storage (this will also emit qd:logout event)
    const sessionService = new SessionService();
    sessionService.clearSession();

    // Dispatch event for any additional listeners
    this.dispatchEvent(
      new CustomEvent('qd:logout', {
        detail: {
          serviceId: session?.serviceId || 'unknown',
        },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handleToggleStudentAnswers = async (e: Event): Promise<void> => {
    const checkbox = e.target as HTMLInputElement;
    this.showStudentAnswers = checkbox.checked;

    // FR-004: Load student data in fresh session when toggle is enabled
    if (this.showStudentAnswers && this.students.length === 0) {
      const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
      if (session) {
        try {
          const { getStorageService } = await import('../../services/storage-service.js');
          const storageService = getStorageService();
          const students = await storageService.getStudentsByRelease(session.release);
          this.students = students;
        } catch (err) {
          console.error('Failed to load students for toggle:', err);
        }
      }
    }

    // Emit event to notify table enhancers
    const eventName = this.showStudentAnswers
      ? 'qd:instructor-show-answers'
      : 'qd:instructor-hide-answers';

    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
      }),
    );

    // Persist toggle state in sessionStorage
    sessionStorage.setItem('qd/instructor/showAnswers', String(this.showStudentAnswers));
  };

  override render() {
    if (!this.unlocked) {
      return html`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `;
    }

    return html`
      <div class="instructor-panel">
        <div class="instructor-title">Instructor Mode</div>

        <label class="toggle-label">
          <input
            type="checkbox"
            .checked=${this.showStudentAnswers}
            @change=${this.handleToggleStudentAnswers}
          />
          Show student answers on page
        </label>

        <button @click=${this.handleViewScores} class="primary compact">View All Scores</button>

        <qd-instructor-export .students=${this.students}></qd-instructor-export>

        <qd-instructor-manage @qd:data-cleared=${this.handleDataCleared}></qd-instructor-manage>

        <button @click=${this.handleLogout} class="logout">Logout</button>

        <qd-instructor-scores
          .students=${this.students}
          .showModal=${this.showScores}
          @close=${this.handleCloseScores}
        ></qd-instructor-scores>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor': QdInstructor;
  }
}
