/**
 * Storage Adapter Interface Tests
 *
 * These tests verify the contract that all storage adapters must implement.
 * The tests use a mock implementation to validate the interface behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { StorageAdapter, StudentRecord, ReleaseId, ServiceId } from '../../../../src/types/contracts';

/**
 * Mock Storage Adapter for testing interface contracts
 */
class MockStorageAdapter implements StorageAdapter {
  private storage = new Map<string, StudentRecord>();
  private initialized = false;

  init(): Promise<void> {
    this.initialized = true;
    return Promise.resolve();
  }

  getStudent(release: ReleaseId, serviceId: ServiceId): Promise<StudentRecord | null> {
    if (!this.initialized) {
      return Promise.reject(new Error('Storage not initialized'));
    }
    const key = `qd/${release}/u${serviceId}`;
    return Promise.resolve(this.storage.get(key) || null);
  }

  saveStudent(record: StudentRecord): Promise<void> {
    if (!this.initialized) {
      return Promise.reject(new Error('Storage not initialized'));
    }
    const key = `qd/${record.release}/u${record.serviceId}`;
    this.storage.set(key, { ...record });
    return Promise.resolve();
  }

  getStudentsByRelease(release: ReleaseId): Promise<StudentRecord[]> {
    if (!this.initialized) {
      return Promise.reject(new Error('Storage not initialized'));
    }
    const prefix = `qd/${release}/`;
    const results = Array.from(this.storage.entries())
      .filter(([key]) => key.startsWith(prefix))
      .map(([, value]) => value);
    return Promise.resolve(results);
  }

  clearAll(): Promise<void> {
    if (!this.initialized) {
      return Promise.reject(new Error('Storage not initialized'));
    }
    this.storage.clear();
    return Promise.resolve();
  }

  backup(record: StudentRecord): Promise<void> {
    if (!this.initialized) {
      return Promise.reject(new Error('Storage not initialized'));
    }
    const timestamp = new Date().toISOString();
    const backupKey = `backup_${timestamp}_${record.serviceId}`;
    this.storage.set(backupKey, { ...record });
    return Promise.resolve();
  }
}

describe('StorageAdapter Interface', () => {
  let adapter: StorageAdapter;

  beforeEach(() => {
    adapter = new MockStorageAdapter();
  });

  describe('init()', () => {
    it('should initialize the storage', async () => {
      await expect(adapter.init()).resolves.toBeUndefined();
    });

    it('should allow operations after initialization', async () => {
      await adapter.init();
      await expect(adapter.getStudent('01-2025', 'TEST001')).resolves.toBeNull();
    });
  });

  describe('getStudent()', () => {
    beforeEach(async () => {
      await adapter.init();
    });

    it('should return null for non-existent student', async () => {
      const result = await adapter.getStudent('01-2025', 'NONEXISTENT');
      expect(result).toBeNull();
    });

    it('should return student record when it exists', async () => {
      const mockRecord: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      await adapter.saveStudent(mockRecord);
      const result = await adapter.getStudent('01-2025', 'TEST001');

      expect(result).toEqual(mockRecord);
    });

    it('should isolate students by release', async () => {
      const record1: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Student 1',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      const record2: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '02-2025',
        serviceId: 'TEST001',
        name: 'Student 2',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      await adapter.saveStudent(record1);
      await adapter.saveStudent(record2);

      const result1 = await adapter.getStudent('01-2025', 'TEST001');
      const result2 = await adapter.getStudent('02-2025', 'TEST001');

      expect(result1?.name).toBe('Student 1');
      expect(result2?.name).toBe('Student 2');
    });

    it('should throw error if not initialized', async () => {
      const uninitializedAdapter = new MockStorageAdapter();
      await expect(
        uninitializedAdapter.getStudent('01-2025', 'TEST001')
      ).rejects.toThrow('Storage not initialized');
    });
  });

  describe('saveStudent()', () => {
    beforeEach(async () => {
      await adapter.init();
    });

    it('should save a new student record', async () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 5,
        correct: 3,
        updated: new Date().toISOString(),
        pages: {},
      };

      await adapter.saveStudent(record);
      const result = await adapter.getStudent('01-2025', 'TEST001');

      expect(result).toEqual(record);
    });

    it('should update existing student record', async () => {
      const initialRecord: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 5,
        correct: 3,
        updated: new Date().toISOString(),
        pages: {},
      };

      await adapter.saveStudent(initialRecord);

      const updatedRecord: StudentRecord = {
        ...initialRecord,
        attempted: 10,
        correct: 8,
        updated: new Date().toISOString(),
      };

      await adapter.saveStudent(updatedRecord);
      const result = await adapter.getStudent('01-2025', 'TEST001');

      expect(result?.attempted).toBe(10);
      expect(result?.correct).toBe(8);
    });

    it('should handle multiple students for same release', async () => {
      const record1: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Student 1',
        attempted: 5,
        correct: 3,
        updated: new Date().toISOString(),
        pages: {},
      };

      const record2: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST002',
        name: 'Student 2',
        attempted: 8,
        correct: 6,
        updated: new Date().toISOString(),
        pages: {},
      };

      await adapter.saveStudent(record1);
      await adapter.saveStudent(record2);

      const result1 = await adapter.getStudent('01-2025', 'TEST001');
      const result2 = await adapter.getStudent('01-2025', 'TEST002');

      expect(result1?.name).toBe('Student 1');
      expect(result2?.name).toBe('Student 2');
    });

    it('should throw error if not initialized', async () => {
      const uninitializedAdapter = new MockStorageAdapter();
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      await expect(
        uninitializedAdapter.saveStudent(record)
      ).rejects.toThrow('Storage not initialized');
    });
  });

  describe('getStudentsByRelease()', () => {
    beforeEach(async () => {
      await adapter.init();
    });

    it('should return empty array for release with no students', async () => {
      const result = await adapter.getStudentsByRelease('01-2025');
      expect(result).toEqual([]);
    });

    it('should return all students for a specific release', async () => {
      const records: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test-doc',
          release: '01-2025',
          serviceId: 'TEST001',
          name: 'Student 1',
          attempted: 5,
          correct: 3,
          updated: new Date().toISOString(),
          pages: {},
        },
        {
          schema: 1,
          docId: 'test-doc',
          release: '01-2025',
          serviceId: 'TEST002',
          name: 'Student 2',
          attempted: 8,
          correct: 6,
          updated: new Date().toISOString(),
          pages: {},
        },
      ];

      for (const record of records) {
        await adapter.saveStudent(record);
      }

      const result = await adapter.getStudentsByRelease('01-2025');

      expect(result).toHaveLength(2);
      expect(result.map(r => r.serviceId).sort()).toEqual(['TEST001', 'TEST002']);
    });

    it('should not return students from different releases', async () => {
      const record1: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Student 1',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      const record2: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '02-2025',
        serviceId: 'TEST002',
        name: 'Student 2',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      await adapter.saveStudent(record1);
      await adapter.saveStudent(record2);

      const result = await adapter.getStudentsByRelease('01-2025');

      expect(result).toHaveLength(1);
      expect(result[0].serviceId).toBe('TEST001');
    });

    it('should throw error if not initialized', async () => {
      const uninitializedAdapter = new MockStorageAdapter();
      await expect(
        uninitializedAdapter.getStudentsByRelease('01-2025')
      ).rejects.toThrow('Storage not initialized');
    });
  });

  describe('clearAll()', () => {
    beforeEach(async () => {
      await adapter.init();
    });

    it('should remove all student records', async () => {
      const records: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test-doc',
          release: '01-2025',
          serviceId: 'TEST001',
          name: 'Student 1',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {},
        },
        {
          schema: 1,
          docId: 'test-doc',
          release: '02-2025',
          serviceId: 'TEST002',
          name: 'Student 2',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {},
        },
      ];

      for (const record of records) {
        await adapter.saveStudent(record);
      }

      await adapter.clearAll();

      const result1 = await adapter.getStudent('01-2025', 'TEST001');
      const result2 = await adapter.getStudent('02-2025', 'TEST002');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should allow new records after clearing', async () => {
      await adapter.clearAll();

      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'New Student',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      await adapter.saveStudent(record);
      const result = await adapter.getStudent('01-2025', 'TEST001');

      expect(result).toEqual(record);
    });

    it('should throw error if not initialized', async () => {
      const uninitializedAdapter = new MockStorageAdapter();
      await expect(
        uninitializedAdapter.clearAll()
      ).rejects.toThrow('Storage not initialized');
    });
  });

  describe('backup()', () => {
    beforeEach(async () => {
      await adapter.init();
    });

    it('should create a backup of student record', async () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 5,
        correct: 3,
        updated: new Date().toISOString(),
        pages: {},
      };

      await adapter.saveStudent(record);
      await expect(adapter.backup(record)).resolves.toBeUndefined();
    });

    it('should not affect the original record', async () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 5,
        correct: 3,
        updated: new Date().toISOString(),
        pages: {},
      };

      await adapter.saveStudent(record);
      await adapter.backup(record);

      const result = await adapter.getStudent('01-2025', 'TEST001');
      expect(result).toEqual(record);
    });

    it('should throw error if not initialized', async () => {
      const uninitializedAdapter = new MockStorageAdapter();
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      await expect(
        uninitializedAdapter.backup(record)
      ).rejects.toThrow('Storage not initialized');
    });
  });

  describe('Storage Key Format', () => {
    beforeEach(async () => {
      await adapter.init();
    });

    it('should use consistent key format qd/{release}/u{serviceId}', async () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '03-2025',
        serviceId: 'ABC123',
        name: 'Test Student',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      await adapter.saveStudent(record);
      const result = await adapter.getStudent('03-2025', 'ABC123');

      expect(result).toEqual(record);
    });
  });
});
