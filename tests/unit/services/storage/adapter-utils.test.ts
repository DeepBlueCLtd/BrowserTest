/**
 * Unit tests for storage adapter utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getStorageKey,
  parseStorageKey,
  isValidReleaseId,
  isValidServiceId,
  createEmptyStudentRecord,
  StorageError,
  StorageNotInitializedError,
  StorageTimeoutError,
  StorageQuotaError,
} from '../../../../src/services/storage/adapter-utils.js';

describe('Storage Adapter Utilities', () => {
  describe('getStorageKey()', () => {
    it('should generate correct storage key format', () => {
      const key = getStorageKey('11-2024', 'RN2344');
      expect(key).toBe('qd/11-2024/uRN2344');
    });

    it('should handle different release formats', () => {
      expect(getStorageKey('01-2025', 'TEST01')).toBe('qd/01-2025/uTEST01');
      expect(getStorageKey('12-2023', 'ABC123')).toBe('qd/12-2023/uABC123');
    });

    it('should handle short service IDs', () => {
      expect(getStorageKey('11-2024', 'AB')).toBe('qd/11-2024/uAB');
    });

    it('should handle long service IDs', () => {
      expect(getStorageKey('11-2024', 'ABCDEFGHIJ')).toBe('qd/11-2024/uABCDEFGHIJ');
    });
  });

  describe('parseStorageKey()', () => {
    it('should parse valid storage key', () => {
      const result = parseStorageKey('qd/11-2024/uRN2344');
      expect(result).toEqual({
        release: '11-2024',
        serviceId: 'RN2344',
      });
    });

    it('should parse key with short service ID', () => {
      const result = parseStorageKey('qd/01-2025/uAB');
      expect(result).toEqual({
        release: '01-2025',
        serviceId: 'AB',
      });
    });

    it('should return null for invalid format', () => {
      expect(parseStorageKey('invalid')).toBeNull();
      expect(parseStorageKey('qd/11-2024/')).toBeNull();
      expect(parseStorageKey('qd//uRN2344')).toBeNull();
      expect(parseStorageKey('wrong/11-2024/uRN2344')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseStorageKey('')).toBeNull();
    });

    it('should handle keys with special characters in service ID', () => {
      const result = parseStorageKey('qd/11-2024/uRN2344ABC');
      expect(result).toEqual({
        release: '11-2024',
        serviceId: 'RN2344ABC',
      });
    });
  });

  describe('isValidReleaseId()', () => {
    it('should accept valid MM-YYYY format', () => {
      expect(isValidReleaseId('01-2025')).toBe(true);
      expect(isValidReleaseId('12-2024')).toBe(true);
      expect(isValidReleaseId('06-2023')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidReleaseId('2024-01')).toBe(false); // YYYY-MM
      expect(isValidReleaseId('1-2024')).toBe(false); // Single digit month
      expect(isValidReleaseId('13-2024')).toBe(false); // Invalid month
      expect(isValidReleaseId('00-2024')).toBe(false); // Invalid month
      expect(isValidReleaseId('01-24')).toBe(false); // 2-digit year
      expect(isValidReleaseId('01/2024')).toBe(false); // Wrong separator
      expect(isValidReleaseId('Jan-2024')).toBe(false); // Text month
    });

    it('should reject empty string', () => {
      expect(isValidReleaseId('')).toBe(false);
    });
  });

  describe('isValidServiceId()', () => {
    it('should accept valid service IDs', () => {
      expect(isValidServiceId('RN2344')).toBe(true);
      expect(isValidServiceId('AB')).toBe(true); // Minimum 2 chars
      expect(isValidServiceId('ABCDEFGHIJ')).toBe(true); // Maximum 10 chars
      expect(isValidServiceId('ABC123')).toBe(true); // Mixed alphanumeric
      expect(isValidServiceId('12345')).toBe(true); // All numeric
      expect(isValidServiceId('ABCDE')).toBe(true); // All letters
    });

    it('should reject invalid service IDs', () => {
      expect(isValidServiceId('A')).toBe(false); // Too short
      expect(isValidServiceId('ABCDEFGHIJK')).toBe(false); // Too long (11 chars)
      expect(isValidServiceId('RN-2344')).toBe(false); // Special characters
      expect(isValidServiceId('RN 2344')).toBe(false); // Space
      expect(isValidServiceId('RN_2344')).toBe(false); // Underscore
      expect(isValidServiceId('RN.2344')).toBe(false); // Period
    });

    it('should reject empty string', () => {
      expect(isValidServiceId('')).toBe(false);
    });

    it('should accept lowercase', () => {
      expect(isValidServiceId('rn2344')).toBe(true);
      expect(isValidServiceId('abc123')).toBe(true);
    });
  });

  describe('createEmptyStudentRecord()', () => {
    it('should create valid empty record', () => {
      const record = createEmptyStudentRecord('11-2024', 'RN2344', 'Test Student', 'doc-test');

      expect(record.schema).toBe(1);
      expect(record.docId).toBe('doc-test');
      expect(record.release).toBe('11-2024');
      expect(record.serviceId).toBe('RN2344');
      expect(record.name).toBe('Test Student');
      expect(record.attempted).toBe(0);
      expect(record.correct).toBe(0);
      expect(record.updated).toBeDefined();
      expect(record.pages).toEqual({});
    });

    it('should create record with different parameters', () => {
      const record = createEmptyStudentRecord('01-2025', 'ABC123', 'Another Student', 'doc-123');

      expect(record.docId).toBe('doc-123');
      expect(record.release).toBe('01-2025');
      expect(record.serviceId).toBe('ABC123');
      expect(record.name).toBe('Another Student');
    });

    it('should handle empty name', () => {
      const record = createEmptyStudentRecord('11-2024', 'RN2344', '', 'doc-empty');

      expect(record.docId).toBe('doc-empty');
      expect(record.name).toBe('');
      expect(record.serviceId).toBe('RN2344');
    });
  });

  describe('StorageError', () => {
    it('should create error with message and operation', () => {
      const error = new StorageError('Test error', 'testOp');

      expect(error.message).toBe('Test error');
      expect(error.operation).toBe('testOp');
      expect(error.name).toBe('StorageError');
      expect(error.cause).toBeUndefined();
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new StorageError('Test error', 'testOp', cause);

      expect(error.message).toBe('Test error');
      expect(error.operation).toBe('testOp');
      expect(error.cause).toBe(cause);
    });

    it('should be instanceof Error', () => {
      const error = new StorageError('Test error', 'testOp');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof StorageError).toBe(true);
    });
  });

  describe('StorageNotInitializedError', () => {
    it('should create error with correct message', () => {
      const error = new StorageNotInitializedError('getStudent');

      expect(error.message).toContain('not initialized');
      expect(error.message).toContain('init()');
      expect(error.operation).toBe('getStudent');
      expect(error.name).toBe('StorageNotInitializedError');
    });

    it('should be instanceof StorageError', () => {
      const error = new StorageNotInitializedError('testOp');
      expect(error instanceof StorageError).toBe(true);
      expect(error instanceof StorageNotInitializedError).toBe(true);
    });
  });

  describe('StorageTimeoutError', () => {
    it('should create error with timeout in message', () => {
      const error = new StorageTimeoutError('saveStudent', 5000);

      expect(error.message).toContain('5000ms');
      expect(error.message).toContain('timed out');
      expect(error.operation).toBe('saveStudent');
      expect(error.name).toBe('StorageTimeoutError');
    });

    it('should be instanceof StorageError', () => {
      const error = new StorageTimeoutError('testOp', 1000);
      expect(error instanceof StorageError).toBe(true);
      expect(error instanceof StorageTimeoutError).toBe(true);
    });
  });

  describe('StorageQuotaError', () => {
    it('should create error with quota message', () => {
      const error = new StorageQuotaError('saveStudent');

      expect(error.message).toContain('quota');
      expect(error.message).toContain('exceeded');
      expect(error.operation).toBe('saveStudent');
      expect(error.name).toBe('StorageQuotaError');
    });

    it('should be instanceof StorageError', () => {
      const error = new StorageQuotaError('testOp');
      expect(error instanceof StorageError).toBe(true);
      expect(error instanceof StorageQuotaError).toBe(true);
    });
  });

  describe('Round-trip key conversion', () => {
    it('should parse key generated by getStorageKey', () => {
      const originalRelease = '11-2024';
      const originalServiceId = 'RN2344';

      const key = getStorageKey(originalRelease, originalServiceId);
      const parsed = parseStorageKey(key);

      expect(parsed).not.toBeNull();
      if (parsed) {
        expect(parsed.release).toBe(originalRelease);
        expect(parsed.serviceId).toBe(originalServiceId);
      }
    });

    it('should handle multiple round trips', () => {
      const testCases = [
        { release: '01-2025', serviceId: 'AB' },
        { release: '12-2023', serviceId: 'ABCDEFGHIJ' },
        { release: '06-2024', serviceId: 'TEST01' },
      ];

      for (const testCase of testCases) {
        const key = getStorageKey(testCase.release, testCase.serviceId);
        const parsed = parseStorageKey(key);

        expect(parsed).toEqual(testCase);
      }
    });
  });
});
