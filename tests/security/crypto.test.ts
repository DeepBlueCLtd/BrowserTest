/**
 * Tests for Web Crypto API utilities
 *
 * Security requirements:
 * - Key derivation using PBKDF2 with sufficient iterations
 * - AES-GCM encryption with proper IV handling
 * - No key material stored in plaintext
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { deriveKey, encrypt, decrypt, EncryptedData } from '../../src/utils/crypto';

describe('deriveKey', () => {
  it('should derive a key from password and salt', async () => {
    const password = 'test-password';
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

    const key = await deriveKey(password, salt);
    expect(key).toBeInstanceOf(CryptoKey);
    expect(key.type).toBe('secret');
  });

  it('should produce different keys for different passwords', async () => {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    const testData = new TextEncoder().encode('test data');
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const key1 = await deriveKey('password1', salt);
    const key2 = await deriveKey('password2', salt);

    // Encrypt same data with both keys
    const ciphertext1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key1, testData);
    const ciphertext2 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key2, testData);

    // Different keys should produce different ciphertexts
    expect(new Uint8Array(ciphertext1)).not.toEqual(new Uint8Array(ciphertext2));
  });

  it('should produce different keys for different salts', async () => {
    const password = 'test-password';
    const salt1 = new Uint8Array(16);
    const salt2 = new Uint8Array(16);
    crypto.getRandomValues(salt1);
    crypto.getRandomValues(salt2);
    const testData = new TextEncoder().encode('test data');
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const key1 = await deriveKey(password, salt1);
    const key2 = await deriveKey(password, salt2);

    // Encrypt same data with both keys
    const ciphertext1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key1, testData);
    const ciphertext2 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key2, testData);

    // Different salts should produce different keys and ciphertexts
    expect(new Uint8Array(ciphertext1)).not.toEqual(new Uint8Array(ciphertext2));
  });

  it('should produce same key for same password and salt', async () => {
    const password = 'test-password';
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    const testData = new TextEncoder().encode('test data');
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const key1 = await deriveKey(password, salt);
    const key2 = await deriveKey(password, salt);

    // Encrypt same data with both keys
    const ciphertext1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key1, testData);
    const ciphertext2 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key2, testData);

    // Same password and salt should produce identical keys and ciphertexts
    expect(new Uint8Array(ciphertext1)).toEqual(new Uint8Array(ciphertext2));
  });

  it('should use sufficient PBKDF2 iterations (security requirement)', async () => {
    const password = 'test-password';
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

    const start = performance.now();
    await deriveKey(password, salt);
    const duration = performance.now() - start;

    // Key derivation should take non-trivial time (50-200ms indicates proper iteration count)
    // This is intentionally slow to resist brute-force attacks
    expect(duration).toBeGreaterThan(10); // At least 10ms
  });
});

describe('encrypt and decrypt', () => {
  let testData: object;

  beforeEach(() => {
    testData = {
      serviceId: 'RN2344',
      name: 'John Doe',
      release: '11-2024',
      loginTime: '2024-11-15T10:00:00Z',
    };
  });

  it('should encrypt and decrypt data successfully', async () => {
    const password = 'encryption-key';
    const encrypted = await encrypt(testData, password);

    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('salt');
    expect(encrypted).toHaveProperty('ciphertext');
    expect(encrypted).toHaveProperty('timestamp');

    const decrypted = await decrypt(encrypted, password);
    expect(decrypted).toEqual(testData);
  });

  it('should produce different ciphertext for same data (random IV)', async () => {
    const password = 'encryption-key';
    const encrypted1 = await encrypt(testData, password);
    const encrypted2 = await encrypt(testData, password);

    // IVs should be different
    expect(encrypted1.iv).not.toBe(encrypted2.iv);
    // Salts should be different
    expect(encrypted1.salt).not.toBe(encrypted2.salt);
    // Ciphertexts should be different
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);

    // But both should decrypt to same data
    const decrypted1 = await decrypt(encrypted1, password);
    const decrypted2 = await decrypt(encrypted2, password);
    expect(decrypted1).toEqual(testData);
    expect(decrypted2).toEqual(testData);
  });

  it('should fail to decrypt with wrong password', async () => {
    const encrypted = await encrypt(testData, 'correct-password');

    await expect(async () => {
      await decrypt(encrypted, 'wrong-password');
    }).rejects.toThrow();
  });

  it('should handle empty objects', async () => {
    const password = 'test-key';
    const emptyData = {};
    const encrypted = await encrypt(emptyData, password);
    const decrypted = await decrypt(encrypted, password);

    expect(decrypted).toEqual(emptyData);
  });

  it('should handle nested objects', async () => {
    const password = 'test-key';
    const nestedData = {
      user: {
        id: 'RN2344',
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      metadata: {
        loginTime: '2024-11-15T10:00:00Z',
        attempts: 3,
      },
    };

    const encrypted = await encrypt(nestedData, password);
    const decrypted = await decrypt(encrypted, password);

    expect(decrypted).toEqual(nestedData);
  });

  it('should handle arrays', async () => {
    const password = 'test-key';
    const arrayData = {
      items: ['item1', 'item2', 'item3'],
      numbers: [1, 2, 3, 4, 5],
    };

    const encrypted = await encrypt(arrayData, password);
    const decrypted = await decrypt(encrypted, password);

    expect(decrypted).toEqual(arrayData);
  });

  it('should include timestamp in encrypted data', async () => {
    const password = 'test-key';
    const before = new Date().toISOString();
    const encrypted = await encrypt(testData, password);
    const after = new Date().toISOString();

    expect(encrypted.timestamp).toBeDefined();
    expect(encrypted.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(encrypted.timestamp >= before).toBe(true);
    expect(encrypted.timestamp <= after).toBe(true);
  });

  it('should use proper IV size (96 bits for AES-GCM)', async () => {
    const password = 'test-key';
    const encrypted = await encrypt(testData, password);

    // IV should be base64-encoded 12 bytes (96 bits)
    const ivBytes = Uint8Array.from(atob(encrypted.iv), (c) => c.charCodeAt(0));
    expect(ivBytes.length).toBe(12);
  });

  it('should use proper salt size (at least 128 bits)', async () => {
    const password = 'test-key';
    const encrypted = await encrypt(testData, password);

    // Salt should be base64-encoded 16+ bytes (128+ bits)
    const saltBytes = Uint8Array.from(atob(encrypted.salt), (c) => c.charCodeAt(0));
    expect(saltBytes.length).toBeGreaterThanOrEqual(16);
  });

  it('should handle unicode characters', async () => {
    const password = 'test-key-🔒';
    const unicodeData = {
      name: '田中太郎',
      message: 'Hello 世界 🌍',
      emoji: '😀🎉🔒',
    };

    const encrypted = await encrypt(unicodeData, password);
    const decrypted = await decrypt(encrypted, password);

    expect(decrypted).toEqual(unicodeData);
  });

  it('should fail with corrupted ciphertext', async () => {
    const password = 'test-key';
    const encrypted = await encrypt(testData, password);

    // Corrupt the ciphertext
    const corrupted: EncryptedData = {
      ...encrypted,
      ciphertext: encrypted.ciphertext.slice(0, -5) + 'xxxxx',
    };

    await expect(async () => {
      await decrypt(corrupted, password);
    }).rejects.toThrow();
  });

  it('should fail with corrupted IV', async () => {
    const password = 'test-key';
    const encrypted = await encrypt(testData, password);

    // Corrupt the IV
    const corrupted: EncryptedData = {
      ...encrypted,
      iv: btoa('invalid-iv-12'), // Must be exactly 12 bytes
    };

    await expect(async () => {
      await decrypt(corrupted, password);
    }).rejects.toThrow();
  });

  it('should handle large data efficiently', async () => {
    const password = 'test-key';
    const largeData = {
      items: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`.repeat(10),
      })),
    };

    const start = performance.now();
    const encrypted = await encrypt(largeData, password);
    const encryptTime = performance.now() - start;

    const decryptStart = performance.now();
    const decrypted = await decrypt(encrypted, password);
    const decryptTime = performance.now() - decryptStart;

    expect(decrypted).toEqual(largeData);
    // Encryption/decryption should be fast (< 500ms for large data)
    expect(encryptTime).toBeLessThan(500);
    expect(decryptTime).toBeLessThan(500);
  });
});
