/**
 * Backup repository.
 *
 * Owns the backup-record shape, key format, and persistence to the `backups`
 * object store. Extracted from `indexeddb.ts`.
 */

import type { StudentRecord } from '../../types/contracts.js';
import { getStorageKey } from './adapter-utils.js';
import { runTransaction } from './idb-helpers.js';
import { STORE_BACKUPS } from './idb-connection.js';

/**
 * A student record copy with backup metadata.
 */
export interface BackupRecord extends StudentRecord {
  /** Original storage key */
  originalKey: string;
  /** Backup timestamp */
  timestamp: string;
}

/**
 * Create a timestamped backup of a student record.
 *
 * Backup key format: `backup_{timestamp}_{serviceId}`.
 *
 * @param db - Open database connection
 * @param record - Student record to back up
 * @throws StorageQuotaError if storage quota exceeded
 */
export async function createBackup(db: IDBDatabase, record: StudentRecord): Promise<void> {
  const timestamp = new Date().toISOString();
  const backupKey = `backup_${timestamp}_${record.serviceId}`;
  const originalKey = getStorageKey(record.release, record.serviceId);

  const backupRecord: BackupRecord = {
    ...record,
    originalKey,
    timestamp,
  };

  await runTransaction(
    db,
    STORE_BACKUPS,
    'readwrite',
    (store) => store.put(backupRecord, backupKey),
    'backup',
  );
}
