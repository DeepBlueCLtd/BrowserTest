/**
 * Unit Tests: Obfuscation Migration Utility
 *
 * Tests for the storage migration utility that converts data
 * between plain and obfuscated formats.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

// Mock the feature flags before importing modules
vi.mock('../../../../src/config/feature-flags.js', () => ({
  ENCRYPT_STORAGE: false,
}));

import { migrateObfuscation } from '../../../../src/services/storage/obfuscation-migration.js';
import {
  IndexedDBStorageAdapter,
  resetStorageAdapter,
} from '../../../../src/services/storage/indexeddb.js';
import { isObfuscated, encode, deriveKey } from '../../../../src/services/storage/obfuscation.js';
import type { StudentRecord } from '../../../../src/types/contracts.js';

const TEST_DB_NAME = 'test-obfuscation-migration';

function createTestStudent(overrides: Partial<StudentRecord> = {}): StudentRecord {
  return {
    schema: 1,
    docId: 'test-doc',
    release: 'Migration Test 2025',
    serviceId: 'MIG001',
    name: 'Migration Student',
    attempted: 3,
    correct: 2,
    updated: new Date().toISOString(),
    pages: {},
    ...overrides,
  };
}

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

describe('obfuscation migration utility', () => {
  let adapter: IndexedDBStorageAdapter;

  beforeEach(async () => {
    resetStorageAdapter();
    adapter = new IndexedDBStorageAdapter(TEST_DB_NAME);
    await adapter.init();
  });

  afterEach(async () => {
    if (adapter) {
      adapter.close();
    }
    resetStorageAdapter();
    await deleteDatabase(TEST_DB_NAME);
  });

  // T039: migrateObfuscation('encrypt') converts plain records to OBF: format
  describe("migrateObfuscation('encrypt')", () => {
    it('converts plain records to OBF: format', async () => {
      const release = 'Migration Test 2025';
      const student = createTestStudent({ release });

      // Save plain data
      await adapter.saveStudent(student);
      adapter.close();

      // Run migration
      const result = await migrateObfuscation(TEST_DB_NAME, 'encrypt', {
        releaseId: release,
      });

      expect(result.migrated).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify data is now obfuscated
      const rawValue = await getRawValue(
        TEST_DB_NAME,
        'students',
        `qd/${release}/u${student.serviceId}`,
      );
      expect(isObfuscated(rawValue)).toBe(true);
    });

    it('skips already obfuscated records', async () => {
      const release = 'Migration Test 2025';
      const student = createTestStudent({ release, serviceId: 'SKIP01' });
      const key = deriveKey(release);

      // Insert obfuscated data directly
      adapter.close();
      const newAdapter = new IndexedDBStorageAdapter(TEST_DB_NAME);
      await newAdapter.init();

      await setRawValue(
        TEST_DB_NAME,
        'students',
        `qd/${release}/u${student.serviceId}`,
        encode(student, key),
      );
      newAdapter.close();

      // Run migration
      const result = await migrateObfuscation(TEST_DB_NAME, 'encrypt', {
        releaseId: release,
      });

      expect(result.migrated).toBe(0);
      expect(result.skipped).toBe(1);
    });
  });

  // T040: migrateObfuscation('decrypt') converts OBF: records to plain format
  describe("migrateObfuscation('decrypt')", () => {
    it('converts OBF: records to plain format', async () => {
      const release = 'Migration Test 2025';
      const student = createTestStudent({ release, serviceId: 'DEC001' });
      const key = deriveKey(release);

      // Insert obfuscated data directly
      adapter.close();
      const newAdapter = new IndexedDBStorageAdapter(TEST_DB_NAME);
      await newAdapter.init();

      await setRawValue(
        TEST_DB_NAME,
        'students',
        `qd/${release}/u${student.serviceId}`,
        encode(student, key),
      );
      newAdapter.close();

      // Run migration
      const result = await migrateObfuscation(TEST_DB_NAME, 'decrypt', {
        releaseId: release,
      });

      expect(result.migrated).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify data is now plain
      const rawValue = await getRawValue(
        TEST_DB_NAME,
        'students',
        `qd/${release}/u${student.serviceId}`,
      );
      expect(isObfuscated(rawValue)).toBe(false);
      expect(typeof rawValue).toBe('object');
      expect((rawValue as StudentRecord).name).toBe(student.name);
    });

    it('skips already plain records', async () => {
      const release = 'Migration Test 2025';
      const student = createTestStudent({ release, serviceId: 'PLAIN1' });

      // Save plain data
      await adapter.saveStudent(student);
      adapter.close();

      // Run decrypt migration
      const result = await migrateObfuscation(TEST_DB_NAME, 'decrypt', {
        releaseId: release,
      });

      expect(result.migrated).toBe(0);
      expect(result.skipped).toBe(1);
    });
  });

  // T041: migrateObfuscation with dryRun:true reports changes without modifying data
  describe('dryRun mode', () => {
    it('reports changes without modifying data', async () => {
      const release = 'Migration Test 2025';
      const student = createTestStudent({ release, serviceId: 'DRY001' });

      // Save plain data
      await adapter.saveStudent(student);
      adapter.close();

      // Run dry run
      const result = await migrateObfuscation(TEST_DB_NAME, 'encrypt', {
        releaseId: release,
        dryRun: true,
      });

      expect(result.migrated).toBe(1); // Would migrate
      expect(result.skipped).toBe(0);

      // Verify data was NOT modified
      const rawValue = await getRawValue(
        TEST_DB_NAME,
        'students',
        `qd/${release}/u${student.serviceId}`,
      );
      expect(isObfuscated(rawValue)).toBe(false);
      expect(typeof rawValue).toBe('object');
    });
  });

  // T042: migrateObfuscation handles errors gracefully
  describe('error handling', () => {
    it('reports corrupted records in errors array', async () => {
      const release = 'Migration Test 2025';

      // Insert corrupted obfuscated data
      adapter.close();
      const newAdapter = new IndexedDBStorageAdapter(TEST_DB_NAME);
      await newAdapter.init();

      await setRawValue(TEST_DB_NAME, 'students', `qd/${release}/uCORRUPT`, 'OBF:invalidbase64!!!');
      newAdapter.close();

      // Run decrypt migration
      const result = await migrateObfuscation(TEST_DB_NAME, 'decrypt', {
        releaseId: release,
      });

      expect(result.migrated).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.key).toContain('CORRUPT');
    });

    it('returns duration in milliseconds', async () => {
      const release = 'Migration Test 2025';
      const student = createTestStudent({ release });

      await adapter.saveStudent(student);
      adapter.close();

      const result = await migrateObfuscation(TEST_DB_NAME, 'encrypt', {
        releaseId: release,
      });

      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(typeof result.durationMs).toBe('number');
    });
  });
});
