/**
 * Schema Migration Service
 *
 * Handles lazy migration of student records from v1 to v2.
 * Migration occurs on first login for existing students.
 */

import type { StudentRecord } from '../../types/contracts.js';
import { SCHEMA_VERSION, PIN_SCHEMA_VERSION } from '../../types/contracts.js';
import type { PinCredential } from '../auth/pin-service.js';

/**
 * Check if a student record needs migration to v2
 *
 * @param record - Student record to check
 * @returns true if record needs PIN migration
 */
export function needsMigration(record: StudentRecord): boolean {
  // Compare with the PIN-era schema, not the current one: a later schema bump
  // must never send PIN-bearing records back through PIN setup, which would
  // let whoever logs in next choose a new PIN for someone else's account.
  return record.schema < PIN_SCHEMA_VERSION;
}

/**
 * Check if a student has a PIN set
 *
 * @param record - Student record to check
 * @returns true if student has a PIN hash
 */
export function hasPinSet(record: StudentRecord): boolean {
  return Boolean(record.pinHash && record.pinHash.length > 0);
}

/**
 * Migrate a student record from v1 to v2
 *
 * Updates schema version but does NOT set PIN - that happens
 * after the student creates their PIN.
 *
 * @param record - Student record to migrate
 * @returns Updated record with v2 schema (pinHash empty)
 */
export function migrateToV2(record: StudentRecord): StudentRecord {
  if (record.schema >= PIN_SCHEMA_VERSION) {
    return record;
  }

  return {
    ...record,
    schema: SCHEMA_VERSION,
    // PIN fields left empty - student will create PIN on login
    pinHash: '',
    pinCreatedAt: undefined,
    pinResetAt: undefined,
  };
}

/**
 * Complete PIN setup for a migrated or new student
 *
 * @param record - Student record
 * @param pinHash - Hashed PIN
 * @returns Updated record with PIN set
 */
export function completePinSetup(record: StudentRecord, credential: PinCredential): StudentRecord {
  return {
    ...record,
    schema: SCHEMA_VERSION,
    ...credential,
    pinCreatedAt: new Date().toISOString(),
  };
}

/**
 * Replace a legacy PIN verifier with a salted KDF one (SRD 013 SEC-07).
 *
 * Called after the student's PIN has been verified against the legacy hash.
 * Keeps `pinCreatedAt`, since the PIN itself has not changed.
 *
 * @param record - Student record holding a legacy SHA-256 PIN hash
 * @param credential - New salted verifier for the same PIN
 * @returns Updated record stamped with the current schema
 */
export function upgradePinCredential(
  record: StudentRecord,
  credential: PinCredential,
): StudentRecord {
  return { ...record, schema: SCHEMA_VERSION, ...credential };
}

/**
 * Reset a student's PIN (instructor action)
 *
 * @param record - Student record
 * @returns Updated record with PIN cleared
 */
export function resetPin(record: StudentRecord): StudentRecord {
  const { pinSalt: _salt, pinIterations: _iterations, pinKdf: _kdf, ...rest } = record;
  return {
    ...rest,
    pinHash: '',
    pinResetAt: new Date().toISOString(),
  };
}
