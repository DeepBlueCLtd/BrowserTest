/**
 * Security utilities for the Sonar Quiz System
 *
 * Provides rate limiting, constant-time comparison, and other security primitives
 * to protect against timing attacks, brute force, and other vulnerabilities.
 */

/**
 * Rate limiter with exponential backoff
 *
 * Implements progressive delays after failed authentication attempts:
 * - 1st failure: 2s delay
 * - 2nd failure: 4s delay
 * - 3rd failure: 8s delay
 * - 4th failure: 16s delay
 * - 5th+ failure: 30s delay (max)
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter();
 *
 * async function handleLogin(password: string) {
 *   if (!await limiter.attempt()) {
 *     const remaining = limiter.getRemainingSeconds();
 *     alert(`Too many attempts. Try again in ${remaining}s`);
 *     return;
 *   }
 *
 *   const isValid = await validatePassword(password);
 *   if (isValid) {
 *     limiter.reset();
 *   }
 * }
 * ```
 */
export class RateLimiter {
  private failureCount = 0;
  private lockoutUntil: number | null = null;

  /**
   * Attempt an action (e.g., login attempt)
   *
   * @returns true if action is allowed, false if rate limited
   */
  attempt(): boolean {
    if (this.lockoutUntil && Date.now() < this.lockoutUntil) {
      return false;
    }

    // Clear lockout if expired
    if (this.lockoutUntil && Date.now() >= this.lockoutUntil) {
      this.lockoutUntil = null;
    }

    return true;
  }

  /**
   * Record a failed attempt and apply exponential backoff
   *
   * Delays: 2s, 4s, 8s, 16s, 30s (max)
   */
  recordFailure(): void {
    this.failureCount++;

    // Exponential backoff with max of 30 seconds
    const delays = [2000, 4000, 8000, 16000, 30000];
    const delayIndex = Math.min(this.failureCount - 1, delays.length - 1);
    const delay = delays[delayIndex] ?? 30000;

    this.lockoutUntil = Date.now() + delay;
  }

  /**
   * Reset the rate limiter after successful authentication
   */
  reset(): void {
    this.failureCount = 0;
    this.lockoutUntil = null;
  }

  /**
   * Get remaining lockout time in seconds
   *
   * @returns Number of seconds until next attempt allowed, or 0 if not locked
   */
  getRemainingSeconds(): number {
    if (!this.lockoutUntil) {
      return 0;
    }

    const remaining = Math.max(0, this.lockoutUntil - Date.now());
    return Math.ceil(remaining / 1000);
  }

  /**
   * Check if currently locked out
   */
  isLockedOut(): boolean {
    return this.lockoutUntil !== null && Date.now() < this.lockoutUntil;
  }
}

/**
 * Constant-time string comparison using Web Crypto API
 *
 * Prevents timing attacks by ensuring comparison time is independent
 * of where strings differ. Uses HMAC-SHA256 for constant-time comparison.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Promise<true> if strings match, Promise<false> otherwise
 *
 * @example
 * ```typescript
 * const userHash = await hashPassword(userInput);
 * const storedHash = getStoredHash();
 *
 * if (await constantTimeCompare(userHash, storedHash)) {
 *   // Authentication successful
 * }
 * ```
 */
export async function constantTimeCompare(a: string, b: string): Promise<boolean> {
  // Early length check (length is not secret information)
  if (a.length !== b.length) {
    return false;
  }

  // Handle empty strings (Web Crypto API doesn't support zero-length keys)
  if (a.length === 0) {
    return true; // Both are empty strings
  }

  // Use Web Crypto API for constant-time comparison
  const encoder = new TextEncoder();
  const aBuffer = encoder.encode(a);
  const bBuffer = encoder.encode(b);

  try {
    // Import first string as HMAC key
    const key = await crypto.subtle.importKey(
      'raw',
      aBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    // Sign second string with first as key
    const signature = await crypto.subtle.sign('HMAC', key, bBuffer);

    // Compare signature to expected value
    // This uses crypto.subtle which performs constant-time comparison internally
    const expectedKey = await crypto.subtle.importKey(
      'raw',
      bBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const expectedSignature = await crypto.subtle.sign('HMAC', expectedKey, aBuffer);

    // Compare signatures byte-by-byte
    if (signature.byteLength !== expectedSignature.byteLength) {
      return false;
    }

    const sigView = new Uint8Array(signature);
    const expView = new Uint8Array(expectedSignature);

    // XOR all bytes - result is 0 if all bytes match
    let result = 0;
    for (let i = 0; i < sigView.length; i++) {
      result |= (sigView[i] ?? 0) ^ (expView[i] ?? 0);
    }

    return result === 0;
  } catch (error) {
    // Crypto API failure - fail closed
    console.error('Constant-time comparison failed:', error);
    return false;
  }
}

/**
 * Hash a password using SHA-256
 *
 * @param password - Password to hash
 * @returns Promise<string> - Hex-encoded SHA-256 hash
 *
 * @example
 * ```typescript
 * const hash = await hashPassword('my-secure-password');
 * console.log(hash); // "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
