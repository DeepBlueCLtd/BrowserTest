/**
 * Storage Adapter Utilities
 *
 * Provides utility functions for working with storage keys, validation,
 * and error types for the storage layer.
 *
 * Storage Key Format: qd/{release}/u{serviceId}
 * Example: qd/11-2024/uRN2344
 */

import type { StudentRecord, ReleaseId, ServiceId } from '../../types/contracts.js';
import { error as logError } from '../../utils/logger.js';

/**
 * Generate storage key for a student record
 *
 * Format: qd/{release}/u{serviceId}
 *
 * @param release - Release identifier (e.g., "01-2025")
 * @param serviceId - Service ID (e.g., "RN2344")
 * @returns Storage key string
 *
 * @example
 * ```typescript
 * const key = getStorageKey('11-2024', 'RN2344');
 * // Returns: "qd/11-2024/uRN2344"
 * ```
 */
export function getStorageKey(release: ReleaseId, serviceId: ServiceId): string {
  return `qd/${release}/u${serviceId}`;
}

/**
 * Parse a storage key back into its components
 *
 * @param key - Storage key to parse
 * @returns Object with release and serviceId, or null if invalid
 *
 * @example
 * ```typescript
 * const parts = parseStorageKey('qd/11-2024/uRN2344');
 * // Returns: { release: '11-2024', serviceId: 'RN2344' }
 * ```
 */
export function parseStorageKey(key: string): { release: ReleaseId; serviceId: ServiceId } | null {
  const match = key.match(/^qd\/([^/]+)\/u(.+)$/);
  if (!match || !match[1] || !match[2]) {
    return null;
  }
  return {
    release: match[1],
    serviceId: match[2],
  };
}

/**
 * Validate release ID format (MM-YYYY)
 *
 * @param release - Release ID to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidReleaseId('11-2024'); // true
 * isValidReleaseId('2024-11'); // false
 * isValidReleaseId('13-2024'); // false (month > 12)
 * ```
 */
export function isValidReleaseId(release: string): boolean {
  const match = release.match(/^(\d{2})-(\d{4})$/);
  if (!match || !match[1] || !match[2]) {
    return false;
  }

  // Validate month range (01-12)
  const month = parseInt(match[1], 10);
  return month >= 1 && month <= 12;
}

/**
 * Validate service ID format (2-10 alphanumeric characters)
 *
 * @param serviceId - Service ID to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidServiceId('RN2344'); // true
 * isValidServiceId('AB'); // true (minimum 2 chars)
 * isValidServiceId('A'); // false (too short)
 * isValidServiceId('ABCDEFGHIJK'); // false (too long)
 * ```
 */
export function isValidServiceId(serviceId: string): boolean {
  return /^[A-Za-z0-9]{2,10}$/.test(serviceId);
}

/**
 * Create a default empty StudentRecord
 *
 * @param release - Release identifier
 * @param serviceId - Service identifier
 * @param name - Student name
 * @param docId - Document identifier
 * @returns New StudentRecord with default values
 *
 * @example
 * ```typescript
 * const record = createEmptyStudentRecord('11-2024', 'RN2344', 'Alice Student', 'doc-123');
 * // Returns StudentRecord with empty pages, 0 scores, current timestamp
 * ```
 */
export function createEmptyStudentRecord(
  release: ReleaseId,
  serviceId: ServiceId,
  name: string,
  docId: string,
): StudentRecord {
  return {
    schema: 1,
    docId,
    release,
    serviceId,
    name,
    attempted: 0,
    correct: 0,
    updated: new Date().toISOString(),
    pages: {},
  };
}

/**
 * Storage adapter error types
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'StorageError';

    // Log error for debugging
    if (cause) {
      logError(`Storage error in ${operation}: ${message}`, cause);
    } else {
      logError(`Storage error in ${operation}: ${message}`);
    }
  }
}

/**
 * Error thrown when storage is not initialized
 */
export class StorageNotInitializedError extends StorageError {
  constructor(operation: string) {
    super('Storage adapter not initialized. Call init() first.', operation);
    this.name = 'StorageNotInitializedError';
  }
}

/**
 * Error thrown when a storage operation times out
 */
export class StorageTimeoutError extends StorageError {
  constructor(operation: string, timeout: number) {
    super(`Storage operation timed out after ${timeout}ms`, operation);
    this.name = 'StorageTimeoutError';
  }
}

/**
 * Error thrown when storage quota is exceeded
 */
export class StorageQuotaError extends StorageError {
  constructor(operation: string) {
    super('Storage quota exceeded. Please clear old data or free up space.', operation);
    this.name = 'StorageQuotaError';
  }
}
