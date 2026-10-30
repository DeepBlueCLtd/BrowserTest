/**
 * Unit tests for the verified instructor session (SRD 013 SEC-01, SEC-02).
 *
 * The review reproduced a logged-out student granting themselves instructor
 * mode with `sessionStorage.setItem('qd/instructor', 'true')`. These tests
 * start from that reproduction.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  startInstructorSession,
  restoreInstructorSession,
  isInstructorSessionActive,
  endInstructorSession,
} from '../../../../src/services/auth/instructor-session.js';
import { hashPassword } from '../../../../src/services/auth/instructor-auth.js';
import { isInstructor } from '../../../../src/utils/session-state.js';
import { CONFIG_IDS } from '../../../../src/config/dom-config-reader.js';
import { STORAGE_KEYS } from '../../../../src/types/contracts.js';

async function configureHash(password: string): Promise<void> {
  const span = document.createElement('span');
  span.id = CONFIG_IDS.instructorHash;
  span.textContent = await hashPassword(password);
  document.body.appendChild(span);
}

describe('instructor session', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    endInstructorSession();
    await configureHash('pwd');
  });

  afterEach(() => {
    document.getElementById(CONFIG_IDS.instructorHash)?.remove();
    sessionStorage.clear();
    endInstructorSession();
  });

  it('does not grant instructor mode for a hand-written "true" flag (review reproduction)', async () => {
    sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');
    expect(await restoreInstructorSession()).toBe(false);
    expect(isInstructor()).toBe(false);
  });

  it('removes a forged value and any instructor session record on restore (SEC-02)', async () => {
    sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ serviceId: 'INSTRUCTOR' }));
    await restoreInstructorSession();
    expect(sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.SESSION)).toBeNull();
  });

  it('leaves a student session alone when clearing a forged instructor value', async () => {
    const student = JSON.stringify({ serviceId: '30012345' });
    sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');
    sessionStorage.setItem(STORAGE_KEYS.SESSION, student);
    await restoreInstructorSession();
    expect(sessionStorage.getItem(STORAGE_KEYS.SESSION)).toBe(student);
  });

  it('is not active before verification, even with a correct stored secret', () => {
    sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'pwd');
    expect(isInstructor()).toBe(false);
  });

  it('starts a session only for the right password', async () => {
    expect(await startInstructorSession('wrong')).toBe(false);
    expect(isInstructor()).toBe(false);
    expect(sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR)).toBeNull();

    expect(await startInstructorSession('pwd')).toBe(true);
    expect(isInstructor()).toBe(true);
  });

  it('restores a genuine session on the next page load', async () => {
    await startInstructorSession('pwd');
    endInstructorSessionMemoryOnly();
    expect(isInstructor()).toBe(false);
    expect(await restoreInstructorSession()).toBe(true);
    expect(isInstructorSessionActive()).toBe(true);
  });

  it('drops the session if the publication hash changes', async () => {
    await startInstructorSession('pwd');
    document.getElementById(CONFIG_IDS.instructorHash)?.remove();
    await configureHash('new-password');
    expect(await restoreInstructorSession()).toBe(false);
    expect(sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR)).toBeNull();
  });

  it('ends the session and clears the stored secret', async () => {
    await startInstructorSession('pwd');
    endInstructorSession();
    expect(isInstructor()).toBe(false);
    expect(sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR)).toBeNull();
  });

  it('is inactive once the stored secret is removed, e.g. by erase-all', async () => {
    await startInstructorSession('pwd');
    sessionStorage.removeItem(STORAGE_KEYS.INSTRUCTOR);
    expect(isInstructor()).toBe(false);
  });
});

/**
 * Simulate a page navigation: memory is fresh but sessionStorage persists.
 * restoreInstructorSession() resets the in-memory flag before checking, so
 * calling it with storage intact is the navigation path; here we only need
 * the in-memory flag dropped while keeping storage.
 */
function endInstructorSessionMemoryOnly(): void {
  const stored = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR);
  endInstructorSession();
  if (stored !== null) sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, stored);
}
