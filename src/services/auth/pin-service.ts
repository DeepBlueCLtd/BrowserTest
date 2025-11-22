/**
 * PIN Authentication Service
 *
 * Provides secure PIN hashing and verification using Web Crypto API.
 * Implements constant-time comparison to prevent timing attacks.
 */

import { PIN_CONSTANTS } from '../../types/contracts.js';

/**
 * PIN validation result
 */
export interface PinValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Hash a PIN using SHA-256
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
