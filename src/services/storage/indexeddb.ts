/**
 * IndexedDB Storage Adapter Implementation
 *
 * Thin coordinator over the storage sub-modules:
 * - `idb-connection`  — open/upgrade/recovery + schema (DB_VERSION, stores)
 * - `idb-helpers`     — promisify/runTransaction scaffolding
 * - `idb-codec`       — encryption-aware encode/decode + format checks
 * - `backup-repository` / `audit-log-repository` — non-student stores
 *
 * Database: Configured via #qd-db-name element (REQUIRED)
 * Stores: students (main data), backups (backup copies), auditLog (PIN resets)
 * Keys: qd/{release}/u{serviceId}
 */

import type {
  StorageAdapter,
  StudentRecord,
  ReleaseId,
  ServiceId,
  PinResetEvent,
} from '../../types/contracts.js';
import { getStorageKey, StorageNotInitializedError, StorageError } from './adapter-utils.js';
import { openDatabase, STORE_STUDENTS } from './idb-connection.js';
import { promisifyRequest, runTransaction } from './idb-helpers.js';
import {
  encodeForStore,
  decodeStoredValue,
  tryDecodeCursorValue,
  isEncryptionEnabled,
} from './idb-codec.js';
import { createBackup } from './backup-repository.js';
import { saveAuditEvent as persistAuditEvent } from './audit-log-repository.js';
import { STORE_BACKUPS, STORE_AUDIT_LOG } from './idb-connection.js';

/**
 * IndexedDB implementation of StorageAdapter
 *
 * Features:
 * - Automatic schema creation with indexes
 * - Atomic transactions
 * - Quota error handling
 * - Backup functionality
 */
export class IndexedDBStorageAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private dbName: string;

  /**
   * Create a new IndexedDB storage adapter
   *
   * @param dbName - Database name (REQUIRED - no default)
   */
  constructor(dbName: string) {
    if (!dbName) {
      throw new Error('FATAL: dbName is required for IndexedDBStorageAdapter');
    }
    this.dbName = dbName;
  }

  /**
   * Initialize the IndexedDB database
   *
   * Creates object stores and indexes on first run. Safe to call multiple
   * times - will reuse the existing connection or in-flight init.
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = openDatabase(this.dbName)
      .then((db) => {
        this.db = db;
      })
      .finally(() => {
        this.initPromise = null;
      });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized before operations
   *
   * @throws StorageNotInitializedError if not initialized
   * @returns Database instance
   */
  private ensureInitialized(): IDBDatabase {
    if (!this.db) {
      throw new StorageNotInitializedError('ensureInitialized');
    }
    return this.db;
  }

  /**
   * Get a student record by release and service ID
   *
   * @param release - Release identifier
   * @param serviceId - Service identifier
   * @returns Student record or null if not found
   * @throws StorageFormatError if format mismatch detected
   */
  async getStudent(release: ReleaseId, serviceId: ServiceId): Promise<StudentRecord | null> {
    const db = this.ensureInitialized();
    const key = getStorageKey(release, serviceId);

    const rawValue = await runTransaction<unknown>(
      db,
      STORE_STUDENTS,
      'readonly',
      (store) => store.get(key),
      'getStudent',
    );

    if (rawValue === undefined || rawValue === null) {
      return null;
    }

    return decodeStoredValue(rawValue, release, key);
  }

  /**
   * Save a student record (encodes when encryption is enabled).
   *
   * @param record - Student record to save
   * @throws StorageQuotaError if storage quota exceeded
   */
  async saveStudent(record: StudentRecord): Promise<void> {
    const db = this.ensureInitialized();
    const key = getStorageKey(record.release, record.serviceId);
    const valueToStore = encodeForStore(record);

    await runTransaction(
      db,
      STORE_STUDENTS,
      'readwrite',
      (store) => store.put(valueToStore, key),
      'saveStudent',
    );
  }

  /**
   * Get all students for a specific release.
   *
   * Uses the by-release index in plain mode; performs a full decode scan when
   * encryption is enabled (the index cannot see into obfuscated values).
   *
   * @param release - Release identifier
   * @returns Array of student records (empty if none found)
   */
  async getStudentsByRelease(release: ReleaseId): Promise<StudentRecord[]> {
    const db = this.ensureInitialized();

    if (isEncryptionEnabled()) {
      return this.getStudentsByReleaseEncrypted(release);
    }

    const all = await runTransaction<StudentRecord[]>(
      db,
      STORE_STUDENTS,
      'readonly',
      (store) => store.index('by-release').getAll(release) as IDBRequest<StudentRecord[]>,
      'getStudentsByRelease',
    );
    return all || [];
  }

  /**
   * Full-scan decode of all students for a release (encryption enabled).
   */
  private getStudentsByReleaseEncrypted(release: ReleaseId): Promise<StudentRecord[]> {
    const db = this.ensureInitialized();

    return new Promise<StudentRecord[]>((resolve, reject) => {
      const transaction = db.transaction(STORE_STUDENTS, 'readonly');
      const store = transaction.objectStore(STORE_STUDENTS);
      const request = store.openCursor();
      const results: StudentRecord[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const record = tryDecodeCursorValue(cursor.value, release);
          if (record && record.release === release) {
            results.push(record);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => {
        reject(
          new StorageError(
            'Failed during getStudentsByRelease',
            'getStudentsByRelease',
            request.error as Error,
          ),
        );
      };
    });
  }

  /**
   * Clear all data from the database.
   *
   * Removes students, backups, and audit-log entries in a single atomic
   * transaction.
   */
  async clearAll(): Promise<void> {
    const db = this.ensureInitialized();
    const transaction = db.transaction(
      [STORE_STUDENTS, STORE_BACKUPS, STORE_AUDIT_LOG],
      'readwrite',
    );

    await Promise.all([
      promisifyRequest(transaction.objectStore(STORE_STUDENTS).clear(), 'clearAll'),
      promisifyRequest(transaction.objectStore(STORE_BACKUPS).clear(), 'clearAll'),
      promisifyRequest(transaction.objectStore(STORE_AUDIT_LOG).clear(), 'clearAll'),
    ]);
  }

  /**
   * Create a backup of a student record.
   *
   * @param record - Student record to backup
   * @throws StorageQuotaError if storage quota exceeded
   */
  async backup(record: StudentRecord): Promise<void> {
    const db = this.ensureInitialized();
    await createBackup(db, record);
  }

  /**
   * Save a PIN reset event to the audit log.
   *
   * @param event - PIN reset event to log
   */
  async saveAuditEvent(event: PinResetEvent): Promise<void> {
    const db = this.ensureInitialized();
    await persistAuditEvent(db, event);
  }

  /**
   * Close the database connection.
   *
   * Useful for cleanup in tests and application shutdown.
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

/**
 * Singleton storage adapter instance
 */
let storageInstance: IndexedDBStorageAdapter | null = null;
let currentDbName: string | null = null;

/**
 * Get the singleton storage adapter instance
 *
 * Creates a new instance on first call, reuses it thereafter.
 * If dbName changes, closes old instance and creates new one.
 *
 * @param dbName - Database name (REQUIRED - no default)
 * @returns IndexedDB storage adapter
 */
export function getStorageAdapter(dbName: string): IndexedDBStorageAdapter {
  if (!dbName) {
    throw new Error('FATAL: dbName is required for getStorageAdapter()');
  }

  // If dbName changed, close old instance and create new one
  if (storageInstance && currentDbName !== dbName) {
    storageInstance.close();
    storageInstance = null;
  }

  if (!storageInstance) {
    storageInstance = new IndexedDBStorageAdapter(dbName);
    currentDbName = dbName;
  }
  return storageInstance;
}

/**
 * Reset the singleton instance
 *
 * Useful for testing to ensure clean state between tests.
 */
export function resetStorageAdapter(): void {
  if (storageInstance) {
    storageInstance.close();
    storageInstance = null;
    currentDbName = null;
  }
}
