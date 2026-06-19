/**
 * IndexedDB connection management.
 *
 * Owns the database schema version, object-store names, the `onupgradeneeded`
 * schema creation, and the open/timeout/corruption-recovery flow. Extracted
 * from `indexeddb.ts` so the adapter no longer embeds connection plumbing.
 */

import { StorageError } from './adapter-utils.js';
import { warn as logWarn, error as logError } from '../../utils/logger.js';

/** Database version - increment to force schema upgrade */
export const DB_VERSION = 3;

/** Object store names */
export const STORE_STUDENTS = 'students';
export const STORE_BACKUPS = 'backups';
export const STORE_AUDIT_LOG = 'auditLog';

/** Timeout for hung database open operations */
const OPEN_TIMEOUT_MS = 5000;

/**
 * Create the object stores and indexes for a fresh or upgrading database.
 */
function createSchema(event: IDBVersionChangeEvent): void {
  const db = (event.target as IDBOpenDBRequest).result;
  const transaction = (event.target as IDBOpenDBRequest).transaction;

  if (transaction) {
    transaction.onerror = () => {
      logError(`Upgrade transaction error: ${transaction.error?.message || 'unknown'}`);
    };
    transaction.onabort = () => {
      logError(`Upgrade transaction aborted: ${transaction.error?.message || 'unknown'}`);
    };
  }

  try {
    // Create students object store
    if (!db.objectStoreNames.contains(STORE_STUDENTS)) {
      const studentsStore = db.createObjectStore(STORE_STUDENTS, { keyPath: null });
      studentsStore.createIndex('by-release', 'release', { unique: false });
      studentsStore.createIndex('by-service-id', 'serviceId', { unique: false });
    }

    // Create backups object store
    if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
      const backupsStore = db.createObjectStore(STORE_BACKUPS, { keyPath: null });
      backupsStore.createIndex('by-original-key', 'originalKey', { unique: false });
      backupsStore.createIndex('by-timestamp', 'timestamp', { unique: false });
    }

    // Create audit log object store (v3 - PIN reset events)
    if (!db.objectStoreNames.contains(STORE_AUDIT_LOG)) {
      const auditStore = db.createObjectStore(STORE_AUDIT_LOG, { keyPath: 'eventId' });
      auditStore.createIndex('by-service-id', 'serviceId', { unique: false });
      auditStore.createIndex('by-reset-at', 'resetAt', { unique: false });
    }
  } catch (err) {
    logError('Error during database upgrade', err as Error);
    throw err;
  }
}

/**
 * Whether the opened database is missing any required object store.
 */
function isCorrupted(db: IDBDatabase): boolean {
  return (
    !db.objectStoreNames.contains(STORE_STUDENTS) ||
    !db.objectStoreNames.contains(STORE_BACKUPS) ||
    !db.objectStoreNames.contains(STORE_AUDIT_LOG)
  );
}

/**
 * Open (and if necessary create/upgrade or recover) the IndexedDB database.
 *
 * Mirrors the original adapter `init()` flow: a 5s open timeout triggers a
 * delete-and-recreate recovery, and an opened-but-store-less database is
 * treated as corrupted and recreated.
 *
 * @param dbName - Database name
 * @returns The ready database connection
 */
export function openDatabase(dbName: string): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    let timeoutId: number | undefined;
    let resolved = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    timeoutId = window.setTimeout(() => {
      if (resolved) return;
      resolved = true;

      logWarn(`IndexedDB open timed out after ${OPEN_TIMEOUT_MS}ms - attempting recovery`);

      const deleteReq = indexedDB.deleteDatabase(dbName);
      deleteReq.onsuccess = () => {
        openDatabase(dbName).then(resolve).catch(reject);
      };
      deleteReq.onerror = () => {
        reject(
          new StorageError(
            `Database "${dbName}" appears corrupted. Please clear site data in browser settings.`,
            'init',
          ),
        );
      };
      deleteReq.onblocked = () => {
        reject(
          new StorageError(
            `Cannot recover database - close all other tabs with this site and reload.`,
            'init',
          ),
        );
      };
    }, OPEN_TIMEOUT_MS);

    const request = indexedDB.open(dbName, DB_VERSION);

    request.onerror = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      logError(`IndexedDB open error: ${request.error?.message || 'unknown'}`);
      reject(new StorageError('Failed to open database', 'init', request.error as Error));
    };

    request.onblocked = () => {
      logWarn('IndexedDB open blocked - close other tabs with this database');
    };

    request.onsuccess = () => {
      if (resolved) return;
      resolved = true;
      cleanup();

      const db = request.result;

      // Verify object stores exist - if not, database is corrupted
      if (isCorrupted(db)) {
        logWarn(
          `Database corrupted (missing stores). Found: [${Array.from(db.objectStoreNames).join(', ')}]`,
        );
        db.close();

        const deleteRequest = indexedDB.deleteDatabase(dbName);
        deleteRequest.onsuccess = () => {
          openDatabase(dbName).then(resolve).catch(reject);
        };
        deleteRequest.onerror = () => {
          reject(
            new StorageError(
              'Failed to delete corrupted database',
              'init',
              deleteRequest.error as Error,
            ),
          );
        };
        return;
      }

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      createSchema(event);
    };
  });
}
