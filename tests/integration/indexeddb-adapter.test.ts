/**
 * Characterization tests for the IndexedDB storage adapter (T022).
 *
 * Captures the adapter's externally observable behavior across get/save
 * student, getStudentsByRelease, backup, audit-event, clearAll, and DB
 * open/recovery before/after the adapter is decomposed into idb-helpers,
 * idb-codec, idb-connection, backup-repository, and audit-log-repository.
 *
 * The bulk of the per-method assertions live in the existing unit suite
 * (tests/unit/services/storage/indexeddb.test.ts); this suite focuses on the
 * full round-trip plus the audit-log and corruption-recovery paths that the
 * unit suite does not exercise.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  IndexedDBStorageAdapter,
  resetStorageAdapter,
} from '../../src/services/storage/indexeddb.js';
import type { StudentRecord, PinResetEvent } from '../../src/types/contracts.js';

const DB_NAME = 'idb-adapter-characterization';
const RELEASE = '06-2026';

function makeStudent(serviceId: string, release = RELEASE): StudentRecord {
  return {
    schema: 2,
    docId: '',
    release,
    serviceId,
    name: `Student ${serviceId}`,
    attempted: 0,
    correct: 0,
    updated: new Date().toISOString(),
    pages: {},
    pinHash: 'hash',
    pinCreatedAt: new Date().toISOString(),
  };
}

describe('IndexedDBStorageAdapter (characterization)', () => {
  let adapter: IndexedDBStorageAdapter;

  beforeEach(async () => {
    resetStorageAdapter();
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    adapter = new IndexedDBStorageAdapter(DB_NAME);
    await adapter.init();
  });

  afterEach(() => {
    adapter.close();
  });

  it('round-trips a saved student', async () => {
    const student = makeStudent('A1');
    await adapter.saveStudent(student);
    const loaded = await adapter.getStudent(RELEASE, 'A1');
    expect(loaded).toEqual(student);
  });

  it('returns null for a missing student', async () => {
    expect(await adapter.getStudent(RELEASE, 'nope')).toBeNull();
  });

  it('lists students by release', async () => {
    await adapter.saveStudent(makeStudent('A1'));
    await adapter.saveStudent(makeStudent('A2'));
    await adapter.saveStudent(makeStudent('B1', '01-2099'));

    const forRelease = await adapter.getStudentsByRelease(RELEASE);
    expect(forRelease.map((s) => s.serviceId).sort()).toEqual(['A1', 'A2']);
  });

  it('creates a backup without throwing', async () => {
    const student = makeStudent('A1');
    await adapter.saveStudent(student);
    await expect(adapter.backup(student)).resolves.toBeUndefined();
  });

  it('saves a PIN-reset audit event', async () => {
    const event: PinResetEvent = {
      eventId: crypto.randomUUID(),
      serviceId: 'A1',
      resetBy: 'instructor',
      resetAt: new Date().toISOString(),
      release: RELEASE,
    };
    await expect(adapter.saveAuditEvent(event)).resolves.toBeUndefined();
  });

  it('clears all stores', async () => {
    await adapter.saveStudent(makeStudent('A1'));
    await adapter.backup(makeStudent('A1'));
    await adapter.clearAll();
    expect(await adapter.getStudent(RELEASE, 'A1')).toBeNull();
    expect(await adapter.getStudentsByRelease(RELEASE)).toEqual([]);
  });

  it('recovers when stores are missing (corrupted DB)', async () => {
    // Simulate a corrupted DB: an existing database at the same name with no
    // object stores. The adapter should delete and recreate it on init.
    adapter.close();
    resetStorageAdapter();
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1); // version 1, no stores created
      req.onsuccess = () => {
        req.result.close();
        resolve();
      };
      req.onerror = () => reject(req.error ?? new Error('open failed'));
    });

    const recovered = new IndexedDBStorageAdapter(DB_NAME);
    await expect(recovered.init()).resolves.toBeUndefined();
    await expect(recovered.saveStudent(makeStudent('A1'))).resolves.toBeUndefined();
    recovered.close();
  });
});
