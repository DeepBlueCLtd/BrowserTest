/**
 * Component tests for <qd-student-table> (T045).
 *
 * Covers the search filter and the per-row `select` event, plus auto-escaped
 * rendering of student-supplied names.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/components/qd-student-table.js';
import type { QdStudentTable } from '../../src/components/qd-student-table.js';
import type { StudentRecord } from '../../src/types/contracts.js';

function makeStudent(serviceId: string, name: string): StudentRecord {
  return {
    schema: 2,
    docId: '',
    release: '06-2026',
    serviceId,
    name,
    attempted: 0,
    correct: 0,
    updated: new Date().toISOString(),
    pages: {},
  };
}

async function mount(students: StudentRecord[]): Promise<QdStudentTable> {
  const el = document.createElement('qd-student-table');
  el.students = students;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function setSearch(el: QdStudentTable, value: string): void {
  const input = el.shadowRoot?.querySelector<HTMLInputElement>('input.search-input');
  if (!input) throw new Error('search input not found');
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('qd-student-table', () => {
  let el: QdStudentTable;

  beforeEach(async () => {
    el = await mount([
      makeStudent('30011111', 'Alice Smith'),
      makeStudent('30022222', 'Bob Jones'),
    ]);
  });

  afterEach(() => {
    el.remove();
  });

  it('renders one row per student', () => {
    const rows = el.shadowRoot?.querySelectorAll('tbody tr');
    expect(rows?.length).toBe(2);
  });

  it('filters by name (case-insensitive)', async () => {
    setSearch(el, 'alice');
    await el.updateComplete;
    const rows = el.shadowRoot?.querySelectorAll('tbody tr');
    expect(rows?.length).toBe(1);
    expect(el.shadowRoot?.textContent).toContain('Alice Smith');
  });

  it('filters by service ID', async () => {
    setSearch(el, '30022222');
    await el.updateComplete;
    const rows = el.shadowRoot?.querySelectorAll('tbody tr');
    expect(rows?.length).toBe(1);
    expect(el.shadowRoot?.textContent).toContain('Bob Jones');
  });

  it('shows an empty message when nothing matches', async () => {
    setSearch(el, 'zzz');
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('.empty-message')?.textContent).toContain('No matching');
  });

  it('emits a select event with the row student', () => {
    let received: StudentRecord | null = null;
    el.addEventListener('select', (e) => {
      received = (e as CustomEvent<StudentRecord>).detail;
    });

    const button = el.shadowRoot?.querySelector<HTMLButtonElement>('tbody tr button.action-btn');
    button?.click();

    expect(received).not.toBeNull();
    expect(received!.serviceId).toBe('30011111');
  });

  it('uses the configured action label', async () => {
    el.actionLabel = 'Reset';
    await el.updateComplete;
    const button = el.shadowRoot?.querySelector('tbody tr button.action-btn');
    expect(button?.textContent?.trim()).toBe('Reset');
  });

  it('renders student-supplied names as inert text (auto-escaped)', async () => {
    el.students = [makeStudent('30033333', '<img src=x onerror=alert(1)>')];
    await el.updateComplete;
    // The raw string should be present as text, with no injected <img> element.
    expect(el.shadowRoot?.querySelector('tbody img')).toBeNull();
    expect(el.shadowRoot?.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});
