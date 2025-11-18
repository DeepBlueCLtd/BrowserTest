/**
 * IndexedDB Storage Adapter Implementation
 *
 * Provides persistent storage for student records using browser IndexedDB.
 * Implements atomic transactions and proper error handling.
 *
 * Database: BrowserTest
 * Stores: students (main data), backups (backup copies)
 * Keys: qd/{release}/u{serviceId}
 */

import type { StorageAdapter, StudentRecord, ReleaseId, ServiceId } from '../../types/contracts.js';
import {
  getStorageKey,
  StorageNotInitializedError,
  StorageError,
  StorageQuotaError,
} from './adapter-utils.js';
import { info, warn as logWarn, error as logError } from '../../utils/logger.js';

/** Default database name */
const DEFAULT_DB_NAME = 'BrowserTest';

/** Database version - increment to force schema upgrade */
const DB_VERSION = 2;

/** Object store names */
const STORE_STUDENTS = 'students';
const STORE_BACKUPS = 'backups';

/**
 * Backup record with metadata
 */
interface BackupRecord extends StudentRecord {
  /** Original storage key */
  originalKey: string;
  /** Backup timestamp */
  timestamp: string;
}

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
   * @param dbName - Database name (defaults to 'BrowserTest')
   */
  constructor(dbName: string = DEFAULT_DB_NAME) {
    this.dbName = dbName;
  }

  /**
   * Initialize the IndexedDB database
   *
   * Creates object stores and indexes on first run.
   * Safe to call multiple times - will reuse existing connection.
   *
   * @returns Promise that resolves when database is ready
   */
  async init(): Promise<void> {
    // Return existing initialization promise if already in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    // If already initialized, return immediately
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(new StorageError('Failed to open database', 'init', request.error as Error));
      };

      request.onsuccess = () => {
        this.db = request.result;

        info(
          `IndexedDB opened: ${this.dbName} v${this.db.version}, stores: [${Array.from(this.db.objectStoreNames).join(', ')}]`,
        );

        // Verify object stores exist - if not, database is corrupted
        if (
          !this.db.objectStoreNames.contains(STORE_STUDENTS) ||
          !this.db.objectStoreNames.contains(STORE_BACKUPS)
        ) {
          // Database exists but stores missing - delete and recreate
          logWarn(
            `Database corrupted (missing stores). Found: [${Array.from(this.db.objectStoreNames).join(', ')}]`,
          );
          this.db.close();
          this.db = null;

          // Delete corrupted database
          const deleteRequest = indexedDB.deleteDatabase(this.dbName);
          deleteRequest.onsuccess = () => {
            logWarn('Corrupted database deleted, retrying init...');
            // Retry initialization
            this.initPromise = null;
            this.init()
              .then(resolve)
              .catch(reject);
          };
          deleteRequest.onerror = () => {
            this.initPromise = null;
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

        this.initPromise = null;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const upgradeEvent = event as IDBVersionChangeEvent;
        const db = (event.target as IDBOpenDBRequest).result;

        info(
          `IndexedDB upgrade: ${this.dbName} v${upgradeEvent.oldVersion} → v${upgradeEvent.newVersion}`,
        );

        try {
          // Create students object store
          if (!db.objectStoreNames.contains(STORE_STUDENTS)) {
            info('Creating students object store...');
            const studentsStore = db.createObjectStore(STORE_STUDENTS, { keyPath: null });

            // Create indexes for efficient queries
            studentsStore.createIndex('by-release', 'release', { unique: false });
            studentsStore.createIndex('by-service-id', 'serviceId', { unique: false });
            info('Students store created with indexes');
          } else {
            info('Students store already exists, skipping');
          }

          // Create backups object store
          if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
            info('Creating backups object store...');
            const backupsStore = db.createObjectStore(STORE_BACKUPS, { keyPath: null });

            // Create indexes for backup queries
            backupsStore.createIndex('by-original-key', 'originalKey', { unique: false });
            backupsStore.createIndex('by-timestamp', 'timestamp', { unique: false });
            info('Backups store created with indexes');
          } else {
            info('Backups store already exists, skipping');
          }

          info(
            `Upgrade complete. Stores: [${Array.from(db.objectStoreNames).join(', ')}]`,
          );
        } catch (err) {
          logError('Error during database upgrade', err as Error);
          throw err;
        }
      };

      request.onblocked = () => {
        logWarn('IndexedDB upgrade blocked by another connection');
      };
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
   */
  async getStudent(release: ReleaseId, serviceId: ServiceId): Promise<StudentRecord | null> {
    const db = this.ensureInitialized();
    const key = getStorageKey(release, serviceId);

    return new Promise<StudentRecord | null>((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_STUDENTS, 'readonly');
        const store = transaction.objectStore(STORE_STUDENTS);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve((request.result as StudentRecord | undefined) || null);
        };

        request.onerror = () => {
          reject(
            new StorageError('Failed to get student record', 'getStudent', request.error as Error),
          );
        };
      } catch (error) {
        reject(new StorageError('Failed to get student record', 'getStudent', error as Error));
      }
    });
  }

  /**
   * Save a student record
   *
   * @param record - Student record to save
   * @throws StorageQuotaError if storage quota exceeded
   */
  async saveStudent(record: StudentRecord): Promise<void> {
    const db = this.ensureInitialized();
    const key = getStorageKey(record.release, record.serviceId);

    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_STUDENTS, 'readwrite');
        const store = transaction.objectStore(STORE_STUDENTS);
        const request = store.put(record, key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          // Check for quota errors
          if (request.error?.name === 'QuotaExceededError') {
            reject(new StorageQuotaError('saveStudent'));
          } else {
            reject(
              new StorageError(
                'Failed to save student record',
                'saveStudent',
                request.error as Error,
              ),
            );
          }
        };

        transaction.onerror = () => {
          reject(
            new StorageError(
              'Transaction failed while saving student',
              'saveStudent',
              transaction.error as Error,
            ),
          );
        };
      } catch (error) {
        reject(new StorageError('Failed to save student record', 'saveStudent', error as Error));
      }
    });
  }

  /**
   * Get all students for a specific release
   *
   * Uses the by-release index for efficient queries.
   *
   * @param release - Release identifier
   * @returns Array of student records (empty if none found)
   */
  async getStudentsByRelease(release: ReleaseId): Promise<StudentRecord[]> {
    const db = this.ensureInitialized();

    return new Promise<StudentRecord[]>((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_STUDENTS, 'readonly');
        const store = transaction.objectStore(STORE_STUDENTS);
        const index = store.index('by-release');
        const request = index.getAll(release);

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(
            new StorageError(
              'Failed to get students by release',
              'getStudentsByRelease',
              request.error as Error,
            ),
          );
        };
      } catch (error) {
        reject(
          new StorageError(
            'Failed to get students by release',
            'getStudentsByRelease',
            error as Error,
          ),
        );
      }
    });
  }

  /**
   * Clear all data from the database
   *
   * Removes both students and backups in a single atomic transaction.
   */
  async clearAll(): Promise<void> {
    const db = this.ensureInitialized();

    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_STUDENTS, STORE_BACKUPS], 'readwrite');

        const studentsStore = transaction.objectStore(STORE_STUDENTS);
        const backupsStore = transaction.objectStore(STORE_BACKUPS);

        const clearStudentsRequest = studentsStore.clear();
        const clearBackupsRequest = backupsStore.clear();

        let studentsCleared = false;
        let backupsCleared = false;

        clearStudentsRequest.onsuccess = () => {
          studentsCleared = true;
          if (backupsCleared) {
            resolve();
          }
        };

        clearBackupsRequest.onsuccess = () => {
          backupsCleared = true;
          if (studentsCleared) {
            resolve();
          }
        };

        clearStudentsRequest.onerror = () => {
          reject(
            new StorageError(
              'Failed to clear students',
              'clearAll',
              clearStudentsRequest.error as Error,
            ),
          );
        };

        clearBackupsRequest.onerror = () => {
          reject(
            new StorageError(
              'Failed to clear backups',
              'clearAll',
              clearBackupsRequest.error as Error,
            ),
          );
        };

        transaction.onerror = () => {
          reject(
            new StorageError(
              'Transaction failed during clearAll',
              'clearAll',
              transaction.error as Error,
            ),
          );
        };
      } catch (error) {
        reject(new StorageError('Failed to clear all data', 'clearAll', error as Error));
      }
    });
  }

  /**
   * Create a backup of a student record
   *
   * Backup key format: backup_{timestamp}_{serviceId}
   *
   * @param record - Student record to backup
   * @throws StorageQuotaError if storage quota exceeded
   */
  async backup(record: StudentRecord): Promise<void> {
    const db = this.ensureInitialized();
    const timestamp = new Date().toISOString();
    const backupKey = `backup_${timestamp}_${record.serviceId}`;
    const originalKey = getStorageKey(record.release, record.serviceId);

    const backupRecord: BackupRecord = {
      ...record,
      originalKey,
      timestamp,
    };

    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_BACKUPS, 'readwrite');
        const store = transaction.objectStore(STORE_BACKUPS);
        const request = store.put(backupRecord, backupKey);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          // Check for quota errors
          if (request.error?.name === 'QuotaExceededError') {
            reject(new StorageQuotaError('backup'));
          } else {
            reject(new StorageError('Failed to create backup', 'backup', request.error as Error));
          }
        };

        transaction.onerror = () => {
          reject(
            new StorageError(
              'Transaction failed during backup',
              'backup',
              transaction.error as Error,
            ),
          );
        };
      } catch (error) {
        reject(new StorageError('Failed to create backup', 'backup', error as Error));
      }
    });
  }

  /**
   * Close the database connection
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
 * @param dbName - Database name (defaults to 'BrowserTest')
 * @returns IndexedDB storage adapter
 */
export function getStorageAdapter(dbName: string = DEFAULT_DB_NAME): IndexedDBStorageAdapter {
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
