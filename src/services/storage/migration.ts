/**
 * Schema Migration Service
 *
 * Handles lazy migration of student records from v1 to v2.
 * Migration occurs on first login for existing students.
 */

import type { StudentRecord } from '../../types/contracts.js';
import { SCHEMA_VERSION } from '../../types/contracts.js';

/**
 * Check if a student record needs migration to v2
 *
 * @param record - Student record to check
 * @returns true if record needs PIN migration
 */
export function needsMigration(record: StudentRecord): boolean {
  return record.schema < SCHEMA_VERSION;
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
  if (record.schema >= SCHEMA_VERSION) {
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
export function completePinSetup(record: StudentRecord, pinHash: string): StudentRecord {
  return {
    ...record,
    schema: SCHEMA_VERSION,
    pinHash,
    pinCreatedAt: new Date().toISOString(),
  };
}

/**
 * Reset a student's PIN (instructor action)
 *
 * @param record - Student record
 * @returns Updated record with PIN cleared
 */
export function resetPin(record: StudentRecord): StudentRecord {
  return {
    ...record,
    pinHash: '',
    pinResetAt: new Date().toISOString(),
  };
}
