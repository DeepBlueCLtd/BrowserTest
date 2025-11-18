/**
 * Instructor component orchestrator
 * Delegates to sub-components based on unlock state
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles.js';
import type { StudentRecord } from '../../types/contracts.js';
import { STORAGE_KEYS } from '../../types/contracts.js';
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

  connectedCallback() {
    super.connectedCallback();
    this.updateVisibility();
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

  private handleLoginEvent = (): void => {
    this.updateVisibility();
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

  private handleViewScores = (): void => {
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
    this.lock();
    this.dispatchEvent(
      new CustomEvent('qd:logout', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  override render() {
    if (!this.unlocked) {
      return html`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `;
    }

    return html`
      <div class="instructor-panel">
        <button @click=${this.handleViewScores} class="primary compact">View Scores</button>

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
