/**
 * Obfuscation Contract Types
 *
 * Feature: 009-encrypt-stored-data
 * Version: 1.0.0
 *
 * These types define the obfuscation layer interface.
 * Implementation in src/services/storage/obfuscation.ts
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Feature flag controlling obfuscation
 * Set at compile time in src/config/feature-flags.ts
 */
export const ENCRYPT_STORAGE: boolean = false; // Default: disabled

// ============================================================================
// FORMAT MARKERS
// ============================================================================

/**
 * Magic prefix for obfuscated data
 * Used for format detection and fail-fast behavior
 */
export const OBFUSCATION_PREFIX = 'OBF:' as const;

/**
 * Type representing obfuscated data format
 * Always starts with "OBF:" followed by base64 payload
 */
export type ObfuscatedString = `${typeof OBFUSCATION_PREFIX}${string}`;

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Error thrown when storage format doesn't match ENCRYPT_STORAGE setting
 */
export interface StorageFormatErrorInfo {
  /** What format was expected based on ENCRYPT_STORAGE */
  expected: 'obfuscated' | 'plain';
  /** What format was actually found in storage */
  found: 'obfuscated' | 'plain';
  /** Storage key where mismatch occurred */
  storageKey: string;
}

// ============================================================================
// OBFUSCATION FUNCTIONS
// ============================================================================

/**
 * Encode function signature
 *
 * @param data - Plain object to obfuscate
 * @param key - Obfuscation key (derived from Release ID)
 * @returns Obfuscated string with OBF: prefix
 */
export type EncodeFn = <T extends object>(data: T, key: string) => ObfuscatedString;

/**
 * Decode function signature
 *
 * @param encoded - Obfuscated string (must start with OBF:)
 * @param key - Obfuscation key (same as used for encoding)
 * @returns Decoded object
 * @throws Error if decode fails (corrupted/tampered data)
 */
export type DecodeFn = <T extends object>(encoded: ObfuscatedString, key: string) => T;

/**
 * Key derivation function signature
 *
 * @param releaseId - Release ID from DOM (.wh_publication_title .title)
 * @returns Obfuscation key for XOR cipher
 */
export type DeriveKeyFn = (releaseId: string) => string;

/**
 * Format detection function signature
 *
 * @param value - Value read from storage
 * @returns true if value is obfuscated (starts with OBF:)
 */
export type IsObfuscatedFn = (value: unknown) => value is ObfuscatedString;

// ============================================================================
// MIGRATION
// ============================================================================

/**
 * Migration direction
 */
export type MigrationDirection = 'encrypt' | 'decrypt';

/**
 * Migration options
 */
export interface MigrationOptions {
  /** Release ID for key derivation */
  releaseId: string;
  /** If true, report what would change without modifying data */
  dryRun?: boolean;
}

/**
 * Migration result
 */
export interface MigrationResult {
  /** Number of records migrated */
  migrated: number;
  /** Number of records skipped (already in target format) */
  skipped: number;
  /** Errors encountered during migration */
  errors: Array<{ key: string; error: string }>;
  /** Total time in milliseconds */
  durationMs: number;
}
