/**
 * Unit tests for the IndexedDB request/transaction helpers (T027).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promisifyRequest, runTransaction } from '../../src/services/storage/idb-helpers.js';
import { StorageError } from '../../src/services/storage/adapter-utils.js';

const DB_NAME = 'idb-helpers-test';
const STORE = 'kv';

function openTestDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('open failed'));
  });
}

describe('idb-helpers', () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    db = await openTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe('runTransaction', () => {
    it('resolves with the request result on success', async () => {
      await runTransaction(db, STORE, 'readwrite', (s) => s.put('hello', 'k1'), 'put');
      const value = await runTransaction<string>(db, STORE, 'readonly', (s) => s.get('k1'), 'get');
      expect(value).toBe('hello');
    });

    it('rejects with a StorageError when the request fails', async () => {
      // add() to an existing key fails with a ConstraintError
      await runTransaction(db, STORE, 'readwrite', (s) => s.add('a', 'dup'), 'add');
      await expect(
        runTransaction(db, STORE, 'readwrite', (s) => s.add('b', 'dup'), 'add'),
      ).rejects.toBeInstanceOf(StorageError);
    });

    it('rejects with a StorageError when the store does not exist', async () => {
      await expect(
        runTransaction(db, 'missing-store', 'readonly', (s) => s.get('x'), 'get'),
      ).rejects.toBeInstanceOf(StorageError);
    });
  });

  describe('promisifyRequest', () => {
    it('resolves with the request result', async () => {
      const tx = db.transaction(STORE, 'readwrite');
      const result = await promisifyRequest(tx.objectStore(STORE).put('v', 'k'), 'put');
      expect(result).toBe('k');
    });
  });
});
