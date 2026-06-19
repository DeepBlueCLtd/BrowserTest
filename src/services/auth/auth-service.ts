/**
 * Student authentication service.
 *
 * The single source of student login logic. Previously the ~100-line login
 * flow (lockout check → storage init → student lookup → PIN setup/verify →
 * rate-limiting → new-student creation) was duplicated verbatim in
 * `qd-login.ts` across `handleStudentLogin` and `retryLoginAfterMigration`.
 * Both paths now delegate to {@link AuthService}, which performs all storage,
 * crypto, and rate-limit calls and returns a discriminated {@link LoginResult}.
 *
 * The component is left to translate the result into session creation, custom
 * events, and UI state — it performs no storage/crypto/rate-limit work itself
 * (contracts/module-boundaries.md → Auth).
 */

import { SCHEMA_VERSION } from '../../types/contracts.js';
import type { StudentRecord } from '../../types/contracts.js';
import { getStorageAdapter } from '../storage/indexeddb.js';
import { needsMigration, hasPinSet, completePinSetup } from '../storage/migration.js';
import { verifyPin, hashPin } from './pin-service.js';
import {
  checkLockout,
  recordFailedAttempt,
  clearAttemptState,
  getRemainingAttempts,
} from './rate-limiter.js';
import { StorageFormatError } from '../storage/adapter-utils.js';

/**
 * Discriminated result of a student login attempt.
 *
 * - `pin-created` — a new PIN was stored (new student, migrated student, or a
 *   student who had no PIN). The caller should surface the "PIN stored"
 *   confirmation and complete the login.
 * - `pin-verified` — an existing student's PIN matched. The caller completes
 *   the login without a confirmation dialog.
 * - `lockout` — the account is (or just became) locked; `lockoutMs` is the
 *   remaining lockout window in milliseconds.
 * - `bad-pin` — the PIN was wrong but the account is not yet locked;
 *   `remaining` is the number of attempts left.
 * - `needs-migration` — stored data is in an incompatible format and must be
 *   migrated before login can proceed.
 * - `error` — login failed for another reason; `message` is user-facing.
 */
export type LoginResult =
  | { kind: 'pin-created'; serviceId: string; name: string; release: string }
  | { kind: 'pin-verified'; serviceId: string; name: string; release: string }
  | { kind: 'lockout'; lockoutMs: number }
  | { kind: 'bad-pin'; remaining: number }
  | { kind: 'needs-migration'; error: StorageFormatError }
  | { kind: 'error'; message: string };

/**
 * Inputs required to authenticate a student.
 */
export interface StudentLoginInput {
  serviceId: string;
  name: string;
  pin: string;
  release: string;
  dbName: string;
}

interface RunOptions {
  /** Whether to enforce the lockout window before attempting login. */
  checkLock: boolean;
  /** Surface a {@link StorageFormatError} as `needs-migration` (initial login only). */
  surfaceMigration: boolean;
  /** User-facing message used when an unexpected error occurs. */
  errorMessage: string;
  /** Console label used when logging an unexpected error. */
  errorLabel: string;
}

/**
 * Service encapsulating all student authentication logic.
 */
export class AuthService {
  /**
   * Authenticate a student (initial login path).
   *
   * Enforces the lockout window and surfaces storage-format mismatches as
   * `needs-migration` so the caller can offer migration.
   */
  loginStudent(input: StudentLoginInput): Promise<LoginResult> {
    return this.runLogin(input, {
      checkLock: true,
      surfaceMigration: true,
      errorMessage: 'Login failed. Please try again.',
      errorLabel: 'Student login error:',
    });
  }

  /**
   * Authenticate a student immediately after a successful data migration.
   *
   * Skips the lockout pre-check (the user just completed migration) and treats
   * any remaining error as a generic post-migration failure.
   */
  retryAfterMigration(input: StudentLoginInput): Promise<LoginResult> {
    return this.runLogin(input, {
      checkLock: false,
      surfaceMigration: false,
      errorMessage: 'Login failed after migration. Please try again.',
      errorLabel: 'Post-migration login error:',
    });
  }

  /**
   * Shared login implementation for both the initial and post-migration paths.
   */
  private async runLogin(input: StudentLoginInput, opts: RunOptions): Promise<LoginResult> {
    const { serviceId, name, pin, release, dbName } = input;

    if (opts.checkLock) {
      const lockout = checkLockout(serviceId);
      if (lockout.isLocked) {
        return { kind: 'lockout', lockoutMs: lockout.remainingMs };
      }
    }

    try {
      const storage = getStorageAdapter(dbName);
      await storage.init();
      const existingStudent = await storage.getStudent(release, serviceId);

      if (existingStudent) {
        // Existing student needing PIN setup (legacy schema or never set a PIN)
        if (needsMigration(existingStudent) || !hasPinSet(existingStudent)) {
          const pinHash = await hashPin(pin);
          const updatedStudent = completePinSetup(existingStudent, pinHash);
          await storage.saveStudent(updatedStudent);
          return { kind: 'pin-created', serviceId, name, release };
        }

        // Existing student with a PIN — verify it
        const isValid = await verifyPin(pin, existingStudent.pinHash || '');
        if (!isValid) {
          const state = recordFailedAttempt(serviceId);
          if (state.lockoutUntil) {
            const lockoutMs = new Date(state.lockoutUntil).getTime() - Date.now();
            return { kind: 'lockout', lockoutMs };
          }
          return { kind: 'bad-pin', remaining: getRemainingAttempts(serviceId) };
        }

        clearAttemptState(serviceId);
        return { kind: 'pin-verified', serviceId, name, release };
      }

      // New student — hash PIN and create record
      const pinHash = await hashPin(pin);
      const newStudent: StudentRecord = {
        schema: SCHEMA_VERSION,
        docId: '',
        release,
        serviceId,
        name,
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
        pinHash,
        pinCreatedAt: new Date().toISOString(),
      };
      await storage.saveStudent(newStudent);
      return { kind: 'pin-created', serviceId, name, release };
    } catch (err) {
      if (opts.surfaceMigration && err instanceof StorageFormatError) {
        return { kind: 'needs-migration', error: err };
      }
      console.error(opts.errorLabel, err);
      return { kind: 'error', message: opts.errorMessage };
    }
  }
}
