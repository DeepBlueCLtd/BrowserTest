/**
 * Obfuscation Migration Utility
 *
 * Provides functions to migrate IndexedDB data between plain and obfuscated formats.
 * Call from browser console or test setup.
 */

import type { StudentRecord } from '../../types/contracts.js';
import { encode, decode, deriveKey, isObfuscated } from './obfuscation.js';
import { info as logInfo, warn as logWarn, error as logError } from '../../utils/logger.js';

/** Migration direction */
export type ObfuscationMigrationDirection = 'encrypt' | 'decrypt';

/** Migration options */
export interface ObfuscationMigrationOptions {
  /** Release ID for key derivation */
  releaseId: string;
  /** If true, report what would change without modifying data */
  dryRun?: boolean;
}

/** Migration result */
export interface ObfuscationMigrationResult {
  /** Number of records migrated */
  migrated: number;
  /** Number of records skipped (already in target format) */
  skipped: number;
  /** Errors encountered during migration */
  errors: Array<{ key: string; error: string }>;
  /** Total time in milliseconds */
  durationMs: number;
}

/** Object store name for students */
const STORE_STUDENTS = 'students';

/**
 * Migrate storage between plain and obfuscated formats
 *
 * @param dbName - IndexedDB database name
 * @param direction - 'encrypt' to obfuscate, 'decrypt' to restore plain
 * @param options - Migration options including releaseId and optional dryRun
 * @returns Migration result with counts and any errors
 */
export async function migrateObfuscation(
  dbName: string,
  direction: ObfuscationMigrationDirection,
  options: ObfuscationMigrationOptions,
): Promise<ObfuscationMigrationResult> {
  const startTime = performance.now();
  const result: ObfuscationMigrationResult = {
    migrated: 0,
    skipped: 0,
    errors: [],
    durationMs: 0,
  };

  const { releaseId, dryRun = false } = options;
  const obfKey = deriveKey(releaseId);

  logInfo(`Starting obfuscation migration: direction=${direction}, dryRun=${dryRun}`);

  // Open database
  const db = await openDatabase(dbName);

  try {
    // Get all records
    const allRecords = await getAllRawRecords(db);

    for (const { key, value } of allRecords) {
      try {
        const currentlyObfuscated = isObfuscated(value);

        if (direction === 'encrypt') {
          if (currentlyObfuscated) {
            result.skipped++;
            continue;
          }

          // Convert plain to obfuscated
          const plainRecord = value as StudentRecord;
          const obfuscatedValue = encode(plainRecord, obfKey);

          if (!dryRun) {
            await putRawRecord(db, key, obfuscatedValue);
          }
          result.migrated++;
        } else {
          // decrypt
          if (!currentlyObfuscated) {
            result.skipped++;
            continue;
          }

          // Convert obfuscated to plain
          const plainRecord = decode<StudentRecord>(value, obfKey);

          if (!dryRun) {
            await putRawRecord(db, key, plainRecord);
          }
          result.migrated++;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        result.errors.push({ key, error: errorMessage });
        logWarn(`Migration error for key ${key}: ${errorMessage}`);
      }
    }
  } finally {
    db.close();
  }

  result.durationMs = performance.now() - startTime;
  logInfo(
    `Migration complete: migrated=${result.migrated}, skipped=${result.skipped}, errors=${result.errors.length}, duration=${result.durationMs.toFixed(2)}ms`,
  );

  return result;
}

/**
 * Open IndexedDB database
 */
async function openDatabase(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      logError(`Failed to open database: ${request.error?.message}`);
      reject(new Error(`Failed to open database: ${request.error?.message}`));
    };
  });
}

/**
 * Get all raw records from the students store
 */
async function getAllRawRecords(db: IDBDatabase): Promise<Array<{ key: string; value: unknown }>> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_STUDENTS, 'readonly');
    const store = transaction.objectStore(STORE_STUDENTS);
    const request = store.openCursor();
    const records: Array<{ key: string; value: unknown }> = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        // cursor.key is IDBValidKey - could be string, number, Date, array, etc.
        // We use out-of-line keys which are always strings in this app
        const keyStr = typeof cursor.key === 'string' ? cursor.key : JSON.stringify(cursor.key);
        records.push({ key: keyStr, value: cursor.value });
        cursor.continue();
      } else {
        resolve(records);
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to read records: ${request.error?.message}`));
    };
  });
}

/**
 * Put a raw record into the students store
 */
async function putRawRecord(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_STUDENTS, 'readwrite');
    const store = transaction.objectStore(STORE_STUDENTS);
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      reject(new Error(`Failed to save record: ${request.error?.message}`));
    };
  });
}
