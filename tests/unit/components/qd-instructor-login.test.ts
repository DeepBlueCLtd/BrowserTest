/**
 * Unit tests for <qd-instructor-login> (T043 extraction).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../src/components/qd-instructor-login.js';
import type { QdInstructorLogin } from '../../../src/components/qd-instructor-login.js';
import { CONFIG_IDS } from '../../../src/config/dom-config-reader.js';
import { hashPassword } from '../../../src/services/auth/instructor-auth.js';
import { isInstructor } from '../../../src/utils/session-state.js';

function setHash(value: string | null): void {
  document.getElementById(CONFIG_IDS.instructorHash)?.remove();
  if (value === null) return;
  const span = document.createElement('span');
  span.id = CONFIG_IDS.instructorHash;
  span.textContent = value;
  document.body.appendChild(span);
}

describe('qd-instructor-login', () => {
  let el: QdInstructorLogin;

  beforeEach(() => {
    sessionStorage.clear();
    el = document.createElement('qd-instructor-login');
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
    setHash(null);
  });

  it('renders the Instructor button and a password modal', async () => {
    await el.updateComplete;
    const btn = el.shadowRoot?.querySelector('button');
    expect(btn?.textContent).toContain('Instructor');
    expect(el.shadowRoot?.querySelector('qd-password-modal')).not.toBeNull();
  });

  it('emits qd:login on a correct password', async () => {
    setHash(await hashPassword('letmein'));
    await el.updateComplete;

    // SessionService also emits a (role-less) qd:login, so collect all and look
    // for the component's instructor login.
    const roles: Array<string | undefined> = [];
    const collect = (e: Event) => roles.push((e as CustomEvent<{ role?: string }>).detail?.role);
    document.addEventListener('qd:login', collect);

    el.shadowRoot
      ?.querySelector('qd-password-modal')
      ?.dispatchEvent(new CustomEvent('qd:password-submit', { detail: { password: 'letmein' } }));

    // Allow the async verification microtasks to settle
    await new Promise((r) => setTimeout(r, 0));
    document.removeEventListener('qd:login', collect);

    expect(roles).toContain('instructor');
    // The verified secret is stored, not a forgeable 'true' flag (SRD 013 SEC-01)
    expect(sessionStorage.getItem('qd/instructor')).toBe('letmein');
    expect(isInstructor()).toBe(true);
  });
});
