/**
 * Security utilities for the Sonar Quiz System
 *
 * Provides timing-safe comparison and other security primitives
 * to protect against timing attacks and other vulnerabilities.
 */

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * This function compares two strings in constant time, regardless of where
 * they differ. This prevents timing attacks where an attacker measures
 * response times to guess password characters one by one.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are identical, false otherwise
 *
 * @example
 * ```typescript
 * const hash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
 * const userInput = hashPassword(password);
 * if (constantTimeCompare(hash, userInput)) {
 *   // Password is correct
 * }
 * ```
 *
 * @remarks
 * - Always processes entire length of both strings
 * - Returns false if lengths differ (but still processes to avoid timing leaks)
 * - Uses bitwise OR to accumulate differences without early exit
 */
export function constantTimeCompare(a: string, b: string): boolean {
  // Convert strings to UTF-8 byte arrays for proper comparison
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  // If lengths differ, result is false, but we still need to process
  // to avoid timing leaks. We'll compare against the longer length.
  const lengthMatch = aBytes.length === bBytes.length;
  const maxLength = Math.max(aBytes.length, bBytes.length);

  // Accumulator for differences (0 = identical, non-zero = different)
  let diff = lengthMatch ? 0 : 1;

  // Compare all bytes, always processing the full length
  // Use bitwise OR to accumulate differences without short-circuiting
  for (let i = 0; i < maxLength; i++) {
    // Use modulo to handle different lengths without branching
    const aIndex = i % Math.max(aBytes.length, 1);
    const bIndex = i % Math.max(bBytes.length, 1);

    // XOR bytes to detect differences, OR into accumulator
    // This ensures we always do the same number of operations
    diff |= aBytes[aIndex] ^ bBytes[bIndex];
  }

  // Return true only if no differences accumulated
  return diff === 0;
}

/**
 * Generates a cryptographically secure random string
 *
 * @param length - Length of the random string in bytes (default: 32)
 * @returns Hexadecimal string of random bytes
 *
 * @example
 * ```typescript
 * const nonce = generateSecureRandom(16); // 32-char hex string
 * ```
 */
export function generateSecureRandom(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hashes a string using SHA-256
 *
 * @param input - String to hash
 * @returns Promise resolving to hexadecimal hash string
 *
 * @example
 * ```typescript
 * const hash = await sha256('my-password');
 * // hash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
 * ```
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
