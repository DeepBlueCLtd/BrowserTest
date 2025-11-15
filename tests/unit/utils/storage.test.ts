/**
 * Tests for secure storage helper functions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getJSON, setJSON, removeItem, clear } from '../../../src/utils/storage-helpers';

describe('Storage Helpers', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('getJSON', () => {
    it('should retrieve and parse JSON from storage', () => {
      const data = { test: 'value', number: 42 };
      sessionStorage.setItem('test-key', JSON.stringify(data));

      const result = getJSON<typeof data>('test-key');
      expect(result).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const result = getJSON('non-existent');
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      sessionStorage.setItem('bad-json', 'not valid json{');
      const result = getJSON('bad-json');
      expect(result).toBeNull();
    });

    it('should use localStorage when specified', () => {
      const data = { persistent: true };
      localStorage.setItem('test-key', JSON.stringify(data));

      const result = getJSON('test-key', localStorage);
      expect(result).toEqual(data);
    });

    it('should handle complex nested objects', () => {
      const data = {
        user: { id: '123', profile: { name: 'Test' } },
        items: [1, 2, 3],
        metadata: { created: '2024-11-15' },
      };
      sessionStorage.setItem('complex', JSON.stringify(data));

      const result = getJSON('complex');
      expect(result).toEqual(data);
    });
  });

  describe('setJSON', () => {
    it('should stringify and store JSON data', () => {
      const data = { test: 'value', number: 42 };
      setJSON('test-key', data);

      const stored = sessionStorage.getItem('test-key');
      expect(stored).toBe(JSON.stringify(data));
    });

    it('should use localStorage when specified', () => {
      const data = { persistent: true };
      setJSON('test-key', data, localStorage);

      const stored = localStorage.getItem('test-key');
      expect(stored).toBe(JSON.stringify(data));
    });

    it('should overwrite existing values', () => {
      setJSON('test-key', { old: 'value' });
      setJSON('test-key', { new: 'value' });

      const result = getJSON('test-key');
      expect(result).toEqual({ new: 'value' });
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3, { nested: true }];
      setJSON('array-key', data);

      const result = getJSON('array-key');
      expect(result).toEqual(data);
    });
  });

  describe('removeItem', () => {
    it('should remove item from sessionStorage', () => {
      sessionStorage.setItem('test-key', 'value');
      removeItem('test-key');

      expect(sessionStorage.getItem('test-key')).toBeNull();
    });

    it('should remove item from localStorage when specified', () => {
      localStorage.setItem('test-key', 'value');
      removeItem('test-key', localStorage);

      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should not throw error for non-existent keys', () => {
      expect(() => removeItem('non-existent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all sessionStorage', () => {
      sessionStorage.setItem('key1', 'value1');
      sessionStorage.setItem('key2', 'value2');

      clear();

      expect(sessionStorage.length).toBe(0);
    });

    it('should clear all localStorage when specified', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');

      clear(localStorage);

      expect(localStorage.length).toBe(0);
    });
  });

  describe('Round-trip', () => {
    it('should preserve data through set/get cycle', () => {
      const original = {
        serviceId: 'RN2344',
        name: 'Test User',
        release: '11-2024',
        scores: [1, 2, 3, 4, 5],
        metadata: { timestamp: '2024-11-15T10:00:00Z' },
      };

      setJSON('roundtrip', original);
      const retrieved = getJSON('roundtrip');

      expect(retrieved).toEqual(original);
    });
  });
});
