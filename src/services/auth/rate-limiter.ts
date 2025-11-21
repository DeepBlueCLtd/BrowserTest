/**
 * Rate Limiter Service for PIN Authentication
 *
 * Tracks failed PIN attempts using sessionStorage.
 * Implements lockout after 3 failed attempts for 30 seconds.
 */

import type { PinAttemptState, ServiceId } from '../../types/contracts.js';
import { PIN_CONSTANTS, STORAGE_KEYS } from '../../types/contracts.js';
import { info, warn, maskServiceId } from '../../utils/logger.js';

/**
 * Get the storage key for a service ID's PIN attempts
 */
function getAttemptKey(serviceId: ServiceId): string {
  return `${STORAGE_KEYS.PIN_ATTEMPTS}:${serviceId}`;
}

/**
 * Get the current PIN attempt state for a service ID
 *
 * @param serviceId - Student service ID
 * @returns Current attempt state or null if none
 */
export function getAttemptState(serviceId: ServiceId): PinAttemptState | null {
  const key = getAttemptKey(serviceId);
  const data = sessionStorage.getItem(key);
  if (!data) {
    return null;
  }
  try {
    return JSON.parse(data) as PinAttemptState;
  } catch {
    return null;
  }
}

/**
 * Check if a service ID is currently locked out
 *
 * @param serviceId - Student service ID
 * @returns Object with isLocked status and remainingMs if locked
 */
export function checkLockout(serviceId: ServiceId): { isLocked: boolean; remainingMs: number } {
  const state = getAttemptState(serviceId);
  if (!state || !state.lockoutUntil) {
    return { isLocked: false, remainingMs: 0 };
  }

  const lockoutTime = new Date(state.lockoutUntil).getTime();
  const now = Date.now();

  if (lockoutTime > now) {
    return { isLocked: true, remainingMs: lockoutTime - now };
  }

  // Lockout expired, clear state
  clearAttemptState(serviceId);
  return { isLocked: false, remainingMs: 0 };
}

/**
 * Record a failed PIN attempt
 *
 * Increments attempt counter and sets lockout if threshold reached.
 *
 * @param serviceId - Student service ID
 * @returns Updated attempt state
 */
export function recordFailedAttempt(serviceId: ServiceId): PinAttemptState {
  const now = new Date().toISOString();
  let state = getAttemptState(serviceId);

  if (!state) {
    state = {
      serviceId,
      attempts: 0,
      lockoutUntil: null,
      lastAttempt: now,
    };
  }

  state.attempts += 1;
  state.lastAttempt = now;

  // Check if lockout threshold reached
  if (state.attempts >= PIN_CONSTANTS.MAX_ATTEMPTS) {
    const lockoutTime = new Date(Date.now() + PIN_CONSTANTS.LOCKOUT_MS);
    state.lockoutUntil = lockoutTime.toISOString();
    warn(
      `PIN lockout triggered for ${maskServiceId(serviceId)} after ${state.attempts} failed attempts`,
    );
  } else {
    info(
      `Failed PIN attempt ${state.attempts}/${PIN_CONSTANTS.MAX_ATTEMPTS} for ${maskServiceId(serviceId)}`,
    );
  }

  // Save to sessionStorage
  const key = getAttemptKey(serviceId);
  sessionStorage.setItem(key, JSON.stringify(state));

  return state;
}

/**
 * Clear PIN attempt state on successful login
 *
 * @param serviceId - Student service ID
 */
export function clearAttemptState(serviceId: ServiceId): void {
  const state = getAttemptState(serviceId);
  if (state && state.attempts > 0) {
    info(
      `Cleared ${state.attempts} failed PIN attempts for ${maskServiceId(serviceId)} on successful login`,
    );
  }
  const key = getAttemptKey(serviceId);
  sessionStorage.removeItem(key);
}

/**
 * Get remaining attempts before lockout
 *
 * @param serviceId - Student service ID
 * @returns Number of attempts remaining (0 if locked out)
 */
export function getRemainingAttempts(serviceId: ServiceId): number {
  const state = getAttemptState(serviceId);
  if (!state) {
    return PIN_CONSTANTS.MAX_ATTEMPTS;
  }

  const lockout = checkLockout(serviceId);
  if (lockout.isLocked) {
    return 0;
  }

  return Math.max(0, PIN_CONSTANTS.MAX_ATTEMPTS - state.attempts);
}
