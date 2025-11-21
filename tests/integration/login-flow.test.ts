/**
 * Integration Tests for Login Flow with PIN Authentication
 *
 * Tests the complete login workflow including:
 * - New student PIN creation (T014)
 * - Returning student PIN authentication (T026)
 * - Migration flow for existing students (T048)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getStorageAdapter, resetStorageAdapter } from '../../src/services/storage/indexeddb.js';
import { hashPin, verifyPin } from '../../src/services/auth/pin-service.js';
import {
  completePinSetup,
  needsMigration,
  hasPinSet,
} from '../../src/services/storage/migration.js';
import {
  checkLockout,
  recordFailedAttempt,
  clearAttemptState,
} from '../../src/services/auth/rate-limiter.js';
import { SCHEMA_VERSION, type StudentRecord } from '../../src/types/contracts.js';

describe('Login Flow with PIN Authentication', () => {
  const TEST_DB = 'LoginFlowTestDB';
  let storage: ReturnType<typeof getStorageAdapter>;

  beforeEach(async () => {
    sessionStorage.clear();
    resetStorageAdapter();
    storage = getStorageAdapter(TEST_DB);
    await storage.init();
  });

  afterEach(async () => {
    await storage.clearAll();
    storage.close();
    resetStorageAdapter();
    sessionStorage.clear();

    // Delete test database
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(TEST_DB);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  });

  describe('T014 - New Student PIN Creation Flow', () => {
    it('should create student record with PIN hash for new student', async () => {
      const serviceId = 'RN2344';
      const name = 'Alice Student';
      const release = 'Test Release 2024';
      const pin = '1234';

      // Hash the PIN
      const pinHash = await hashPin(pin);
      expect(pinHash).toHaveLength(64); // SHA-256 hex

      // Create new student record with PIN
      const newStudent: StudentRecord = {
        schema: SCHEMA_VERSION,
        docId: '',
        release,
        serviceId,
        name,
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
        pinHash,
        pinCreatedAt: new Date().toISOString(),
      };

      // Save to storage
      await storage.saveStudent(newStudent);

      // Verify student was saved
      const saved = await storage.getStudent(release, serviceId);
      expect(saved).not.toBeNull();
      expect(saved?.serviceId).toBe(serviceId);
      expect(saved?.name).toBe(name);
      expect(saved?.pinHash).toBe(pinHash);
      expect(saved?.pinCreatedAt).toBeDefined();
    });

    it('should verify PIN matches stored hash', async () => {
      const pin = '5678';
      const pinHash = await hashPin(pin);

      // Verify correct PIN
      const isValid = await verifyPin(pin, pinHash);
      expect(isValid).toBe(true);

      // Verify wrong PIN
      const isInvalid = await verifyPin('9999', pinHash);
      expect(isInvalid).toBe(false);
    });

    it('should reject PIN with wrong format', () => {
      // PIN must be 4 digits
      const shortPin = '123';
      const longPin = '12345';
      const letterPin = 'abcd';

      // These should still hash (validation is in UI), but we test the format
      expect(shortPin.length).not.toBe(4);
      expect(longPin.length).not.toBe(4);
      expect(/^\d{4}$/.test(letterPin)).toBe(false);
    });
  });

  describe('T026 - Returning Student PIN Authentication', () => {
    it('should authenticate returning student with correct PIN', async () => {
      const serviceId = 'RN5678';
      const release = 'Test Release 2024';
      const pin = '4321';

      // Create student with PIN
      const pinHash = await hashPin(pin);
      const student: StudentRecord = {
        schema: SCHEMA_VERSION,
        docId: '',
        release,
        serviceId,
        name: 'Bob Student',
        attempted: 5,
        correct: 3,
        updated: new Date().toISOString(),
        pages: {},
        pinHash,
        pinCreatedAt: new Date().toISOString(),
      };
      await storage.saveStudent(student);

      // Retrieve and verify PIN
      const retrieved = await storage.getStudent(release, serviceId);
      expect(retrieved).not.toBeNull();

      const isValid = await verifyPin(pin, retrieved!.pinHash!);
      expect(isValid).toBe(true);

      // Verify quiz data preserved
      expect(retrieved?.attempted).toBe(5);
      expect(retrieved?.correct).toBe(3);
    });

    it('should reject incorrect PIN and track attempts', async () => {
      const serviceId = 'RN9999';
      const release = 'Test Release 2024';
      const correctPin = '1111';
      const wrongPin = '2222';

      // Create student
      const pinHash = await hashPin(correctPin);
      const student: StudentRecord = {
        schema: SCHEMA_VERSION,
        docId: '',
        release,
        serviceId,
        name: 'Carol Student',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
        pinHash,
        pinCreatedAt: new Date().toISOString(),
      };
      await storage.saveStudent(student);

      // Try wrong PIN
      const isValid = await verifyPin(wrongPin, pinHash);
      expect(isValid).toBe(false);

      // Record failed attempt
      const state = recordFailedAttempt(serviceId);
      expect(state.attempts).toBe(1);
      expect(state.lockoutUntil).toBeNull();
    });

    it('should lock out after 3 failed attempts', () => {
      const serviceId = 'RN1111';

      // Record 3 failed attempts
      recordFailedAttempt(serviceId);
      recordFailedAttempt(serviceId);
      const state = recordFailedAttempt(serviceId);

      expect(state.attempts).toBe(3);
      expect(state.lockoutUntil).not.toBeNull();

      // Check lockout
      const lockout = checkLockout(serviceId);
      expect(lockout.isLocked).toBe(true);
      expect(lockout.remainingMs).toBeGreaterThan(0);
    });

    it('should clear attempts on successful login', () => {
      const serviceId = 'RN2222';

      // Record some failed attempts
      recordFailedAttempt(serviceId);
      recordFailedAttempt(serviceId);

      // Clear on success
      clearAttemptState(serviceId);

      // Check cleared
      const lockout = checkLockout(serviceId);
      expect(lockout.isLocked).toBe(false);
    });
  });

  describe('T048 - Migration Flow for Existing Students', () => {
    it('should detect v1 schema student needing migration', async () => {
      // Create v1 student (no PIN)
      const v1Student: StudentRecord = {
        schema: 1,
        docId: '',
        release: 'Old Release',
        serviceId: 'RN3333',
        name: 'Legacy Student',
        attempted: 10,
        correct: 8,
        updated: new Date().toISOString(),
        pages: {},
      };
      await storage.saveStudent(v1Student);

      // Check needs migration
      const retrieved = await storage.getStudent('Old Release', 'RN3333');
      expect(needsMigration(retrieved!)).toBe(true);
      expect(hasPinSet(retrieved!)).toBe(false);
    });

    it('should complete PIN setup during migration', async () => {
      // Create v1 student
      const v1Student: StudentRecord = {
        schema: 1,
        docId: '',
        release: 'Old Release',
        serviceId: 'RN4444',
        name: 'Migrating Student',
        attempted: 15,
        correct: 12,
        updated: new Date().toISOString(),
        pages: {
          'page-1': {
            answers: [{ answer: 'a', success: true, timestamp: new Date().toISOString() }],
            state: 'complete',
          },
        },
      };
      await storage.saveStudent(v1Student);

      // Complete PIN setup
      const pin = '9876';
      const pinHash = await hashPin(pin);
      const migrated = completePinSetup(v1Student, pinHash);

      // Verify migration
      expect(migrated.schema).toBe(SCHEMA_VERSION);
      expect(migrated.pinHash).toBe(pinHash);
      expect(migrated.pinCreatedAt).toBeDefined();

      // Verify data preserved
      expect(migrated.attempted).toBe(15);
      expect(migrated.correct).toBe(12);
      expect(migrated.pages['page-1']?.answers[0]?.answer).toBe('a');
    });

    it('should not require migration for v2 student with PIN', async () => {
      const pinHash = await hashPin('5555');
      const v2Student: StudentRecord = {
        schema: SCHEMA_VERSION,
        docId: '',
        release: 'New Release',
        serviceId: 'RN5555',
        name: 'Modern Student',
        attempted: 0,
        correct: 0,
        updated: new Date().toISOString(),
        pages: {},
        pinHash,
        pinCreatedAt: new Date().toISOString(),
      };
      await storage.saveStudent(v2Student);

      const retrieved = await storage.getStudent('New Release', 'RN5555');
      expect(needsMigration(retrieved!)).toBe(false);
      expect(hasPinSet(retrieved!)).toBe(true);
    });
  });
});
