/**
 * Encrypted session storage using AES-GCM
 *
 * Provides secure storage of session data in sessionStorage using
 * Web Crypto API encryption. Protects against XSS data exfiltration.
 *
 * Key features:
 * - AES-GCM encryption with 256-bit keys
 * - Random IV generation per encryption operation
 * - Base64 encoding for sessionStorage compatibility
 * - Typed get/set operations
 * - Graceful error handling (returns null for corrupted data)
 *
 * Security properties:
 * - Authenticated encryption (GCM mode)
 * - Per-session encryption keys
 * - No key material stored in sessionStorage
 * - Protection against tampering (authentication tag verification)
 */

import { error, warn } from '../../utils/logger.js';

/**
 * Encrypted data format stored in sessionStorage
 */
interface EncryptedData {
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded encrypted data */
  ciphertext: string;
  /** Format version for future migrations */
  version: number;
}

/**
 * Current encryption format version
 */
const ENCRYPTION_VERSION = 1;

/**
 * Encrypted session storage manager
 *
 * Singleton class that manages encryption/decryption of session data.
 * Creates a unique encryption key per browser session.
 *
 * Supports disabling encryption at runtime for debugging purposes.
 */
export class EncryptedSessionStorage {
  private encryptionKey: CryptoKey | null = null;
  private keyPromise: Promise<CryptoKey> | null = null;
  private encryptionEnabled: boolean;

  /**
   * Create encrypted session storage instance
   *
   * @param enableEncryption - Enable encryption (default: true). Set to false for debugging.
   *
   * @example
   * ```typescript
   * // Production: encrypted
   * const storage = new EncryptedSessionStorage(true);
   *
   * // Development: plaintext for debugging
   * const storage = new EncryptedSessionStorage(false);
   * ```
   */
  constructor(enableEncryption = true) {
    this.encryptionEnabled = enableEncryption;
  }

  /**
   * Get or create the encryption key
   *
   * Key is generated once per session and cached in memory.
   * Never stored in sessionStorage.
   *
   * @returns Promise resolving to the encryption key
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    // Return cached key if available
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    // Return pending key generation promise if in progress
    if (this.keyPromise) {
      return this.keyPromise;
    }

    // Generate new key
    this.keyPromise = (async () => {
      try {
        const key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false, // Non-extractable for security
          ['encrypt', 'decrypt'],
        );

        this.encryptionKey = key;
        this.keyPromise = null;

        return key;
      } catch (err) {
        this.keyPromise = null;
        throw err;
      }
    })();

    return this.keyPromise;
  }

  /**
   * Encrypt and store data in sessionStorage
   *
   * @param key - Storage key
   * @param value - Data to encrypt (will be JSON serialized)
   * @returns Promise<true> if successful, Promise<false> if failed
   *
   * @example
   * ```typescript
   * const storage = new EncryptedSessionStorage();
   * const success = await storage.setSecure('session', { userId: 'RN2344' });
   * ```
   */
  async setSecure<T>(key: string, value: T): Promise<boolean> {
    try {
      // If encryption disabled, use plain JSON storage (for debugging)
      if (!this.encryptionEnabled) {
        const json = JSON.stringify(value);
        sessionStorage.setItem(key, json);
        return true;
      }

      // Serialize data
      const json = JSON.stringify(value);
      const encoder = new TextEncoder();
      const data = encoder.encode(json);

      // Generate random IV (12 bytes recommended for GCM)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Get encryption key
      const cryptoKey = await this.getEncryptionKey();

      // Encrypt data
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, data);

      // Encode to base64 for storage
      const encryptedData: EncryptedData = {
        iv: this.arrayBufferToBase64(iv.buffer),
        ciphertext: this.arrayBufferToBase64(ciphertext),
        version: ENCRYPTION_VERSION,
      };

      // Store in sessionStorage
      sessionStorage.setItem(key, JSON.stringify(encryptedData));

      return true;
    } catch (err) {
      error(`Failed to encrypt and store data for key: ${key}`, err);
      return false;
    }
  }

  /**
   * Retrieve and decrypt data from sessionStorage
   *
   * @param key - Storage key
   * @returns Promise<T | null> - Decrypted data, or null if not found/corrupted
   *
   * @example
   * ```typescript
   * const storage = new EncryptedSessionStorage();
   * const session = await storage.getSecure<SessionData>('session');
   * if (session) {
   *   console.log('User ID:', session.userId);
   * }
   * ```
   */
  async getSecure<T>(key: string): Promise<T | null> {
    try {
      // Retrieve data
      const stored = sessionStorage.getItem(key);
      if (!stored) {
        return null;
      }

      // If encryption disabled, parse as plain JSON (for debugging)
      if (!this.encryptionEnabled) {
        return JSON.parse(stored) as T;
      }

      // Parse encrypted data
      const encryptedData = JSON.parse(stored) as EncryptedData;

      // Version check (for future migrations)
      if (encryptedData.version !== ENCRYPTION_VERSION) {
        warn(`Encrypted data version mismatch for key: ${key}`);
        return null;
      }

      // Decode from base64
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);

      // Get encryption key
      const cryptoKey = await this.getEncryptionKey();

      // Decrypt data
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);

      // Deserialize
      const decoder = new TextDecoder();
      const json = decoder.decode(decrypted);
      return JSON.parse(json) as T;
    } catch (err) {
      // Corrupted data or wrong key - return null
      warn(`Failed to decrypt data for key: ${key}`, err);
      return null;
    }
  }

  /**
   * Remove data from sessionStorage
   *
   * @param key - Storage key
   */
  remove(key: string): void {
    sessionStorage.removeItem(key);
  }

  /**
   * Clear all session storage
   */
  clear(): void {
    sessionStorage.clear();
  }

  /**
   * Clear encryption key from memory
   *
   * Forces key regeneration on next encryption/decryption.
   * Useful for session termination.
   */
  clearKey(): void {
    this.encryptionKey = null;
    this.keyPromise = null;
  }

  /**
   * Enable or disable encryption at runtime
   *
   * Useful for switching between encrypted (production) and plaintext (debugging) modes.
   * Warning: Changing this setting will not re-encrypt existing data.
   *
   * @param enabled - Enable encryption (true) or use plaintext (false)
   *
   * @example
   * ```typescript
   * // Disable encryption for debugging
   * storage.setEncryption(false);
   * await storage.setSecure('test', { data: 'visible' });
   * // Now visible in DevTools sessionStorage inspector
   *
   * // Re-enable for production
   * storage.setEncryption(true);
   * ```
   */
  setEncryption(enabled: boolean): void {
    this.encryptionEnabled = enabled;
  }

  /**
   * Check if encryption is currently enabled
   *
   * @returns true if encryption is enabled
   */
  isEncryptionEnabled(): boolean {
    return this.encryptionEnabled;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i] ?? 0);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * Singleton instance for global use
 */
export const encryptedStorage = new EncryptedSessionStorage();
