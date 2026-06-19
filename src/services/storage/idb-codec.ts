/**
 * Encryption-aware codec for stored student records.
 *
 * Confines the `ENCRYPT_STORAGE` policy and the obfuscation encode/decode +
 * format-mismatch detection to a single module. The adapter no longer
 * references `ENCRYPT_STORAGE`, `deriveKey`, or `isObfuscated` directly.
 */

import type { StudentRecord, ReleaseId } from '../../types/contracts.js';
import { StorageError, StorageFormatError } from './adapter-utils.js';
import { ENCRYPT_STORAGE } from '../../config/feature-flags.js';
import { encode, decode, isObfuscated, deriveKey } from './obfuscation.js';

/**
 * Whether the codec is currently operating in encrypted mode.
 */
export function isEncryptionEnabled(): boolean {
  return ENCRYPT_STORAGE;
}

/**
 * Encode a record for storage, obfuscating it when encryption is enabled.
 *
 * @param record - Student record to encode
 * @returns The value to persist (obfuscated string or the plain record)
 */
export function encodeForStore(record: StudentRecord): unknown {
  return ENCRYPT_STORAGE ? encode(record, deriveKey(record.release)) : record;
}

/**
 * Decode a stored value, verifying its format matches the ENCRYPT_STORAGE
 * setting.
 *
 * @param rawValue - Value from IndexedDB (obfuscated string or plain object)
 * @param release - Release ID for key derivation
 * @param storageKey - Storage key for error reporting
 * @returns The decoded student record
 * @throws StorageFormatError if the stored format does not match the setting
 */
export function decodeStoredValue(
  rawValue: unknown,
  release: ReleaseId,
  storageKey: string,
): StudentRecord {
  const storedIsObfuscated = isObfuscated(rawValue);

  // Check for format mismatch
  if (ENCRYPT_STORAGE && !storedIsObfuscated) {
    throw new StorageFormatError(
      'Unobfuscated data found with ENCRYPT_STORAGE enabled. Run migration to encrypt existing data.',
      'obfuscated',
      'plain',
      storageKey,
    );
  }

  if (!ENCRYPT_STORAGE && storedIsObfuscated) {
    throw new StorageFormatError(
      'Obfuscated data found with ENCRYPT_STORAGE disabled. Run migration to decrypt or re-enable encryption.',
      'plain',
      'obfuscated',
      storageKey,
    );
  }

  // Decode if encrypted, otherwise return as-is
  if (ENCRYPT_STORAGE && storedIsObfuscated) {
    const obfKey = deriveKey(release);
    try {
      return decode<StudentRecord>(rawValue, obfKey);
    } catch (error) {
      throw new StorageError(
        'Failed to decode obfuscated data - data may be corrupted or tampered',
        'getStudent',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  return rawValue as StudentRecord;
}

/**
 * Decode a record found during a full-store cursor scan (encrypted mode).
 *
 * Returns null for non-obfuscated entries or records that fail to decode, so
 * the caller can skip them without aborting the scan.
 *
 * @param rawValue - Cursor value
 * @param release - Release ID for key derivation
 * @returns The decoded record, or null if it should be skipped
 */
export function tryDecodeCursorValue(rawValue: unknown, release: ReleaseId): StudentRecord | null {
  if (!isObfuscated(rawValue)) {
    return null;
  }
  try {
    return decode<StudentRecord>(rawValue, deriveKey(release));
  } catch {
    return null;
  }
}
