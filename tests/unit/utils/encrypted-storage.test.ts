/**
 * Tests for encrypted storage helpers
 *
 * Security requirement: All sensitive session data must be encrypted
 * before storing in browser storage to prevent PII exposure.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getEncryptedJSON,
  setEncryptedJSON,
  removeEncryptedItem,
} from '../../../src/utils/storage-helpers';

describe('Encrypted Storage Helpers', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('setEncryptedJSON and getEncryptedJSON', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const data = {
        serviceId: 'RN2344',
        name: 'John Doe',
        release: '11-2024',
        loginTime: '2024-11-15T10:00:00Z',
      };
      const password = 'session-key-12345';

      await setEncryptedJSON('test-key', data, password);

      // Verify data is encrypted in storage (not plaintext)
      const stored = sessionStorage.getItem('test-key');
      expect(stored).toBeTruthy();
      expect(stored).not.toContain('RN2344');
      expect(stored).not.toContain('John Doe');

      // Verify we can decrypt it back
      const decrypted = await getEncryptedJSON('test-key', password);
      expect(decrypted).toEqual(data);
    });

    it('should fail to decrypt with wrong password', async () => {
      const data = { secret: 'value' };
      await setEncryptedJSON('test-key', data, 'correct-password');

      const result = await getEncryptedJSON('test-key', 'wrong-password');
      expect(result).toBeNull();
    });

    it('should return null for non-existent keys', async () => {
      const result = await getEncryptedJSON('non-existent', 'password');
      expect(result).toBeNull();
    });

    it('should handle empty objects', async () => {
      const emptyData = {};
      const password = 'test-key';

      await setEncryptedJSON('empty', emptyData, password);
      const result = await getEncryptedJSON('empty', password);

      expect(result).toEqual(emptyData);
    });

    it('should handle nested objects', async () => {
      const nested = {
        user: {
          id: 'RN2344',
          profile: { name: 'Test', email: 'test@example.com' },
        },
        metadata: { timestamp: '2024-11-15', count: 42 },
      };
      const password = 'test-key';

      await setEncryptedJSON('nested', nested, password);
      const result = await getEncryptedJSON('nested', password);

      expect(result).toEqual(nested);
    });

    it('should handle arrays', async () => {
      const arrayData = {
        items: ['item1', 'item2', 'item3'],
        numbers: [1, 2, 3, 4, 5],
      };
      const password = 'test-key';

      await setEncryptedJSON('array', arrayData, password);
      const result = await getEncryptedJSON('array', password);

      expect(result).toEqual(arrayData);
    });

    it('should use localStorage when specified', async () => {
      const data = { persistent: true };
      const password = 'test-key';

      await setEncryptedJSON('test-key', data, password, localStorage);

      // Should not be in sessionStorage
      expect(sessionStorage.getItem('test-key')).toBeNull();

      // Should be in localStorage
      expect(localStorage.getItem('test-key')).toBeTruthy();

      const result = await getEncryptedJSON('test-key', password, localStorage);
      expect(result).toEqual(data);
    });

    it('should produce different ciphertext for same data (random IV)', async () => {
      const data = { test: 'value' };
      const password = 'test-key';

      await setEncryptedJSON('key1', data, password);
      await setEncryptedJSON('key2', data, password);

      const stored1 = sessionStorage.getItem('key1');
      const stored2 = sessionStorage.getItem('key2');

      // Stored values should be different (different IVs)
      expect(stored1).not.toBe(stored2);

      // But both should decrypt to same data
      const result1 = await getEncryptedJSON('key1', password);
      const result2 = await getEncryptedJSON('key2', password);
      expect(result1).toEqual(data);
      expect(result2).toEqual(data);
    });

    it('should handle unicode and special characters', async () => {
      const data = {
        chinese: '你好世界',
        emoji: '😀🎉🔒',
        special: '<script>alert("XSS")</script>',
      };
      const password = 'test-key';

      await setEncryptedJSON('unicode', data, password);
      const result = await getEncryptedJSON('unicode', password);

      expect(result).toEqual(data);
    });

    it('should return null for corrupted encrypted data', async () => {
      const data = { test: 'value' };
      const password = 'test-key';

      await setEncryptedJSON('test-key', data, password);

      // Corrupt the stored data
      sessionStorage.setItem('test-key', 'corrupted-data');

      const result = await getEncryptedJSON('test-key', password);
      expect(result).toBeNull();
    });
  });

  describe('removeEncryptedItem', () => {
    it('should remove encrypted item from storage', async () => {
      const data = { test: 'value' };
      await setEncryptedJSON('test-key', data, 'password');

      expect(sessionStorage.getItem('test-key')).toBeTruthy();

      removeEncryptedItem('test-key');

      expect(sessionStorage.getItem('test-key')).toBeNull();
    });

    it('should remove from localStorage when specified', async () => {
      const data = { test: 'value' };
      await setEncryptedJSON('test-key', data, 'password', localStorage);

      expect(localStorage.getItem('test-key')).toBeTruthy();

      removeEncryptedItem('test-key', localStorage);

      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should not throw error for non-existent keys', () => {
      expect(() => removeEncryptedItem('non-existent')).not.toThrow();
    });
  });

  describe('Security properties', () => {
    it('should not expose PII in stored encrypted data', async () => {
      const sensitiveData = {
        serviceId: 'RN2344',
        name: 'John Doe',
        ssn: '123-45-6789',
        email: 'john@example.com',
      };
      const password = 'test-key';

      await setEncryptedJSON('sensitive', sensitiveData, password);

      const stored = sessionStorage.getItem('sensitive');
      expect(stored).toBeTruthy();

      // None of the PII should be visible in plaintext
      expect(stored).not.toContain('RN2344');
      expect(stored).not.toContain('John Doe');
      expect(stored).not.toContain('123-45-6789');
      expect(stored).not.toContain('john@example.com');
    });

    it('should include encryption metadata in stored format', async () => {
      const data = { test: 'value' };
      const password = 'test-key';

      await setEncryptedJSON('test-key', data, password);

      const stored = sessionStorage.getItem('test-key');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!) as Record<string, unknown>;
      // Should have encryption envelope
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('salt');
      expect(parsed).toHaveProperty('ciphertext');
      expect(parsed).toHaveProperty('timestamp');
    });
  });
});
