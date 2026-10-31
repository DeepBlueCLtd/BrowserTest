/**
 * Unit tests for accessibility helpers (SRD 013 A11Y-01, A11Y-02).
 */

import { describe, it, expect, afterEach } from 'vitest';
import { ensureId, announce, LIVE_REGION_ID } from '../../../src/utils/a11y.js';

describe('a11y helpers', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('ensureId keeps an existing id', () => {
    const el = document.createElement('td');
    el.id = 'author-id';
    expect(ensureId(el, 'qd')).toBe('author-id');
  });

  it('ensureId assigns distinct ids', () => {
    const a = document.createElement('td');
    const b = document.createElement('td');
    expect(ensureId(a, 'qd-q')).not.toBe(ensureId(b, 'qd-q'));
    expect(a.id).toMatch(/^qd-q-\d+$/);
  });

  it('announce writes to one polite live region', () => {
    announce('Question 1: correct');
    announce('Question 2: incorrect');
    const regions = document.querySelectorAll(`#${LIVE_REGION_ID}`);
    expect(regions).toHaveLength(1);
    expect(regions[0]!.getAttribute('aria-live')).toBe('polite');
    expect(regions[0]!.textContent).toBe('Question 2: incorrect');
  });
});
