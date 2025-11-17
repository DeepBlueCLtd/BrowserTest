/**
 * Instructor component orchestrator
 * Delegates to sub-components based on unlock state
 */

import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles.js';
import type { StudentRecord } from '../../types/contracts.js';
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
  static override styles = sharedStyles;

  @state()
  private unlocked = false;

  @state()
  private showScores = false;

  @state()
  private students: StudentRecord[] = [];

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
    this.dispatchEvent(new CustomEvent('qd:instructor-unlock', {
      bubbles: true,
      composed: true,
    }));
  };

  private handleViewScores = (): void => {
    this.showScores = true;
  };

  private handleCloseScores = (): void => {
    this.showScores = false;
  };

  private handleDataCleared = (): void => {
    // Forward event to parent
    this.dispatchEvent(new CustomEvent('qd:data-cleared', {
      bubbles: true,
      composed: true,
    }));
    // Refresh students list
    this.students = [];
  };

  override render() {
    if (!this.unlocked) {
      return html`
        <qd-instructor-unlock
          @qd:instructor-unlock=${this.handleUnlock}
        ></qd-instructor-unlock>
      `;
    }

    return html`
      <div class="instructor-panel">
        <h3>Instructor Controls</h3>

        <div style="margin: 16px 0;">
          <button @click=${this.handleViewScores} class="primary">
            📊 View All Scores
          </button>
        </div>

        <qd-instructor-export
          .students=${this.students}
        ></qd-instructor-export>

        <qd-instructor-manage
          @qd:data-cleared=${this.handleDataCleared}
        ></qd-instructor-manage>

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
