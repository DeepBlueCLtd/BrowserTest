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

/**
 * Whether any session (student or instructor) is currently active.
 */
export function hasActiveSession(): boolean {
  return getJSON<SessionData>(STORAGE_KEYS.SESSION) !== null;
}

/**
 * Whether the current session is an instructor session.
 */
export function isInstructor(): boolean {
  return sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === 'true';
}

/**
 * Whether a student (non-instructor) is currently logged in.
 */
export function isStudentLoggedIn(): boolean {
  return hasActiveSession() && !isInstructor();
}
