/**
 * Unit tests for storage helper utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getJSON,
  setJSON,
  removeItem,
  hasItem,
  clearQuizData,
  getQuizDataKeys,
  clearAll,
} from '../../../src/utils/storage-helpers.js';

describe('Storage Helpers', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('getJSON() and setJSON()', () => {
    it('should store and retrieve objects', () => {
      const data = { id: 'test', count: 42 };

      const setResult = setJSON('test-key', data);
      expect(setResult).toBe(true);

      const retrieved = getJSON<typeof data>('test-key');
      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const retrieved = getJSON('nonexistent');
      expect(retrieved).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      sessionStorage.setItem('invalid', '{broken json}');

      const retrieved = getJSON('invalid');
      expect(retrieved).toBeNull();
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3, 4, 5];

      setJSON('array', data);
      const retrieved = getJSON<number[]>('array');

      expect(retrieved).toEqual(data);
    });

    it('should handle null values', () => {
      setJSON('null-value', null);
      const retrieved = getJSON('null-value');

      expect(retrieved).toBeNull();
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          id: 'RN2344',
          scores: [95, 87, 92],
        },
      };

      setJSON('nested', data);
      const retrieved = getJSON<typeof data>('nested');

      expect(retrieved).toEqual(data);
    });
  });

  describe('removeItem()', () => {
    it('should remove item from storage', () => {
      setJSON('to-remove', 'data');

      expect(hasItem('to-remove')).toBe(true);

      removeItem('to-remove');

      expect(hasItem('to-remove')).toBe(false);
    });
  });

  describe('hasItem()', () => {
    it('should return true for existing item', () => {
      setJSON('exists', 'value');

      expect(hasItem('exists')).toBe(true);
    });

    it('should return false for non-existent item', () => {
      expect(hasItem('nonexistent')).toBe(false);
    });
  });

  describe('clearQuizData()', () => {
    it('should remove only quiz data keys', () => {
      setJSON('qd/session', { data: 'quiz' });
      setJSON('qd/state', { data: 'quiz' });
      setJSON('other-app', { data: 'other' });

      const cleared = clearQuizData();

      expect(cleared).toBe(2);
      expect(hasItem('qd/session')).toBe(false);
      expect(hasItem('qd/state')).toBe(false);
      expect(hasItem('other-app')).toBe(true);
    });

    it('should return 0 when no quiz data exists', () => {
      setJSON('other-app', { data: 'other' });

      const cleared = clearQuizData();

      expect(cleared).toBe(0);
    });
  });

  describe('getQuizDataKeys()', () => {
    it('should return all quiz data keys', () => {
      setJSON('qd/session', 'data1');
      setJSON('qd/state', 'data2');
      setJSON('qd/cache', 'data3');
      setJSON('other-app', 'data4');

      const keys = getQuizDataKeys();

      expect(keys).toHaveLength(3);
      expect(keys).toContain('qd/session');
      expect(keys).toContain('qd/state');
      expect(keys).toContain('qd/cache');
      expect(keys).not.toContain('other-app');
    });

    it('should return empty array when no quiz data exists', () => {
      setJSON('other-app', 'data');

      const keys = getQuizDataKeys();

      expect(keys).toEqual([]);
    });
  });

  describe('clearAll()', () => {
    it('should clear all session storage', () => {
      setJSON('key1', 'value1');
      setJSON('key2', 'value2');
      setJSON('key3', 'value3');

      clearAll();

      expect(sessionStorage.length).toBe(0);
    });
  });
});
