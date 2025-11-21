/**
 * PIN Service Contract
 *
 * Handles PIN creation, validation, and management for student authentication.
 * All operations are synchronous or use Web Crypto API promises.
 */

export interface PinService {
  /**
   * Hash a 4-digit PIN using SHA-256
   * @param pin - 4-digit string (e.g., "1234", "0001")
   * @returns Promise resolving to hex-encoded hash
   * @throws {ValidationError} if PIN format invalid
   */
  hashPin(pin: string): Promise<string>;

  /**
   * Verify a PIN against stored hash using constant-time comparison
   * @param enteredPin - PIN entered by user
   * @param storedHash - SHA-256 hash from storage
   * @returns Promise resolving to true if match, false otherwise
   */
  verifyPin(enteredPin: string, storedHash: string): Promise<boolean>;

  /**
   * Validate PIN format (4 digits exactly)
   * @param pin - Input to validate
   * @returns true if valid format, false otherwise
   */
  isValidPinFormat(pin: string): boolean;

  /**
   * Check if PINs match (for confirmation during creation)
   * @param pin1 - First PIN entry
   * @param pin2 - Confirmation PIN entry
   * @returns true if exact match, false otherwise
   */
  pinsMatch(pin1: string, pin2: string): boolean;
}

/**
 * Rate Limiter Contract
 *
 * Manages failed attempt tracking and lockout logic.
 * Uses sessionStorage for per-tab isolation.
 */
export interface RateLimiter {
  /**
   * Record a failed PIN attempt
   * @param serviceId - Student identifier
   * @returns Updated attempt state with lockout info
   */
  recordFailedAttempt(serviceId: string): PinAttemptState;

  /**
   * Check if student is currently locked out
   * @param serviceId - Student identifier
   * @returns Lockout state with remaining time
   */
  isLockedOut(serviceId: string): LockoutStatus;

  /**
   * Clear rate limit state (on successful login)
   * @param serviceId - Student identifier
   */
  clearAttempts(serviceId: string): void;

  /**
   * Get remaining lockout time in seconds
   * @param serviceId - Student identifier
   * @returns Seconds remaining or 0 if not locked
   */
  getRemainingLockoutTime(serviceId: string): number;
}

/**
 * Migration Service Contract
 *
 * Handles schema v1 to v2 migration for existing students.
 */
export interface MigrationService {
  /**
   * Check if student record needs migration
   * @param student - Current student record
   * @returns true if schema v1, false if v2+
   */
  needsMigration(student: StudentRecord): boolean;

  /**
   * Migrate student record to v2 schema
   * @param student - v1 student record
   * @returns v2 student record with empty pinHash
   */
  migrateToV2(student: StudentRecordV1): StudentRecordV2;

  /**
   * Complete migration by adding PIN
   * @param student - Migrated student record
   * @param pinHash - Hash of newly created PIN
   * @returns Updated v2 record with PIN
   */
  completeMigration(student: StudentRecordV2, pinHash: string): StudentRecordV2;
}

// Type definitions
export interface PinAttemptState {
  serviceId: string;
  attempts: number;
  lockoutUntil: string | null;
  lastAttempt: string;
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  unlockAt: Date | null;
}

export interface ValidationError extends Error {
  code: 'INVALID_PIN_FORMAT' | 'PIN_MISMATCH' | 'PIN_REQUIRED';
}

// Events emitted by PIN components
export interface PinEvents {
  'qd:pin-created': {
    serviceId: string;
    timestamp: string;
  };
  'qd:pin-verified': {
    serviceId: string;
    success: boolean;
    timestamp: string;
  };
  'qd:pin-reset': {
    serviceId: string;
    resetBy: 'instructor';
    timestamp: string;
  };
  'qd:pin-lockout': {
    serviceId: string;
    lockoutUntil: string;
  };
}