/**
 * PIN Authentication Service
 *
 * Provides secure PIN hashing and verification using Web Crypto API.
 * Implements constant-time comparison to prevent timing attacks.
 */

import { PIN_CONSTANTS } from '../../types/contracts.js';
import type { StudentRecord } from '../../types/contracts.js';

/**
 * Salted PIN verifier as stored on a student record (SRD 013 SEC-06).
 */
export interface PinCredential {
  /** Hex PBKDF2-SHA-256 output (32 bytes) */
  pinHash: string;
  /** Hex random salt */
  pinSalt: string;
  /** Iteration count used */
  pinIterations: number;
  /** KDF identifier */
  pinKdf: 'pbkdf2-sha256';
}

/** Result of checking a PIN against a stored record. */
export interface StoredPinCheck {
  /** Whether the PIN matched */
  valid: boolean;
  /** Present when the record held a legacy hash: the salted verifier to store instead */
  upgrade?: PinCredential;
}

/** Hex-encode bytes. */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Decode a hex string to bytes. */
function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Derive a PIN verifier with PBKDF2-SHA-256.
 *
 * @param pin - 4-digit PIN
 * @param saltHex - Hex-encoded salt
 * @param iterations - PBKDF2 iteration count
 * @returns Hex-encoded 32-byte derived key
 */
export async function derivePinHash(
  pin: string,
  saltHex: string,
  iterations: number,
): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

/**
 * Create a new salted verifier for a PIN.
 *
 * A 4-digit PIN has only 10,000 values, so this cannot make a PIN secret from
 * someone holding the database. The per-student salt and iteration count turn
 * a lookup that took milliseconds into minutes of work per PIN.
 *
 * @param pin - 4-digit PIN
 * @param iterations - Iteration count (defaults to the current policy)
 * @returns Credential fields to store on the student record
 */
export async function createPinCredential(
  pin: string,
  iterations: number = PIN_CONSTANTS.KDF_ITERATIONS,
): Promise<PinCredential> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(PIN_CONSTANTS.SALT_BYTES)));
  return {
    pinHash: await derivePinHash(pin, salt, iterations),
    pinSalt: salt,
    pinIterations: iterations,
    pinKdf: 'pbkdf2-sha256',
  };
}

/**
 * Check a PIN against whatever verifier a student record holds.
 *
 * Salted records are checked with PBKDF2. Legacy records (unsalted SHA-256)
 * still verify, and a match returns a salted replacement so the caller can
 * upgrade the record (SRD 013 SEC-07).
 *
 * @param pin - PIN the student typed
 * @param record - Stored PIN fields
 * @returns Whether it matched, plus an upgrade credential for legacy records
 */
export async function verifyStoredPin(
  pin: string,
  record: Pick<StudentRecord, 'pinHash' | 'pinSalt' | 'pinIterations' | 'pinKdf'>,
): Promise<StoredPinCheck> {
  const stored = record.pinHash ?? '';
  if (!stored) {
    return { valid: false };
  }

  if (record.pinKdf === 'pbkdf2-sha256' && record.pinSalt && record.pinIterations) {
    const derived = await derivePinHash(pin, record.pinSalt, record.pinIterations);
    return { valid: constantTimeCompare(derived, stored) };
  }

  if (!(await verifyPin(pin, stored))) {
    return { valid: false };
  }
  return { valid: true, upgrade: await createPinCredential(pin) };
}

/**
 * PIN validation result
 */
export interface PinValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Hash a PIN using unsalted SHA-256 (legacy v2 verifier).
 *
 * Kept only to verify records written before SRD 013. New verifiers come from
 * {@link createPinCredential}.
 *
 * @param pin - 4-digit PIN to hash
 * @returns Promise resolving to hex-encoded hash
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a PIN against a stored hash
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param pin - PIN to verify
 * @param storedHash - Stored SHA-256 hash
 * @returns Promise resolving to true if PIN matches
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPin(pin);
  return constantTimeCompare(inputHash, storedHash);
}

/**
 * Constant-time string comparison
 *
 * Compares strings in constant time to prevent timing attacks.
 * XORs each character and accumulates differences.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validate PIN format
 *
 * @param pin - PIN to validate
 * @returns Validation result with error message if invalid
 */
export function validatePinFormat(pin: string): PinValidationResult {
  if (!pin) {
    return { valid: false, error: 'PIN is required' };
  }

  if (pin.length !== PIN_CONSTANTS.PIN_LENGTH) {
    return { valid: false, error: `PIN must be exactly ${PIN_CONSTANTS.PIN_LENGTH} digits` };
  }

  if (!/^\d+$/.test(pin)) {
    return { valid: false, error: 'PIN must contain only digits' };
  }

  return { valid: true };
}

/**
 * Validate PIN confirmation matches
 *
 * @param pin - Original PIN
 * @param confirm - Confirmation PIN
 * @returns Validation result with error message if mismatch
 */
export function validatePinConfirmation(pin: string, confirm: string): PinValidationResult {
  if (pin !== confirm) {
    return { valid: false, error: 'PINs do not match' };
  }
  return { valid: true };
}
