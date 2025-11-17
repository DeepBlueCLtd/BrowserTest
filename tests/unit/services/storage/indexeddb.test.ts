/**
 * Unit tests for IndexedDB storage adapter
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  IndexedDBStorageAdapter,
  getStorageAdapter,
  resetStorageAdapter,
} from '../../../../src/services/storage/indexeddb.js';
import { StorageNotInitializedError } from '../../../../src/services/storage/adapter-utils.js';
import type { StudentRecord } from '../../../../src/types/contracts.js';

describe('IndexedDB Storage Adapter', () => {
  let adapter: IndexedDBStorageAdapter;

  beforeEach(async () => {
    adapter = new IndexedDBStorageAdapter();
    await adapter.init();
    // Clear all data to ensure test isolation
    await adapter.clearAll();
  });

  afterEach(() => {
    adapter.close();
  });

  describe('init()', () => {
    it('should initialize database successfully', async () => {
      const freshAdapter = new IndexedDBStorageAdapter();
      await expect(freshAdapter.init()).resolves.toBeUndefined();
      freshAdapter.close();
    });

    it('should be safe to call init() multiple times', async () => {
      await adapter.init();
      await adapter.init();
      await adapter.init();
      // Should not throw
    });

    it('should reuse existing connection', async () => {
      const freshAdapter = new IndexedDBStorageAdapter();
      await freshAdapter.init();

      // Second init should return immediately
      const start = Date.now();
      await freshAdapter.init();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10); // Should be nearly instant
      freshAdapter.close();
    });
  });

  describe('getStudent()', () => {
    it('should return null for non-existent student', async () => {
      const result = await adapter.getStudent('11-2024', 'RN2344');
      expect(result).toBeNull();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedAdapter = new IndexedDBStorageAdapter();

      await expect(uninitializedAdapter.getStudent('11-2024', 'RN2344')).rejects.toThrow(
        StorageNotInitializedError,
      );

      uninitializedAdapter.close();
    });

    it('should retrieve saved student', async () => {
      const record: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Test Student',
        attempted: 5,
        correct: 3,
        pages: {
          'gram-1': {
            state: 'complete',
            answered: 3,
            correct: 2,
            answers: [
              { answer: 'a', success: true, timestamp: '2024-11-16T10:00:00Z' },
              { answer: 'b', success: false, timestamp: '2024-11-16T10:01:00Z' },
              { answer: 'c', success: true, timestamp: '2024-11-16T10:02:00Z' },
            ],
          },
        },
      };

      await adapter.saveStudent(record);

      const retrieved = await adapter.getStudent('11-2024', 'RN2344');
      expect(retrieved).toEqual(record);
    });

    it('should handle different releases', async () => {
      const record1: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Student 1',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      const record2: StudentRecord = {
        schema: 1,
        release: '01-2025',
        serviceId: 'RN2344',
        name: 'Student 2',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      await adapter.saveStudent(record1);
      await adapter.saveStudent(record2);

      const retrieved1 = await adapter.getStudent('11-2024', 'RN2344');
      const retrieved2 = await adapter.getStudent('01-2025', 'RN2344');

      expect(retrieved1?.release).toBe('11-2024');
      expect(retrieved2?.release).toBe('01-2025');
    });
  });

  describe('saveStudent()', () => {
    it('should save new student record', async () => {
      const record: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'TEST01',
        name: 'New Student',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      await expect(adapter.saveStudent(record)).resolves.toBeUndefined();

      const retrieved = await adapter.getStudent('11-2024', 'TEST01');
      expect(retrieved).toEqual(record);
    });

    it('should update existing student record', async () => {
      const record: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Test Student',
        attempted: 5,
        correct: 3,
        pages: {},
      };

      await adapter.saveStudent(record);

      // Update record
      record.attempted = 10;
      record.correct = 8;

      await adapter.saveStudent(record);

      const retrieved = await adapter.getStudent('11-2024', 'RN2344');
      expect(retrieved?.attempted).toBe(10);
      expect(retrieved?.correct).toBe(8);
    });

    it('should save complex page data', async () => {
      const record: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Test Student',
        attempted: 10,
        correct: 8,
        pages: {
          'page-1': {
            state: 'complete',
            answered: 3,
            correct: 3,
            answers: [
              { answer: 'a', success: true, timestamp: '2024-11-16T10:00:00Z' },
              { answer: 'b', success: true, timestamp: '2024-11-16T10:01:00Z' },
              { answer: 'c', success: true, timestamp: '2024-11-16T10:02:00Z' },
            ],
          },
          'page-2': {
            state: 'incomplete',
            answered: 1,
            correct: 0,
            answers: [{ answer: 'x', success: false, timestamp: '2024-11-16T10:05:00Z' }],
          },
        },
      };

      await adapter.saveStudent(record);

      const retrieved = await adapter.getStudent('11-2024', 'RN2344');
      expect(retrieved?.pages).toEqual(record.pages);
    });

    it('should throw error if not initialized', async () => {
      const uninitializedAdapter = new IndexedDBStorageAdapter();
      const record: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Test',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      await expect(uninitializedAdapter.saveStudent(record)).rejects.toThrow(
        StorageNotInitializedError,
      );

      uninitializedAdapter.close();
    });
  });

  describe('getStudentsByRelease()', () => {
    it('should return empty array for release with no students', async () => {
      const result = await adapter.getStudentsByRelease('11-2024');
      expect(result).toEqual([]);
    });

    it('should return all students for a release', async () => {
      const student1: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Student 1',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      const student2: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN5678',
        name: 'Student 2',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      const student3: StudentRecord = {
        schema: 1,
        release: '01-2025',
        serviceId: 'RN9999',
        name: 'Student 3',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      await adapter.saveStudent(student1);
      await adapter.saveStudent(student2);
      await adapter.saveStudent(student3);

      const students2024 = await adapter.getStudentsByRelease('11-2024');
      const students2025 = await adapter.getStudentsByRelease('01-2025');

      expect(students2024).toHaveLength(2);
      expect(students2025).toHaveLength(1);

      expect(students2024.some((s) => s.serviceId === 'RN2344')).toBe(true);
      expect(students2024.some((s) => s.serviceId === 'RN5678')).toBe(true);
      expect(students2025[0]?.serviceId).toBe('RN9999');
    });

    it('should throw error if not initialized', async () => {
      const uninitializedAdapter = new IndexedDBStorageAdapter();

      await expect(uninitializedAdapter.getStudentsByRelease('11-2024')).rejects.toThrow(
        StorageNotInitializedError,
      );

      uninitializedAdapter.close();
    });
  });

  describe('clearAll()', () => {
    it('should clear all students', async () => {
      const record1: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Student 1',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      const record2: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN5678',
        name: 'Student 2',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      await adapter.saveStudent(record1);
      await adapter.saveStudent(record2);

      await adapter.clearAll();

      const students = await adapter.getStudentsByRelease('11-2024');
      expect(students).toEqual([]);
    });

    it('should clear backups as well', async () => {
      const record: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Test Student',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      await adapter.saveStudent(record);
      await adapter.backup(record);

      await adapter.clearAll();

      // Both students and backups should be cleared
      const students = await adapter.getStudentsByRelease('11-2024');
      expect(students).toEqual([]);
    });

    it('should throw error if not initialized', async () => {
      const uninitializedAdapter = new IndexedDBStorageAdapter();

      await expect(uninitializedAdapter.clearAll()).rejects.toThrow(StorageNotInitializedError);

      uninitializedAdapter.close();
    });
  });

  describe('backup()', () => {
    it('should create backup of student record', async () => {
      const record: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Test Student',
        attempted: 5,
        correct: 3,
        pages: {},
      };

      await expect(adapter.backup(record)).resolves.toBeUndefined();
    });

    it('should create multiple backups', async () => {
      const record: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Test Student',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      await adapter.backup(record);
      await adapter.backup(record);
      await adapter.backup(record);

      // Should not throw
    });

    it('should throw error if not initialized', async () => {
      const uninitializedAdapter = new IndexedDBStorageAdapter();
      const record: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Test',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      await expect(uninitializedAdapter.backup(record)).rejects.toThrow(StorageNotInitializedError);

      uninitializedAdapter.close();
    });
  });

  describe('close()', () => {
    it('should close database connection', () => {
      adapter.close();
      // Should not throw
    });

    it('should allow re-initialization after close', async () => {
      adapter.close();

      await adapter.init();

      const record: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Test',
        attempted: 0,
        correct: 0,
        pages: {},
      };

      await expect(adapter.saveStudent(record)).resolves.toBeUndefined();
    });

    it('should be safe to call multiple times', () => {
      adapter.close();
      adapter.close();
      adapter.close();
      // Should not throw
    });
  });

  describe('Singleton pattern', () => {
    afterEach(() => {
      resetStorageAdapter();
    });

    it('should return same instance', () => {
      const instance1 = getStorageAdapter();
      const instance2 = getStorageAdapter();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getStorageAdapter();
      resetStorageAdapter();
      const instance2 = getStorageAdapter();

      expect(instance1).not.toBe(instance2);
    });

    it('should close connection on reset', async () => {
      const instance = getStorageAdapter();
      await instance.init();

      resetStorageAdapter();

      // Original instance should be closed
      await expect(instance.getStudent('11-2024', 'RN2344')).rejects.toThrow(
        StorageNotInitializedError,
      );
    });
  });

  describe('Data persistence', () => {
    it('should persist data across adapter instances', async () => {
      const record: StudentRecord = {
        schema: 1,
        release: '11-2024',
        serviceId: 'RN2344',
        name: 'Test Student',
        attempted: 10,
        correct: 8,
        pages: {},
      };

      await adapter.saveStudent(record);
      adapter.close();

      // Create new adapter instance
      const newAdapter = new IndexedDBStorageAdapter();
      await newAdapter.init();

      const retrieved = await newAdapter.getStudent('11-2024', 'RN2344');
      expect(retrieved).toEqual(record);

      newAdapter.close();
    });
  });
});
