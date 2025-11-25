/**
 * Instructor scores view component
 * Displays student scores with expandable per-page breakdown
 *
 * Refactored to use qd-scores-modal component.
 * Feature: 007-lit-component-refactor
 */

import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles.js';
import type { StudentRecord } from '../../types/contracts.js';
import '../qd-scores-modal.js';

/**
 * Scores table component showing all student progress
 *
 * Features:
 * - Summary view with attempted/correct/percentage
 * - Expandable per-student breakdown
 * - Color-coded correct/incorrect answers
 * - Modal display with close button
 *
 * Now delegates to qd-scores-modal component.
 */
@customElement('qd-instructor-scores')
export class QdInstructorScores extends LitElement {
  static override styles = sharedStyles;

  @property({ type: Array })
  students: StudentRecord[] = [];

  @property({ type: Boolean })
  showModal = false;

  private handleClose = () => {
    this.dispatchEvent(new CustomEvent('close'));
  };

  override render() {
    return html`
      <qd-scores-modal
        .open=${this.showModal}
        .students=${this.students}
        @close=${this.handleClose}
      ></qd-scores-modal>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-instructor-scores': QdInstructorScores;
  }
}
