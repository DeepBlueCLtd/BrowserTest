/**
 * IndexedDB Storage Adapter Implementation
 *
 * Provides persistent storage for student records using browser IndexedDB.
 * Implements atomic transactions and proper error handling.
 */

import type { StorageAdapter, StudentRecord, ReleaseId, ServiceId } from '../../types/contracts';
import {
  getStorageKey,
  StorageNotInitializedError,
  StorageError,
  StorageQuotaError,
} from './adapter';

const DB_NAME = 'SonarQuizDB';
const DB_VERSION = 1;
const STORE_STUDENTS = 'students';
const STORE_BACKUPS = 'backups';

/**
 * IndexedDB implementation of StorageAdapter
 */
export class IndexedDBStorageAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   * Creates object stores and indexes on first run
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
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(new StorageError('Failed to open database', 'init', request.error as Error));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create students object store
        if (!db.objectStoreNames.contains(STORE_STUDENTS)) {
          const studentsStore = db.createObjectStore(STORE_STUDENTS, { keyPath: null });

          // Create indexes for efficient queries
          studentsStore.createIndex('by-release', 'release', { unique: false });
          studentsStore.createIndex('by-service-id', 'serviceId', { unique: false });
          studentsStore.createIndex('by-updated', 'updated', { unique: false });
        }

        // Create backups object store
        if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
          const backupsStore = db.createObjectStore(STORE_BACKUPS, { keyPath: null });

          // Create indexes for backup queries
          backupsStore.createIndex('by-original-key', 'originalKey', { unique: false });
          backupsStore.createIndex('by-timestamp', 'timestamp', { unique: false });
        }
      };

      request.onblocked = () => {
        console.warn('IndexedDB upgrade blocked by another connection');
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized before operations
   */
  private ensureInitialized(): IDBDatabase {
    if (!this.db) {
      throw new StorageNotInitializedError('operation');
    }
    return this.db;
  }

  /**
   * Get a student record by release and service ID
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
   * Updates the 'updated' timestamp automatically
   */
  async saveStudent(record: StudentRecord): Promise<void> {
    const db = this.ensureInitialized();
    const key = getStorageKey(record.release, record.serviceId);

    // Update the timestamp
    const recordToSave: StudentRecord = {
      ...record,
      updated: new Date().toISOString(),
    };

    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_STUDENTS, 'readwrite');
        const store = transaction.objectStore(STORE_STUDENTS);
        const request = store.put(recordToSave, key);

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
   * Uses the by-release index for efficient queries
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
   * Removes both students and backups in a single transaction
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
   * Backup key format: backup_{timestamp}_{serviceId}
   */
  async backup(record: StudentRecord): Promise<void> {
    const db = this.ensureInitialized();
    const timestamp = new Date().toISOString();
    const backupKey = `backup_${timestamp}_${record.serviceId}`;
    const originalKey = getStorageKey(record.release, record.serviceId);

    const backupRecord = {
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
   * Useful for cleanup in tests
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
 * Create and return a singleton instance of the storage adapter
 */
let storageInstance: IndexedDBStorageAdapter | null = null;

export function getStorageAdapter(): IndexedDBStorageAdapter {
  if (!storageInstance) {
    storageInstance = new IndexedDBStorageAdapter();
  }
  return storageInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetStorageAdapter(): void {
  if (storageInstance) {
    storageInstance.close();
    storageInstance = null;
  }
}
