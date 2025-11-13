/**
 * Storage Adapter Interface and Utilities
 *
 * This module re-exports the StorageAdapter interface from contracts
 * and provides utility functions for working with storage keys.
 */

import type { StorageAdapter, StudentRecord, ReleaseId, ServiceId } from '../../types/contracts';

// Re-export the interface for convenience
export type { StorageAdapter, StudentRecord, ReleaseId, ServiceId };

/**
 * Generate storage key for a student record
 *
 * Format: qd/{release}/u{serviceId}
 *
 * @param release - Release identifier (e.g., "01-2025")
 * @param serviceId - Service ID (e.g., "RN2344")
 * @returns Storage key string
 */
export function getStorageKey(release: ReleaseId, serviceId: ServiceId): string {
  return `qd/${release}/u${serviceId}`;
}

/**
 * Parse a storage key back into its components
 *
 * @param key - Storage key to parse
 * @returns Object with release and serviceId, or null if invalid
 */
export function parseStorageKey(key: string): { release: ReleaseId; serviceId: ServiceId } | null {
  const match = key.match(/^qd\/([^/]+)\/u(.+)$/);
  if (!match) {
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
 */
export function isValidReleaseId(release: string): boolean {
  return /^\d{2}-\d{4}$/.test(release);
}

/**
 * Validate service ID format (2-10 alphanumeric characters)
 *
 * @param serviceId - Service ID to validate
 * @returns True if valid, false otherwise
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
  }
}

/**
 * Error thrown when storage is not initialized
 */
export class StorageNotInitializedError extends StorageError {
  constructor(operation: string) {
    super('Storage adapter not initialized', operation);
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
    super('Storage quota exceeded', operation);
    this.name = 'StorageQuotaError';
  }
}
