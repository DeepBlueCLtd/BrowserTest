/**
 * Integration Tests: Encrypted Storage
 *
 * Tests for IndexedDB storage adapter with obfuscation layer.
 * Tests US1 (encryption enabled), US2 (encryption disabled), US3 (instructor access).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  IndexedDBStorageAdapter,
  resetStorageAdapter,
} from '../../../src/services/storage/indexeddb.js';
import {
  isObfuscated,
  OBFUSCATION_PREFIX,
  deriveKey,
  encode,
} from '../../../src/services/storage/obfuscation.js';
// StorageFormatError is checked via error message regex, not instanceof
import type { StudentRecord } from '../../../src/types/contracts.js';
import 'fake-indexeddb/auto';

// Test database name
const TEST_DB_NAME = 'test-encrypted-storage';

// Sample student record
function createTestStudent(overrides: Partial<StudentRecord> = {}): StudentRecord {
  return {
    schema: 1,
    docId: 'test-doc',
    release: 'Test Release 2025',
    serviceId: 'ST1234',
    name: 'Test Student',
    attempted: 5,
    correct: 3,
    updated: new Date().toISOString(),
    pages: {
      'page-1': {
        state: 'incomplete' as const,
        answers: [{ answer: 'a', success: true, timestamp: new Date().toISOString() }],
      },
    },
    ...overrides,
  };
}

describe('encrypted storage integration', () => {
  let adapter: IndexedDBStorageAdapter;

  beforeEach(async () => {
    // Reset singleton and any mocks
    resetStorageAdapter();
    vi.resetModules();

    // Create fresh adapter
    adapter = new IndexedDBStorageAdapter(TEST_DB_NAME);
    await adapter.init();
  });

  afterEach(async () => {
    // Clean up
    if (adapter) {
      adapter.close();
    }
    resetStorageAdapter();

    // Delete test database
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(TEST_DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error(req.error?.message ?? 'Failed to delete database'));
    });
  });

  // ==========================================================================
  // US1: Protected Student Data in Production (ENCRYPT_STORAGE=true)
  // ==========================================================================
  describe('US1: ENCRYPT_STORAGE=true', () => {
    // T017: saveStudent stores OBF: prefixed string
    it('saveStudent stores OBF: prefixed string when encryption enabled', async () => {
      // Mock ENCRYPT_STORAGE = true
      vi.doMock('../../../src/config/feature-flags.js', () => ({
        ENCRYPT_STORAGE: true,
      }));

      // Re-import adapter with mocked config
      const { IndexedDBStorageAdapter: EncryptedAdapter } = await import(
        '../../../src/services/storage/indexeddb.js'
      );

      const encAdapter = new EncryptedAdapter(TEST_DB_NAME + '-enc');
      await encAdapter.init();

      try {
        const student = createTestStudent();
        await encAdapter.saveStudent(student);

        // Read raw value directly from IndexedDB
        const rawValue = await getRawValue(
          TEST_DB_NAME + '-enc',
          'students',
          `qd/${student.release}/u${student.serviceId}`,
        );

        // Should be obfuscated string starting with OBF:
        expect(typeof rawValue).toBe('string');
        expect(isObfuscated(rawValue)).toBe(true);
      } finally {
        encAdapter.close();
        await deleteDatabase(TEST_DB_NAME + '-enc');
      }
    });

    // T018: getStudent decodes OBF: data correctly
    it('getStudent decodes OBF: data correctly when encryption enabled', async () => {
      vi.doMock('../../../src/config/feature-flags.js', () => ({
        ENCRYPT_STORAGE: true,
      }));

      const { IndexedDBStorageAdapter: EncryptedAdapter } = await import(
        '../../../src/services/storage/indexeddb.js'
      );

      const encAdapter = new EncryptedAdapter(TEST_DB_NAME + '-enc2');
      await encAdapter.init();

      try {
        const original = createTestStudent({ name: 'Alice Encrypted' });
        await encAdapter.saveStudent(original);

        const retrieved = await encAdapter.getStudent(original.release, original.serviceId);

        expect(retrieved).not.toBeNull();
        expect(retrieved!.name).toBe('Alice Encrypted');
        expect(retrieved!.attempted).toBe(original.attempted);
        expect(retrieved!.correct).toBe(original.correct);
        expect(retrieved!.pages).toEqual(original.pages);
      } finally {
        encAdapter.close();
        await deleteDatabase(TEST_DB_NAME + '-enc2');
      }
    });

    // T019: format mismatch throws StorageFormatError when ENCRYPT_STORAGE=true but data is plain
    it('throws StorageFormatError when ENCRYPT_STORAGE=true but data is plain', async () => {
      // First, save plain data with encryption disabled
      const student = createTestStudent({ serviceId: 'PLAIN1' });
      await adapter.saveStudent(student);
      adapter.close();

      // Now try to read with encryption enabled
      vi.doMock('../../../src/config/feature-flags.js', () => ({
        ENCRYPT_STORAGE: true,
      }));

      const { IndexedDBStorageAdapter: EncryptedAdapter } = await import(
        '../../../src/services/storage/indexeddb.js'
      );

      const encAdapter = new EncryptedAdapter(TEST_DB_NAME);
      await encAdapter.init();

      try {
        await expect(encAdapter.getStudent(student.release, student.serviceId)).rejects.toThrow(
          /Unobfuscated data found/,
        );
      } finally {
        encAdapter.close();
      }
    });

    // T020: tampered OBF: data is detected and handled gracefully
    it('handles tampered OBF: data gracefully', async () => {
      vi.doMock('../../../src/config/feature-flags.js', () => ({
        ENCRYPT_STORAGE: true,
      }));

      const { IndexedDBStorageAdapter: EncryptedAdapter } = await import(
        '../../../src/services/storage/indexeddb.js'
      );

      const encAdapter = new EncryptedAdapter(TEST_DB_NAME + '-tamper');
      await encAdapter.init();

      try {
        // Manually insert tampered data (key not needed - just storing corrupt base64)
        const tamperedData = `${OBFUSCATION_PREFIX}AAAA${btoa('invalid json garbage')}`;
        await setRawValue(
          TEST_DB_NAME + '-tamper',
          'students',
          'qd/Test Release/uTAMPER1',
          tamperedData,
        );

        // Should throw or return null when reading tampered data
        await expect(encAdapter.getStudent('Test Release', 'TAMPER1')).rejects.toThrow();
      } finally {
        encAdapter.close();
        await deleteDatabase(TEST_DB_NAME + '-tamper');
      }
    });
  });

  // ==========================================================================
  // US2: Readable Data in Development Mode (ENCRYPT_STORAGE=false)
  // ==========================================================================
  describe('US2: ENCRYPT_STORAGE=false', () => {
    // T026: saveStudent stores plain object
    it('saveStudent stores plain object when encryption disabled', async () => {
      // Default is ENCRYPT_STORAGE=false
      const student = createTestStudent({ name: 'Plain Jane' });
      await adapter.saveStudent(student);

      // Read raw value directly from IndexedDB
      const rawValue = await getRawValue(
        TEST_DB_NAME,
        'students',
        `qd/${student.release}/u${student.serviceId}`,
      );

      // Should be plain object, not string
      expect(typeof rawValue).toBe('object');
      expect(rawValue).not.toBeNull();
      expect((rawValue as StudentRecord).name).toBe('Plain Jane');
    });

    // T027: getStudent returns plain object
    it('getStudent returns plain object when encryption disabled', async () => {
      const original = createTestStudent({ name: 'Bob Plain' });
      await adapter.saveStudent(original);

      const retrieved = await adapter.getStudent(original.release, original.serviceId);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('Bob Plain');
      expect(retrieved!.attempted).toBe(original.attempted);
    });

    // T028: format mismatch throws StorageFormatError when ENCRYPT_STORAGE=false but data is OBF:
    it('throws StorageFormatError when ENCRYPT_STORAGE=false but data is OBF:', async () => {
      // Manually insert obfuscated data
      const student = createTestStudent({ serviceId: 'OBFUS1' });
      const key = deriveKey(student.release);
      const obfuscatedData = encode(student, key);

      await setRawValue(
        TEST_DB_NAME,
        'students',
        `qd/${student.release}/u${student.serviceId}`,
        obfuscatedData,
      );

      // Try to read with encryption disabled (default)
      await expect(adapter.getStudent(student.release, student.serviceId)).rejects.toThrow(
        /Obfuscated data found/,
      );
    });
  });

  // ==========================================================================
  // US3: Instructor Access to Obfuscated Data
  // ==========================================================================
  describe('US3: Instructor access', () => {
    // T033: getStudentsByRelease returns decoded records when ENCRYPT_STORAGE=true
    it('getStudentsByRelease returns decoded records when encryption enabled', async () => {
      vi.doMock('../../../src/config/feature-flags.js', () => ({
        ENCRYPT_STORAGE: true,
      }));

      const { IndexedDBStorageAdapter: EncryptedAdapter } = await import(
        '../../../src/services/storage/indexeddb.js'
      );

      const encAdapter = new EncryptedAdapter(TEST_DB_NAME + '-instructor');
      await encAdapter.init();

      try {
        const release = 'Instructor Test 2025';
        const student1 = createTestStudent({ release, serviceId: 'INS1', name: 'Student One' });
        const student2 = createTestStudent({ release, serviceId: 'INS2', name: 'Student Two' });

        await encAdapter.saveStudent(student1);
        await encAdapter.saveStudent(student2);

        const students = await encAdapter.getStudentsByRelease(release);

        expect(students).toHaveLength(2);
        expect(students.map((s) => s.name).sort()).toEqual(['Student One', 'Student Two']);
        // Verify data is decoded, not obfuscated strings
        const firstStudent = students[0];
        expect(firstStudent).toBeDefined();
        expect(typeof firstStudent).toBe('object');
        expect(typeof firstStudent?.name).toBe('string');
      } finally {
        encAdapter.close();
        await deleteDatabase(TEST_DB_NAME + '-instructor');
      }
    });
  });
});

// ==========================================================================
// Helper functions for raw IndexedDB access
// ==========================================================================

async function getRawValue(dbName: string, storeName: string, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        resolve(getReq.result);
        db.close();
      };
      getReq.onerror = () => {
        reject(new Error(getReq.error?.message ?? 'Failed to get value'));
        db.close();
      };
    };
    req.onerror = () => reject(new Error(req.error?.message ?? 'Failed to open database'));
  });
}

async function setRawValue(
  dbName: string,
  storeName: string,
  key: string,
  value: unknown,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const putReq = store.put(value, key);
      putReq.onsuccess = () => {
        resolve();
        db.close();
      };
      putReq.onerror = () => {
        reject(new Error(putReq.error?.message ?? 'Failed to put value'));
        db.close();
      };
    };
    req.onerror = () => reject(new Error(req.error?.message ?? 'Failed to open database'));
  });
}

async function deleteDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(dbName);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(new Error(req.error?.message ?? 'Failed to delete database'));
  });
}
