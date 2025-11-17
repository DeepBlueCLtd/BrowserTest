/**
 * Unit tests for encrypted session storage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncryptedSessionStorage } from '../../../../src/services/storage/encrypted-session.js';

describe('EncryptedSessionStorage', () => {
  let storage: EncryptedSessionStorage;

  beforeEach(() => {
    storage = new EncryptedSessionStorage();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('setSecure() and getSecure()', () => {
    it('should encrypt and decrypt simple string', async () => {
      const key = 'test-key';
      const value = 'Hello, World!';

      const setResult = await storage.setSecure(key, value);
      expect(setResult).toBe(true);

      const retrieved = await storage.getSecure<string>(key);
      expect(retrieved).toBe(value);
    });

    it('should encrypt and decrypt objects', async () => {
      const key = 'user-session';
      const value = {
        serviceId: 'RN2344',
        name: 'Test User',
        loginTime: '2025-11-16T10:00:00Z',
      };

      await storage.setSecure(key, value);
      const retrieved = await storage.getSecure<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    it('should encrypt and decrypt arrays', async () => {
      const key = 'answers';
      const value = [
        { answer: 'a', success: true, timestamp: '2025-11-16T10:00:00Z' },
        { answer: 'b', success: false, timestamp: '2025-11-16T10:01:00Z' },
      ];

      await storage.setSecure(key, value);
      const retrieved = await storage.getSecure<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    it('should handle nested objects', async () => {
      const key = 'complex-data';
      const value = {
        user: {
          serviceId: 'RN2344',
          metadata: {
            scores: [95, 87, 92],
          },
        },
        timestamp: Date.now(),
      };

      await storage.setSecure(key, value);
      const retrieved = await storage.getSecure<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const retrieved = await storage.getSecure<string>('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should return null for corrupted data', async () => {
      const key = 'corrupted';

      // Store valid encrypted data first
      await storage.setSecure(key, 'test data');

      // Corrupt the stored data
      sessionStorage.setItem(key, 'invalid json');

      const retrieved = await storage.getSecure<string>(key);
      expect(retrieved).toBeNull();
    });

    it('should use different IVs for same data', async () => {
      const key1 = 'data1';
      const key2 = 'data2';
      const value = 'same data';

      await storage.setSecure(key1, value);
      await storage.setSecure(key2, value);

      const stored1 = sessionStorage.getItem(key1);
      const stored2 = sessionStorage.getItem(key2);

      expect(stored1).not.toBe(stored2); // Different ciphertexts due to random IV
    });

    it('should handle empty string', async () => {
      const key = 'empty';
      const value = '';

      await storage.setSecure(key, value);
      const retrieved = await storage.getSecure<string>(key);

      expect(retrieved).toBe(value);
    });

    it('should handle null values', async () => {
      const key = 'null-value';
      const value = null;

      await storage.setSecure(key, value);
      const retrieved = await storage.getSecure<null>(key);

      expect(retrieved).toBe(null);
    });

    it('should handle numbers', async () => {
      const key = 'number';
      const value = 42;

      await storage.setSecure(key, value);
      const retrieved = await storage.getSecure<number>(key);

      expect(retrieved).toBe(value);
    });

    it('should handle booleans', async () => {
      const key = 'bool';
      const value = true;

      await storage.setSecure(key, value);
      const retrieved = await storage.getSecure<boolean>(key);

      expect(retrieved).toBe(value);
    });
  });

  describe('Data isolation', () => {
    it('should not allow decryption with different instance', async () => {
      const key = 'secret-data';
      const value = 'sensitive information';

      // Encrypt with first instance
      await storage.setSecure(key, value);

      // Try to decrypt with new instance (different key)
      const newStorage = new EncryptedSessionStorage();
      const retrieved = await newStorage.getSecure<string>(key);

      // Should fail because different encryption key
      expect(retrieved).toBeNull();
    });

    it('should maintain encryption key across operations', async () => {
      const key1 = 'data1';
      const key2 = 'data2';
      const value1 = 'first value';
      const value2 = 'second value';

      // Multiple operations with same instance
      await storage.setSecure(key1, value1);
      await storage.setSecure(key2, value2);

      const retrieved1 = await storage.getSecure<string>(key1);
      const retrieved2 = await storage.getSecure<string>(key2);

      expect(retrieved1).toBe(value1);
      expect(retrieved2).toBe(value2);
    });
  });

  describe('remove()', () => {
    it('should remove encrypted data', async () => {
      const key = 'to-remove';
      const value = 'data';

      await storage.setSecure(key, value);
      expect(await storage.getSecure<string>(key)).toBe(value);

      storage.remove(key);
      expect(await storage.getSecure<string>(key)).toBeNull();
    });
  });

  describe('clear()', () => {
    it('should clear all session storage', async () => {
      await storage.setSecure('key1', 'value1');
      await storage.setSecure('key2', 'value2');
      await storage.setSecure('key3', 'value3');

      storage.clear();

      expect(await storage.getSecure<string>('key1')).toBeNull();
      expect(await storage.getSecure<string>('key2')).toBeNull();
      expect(await storage.getSecure<string>('key3')).toBeNull();
    });
  });

  describe('clearKey()', () => {
    it('should force key regeneration', async () => {
      const key = 'test-data';
      const value = 'original value';

      // Encrypt with original key
      await storage.setSecure(key, value);

      // Clear encryption key
      storage.clearKey();

      // Try to decrypt (should fail with new key)
      const retrieved = await storage.getSecure<string>(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('Encryption properties', () => {
    it('should produce different ciphertexts for same plaintext', async () => {
      const value = 'test data';

      await storage.setSecure('key1', value);
      await storage.setSecure('key2', value);

      const stored1 = sessionStorage.getItem('key1');
      const stored2 = sessionStorage.getItem('key2');

      // Different IVs should produce different ciphertexts
      expect(stored1).not.toBe(stored2);
    });

    it('should store data as JSON with version info', async () => {
      const key = 'versioned-data';
      const value = 'test';

      await storage.setSecure(key, value);

      const stored = sessionStorage.getItem(key);
      expect(stored).toBeTruthy();

      if (stored) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed = JSON.parse(stored);

        expect(parsed).toHaveProperty('iv');

        expect(parsed).toHaveProperty('ciphertext');

        expect(parsed).toHaveProperty('version', 1);
      }
    });

    it('should produce non-readable ciphertext', async () => {
      const key = 'secret';
      const value = 'This is sensitive data that should be encrypted';

      await storage.setSecure(key, value);

      const stored = sessionStorage.getItem(key);
      expect(stored).toBeTruthy();

      if (stored) {
        // Stored data should not contain plaintext
        expect(stored).not.toContain(value);
        expect(stored).not.toContain('sensitive');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON in storage', async () => {
      const key = 'invalid';
      sessionStorage.setItem(key, '{invalid json}');

      const retrieved = await storage.getSecure<string>(key);
      expect(retrieved).toBeNull();
    });

    it('should handle missing version field', async () => {
      const key = 'no-version';
      sessionStorage.setItem(key, JSON.stringify({ iv: 'abc', ciphertext: 'def' }));

      const retrieved = await storage.getSecure<string>(key);
      expect(retrieved).toBeNull();
    });

    it('should handle wrong version', async () => {
      const key = 'wrong-version';
      sessionStorage.setItem(key, JSON.stringify({ iv: 'abc', ciphertext: 'def', version: 999 }));

      const retrieved = await storage.getSecure<string>(key);
      expect(retrieved).toBeNull();
    });

    it('should handle invalid base64', async () => {
      const key = 'invalid-base64';
      sessionStorage.setItem(
        key,
        JSON.stringify({ iv: '!!!invalid', ciphertext: '!!!invalid', version: 1 }),
      );

      const retrieved = await storage.getSecure<string>(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('Type safety', () => {
    it('should preserve type information', async () => {
      interface TestData {
        id: string;
        count: number;
        active: boolean;
      }

      const key = 'typed-data';
      const value: TestData = {
        id: 'test-123',
        count: 42,
        active: true,
      };

      await storage.setSecure<TestData>(key, value);
      const retrieved = await storage.getSecure<TestData>(key);

      expect(retrieved).toEqual(value);

      if (retrieved) {
        // TypeScript should know the shape
        expect(typeof retrieved.id).toBe('string');
        expect(typeof retrieved.count).toBe('number');
        expect(typeof retrieved.active).toBe('boolean');
      }
    });
  });

  describe('Encryption control', () => {
    it('should enable encryption by default', () => {
      const defaultStorage = new EncryptedSessionStorage();
      expect(defaultStorage.isEncryptionEnabled()).toBe(true);
    });

    it('should allow disabling encryption via constructor', () => {
      const plaintextStorage = new EncryptedSessionStorage(false);
      expect(plaintextStorage.isEncryptionEnabled()).toBe(false);
    });

    it('should store plaintext when encryption disabled', async () => {
      const plaintextStorage = new EncryptedSessionStorage(false);
      const key = 'plaintext-test';
      const value = { data: 'visible data' };

      await plaintextStorage.setSecure(key, value);

      // Retrieve directly from sessionStorage
      const stored = sessionStorage.getItem(key);
      expect(stored).toBeTruthy();

      if (stored) {
        // Should be plain JSON, not encrypted
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed = JSON.parse(stored);
        expect(parsed).toEqual(value);

        expect(parsed).not.toHaveProperty('iv');

        expect(parsed).not.toHaveProperty('ciphertext');
      }
    });

    it('should retrieve plaintext when encryption disabled', async () => {
      const plaintextStorage = new EncryptedSessionStorage(false);
      const key = 'plaintext-retrieve';
      const value = 'test data';

      await plaintextStorage.setSecure(key, value);
      const retrieved = await plaintextStorage.getSecure<string>(key);

      expect(retrieved).toBe(value);
    });

    it('should allow enabling encryption at runtime', () => {
      const dynamicStorage = new EncryptedSessionStorage(false);
      expect(dynamicStorage.isEncryptionEnabled()).toBe(false);

      dynamicStorage.setEncryption(true);
      expect(dynamicStorage.isEncryptionEnabled()).toBe(true);
    });

    it('should allow disabling encryption at runtime', () => {
      const dynamicStorage = new EncryptedSessionStorage(true);
      expect(dynamicStorage.isEncryptionEnabled()).toBe(true);

      dynamicStorage.setEncryption(false);
      expect(dynamicStorage.isEncryptionEnabled()).toBe(false);
    });

    it('should store encrypted data after enabling encryption', async () => {
      const dynamicStorage = new EncryptedSessionStorage(false);
      const key = 'toggle-encrypted';
      const value = 'secret data';

      // Enable encryption
      dynamicStorage.setEncryption(true);
      await dynamicStorage.setSecure(key, value);

      // Check stored data is encrypted
      const stored = sessionStorage.getItem(key);
      expect(stored).toBeTruthy();

      if (stored) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed = JSON.parse(stored);

        expect(parsed).toHaveProperty('iv');

        expect(parsed).toHaveProperty('ciphertext');

        expect(parsed).toHaveProperty('version', 1);
        // Should not contain plaintext
        expect(stored).not.toContain(value);
      }

      // Verify decryption works
      const retrieved = await dynamicStorage.getSecure<string>(key);
      expect(retrieved).toBe(value);
    });

    it('should store plaintext after disabling encryption', async () => {
      const dynamicStorage = new EncryptedSessionStorage(true);
      const key = 'toggle-plaintext';
      const value = 'visible data';

      // Disable encryption
      dynamicStorage.setEncryption(false);
      await dynamicStorage.setSecure(key, value);

      // Check stored data is plaintext
      const stored = sessionStorage.getItem(key);
      expect(stored).toBeTruthy();

      if (stored) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed = JSON.parse(stored);
        expect(parsed).toBe(value);
      }
    });

    it('should handle complex objects in plaintext mode', async () => {
      const plaintextStorage = new EncryptedSessionStorage(false);
      const key = 'complex-plaintext';
      const value = {
        user: { id: 'RN2344', name: 'Test User' },
        scores: [95, 87, 92],
        metadata: { timestamp: Date.now() },
      };

      await plaintextStorage.setSecure(key, value);
      const retrieved = await plaintextStorage.getSecure<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    it('should return encrypted structure when reading encrypted data with encryption disabled', async () => {
      const encryptedStorage = new EncryptedSessionStorage(true);
      const key = 'encrypted-data';
      const value = 'secret';

      // Store encrypted
      await encryptedStorage.setSecure(key, value);

      // Try to read with encryption disabled
      const plaintextStorage = new EncryptedSessionStorage(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const retrieved = await plaintextStorage.getSecure<any>(key);

      // Should return the encrypted object structure (not the original value)
      expect(retrieved).toBeTruthy();

      expect(retrieved).toHaveProperty('iv');

      expect(retrieved).toHaveProperty('ciphertext');

      expect(retrieved).toHaveProperty('version', 1);
      expect(retrieved).not.toBe(value);
    });
  });
});
