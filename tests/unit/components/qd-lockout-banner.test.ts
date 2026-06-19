/**
 * Unit tests for <qd-lockout-banner> (T043 extraction).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../src/components/qd-lockout-banner.js';
import type { QdLockoutBanner } from '../../../src/components/qd-lockout-banner.js';

describe('qd-lockout-banner', () => {
  let el: QdLockoutBanner;

  beforeEach(() => {
    el = document.createElement('qd-lockout-banner');
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('renders nothing when not locked out (untilMs in the past)', async () => {
    el.untilMs = Date.now() - 1000;
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('.lockout-message')).toBeNull();
  });

  it('renders a countdown message when locked out', async () => {
    el.untilMs = Date.now() + 5000;
    await el.updateComplete;
    const msg = el.shadowRoot?.querySelector('.lockout-message');
    expect(msg).not.toBeNull();
    expect(msg?.textContent).toContain('Too many attempts');
  });
});
