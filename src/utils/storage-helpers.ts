/**
 * Storage helper functions for safe JSON operations
 *
 * Provides type-safe wrapper functions for browser storage APIs
 * with automatic JSON serialization/deserialization and encryption support.
 */

import { encrypt, decrypt, type EncryptedData } from './crypto';

/**
 * Retrieves and parses JSON data from storage
 *
 * @param key - Storage key
 * @param storage - Storage instance (default: sessionStorage)
 * @returns Parsed object or null if not found/invalid
 *
 * @example
 * ```typescript
 * const session = getJSON<SessionData>('qd/session');
 * if (session) {
 *   console.log(session.serviceId);
 * }
 * ```
 */
export function getJSON<T = unknown>(key: string, storage: Storage = sessionStorage): T | null {
  try {
    const item = storage.getItem(key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item) as T;
  } catch {
    // Invalid JSON or storage access error
    return null;
  }
}

/**
 * Stringifies and stores JSON data
 *
 * @param key - Storage key
 * @param value - Value to store
 * @param storage - Storage instance (default: sessionStorage)
 *
 * @example
 * ```typescript
 * setJSON('qd/session', { serviceId: 'RN2344', name: 'John' });
 * ```
 */
export function setJSON(key: string, value: unknown, storage: Storage = sessionStorage): void {
  try {
    const json = JSON.stringify(value);
    storage.setItem(key, json);
  } catch (error) {
    // Storage quota exceeded or serialization error
    throw new Error(
      `Failed to save to storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Removes an item from storage
 *
 * @param key - Storage key
 * @param storage - Storage instance (default: sessionStorage)
 *
 * @example
 * ```typescript
 * removeItem('qd/session');
 * ```
 */
export function removeItem(key: string, storage: Storage = sessionStorage): void {
  storage.removeItem(key);
}

/**
 * Clears all items from storage
 *
 * @param storage - Storage instance (default: sessionStorage)
 *
 * @example
 * ```typescript
 * clear(); // Clear sessionStorage
 * clear(localStorage); // Clear localStorage
 * ```
 */
export function clear(storage: Storage = sessionStorage): void {
  storage.clear();
}

/**
 * Gets all keys from storage
 *
 * @param storage - Storage instance (default: sessionStorage)
 * @returns Array of all storage keys
 *
 * @example
 * ```typescript
 * const keys = getAllKeys();
 * console.log(`Found ${keys.length} keys`);
 * ```
 */
export function getAllKeys(storage: Storage = sessionStorage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key !== null) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Checks if a key exists in storage
 *
 * @param key - Storage key
 * @param storage - Storage instance (default: sessionStorage)
 * @returns true if key exists, false otherwise
 *
 * @example
 * ```typescript
 * if (hasKey('qd/session')) {
 *   // Session exists
 * }
 * ```
 */
export function hasKey(key: string, storage: Storage = sessionStorage): boolean {
  return storage.getItem(key) !== null;
}

/**
 * Retrieves, decrypts, and parses encrypted JSON data from storage
 *
 * @param key - Storage key
 * @param password - Password for decryption
 * @param storage - Storage instance (default: sessionStorage)
 * @returns Parsed object or null if not found/invalid/decryption failed
 *
 * @example
 * ```typescript
 * const session = await getEncryptedJSON<SessionData>('qd/session', sessionKey);
 * if (session) {
 *   console.log(session.serviceId); // Decrypted
 * }
 * ```
 */
export async function getEncryptedJSON<T = unknown>(
  key: string,
  password: string,
  storage: Storage = sessionStorage,
): Promise<T | null> {
  try {
    const item = storage.getItem(key);
    if (item === null) {
      return null;
    }

    // Parse the encrypted envelope
    const encryptedData = JSON.parse(item) as EncryptedData;

    // Decrypt the data
    const decrypted = await decrypt(encryptedData, password);
    return decrypted as T;
  } catch {
    // Decryption failed, corrupted data, or invalid JSON
    return null;
  }
}

/**
 * Encrypts, stringifies, and stores JSON data
 *
 * @param key - Storage key
 * @param value - Value to encrypt and store
 * @param password - Password for encryption
 * @param storage - Storage instance (default: sessionStorage)
 *
 * @example
 * ```typescript
 * await setEncryptedJSON('qd/session', { serviceId: 'RN2344', name: 'John' }, sessionKey);
 * ```
 */
export async function setEncryptedJSON(
  key: string,
  value: unknown,
  password: string,
  storage: Storage = sessionStorage,
): Promise<void> {
  try {
    // Encrypt the data
    const encryptedData = await encrypt(value, password);

    // Store the encrypted envelope as JSON
    const json = JSON.stringify(encryptedData);
    storage.setItem(key, json);
  } catch (error) {
    // Encryption or storage error
    throw new Error(
      `Failed to save encrypted data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Removes an encrypted item from storage
 *
 * @param key - Storage key
 * @param storage - Storage instance (default: sessionStorage)
 *
 * @example
 * ```typescript
 * removeEncryptedItem('qd/session');
 * ```
 */
export function removeEncryptedItem(key: string, storage: Storage = sessionStorage): void {
  storage.removeItem(key);
}
