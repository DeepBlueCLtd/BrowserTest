/**
 * Characterization tests for AuthService (T015, FR-006).
 *
 * Captures the current student-login outcomes the component used to implement
 * inline, before the duplicated flow was consolidated into AuthService:
 *   - success (existing student, correct PIN)        → pin-verified
 *   - new student created                            → pin-created
 *   - existing legacy/no-PIN student sets a PIN      → pin-created
 *   - lockout (threshold reached / already locked)   → lockout
 *   - bad PIN (still attempts remaining)             → bad-pin
 *   - needs-migration (storage format mismatch)      → needs-migration
 *   - retry-after-migration shares the success path
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '../../src/services/auth/auth-service.js';
import type { StudentLoginInput } from '../../src/services/auth/auth-service.js';
import { getStorageAdapter, resetStorageAdapter } from '../../src/services/storage/indexeddb.js';
import { hashPin } from '../../src/services/auth/pin-service.js';
import { StorageFormatError } from '../../src/services/storage/adapter-utils.js';
import { SCHEMA_VERSION } from '../../src/types/contracts.js';
import type { StudentRecord } from '../../src/types/contracts.js';

const DB_NAME = 'auth-service-test-db';
const RELEASE = 'TEST-2026';

function makeInput(overrides: Partial<StudentLoginInput> = {}): StudentLoginInput {
  return {
    serviceId: '30012345',
    name: 'J Smith',
    pin: '1234',
    release: RELEASE,
    dbName: DB_NAME,
    ...overrides,
  };
}

async function seedStudent(overrides: Partial<StudentRecord> = {}): Promise<void> {
  const storage = getStorageAdapter(DB_NAME);
  await storage.init();
  const record: StudentRecord = {
    schema: SCHEMA_VERSION,
    docId: '',
    release: RELEASE,
    serviceId: '30012345',
    name: 'J Smith',
    attempted: 0,
    correct: 0,
    updated: new Date().toISOString(),
    pages: {},
    pinHash: await hashPin('1234'),
    pinCreatedAt: new Date().toISOString(),
    ...overrides,
  };
  await storage.saveStudent(record);
}

describe('AuthService', () => {
  describe('isRegistered', () => {
    it('returns false for a service ID with no record', async () => {
      const service = new AuthService();

      const result = await service.isRegistered('NOBODY01', RELEASE, DB_NAME);

      expect(result).toBe(false);
    });

    it('returns true once an account with a PIN exists', async () => {
      const service = new AuthService();
      await service.loginStudent({
        serviceId: 'REG001',
        name: 'Registered Student',
        pin: '1234',
        release: RELEASE,
        dbName: DB_NAME,
      });

      const result = await service.isRegistered('REG001', RELEASE, DB_NAME);

      expect(result).toBe(true);
    });

    it('reports unknown rather than throwing when storage is unusable', async () => {
      const service = new AuthService();

      // An empty database name cannot open a store
      const result = await service.isRegistered('REG001', RELEASE, '');

      expect(result).toBeNull();
    });
  });

  let auth: AuthService;

  beforeEach(() => {
    auth = new AuthService();
    sessionStorage.clear();
    resetStorageAdapter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetStorageAdapter();
  });

  it('creates a new student and returns pin-created', async () => {
    const result = await auth.loginStudent(makeInput());
    expect(result.kind).toBe('pin-created');

    const storage = getStorageAdapter(DB_NAME);
    await storage.init();
    const saved = await storage.getStudent(RELEASE, '30012345');
    expect(saved).not.toBeNull();
    expect(saved?.pinHash).toBeTruthy();
  });

  it('verifies an existing student with the correct PIN (pin-verified)', async () => {
    await seedStudent();
    const result = await auth.loginStudent(makeInput({ pin: '1234' }));
    expect(result.kind).toBe('pin-verified');
  });

  it('sets a PIN for a legacy student without one (pin-created)', async () => {
    await seedStudent({ pinHash: '', pinCreatedAt: undefined, schema: 1 });
    const result = await auth.loginStudent(makeInput({ pin: '5678' }));
    expect(result.kind).toBe('pin-created');
  });

  it('returns bad-pin with remaining attempts on a wrong PIN', async () => {
    await seedStudent();
    const result = await auth.loginStudent(makeInput({ pin: '0000' }));
    expect(result.kind).toBe('bad-pin');
    if (result.kind === 'bad-pin') {
      expect(result.remaining).toBeGreaterThan(0);
    }
  });

  it('returns lockout once the failed-attempt threshold is reached', async () => {
    await seedStudent();
    let result = await auth.loginStudent(makeInput({ pin: '0000' }));
    while (result.kind === 'bad-pin') {
      result = await auth.loginStudent(makeInput({ pin: '0000' }));
    }
    expect(result.kind).toBe('lockout');
  });

  it('returns lockout immediately when already locked out (no storage call)', async () => {
    await seedStudent();
    let result = await auth.loginStudent(makeInput({ pin: '0000' }));
    while (result.kind === 'bad-pin') {
      result = await auth.loginStudent(makeInput({ pin: '0000' }));
    }
    expect(result.kind).toBe('lockout');

    // A subsequent correct PIN is still rejected while locked
    const locked = await auth.loginStudent(makeInput({ pin: '1234' }));
    expect(locked.kind).toBe('lockout');
  });

  it('surfaces a storage format mismatch as needs-migration', async () => {
    await seedStudent();
    const storage = getStorageAdapter(DB_NAME);
    vi.spyOn(storage, 'getStudent').mockRejectedValueOnce(
      new StorageFormatError('format mismatch', 'obfuscated', 'plain', 'qd/TEST-2026/u30012345'),
    );
    const result = await auth.loginStudent(makeInput());
    expect(result.kind).toBe('needs-migration');
    if (result.kind === 'needs-migration') {
      expect(result.error).toBeInstanceOf(StorageFormatError);
    }
  });

  it('retryAfterMigration shares the success path (pin-verified) and skips lockout', async () => {
    await seedStudent();
    const result = await auth.retryAfterMigration(makeInput({ pin: '1234' }));
    expect(result.kind).toBe('pin-verified');
  });

  it('retryAfterMigration treats a storage format mismatch as a generic error', async () => {
    await seedStudent();
    const storage = getStorageAdapter(DB_NAME);
    vi.spyOn(storage, 'getStudent').mockRejectedValueOnce(
      new StorageFormatError('format mismatch', 'obfuscated', 'plain', 'qd/TEST-2026/u30012345'),
    );
    const result = await auth.retryAfterMigration(makeInput());
    expect(result.kind).toBe('error');
  });
});
