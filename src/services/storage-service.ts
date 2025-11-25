/**
 * Storage Service
 *
 * Coordinates between IndexedDB persistence and sessionStorage cache.
 * Provides high-level operations for loading/saving student records.
 */

import type {
  StudentRecord,
  SessionData,
  SessionCache,
  PageData,
  PageId,
  ReleaseId,
  AnswerRecord,
} from '../types/contracts.js';
import { getStorageAdapter } from './storage/indexeddb.js';
import { buildCacheFromRecord } from './session.js';
import { calculateCompletionState } from './state-calculator.js';
import { recalculateTotalsFromPages } from '../utils/calculation-helpers.js';
import { info, warn, error as logError } from '../utils/logger.js';

/**
 * Storage Service for managing student records
 */
export class StorageService {
  private adapter;
  private dbName: string;

  /**
   * Create storage service with specified database name
   *
   * @param dbName - IndexedDB database name (REQUIRED - no default)
   */
  constructor(dbName: string) {
    if (!dbName) {
      throw new Error('FATAL: dbName is required for StorageService');
    }
    this.dbName = dbName;
    this.adapter = getStorageAdapter(dbName);
  }

  /**
   * Initialize IndexedDB storage
   */
  async init(): Promise<void> {
    try {
      await this.adapter.init();
      info(`Storage service initialized (IndexedDB "${this.dbName}" ready)`);
    } catch (err) {
      logError('Failed to initialize storage service', err as Error);
      throw err;
    }
  }

  /**
   * Load student record from IndexedDB
   *
   * Creates a new record if none exists.
   *
   * @param session - Current session data
   * @returns Student record
   */
  async loadStudentRecord(session: SessionData): Promise<StudentRecord> {
    try {
      const existing = await this.adapter.getStudent(session.release, session.serviceId);

      if (existing) {
        info(`Loaded student record for ${session.serviceId} from IndexedDB`);
        return existing;
      }

      // Create new student record
      const newRecord: StudentRecord = {
        schema: 1,
        docId: session.release, // Use release as docId
        release: session.release,
        serviceId: session.serviceId,
        name: session.name,
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      info(`Created new student record for ${session.serviceId}`);
      return newRecord;
    } catch (err) {
      // If IndexedDB has schema issues, create a new record
      warn(`IndexedDB error, creating new record: ${(err as Error).message}`);
      const newRecord: StudentRecord = {
        schema: 1,
        docId: session.release,
        release: session.release,
        serviceId: session.serviceId,
        name: session.name,
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };
      return newRecord;
    }
  }

  /**
   * Save student record to IndexedDB
   *
   * @param record - Student record to save
   */
  async saveStudentRecord(record: StudentRecord): Promise<void> {
    try {
      // Update timestamp
      record.updated = new Date().toISOString();

      // Recalculate totals from pages using calculation helper
      const totals = recalculateTotalsFromPages(record.pages);
      record.attempted = totals.attempted;
      record.correct = totals.correct;

      await this.adapter.saveStudent(record);
      info(`Saved student record for ${record.serviceId} to IndexedDB`);
    } catch (err) {
      logError('Failed to save student record', err as Error);
      throw err;
    }
  }

  /**
   * Update student record with a new answer
   *
   * @param record - Current student record
   * @param pageId - Page where answer was submitted
   * @param questionIndex - Question index (0-based)
   * @param answer - Answer record
   * @param totalQuestions - Total questions on the page
   * @returns Updated student record
   */
  updateRecordWithAnswer(
    record: StudentRecord,
    pageId: PageId,
    questionIndex: number,
    answer: AnswerRecord,
    totalQuestions: number,
  ): StudentRecord {
    // Get or create page data
    const existingPage = record.pages[pageId];
    const pageData: PageData = existingPage || {
      answers: [],
      state: 'unstarted',
    };

    // Ensure answers array is large enough
    while (pageData.answers.length <= questionIndex) {
      pageData.answers.push({
        answer: '',
        success: false,
        timestamp: new Date().toISOString(),
      });
    }

    // Update answer at index (FR-015: overwrites previous answer for re-submissions)
    // Only the most recent answer is stored, with updated timestamp
    pageData.answers[questionIndex] = answer;

    // Update timestamps
    const now = new Date().toISOString();
    if (!pageData.firstAttempted) {
      pageData.firstAttempted = now;
    }
    pageData.lastAttempted = now;

    // Recalculate state
    pageData.state = calculateCompletionState(pageData.answers, totalQuestions);

    // Update record
    return {
      ...record,
      pages: {
        ...record.pages,
        [pageId]: pageData,
      },
    };
  }

  /**
   * Build session cache from student record
   *
   * @param record - Student record
   * @returns Session cache
   */
  buildCache(record: StudentRecord): SessionCache {
    return buildCacheFromRecord(record);
  }

  /**
   * Get all students for a release
   *
   * @param release - Release identifier
   * @returns Array of student records
   */
  async getStudentsByRelease(release: ReleaseId): Promise<StudentRecord[]> {
    try {
      return await this.adapter.getStudentsByRelease(release);
    } catch (err) {
      logError('Failed to get students by release', err as Error);
      throw err;
    }
  }

  /**
   * Clear all data from IndexedDB
   */
  async clearAll(): Promise<void> {
    try {
      await this.adapter.clearAll();
      info('Cleared all data from IndexedDB');
    } catch (err) {
      logError('Failed to clear all data', err as Error);
      throw err;
    }
  }

  /**
   * Create backup of student record
   *
   * @param record - Student record to backup
   */
  async backup(record: StudentRecord): Promise<void> {
    try {
      await this.adapter.backup(record);
      info(`Created backup for ${record.serviceId}`);
    } catch (err) {
      warn(`Failed to create backup for ${record.serviceId}`, err);
    }
  }
}

// ============================================================================
// SINGLETON PATTERN
// ============================================================================

let storageServiceInstance: StorageService | null = null;
let currentServiceDbName: string | null = null;

/**
 * Get singleton storage service instance
 *
 * @param dbName - IndexedDB database name (optional, uses existing instance if available)
 */
export function getStorageService(dbName?: string): StorageService {
  // If instance exists and no dbName specified, return existing
  if (storageServiceInstance && !dbName) {
    return storageServiceInstance;
  }

  // If dbName specified and different, warn but return existing (don't break app)
  if (storageServiceInstance && dbName && currentServiceDbName !== dbName) {
    warn(
      `Storage service already initialized with dbName="${currentServiceDbName}", ignoring new dbName="${dbName}"`,
    );
    return storageServiceInstance;
  }

  // Create new instance if none exists
  if (!storageServiceInstance) {
    if (!dbName) {
      throw new Error('FATAL: dbName is required for first getStorageService() call');
    }
    storageServiceInstance = new StorageService(dbName);
    currentServiceDbName = dbName;
  }

  return storageServiceInstance;
}

/**
 * Reset singleton (for testing)
 */
export function resetStorageService(): void {
  storageServiceInstance = null;
  currentServiceDbName = null;
}
