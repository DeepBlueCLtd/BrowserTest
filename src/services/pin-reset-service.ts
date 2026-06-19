/**
 * PIN reset service.
 *
 * Encapsulates the storage init, PIN reset, save, and audit-event construction
 * for an instructor-initiated PIN reset. Extracted from `qd-pin-reset-dialog`
 * so the dialog only renders the result.
 */

import type { StudentRecord, PinResetEvent } from '../types/contracts.js';
import { getStorageAdapter } from './storage/indexeddb.js';
import { resetPin } from './storage/migration.js';
import { readDbName, CONFIG_IDS } from '../config/dom-config-reader.js';

/**
 * Result of a PIN reset.
 */
export interface PinResetResult {
  ok: boolean;
  /** User-facing error message when `ok` is false. */
  error?: string;
  /** The updated student record when `ok` is true. */
  updated?: StudentRecord;
}

/**
 * Reset a student's PIN and write an audit event.
 *
 * @param student - Student whose PIN to reset
 * @returns Success with the updated record, or failure with a message
 */
export async function resetStudentPin(student: StudentRecord): Promise<PinResetResult> {
  const dbName = readDbName();
  if (!dbName) {
    return {
      ok: false,
      error: `Database name not configured. Add <span id="${CONFIG_IDS.dbName}">dbName</span> to page.`,
    };
  }

  try {
    const storage = getStorageAdapter(dbName);
    await storage.init();

    const updated = resetPin(student);
    await storage.saveStudent(updated);

    const auditEvent: PinResetEvent = {
      eventId: crypto.randomUUID(),
      serviceId: student.serviceId,
      resetBy: 'instructor',
      resetAt: new Date().toISOString(),
      release: student.release,
    };
    await storage.saveAuditEvent(auditEvent);

    return { ok: true, updated };
  } catch (err) {
    console.error('PIN reset error:', err);
    return { ok: false, error: 'Failed to reset PIN. Please try again.' };
  }
}
