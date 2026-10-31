/**
 * Test helpers for verified instructor sessions (SRD 013 SEC-01).
 *
 * Instructor mode can no longer be granted by writing `'true'` into
 * sessionStorage, so tests that need an instructor go through the real
 * verification path.
 */

import { hashPassword } from '../../src/services/auth/instructor-auth.js';
import {
  startInstructorSession,
  endInstructorSession,
} from '../../src/services/auth/instructor-session.js';
import { CONFIG_IDS } from '../../src/config/dom-config-reader.js';
import { STORAGE_KEYS } from '../../src/types/contracts.js';

/** Password the helpers configure. */
export const TEST_INSTRUCTOR_PASSWORD = 'pwd';

/** Put the hash of `password` in the page's `#qd-instructor-hash` span. */
export async function configureInstructorHash(
  password: string = TEST_INSTRUCTOR_PASSWORD,
): Promise<void> {
  document.getElementById(CONFIG_IDS.instructorHash)?.remove();
  const span = document.createElement('span');
  span.id = CONFIG_IDS.instructorHash;
  span.textContent = await hashPassword(password);
  document.body.appendChild(span);
}

/** Configure the hash and start a verified instructor session in this tab. */
export async function loginInstructorForTest(
  password: string = TEST_INSTRUCTOR_PASSWORD,
): Promise<void> {
  await configureInstructorHash(password);
  if (!(await startInstructorSession(password))) {
    throw new Error('Test instructor session failed to start');
  }
}

/**
 * Configure the hash and leave the secret in sessionStorage as a previous
 * page would, so bootstrap's restore path can verify it.
 */
export async function storeInstructorSecretForNextPage(
  password: string = TEST_INSTRUCTOR_PASSWORD,
): Promise<void> {
  await configureInstructorHash(password);
  sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, password);
}

/** Remove the hash span and end any instructor session. */
export function resetInstructorForTest(): void {
  endInstructorSession();
  document.getElementById(CONFIG_IDS.instructorHash)?.remove();
}
