/**
 * Session-state predicates.
 *
 * Small, shared read helpers for the "is there a session / is it an instructor"
 * checks that the login, status, and instructor components each used to inline.
 * Centralizing them keeps the `updateVisibility` logic consistent.
 */

import type { SessionData } from '../types/contracts.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import { getJSON } from './storage-helpers.js';
import { isInstructorSessionActive } from '../services/auth/instructor-session.js';

/**
 * Whether any session (student or instructor) is currently active.
 */
export function hasActiveSession(): boolean {
  return getJSON<SessionData>(STORAGE_KEYS.SESSION) !== null;
}

/**
 * Whether the current session is a verified instructor session.
 *
 * A value written into sessionStorage by hand does not count: the stored
 * secret must have been verified against the page's instructor hash during
 * this page load (SRD 013 SEC-01).
 */
export function isInstructor(): boolean {
  return isInstructorSessionActive();
}

/**
 * Whether a student (non-instructor) is currently logged in.
 */
export function isStudentLoggedIn(): boolean {
  return hasActiveSession() && !isInstructor();
}
