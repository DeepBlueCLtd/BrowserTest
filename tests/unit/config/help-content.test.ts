/**
 * Unit tests for student help text (SRD 013 UX-09): each status colour has one
 * meaning, matching the state calculator.
 */

import { describe, it, expect } from 'vitest';
import { getHelpContent } from '../../../src/config/help-content.js';

describe('student help text', () => {
  const body = getHelpContent('status').body;

  it('describes the three page states as the state calculator defines them', () => {
    expect(body).toContain('every question on the page answered correctly');
    expect(body).toContain('started, with some questions unanswered or incorrect');
    expect(body).toContain('not started');
  });

  it('describes per-answer feedback by its marks, not by colour', () => {
    expect(body).toContain('✓ Correct');
    expect(body).toContain('✗ Incorrect');
    expect(body).not.toMatch(/None yet|Some answered/);
  });
});
