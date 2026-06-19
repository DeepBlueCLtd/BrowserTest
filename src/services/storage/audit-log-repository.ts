/**
 * Audit-log repository.
 *
 * Persists PIN-reset audit events to the `auditLog` object store. Extracted
 * from `indexeddb.ts`.
 */

import type { PinResetEvent } from '../../types/contracts.js';
import { runTransaction } from './idb-helpers.js';
import { STORE_AUDIT_LOG } from './idb-connection.js';

/**
 * Append a PIN-reset event to the audit log.
 *
 * @param db - Open database connection
 * @param event - PIN reset event to record
 */
export async function saveAuditEvent(db: IDBDatabase, event: PinResetEvent): Promise<void> {
  await runTransaction(
    db,
    STORE_AUDIT_LOG,
    'readwrite',
    (store) => store.add(event),
    'saveAuditEvent',
  );
}
