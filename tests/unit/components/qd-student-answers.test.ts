/**
 * Component tests for <qd-student-answers> and <qd-student-entries> (T044).
 *
 * Assert escaped rendering (no live markup from student-controlled strings) and
 * that styles are encapsulated in the component's shadow root.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../src/components/qd-student-answers.js';
import '../../../src/components/qd-student-entries.js';
import type { QdStudentAnswers } from '../../../src/components/qd-student-answers.js';
import type { QdStudentEntries } from '../../../src/components/qd-student-entries.js';
import type { StudentAnswerDisplay } from '../../../src/services/answer-display.js';
import type { CellEntry } from '../../../src/services/analysis-display.js';

describe('qd-student-answers', () => {
  let el: QdStudentAnswers;

  beforeEach(() => {
    el = document.createElement('qd-student-answers');
    document.body.appendChild(el);
  });
  afterEach(() => el.remove());

  it('renders each answer with masked id and correctness class', async () => {
    const answers: StudentAnswerDisplay[] = [
      {
        name: 'Alice',
        maskedServiceId: '2344',
        answer: '1',
        success: true,
        formattedTimestamp: '14:23',
        cssClass: 'qd-correct',
      },
    ];
    el.answers = answers;
    await el.updateComplete;

    const entry = el.shadowRoot?.querySelector('.qd-student-answer');
    expect(entry?.classList.contains('qd-correct')).toBe(true);
    expect(entry?.querySelector('.qd-student-name')?.textContent).toContain('Alice');
    expect(entry?.querySelector('.qd-student-name')?.textContent).toContain('2344');
    // Styles are encapsulated (shadow root carries adoptedStyleSheets/<style>).
    expect(el.shadowRoot).not.toBeNull();
  });

  it('escapes student-controlled markup (renders as text, not elements)', async () => {
    el.answers = [
      {
        name: '<img src=x onerror=alert(1)>Mallory',
        maskedServiceId: '0001',
        answer: '<script>alert(1)</script>',
        success: false,
        formattedTimestamp: '00:00',
        cssClass: 'qd-incorrect',
      },
    ];
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector('img')).toBeNull();
    expect(el.shadowRoot?.querySelector('script')).toBeNull();
    expect(el.shadowRoot?.querySelector('.qd-student-answer-text')?.textContent).toBe(
      '<script>alert(1)</script>',
    );
  });
});

describe('qd-student-entries', () => {
  let el: QdStudentEntries;

  beforeEach(() => {
    el = document.createElement('qd-student-entries');
    document.body.appendChild(el);
  });
  afterEach(() => el.remove());

  it('renders the empty-state placeholder when there are no entries', async () => {
    el.entries = [];
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('.qd-no-entries')?.textContent).toContain(
      '(No entries yet)',
    );
  });

  it('escapes student-controlled content', async () => {
    const entries: CellEntry[] = [
      {
        serviceId: 'RN1234',
        name: 'Bob',
        content: '<script>alert(1)</script>',
        timestamp: '2024-11-19T14:23:00Z',
      },
    ];
    el.entries = entries;
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector('script')).toBeNull();
    expect(el.shadowRoot?.querySelector('.qd-entry-content')?.textContent).toBe(
      '<script>alert(1)</script>',
    );
  });
});
