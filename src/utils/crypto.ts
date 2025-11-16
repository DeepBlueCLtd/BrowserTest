/**
 * Cryptographic utilities using Web Crypto API
 *
 * Provides encryption, decryption, and key derivation functions
 * for securing sensitive data in browser storage.
 */

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  /** Initialization vector (base64) */
  iv: string;
  /** Salt for key derivation (base64) */
  salt: string;
  /** Encrypted ciphertext (base64) */
  ciphertext: string;
  /** Encryption timestamp (ISO 8601) */
  timestamp: string;
}

/**
 * PBKDF2 configuration
 */
const PBKDF2_ITERATIONS = 100000; // OWASP recommendation for 2023+
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits (recommended for AES-GCM)

/**
 * Derives a cryptographic key from a password using PBKDF2
 *
 * @param password - Password to derive key from
 * @param salt - Salt for key derivation (must be at least 16 bytes)
 * @param iterations - Number of PBKDF2 iterations (default: 100,000)
 * @returns Promise resolving to CryptoKey for AES-GCM
 *
 * @example
 * ```typescript
 * const salt = new Uint8Array(16);
 * crypto.getRandomValues(salt);
 * const key = await deriveKey('my-password', salt);
 * ```
 *
 * @remarks
 * - Uses PBKDF2 with SHA-256
 * - 100,000 iterations (OWASP 2023 recommendation)
 * - Intentionally slow to resist brute-force attacks
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, [
    'deriveBits',
    'deriveKey',
  ]);

  // Derive AES-GCM key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // Not extractable
    ['encrypt', 'decrypt'],
  );

  return key;
}

/**
 * Encrypts data using AES-GCM with a password-derived key
 *
 * @param data - Data to encrypt (will be JSON-serialized)
 * @param password - Password for encryption
 * @returns Promise resolving to encrypted data with IV and salt
 *
 * @example
 * ```typescript
 * const data = { serviceId: 'RN2344', name: 'John Doe' };
 * const encrypted = await encrypt(data, 'my-password');
 * // encrypted.ciphertext contains the encrypted data
 * ```
 *
 * @remarks
 * - Uses AES-GCM-256 for authenticated encryption
 * - Generates random IV and salt for each encryption
 * - Includes timestamp for freshness verification
 * - Data is JSON-serialized before encryption
 */
export async function encrypt(data: unknown, password: string): Promise<EncryptedData> {
  // Generate random salt and IV
  const salt = new Uint8Array(SALT_LENGTH);
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  // Derive key from password
  const key = await deriveKey(password, salt);

  // Serialize data to JSON
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  // Encrypt using AES-GCM
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintext,
  );

  // Convert to base64 for storage
  // Helper to convert Uint8Array to base64 (handles large arrays)
  const toBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const ciphertext = toBase64(new Uint8Array(ciphertextBuffer));
  const ivBase64 = toBase64(iv);
  const saltBase64 = toBase64(salt);

  return {
    iv: ivBase64,
    salt: saltBase64,
    ciphertext,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Decrypts data that was encrypted with the encrypt function
 *
 * @param encryptedData - Encrypted data with IV and salt
 * @param password - Password for decryption
 * @returns Promise resolving to decrypted data
 * @throws Error if decryption fails (wrong password or corrupted data)
 *
 * @example
 * ```typescript
 * const encrypted = await encrypt(data, 'my-password');
 * const decrypted = await decrypt(encrypted, 'my-password');
 * ```
 *
 * @remarks
 * - Throws error if password is incorrect
 * - Throws error if data is corrupted
 * - AES-GCM provides authenticated encryption (integrity check)
 */
export async function decrypt(encryptedData: EncryptedData, password: string): Promise<unknown> {
  // Decode from base64
  const iv = Uint8Array.from(atob(encryptedData.iv), (c) => c.charCodeAt(0));
  const salt = Uint8Array.from(atob(encryptedData.salt), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(encryptedData.ciphertext), (c) => c.charCodeAt(0));

  // Derive key from password
  const key = await deriveKey(password, salt);

  try {
    // Decrypt using AES-GCM
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext,
    );

    // Decode and parse JSON
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(plaintextBuffer);
    return JSON.parse(plaintext);
  } catch {
    throw new Error('Decryption failed: Invalid password or corrupted data');
  }
}

/**
 * Generates a secure random encryption password
 *
 * @param length - Length in bytes (default: 32)
 * @returns Hexadecimal string of random bytes
 *
 * @example
 * ```typescript
 * const sessionKey = generateEncryptionKey();
 * // Returns 64-char hex string (32 bytes = 256 bits)
 * ```
 */
export function generateEncryptionKey(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
