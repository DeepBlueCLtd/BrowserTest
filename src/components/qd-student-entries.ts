/**
 * Student Entries Component
 *
 * Reusable, Shadow-DOM-isolated display of student analysis-cell entries for
 * the instructor view. Replaces the previous raw-DOM builder that set inline
 * `style.cssText` hex colors (Constitution V) — all styles now live in
 * `static styles`, and all bindings are auto-escaped (no `innerHTML`).
 *
 * @element qd-student-entries
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { CellEntry } from '../services/analysis-display.js';
import { sortByTimestamp } from '../services/analysis-display.js';
import { formatStoredTimestamp } from '../utils/date-helpers.js';

/**
 * Renders a cell's student entries (newest first) or an empty-state placeholder.
 */
@customElement('qd-student-entries')
export class QdStudentEntries extends LitElement {
  /** Entries to display (unsorted; sorted newest-first internally). */
  @property({ attribute: false })
  entries: CellEntry[] = [];

  static override styles = css`
    :host {
      display: block;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 2px solid #3b82f6;
    }

    :host([data-empty]) {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }

    .qd-no-entries {
      color: #9ca3af;
      font-style: italic;
      font-size: 13px;
      padding: 8px 0;
    }

    .qd-entry {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
      color: #1f2937;
    }

    .qd-entry-name {
      font-weight: 600;
      color: #374151;
    }

    .qd-entry-content {
      white-space: pre-wrap;
    }
  `;

  override render() {
    if (this.entries.length === 0) {
      this.setAttribute('data-empty', '');
      return html`<div class="qd-no-entries">(No entries yet)</div>`;
    }
    this.removeAttribute('data-empty');

    return sortByTimestamp(this.entries).map((entry) => {
      const last4 = entry.serviceId.slice(-4);
      const timestamp = formatStoredTimestamp(entry.timestamp);
      return html`<div class="qd-entry">
        <span class="qd-entry-name">${entry.name} (${last4}) • ${timestamp}: </span>
        <span class="qd-entry-content">${entry.content}</span>
      </div>`;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qd-student-entries': QdStudentEntries;
  }
}
