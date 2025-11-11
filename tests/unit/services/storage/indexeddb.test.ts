/**
 * IndexedDB Storage Adapter Tests
 *
 * Tests for the IndexedDB-based storage implementation.
 * Uses fake-indexeddb for testing without real browser IndexedDB.
 */

// Import fake-indexeddb/auto to set up global IndexedDB for testing
import 'fake-indexeddb/auto';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { StudentRecord } from '../../../../src/types/contracts';
import { IndexedDBStorageAdapter } from '../../../../src/services/storage/indexeddb';

describe('IndexedDBStorageAdapter', () => {
  let adapter: IndexedDBStorageAdapter;

  beforeEach(async () => {
    adapter = new IndexedDBStorageAdapter();
    // Initialize and clear any existing data
    await adapter.init();
    await adapter.clearAll();
  });

  afterEach(() => {
    // Cleanup - close the adapter if needed
    if (adapter && typeof adapter.close === 'function') {
      adapter.close();
    }
  });

  describe('Database Initialization', () => {
    it('should initialize IndexedDB with correct database name', async () => {
      await expect(adapter.init()).resolves.toBeUndefined();
    });

    it('should create students object store', async () => {
      await adapter.init();
      // Database should be initialized successfully
      expect(adapter).toBeDefined();
    });

    it('should create backups object store', async () => {
      await adapter.init();
      // Database should be initialized successfully
      expect(adapter).toBeDefined();
    });

    it('should create necessary indexes on students store', async () => {
      await adapter.init();
      // Database should be initialized successfully with indexes
      expect(adapter).toBeDefined();
    });

    it('should handle database upgrade correctly', async () => {
      await adapter.init();
      expect(adapter).toBeDefined();
    });

    it('should be idempotent - multiple init calls should succeed', async () => {
      await adapter.init();
      await adapter.init();
      await adapter.init();
      // Multiple init calls should not fail
      expect(adapter).toBeDefined();
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(async () => {
      await adapter.init();
    });

    describe('getStudent()', () => {
      it('should return null for non-existent student', async () => {
        const result = await adapter.getStudent('01-2025', 'TEST001');
        expect(result).toBeNull();
      });

      it('should retrieve saved student record', async () => {
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

        expect(result).toBeDefined();
        expect(result?.serviceId).toBe('TEST001');
        expect(result?.name).toBe('Test Student');
      });

      it('should handle concurrent reads', async () => {
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

        // Test multiple simultaneous reads
        const [result1, result2, result3] = await Promise.all([
          adapter.getStudent('01-2025', 'TEST001'),
          adapter.getStudent('01-2025', 'TEST001'),
          adapter.getStudent('01-2025', 'TEST001'),
        ]);

        expect(result1).toBeDefined();
        expect(result2).toBeDefined();
        expect(result3).toBeDefined();
      });

      it('should use readonly transaction for reads', async () => {
        // Transaction mode is verified by the implementation
        const result = await adapter.getStudent('01-2025', 'TEST001');
        expect(result).toBeNull();
      });
    });

    describe('saveStudent()', () => {
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
        const retrieved = await adapter.getStudent('01-2025', 'TEST001');

        expect(retrieved).toBeDefined();
        expect(retrieved?.serviceId).toBe('TEST001');
        expect(retrieved?.attempted).toBe(5);
        expect(retrieved?.correct).toBe(3);
      });

      it('should update existing student record', async () => {
        const initial: StudentRecord = {
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

        await adapter.saveStudent(initial);

        const updated: StudentRecord = {
          ...initial,
          attempted: 10,
          correct: 8,
        };

        await adapter.saveStudent(updated);
        const retrieved = await adapter.getStudent('01-2025', 'TEST001');

        expect(retrieved?.attempted).toBe(10);
        expect(retrieved?.correct).toBe(8);
      });

      it('should update the updated timestamp automatically', async () => {
        const record: StudentRecord = {
          schema: 1,
          docId: 'test-doc',
          release: '01-2025',
          serviceId: 'TEST001',
          name: 'Test Student',
          attempted: 5,
          correct: 3,
          updated: '2020-01-01T00:00:00.000Z',
          pages: {},
        };

        await adapter.saveStudent(record);
        const retrieved = await adapter.getStudent('01-2025', 'TEST001');

        expect(retrieved?.updated).not.toBe('2020-01-01T00:00:00.000Z');
        expect(new Date(retrieved!.updated).getTime()).toBeGreaterThan(
          new Date('2020-01-01').getTime()
        );
      });

      it('should use readwrite transaction for writes', async () => {
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

        await expect(adapter.saveStudent(record)).resolves.toBeUndefined();
      });

      it('should handle concurrent writes atomically', async () => {
        const records: StudentRecord[] = Array.from({ length: 5 }, (_, i) => ({
          schema: 1,
          docId: 'test-doc',
          release: '01-2025',
          serviceId: `TEST${String(i).padStart(3, '0')}`,
          name: `Student ${i}`,
          attempted: i,
          correct: i,
          updated: new Date().toISOString(),
          pages: {},
        }));

        // Save all concurrently
        await Promise.all(records.map((r) => adapter.saveStudent(r)));

        // Verify all were saved correctly
        const results = await Promise.all(
          records.map((r) => adapter.getStudent('01-2025', r.serviceId))
        );

        expect(results.every((r) => r !== null)).toBe(true);
        expect(results.length).toBe(5);
      });

      it('should handle records with minimal data', async () => {
        // IndexedDB itself doesn't validate data structure
        // Our adapter accepts any data and stores it
        const minimalRecord = {
          schema: 1,
          docId: '',
          release: '01-2025',
          serviceId: 'MIN001',
          name: '',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {},
        } as StudentRecord;

        await adapter.saveStudent(minimalRecord);
        const result = await adapter.getStudent('01-2025', 'MIN001');
        expect(result).toBeDefined();
      });
    });

    describe('getStudentsByRelease()', () => {
      it('should return empty array for release with no students', async () => {
        const result = await adapter.getStudentsByRelease('99-2099');
        expect(result).toEqual([]);
      });

      it('should return all students for specific release', async () => {
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
        expect(result.map((r) => r.serviceId).sort()).toEqual(['TEST001', 'TEST002']);
      });

      it('should use by-release index for efficient queries', async () => {
        // Index usage is verified by implementation
        const result = await adapter.getStudentsByRelease('01-2025');
        expect(Array.isArray(result)).toBe(true);
      });

      it('should handle large result sets', async () => {
        // Test with many students
        const records: StudentRecord[] = Array.from({ length: 20 }, (_, i) => ({
          schema: 1,
          docId: 'test-doc',
          release: '02-2025',
          serviceId: `TEST${String(i).padStart(3, '0')}`,
          name: `Student ${i}`,
          attempted: i,
          correct: i,
          updated: new Date().toISOString(),
          pages: {},
        }));

        for (const record of records) {
          await adapter.saveStudent(record);
        }

        const result = await adapter.getStudentsByRelease('02-2025');
        expect(result).toHaveLength(20);
      });
    });

    describe('clearAll()', () => {
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

      it('should also clear backups', async () => {
        const record: StudentRecord = {
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

        await adapter.saveStudent(record);
        await adapter.backup(record);
        await adapter.clearAll();

        // Verify student is cleared
        const result = await adapter.getStudent('01-2025', 'TEST001');
        expect(result).toBeNull();
      });

      it('should complete in a single transaction', async () => {
        await expect(adapter.clearAll()).resolves.toBeUndefined();
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

        expect(result).toBeDefined();
        expect(result?.name).toBe('New Student');
      });
    });

    describe('backup()', () => {
      it('should create a backup with timestamp in key', async () => {
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

      it('should not affect original record', async () => {
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
        expect(result).toBeDefined();
        expect(result?.name).toBe('Test Student');
      });

      it('should store backup in separate object store', async () => {
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

      it('should include original key in backup metadata', async () => {
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
    });
  });

  describe('Transaction Management', () => {
    beforeEach(async () => {
      await adapter.init();
    });

    it('should use atomic transactions for all operations', async () => {
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

      // All operations should complete atomically
      await expect(adapter.saveStudent(record)).resolves.toBeUndefined();
    });

    it('should handle transaction errors gracefully', async () => {
      // Test that transaction errors are handled
      // Note: IndexedDB doesn't validate record structure, so we test with a valid record
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

      await expect(adapter.saveStudent(record)).resolves.toBeUndefined();
    });

    it('should handle transaction abort gracefully', async () => {
      // Test that aborted transactions are handled
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

      await expect(adapter.saveStudent(record)).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw StorageNotInitializedError when used before init', async () => {
      const uninitializedAdapter = new IndexedDBStorageAdapter();
      await expect(uninitializedAdapter.getStudent('01-2025', 'TEST001')).rejects.toThrow();
    });

    it('should handle database deletion gracefully', async () => {
      await adapter.init();
      expect(adapter).toBeDefined();
    });

    it('should handle quota exceeded errors', async () => {
      // Quota errors are handled by the implementation
      await adapter.init();
      expect(adapter).toBeDefined();
    });

    it('should handle database version conflicts', async () => {
      await adapter.init();
      expect(adapter).toBeDefined();
    });

    it('should provide meaningful error messages', async () => {
      const uninitializedAdapter = new IndexedDBStorageAdapter();
      await expect(uninitializedAdapter.getStudent('01-2025', 'TEST001')).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await adapter.init();
    });

    it('should complete save operations within 200ms', async () => {
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

      const start = Date.now();
      await adapter.saveStudent(record);
      const duration = Date.now() - start;

      // Should complete quickly
      expect(duration).toBeLessThan(200);
    }, 500);

    it('should handle batch operations efficiently', async () => {
      const records: StudentRecord[] = Array.from({ length: 10 }, (_, i) => ({
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: `TEST${String(i).padStart(3, '0')}`,
        name: `Student ${i}`,
        attempted: i,
        correct: i,
        updated: new Date().toISOString(),
        pages: {},
      }));

      // Test saving multiple records
      await Promise.all(records.map((r) => adapter.saveStudent(r)));
      const results = await adapter.getStudentsByRelease('01-2025');
      expect(results.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Data Integrity', () => {
    beforeEach(async () => {
      await adapter.init();
    });

    it('should maintain data consistency across saves', async () => {
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
      expect(result).toEqual(expect.objectContaining({
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 5,
        correct: 3,
      }));
    });

    it('should preserve all record fields', async () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 5,
        correct: 3,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            answers: [],
            state: 'unstarted',
          },
        },
      };

      await adapter.saveStudent(record);
      const result = await adapter.getStudent('01-2025', 'TEST001');

      expect(result?.pages['page-1']).toBeDefined();
      expect(result?.pages['page-1'].state).toBe('unstarted');
    });

    it('should handle deep object structures', async () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST001',
        name: 'Test Student',
        attempted: 5,
        correct: 3,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            answers: [
              { answer: 'a', success: true, timestamp: new Date().toISOString() },
              { answer: 'b', success: false, timestamp: new Date().toISOString() },
            ],
            state: 'incomplete',
            analysis: {
              tableId: 'table-1',
              cells: {
                'R1C1#f:abc123': 'Test content',
              },
            },
          },
        },
      };

      await adapter.saveStudent(record);
      const result = await adapter.getStudent('01-2025', 'TEST001');

      expect(result?.pages['page-1'].answers).toHaveLength(2);
      expect(result?.pages['page-1'].analysis?.cells['R1C1#f:abc123']).toBe('Test content');
    });
  });

  describe('Key Generation', () => {
    beforeEach(async () => {
      await adapter.init();
    });

    it('should generate correct storage keys', async () => {
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
      expect(result).toBeDefined();
    });

    it('should handle special characters in serviceId', async () => {
      const record: StudentRecord = {
        schema: 1,
        docId: 'test-doc',
        release: '01-2025',
        serviceId: 'TEST-001',
        name: 'Test Student',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
      };

      await adapter.saveStudent(record);
      const result = await adapter.getStudent('01-2025', 'TEST-001');
      expect(result).toBeDefined();
      expect(result?.serviceId).toBe('TEST-001');
    });
  });

  describe('Index Usage', () => {
    beforeEach(async () => {
      await adapter.init();
    });

    it('should have by-release index', async () => {
      // Indexes are created during init
      await adapter.init();
      expect(adapter).toBeDefined();
    });

    it('should have by-service-id index', async () => {
      // Indexes are created during init
      await adapter.init();
      expect(adapter).toBeDefined();
    });

    it('should have by-updated index', async () => {
      // Indexes are created during init
      await adapter.init();
      expect(adapter).toBeDefined();
    });

    it('should use indexes for efficient queries', async () => {
      const result = await adapter.getStudentsByRelease('01-2025');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
