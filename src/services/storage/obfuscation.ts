/**
 * Obfuscation Utilities for IndexedDB Storage
 *
 * Provides deterrence-level obfuscation for student records.
 * Uses XOR cipher with base64 encoding - NOT cryptographic security.
 *
 * Purpose: Prevent casual inspection via browser DevTools.
 */

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

/**
 * Derive obfuscation key from Release ID
 *
 * Creates a repeating byte pattern for XOR cipher.
 * Converts each character to its char code and joins with separator.
 *
 * @param releaseId - Release ID from DOM (.wh_publication_title .title)
 * @returns Obfuscation key string
 */
export function deriveKey(releaseId: string): string {
  if (!releaseId) {
    return '';
  }
  // Convert each character to char code and join
  // This creates a repeating numeric pattern for XOR
  return releaseId
    .split('')
    .map((c) => c.charCodeAt(0).toString())
    .join('');
}

/**
 * XOR a string with a key
 *
 * Symmetric operation - same function encodes and decodes.
 * Key cycles if shorter than input.
 *
 * @param input - String to XOR
 * @param key - Key for XOR operation
 * @returns XOR'd string
 */
export function xorString(input: string, key: string): string {
  if (!input || !key) {
    return input || '';
  }

  const result: string[] = [];
  for (let i = 0; i < input.length; i++) {
    const inputChar = input.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    result.push(String.fromCharCode(inputChar ^ keyChar));
  }
  return result.join('');
}

/**
 * Convert string to UTF-8 bytes for safe base64 encoding
 * Handles Unicode characters correctly
 */
function stringToUtf8Bytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert UTF-8 bytes back to string
 */
function utf8BytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * XOR bytes with key bytes (for UTF-8 safe operation)
 */
function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length === 0) {
    return data;
  }
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const dataByte = data[i];
    const keyByte = key[i % key.length];
    if (dataByte !== undefined && keyByte !== undefined) {
      result[i] = dataByte ^ keyByte;
    }
  }
  return result;
}

/**
 * Convert Uint8Array to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  // Convert bytes to binary string
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encode data with obfuscation
 *
 * Process: JSON.stringify → UTF-8 bytes → XOR with key → base64 → add prefix
 *
 * @param data - Plain object to obfuscate
 * @param key - Obfuscation key (from deriveKey)
 * @returns Obfuscated string with OBF: prefix
 */
export function encode<T extends object>(data: T, key: string): ObfuscatedString {
  const json = JSON.stringify(data);
  const jsonBytes = stringToUtf8Bytes(json);
  const keyBytes = stringToUtf8Bytes(key || 'default');
  const xoredBytes = xorBytes(jsonBytes, keyBytes);
  const base64 = bytesToBase64(xoredBytes);
  return `${OBFUSCATION_PREFIX}${base64}`;
}

/**
 * Decode obfuscated data
 *
 * Process: remove prefix → base64 decode → XOR with key → UTF-8 to string → JSON.parse
 *
 * @param encoded - Obfuscated string (must start with OBF:)
 * @param key - Obfuscation key (same as used for encoding)
 * @returns Decoded object
 * @throws Error if decode fails (corrupted/tampered data)
 */
export function decode<T extends object>(encoded: ObfuscatedString, key: string): T {
  // Remove prefix
  const base64 = encoded.slice(OBFUSCATION_PREFIX.length);

  if (!base64) {
    throw new Error('Empty obfuscated payload');
  }

  // Base64 decode - throws if invalid
  let xoredBytes: Uint8Array;
  try {
    xoredBytes = base64ToBytes(base64);
  } catch {
    throw new Error('Invalid base64 in obfuscated data');
  }

  // XOR to get original JSON bytes
  const keyBytes = stringToUtf8Bytes(key || 'default');
  const jsonBytes = xorBytes(xoredBytes, keyBytes);

  // Convert to string
  let json: string;
  try {
    json = utf8BytesToString(jsonBytes);
  } catch {
    throw new Error('Failed to decode UTF-8 data - possibly corrupted');
  }

  // Parse JSON - throws if invalid
  try {
    return JSON.parse(json) as T;
  } catch {
    throw new Error('Failed to parse JSON - data may be corrupted or tampered');
  }
}

/**
 * Check if a value is obfuscated
 *
 * @param value - Value to check
 * @returns True if value starts with OBF: prefix
 */
export function isObfuscated(value: unknown): value is ObfuscatedString {
  return typeof value === 'string' && value.startsWith(OBFUSCATION_PREFIX);
}
