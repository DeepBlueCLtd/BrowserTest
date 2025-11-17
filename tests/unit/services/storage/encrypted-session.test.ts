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
      sessionStorage.setItem(
        key,
        JSON.stringify({ iv: 'abc', ciphertext: 'def' })
      );

      const retrieved = await storage.getSecure<string>(key);
      expect(retrieved).toBeNull();
    });

    it('should handle wrong version', async () => {
      const key = 'wrong-version';
      sessionStorage.setItem(
        key,
        JSON.stringify({ iv: 'abc', ciphertext: 'def', version: 999 })
      );

      const retrieved = await storage.getSecure<string>(key);
      expect(retrieved).toBeNull();
    });

    it('should handle invalid base64', async () => {
      const key = 'invalid-base64';
      sessionStorage.setItem(
        key,
        JSON.stringify({ iv: '!!!invalid', ciphertext: '!!!invalid', version: 1 })
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
});
