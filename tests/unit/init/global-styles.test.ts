/**
 * Unit tests for global style injection (src/init/global-styles.ts)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { injectGlobalStyles } from '../../../src/init/global-styles.js';

const STYLE_ID = 'qd-global-styles';

describe('injectGlobalStyles()', () => {
  beforeEach(() => {
    document.getElementById(STYLE_ID)?.remove();
  });

  afterEach(() => {
    document.getElementById(STYLE_ID)?.remove();
  });

  it('injects a single <style id="qd-global-styles"> into <head>', () => {
    expect(document.getElementById(STYLE_ID)).toBeNull();

    injectGlobalStyles();

    const style = document.getElementById(STYLE_ID);
    expect(style).not.toBeNull();
    expect(style?.tagName).toBe('STYLE');
    expect(style?.parentElement).toBe(document.head);
    expect(document.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1);
  });

  it('is idempotent: a second call does not add another style element', () => {
    injectGlobalStyles();
    const first = document.getElementById(STYLE_ID);

    injectGlobalStyles();

    const all = document.querySelectorAll(`#${STYLE_ID}`);
    expect(all).toHaveLength(1);
    // Same node retained (not replaced)
    expect(document.getElementById(STYLE_ID)).toBe(first);
  });

  it('contains the .qd-hidden rule', () => {
    injectGlobalStyles();

    const css = document.getElementById(STYLE_ID)?.textContent ?? '';
    expect(css).toMatch(/\.qd-hidden\s*\{[^}]*display:\s*none\s*!important/);
  });

  it('contains the R/A/G badge and quiz validation rules', () => {
    injectGlobalStyles();

    const css = document.getElementById(STYLE_ID)?.textContent ?? '';
    expect(css).toContain('.qd-badge-red');
    expect(css).toContain('.qd-badge-amber');
    expect(css).toContain('.qd-badge-green');
    expect(css).toContain('.qd-quiz-interactive .qd-answer-correct');
    expect(css).toContain('.qd-quiz-interactive .qd-answer-incorrect');
  });

  it('does not re-inject if an element with the id already exists (external guard)', () => {
    const existing = document.createElement('style');
    existing.id = STYLE_ID;
    existing.textContent = '/* pre-existing */';
    document.head.appendChild(existing);

    injectGlobalStyles();

    expect(document.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1);
    expect(document.getElementById(STYLE_ID)?.textContent).toBe('/* pre-existing */');
  });
});
