/**
 * Unit tests for DOM helper utilities
 */

import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../../../src/utils/dom-helpers.js';

describe('escapeHtml()', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml(`<b>"O'Brien" & Co</b>`)).toBe(
      '&lt;b&gt;&quot;O&#39;Brien&quot; &amp; Co&lt;/b&gt;',
    );
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('Jane Smith RN1234')).toBe('Jane Smith RN1234');
  });

  it('neutralises a script payload used as a student name', () => {
    const payload = '<img src=x onerror="alert(1)">';
    const escaped = escapeHtml(payload);
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).toContain('&lt;img');
  });
});
