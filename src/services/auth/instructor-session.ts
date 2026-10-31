/**
 * Verified instructor session (SRD 013 SEC-01, SEC-02).
 *
 * Instructor mode used to be a `'true'` string in sessionStorage, so anyone
 * with DevTools could grant it to themselves. Now the tab stores the password
 * the instructor typed, and every page load re-checks it against the
 * publication's `#qd-instructor-hash` before instructor mode is granted.
 * Forging the stored value therefore needs the password itself (or a
 * preimage of the configured hash).
 *
 * The verified result is held in memory for the page, so the many synchronous
 * `isInstructor()` callers stay synchronous. `restoreInstructorSession()` must
 * run during bootstrap before any component or enhancer asks.
 *
 * Trade-off (documented in docs/SECURITY.md): while an instructor is logged
 * in, the password sits in that tab's sessionStorage. It is cleared on logout,
 * on idle timeout and when the tab closes.
 */

import { STORAGE_KEYS, PIN_CONSTANTS } from '../../types/contracts.js';
import { RateLimiter } from '../../utils/security.js';
import { verifyInstructorPassword } from './instructor-auth.js';

/** Whether the stored instructor secret was verified during this page load. */
let verified = false;

/**
 * Rate limiter for password re-checks before destructive actions. Same
 * allowance as the login paths: two wrong passwords are free, then backoff.
 */
const reauthLimiter = new RateLimiter(PIN_CONSTANTS.MAX_ATTEMPTS - 1);

/** Outcome of re-entering the instructor password before a destructive action. */
export type ReauthResult =
  | { ok: true }
  | { ok: false; reason: 'incorrect' }
  | { ok: false; reason: 'locked'; retryInSeconds: number };

/**
 * Re-check the instructor password before a destructive action
 * (SRD 013 SEC-03: Erase All Data and Reset PIN).
 *
 * Checks against the publication's configured hash, not the stored secret, so
 * a session that was somehow obtained without the password still cannot erase
 * data. Attempts are rate limited.
 *
 * @param password - Password typed into the confirmation dialog
 * @returns Whether the action may proceed, or why not
 */
export async function confirmInstructorPassword(password: string): Promise<ReauthResult> {
  if (!reauthLimiter.attempt()) {
    return { ok: false, reason: 'locked', retryInSeconds: reauthLimiter.getRemainingSeconds() };
  }
  if (await verifyInstructorPassword(password)) {
    reauthLimiter.reset();
    return { ok: true };
  }
  reauthLimiter.recordFailure();
  return { ok: false, reason: 'incorrect' };
}

/**
 * User-facing message for a failed password re-check.
 *
 * @param result - A failed {@link ReauthResult}
 * @returns Message for the dialog
 */
export function reauthErrorMessage(result: Exclude<ReauthResult, { ok: true }>): string {
  return result.reason === 'locked'
    ? `Too many attempts. Try again in ${result.retryInSeconds}s`
    : 'Incorrect instructor password';
}

/** Reset the re-check rate limiter (tests only). */
export function resetReauthLimiterForTests(): void {
  reauthLimiter.reset();
}

/**
 * Verify a password and, when it matches, start an instructor session in this tab.
 *
 * @param password - Plaintext password the instructor typed
 * @returns true when the password matched and the session started
 */
export async function startInstructorSession(password: string): Promise<boolean> {
  if (!(await verifyInstructorPassword(password))) {
    return false;
  }
  sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, password);
  verified = true;
  return true;
}

/**
 * Re-verify a stored instructor secret on page load.
 *
 * When the stored value does not verify (forged, stale after a password
 * change, or no hash configured), the key is removed so the page falls back
 * to the student login form (SEC-02). An instructor `qd/session` left behind
 * is cleared too.
 *
 * @returns true when an instructor session is active for this page
 */
export async function restoreInstructorSession(): Promise<boolean> {
  verified = false;
  const stored = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR);
  if (stored === null) {
    return false;
  }

  if (await verifyInstructorPassword(stored)) {
    verified = true;
    return true;
  }

  sessionStorage.removeItem(STORAGE_KEYS.INSTRUCTOR);
  try {
    const session = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.SESSION) ?? 'null') as {
      serviceId?: string;
    } | null;
    if (session?.serviceId === 'INSTRUCTOR') {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  } catch {
    // Unparseable session data is not an instructor session; leave it alone
  }
  return false;
}

/**
 * Whether instructor mode is active for this page.
 *
 * True only after {@link startInstructorSession} or a successful
 * {@link restoreInstructorSession}, and only while the stored secret remains.
 */
export function isInstructorSessionActive(): boolean {
  return verified && sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) !== null;
}

/** End the instructor session in this tab (logout, timeout). */
export function endInstructorSession(): void {
  verified = false;
  sessionStorage.removeItem(STORAGE_KEYS.INSTRUCTOR);
}
