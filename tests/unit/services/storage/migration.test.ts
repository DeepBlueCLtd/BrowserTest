/**
 * Unit tests for Migration Service
 *
 * Tests schema detection and v1→v2 migration logic.
 */

import { describe, it, expect } from 'vitest';
import {
  needsMigration,
  hasPinSet,
  migrateToV2,
  completePinSetup,
  resetPin,
} from '../../../../src/services/storage/migration.js';
import type { StudentRecord } from '../../../../src/types/contracts.js';
import { SCHEMA_VERSION } from '../../../../src/types/contracts.js';

describe('Migration Service', () => {
  const createV1Student = (): StudentRecord => ({
    schema: 1,
    docId: 'doc1',
    release: 'Autumn 2025',
    serviceId: 'RN1234',
    name: 'John Doe',
    attempted: 5,
    correct: 3,
    updated: '2025-01-01T00:00:00Z',
    pages: {
      page1: {
        answers: [],
        state: 'incomplete',
      },
    },
  });

  const createV2Student = (): StudentRecord => ({
    ...createV1Student(),
    schema: SCHEMA_VERSION,
    pinHash: 'abc123hash',
    pinCreatedAt: '2025-01-01T00:00:00Z',
  });

  describe('needsMigration', () => {
    it('should return true for v1 schema', () => {
      const student = createV1Student();
      expect(needsMigration(student)).toBe(true);
    });

    it('should return false for current schema', () => {
      const student = createV2Student();
      expect(needsMigration(student)).toBe(false);
    });

    it('should return true for older schemas', () => {
      const student = { ...createV1Student(), schema: 0 };
      expect(needsMigration(student)).toBe(true);
    });
  });

  describe('hasPinSet', () => {
    it('should return false when pinHash is undefined', () => {
      const student = createV1Student();
      expect(hasPinSet(student)).toBe(false);
    });

    it('should return false when pinHash is empty string', () => {
      const student = { ...createV1Student(), pinHash: '' };
      expect(hasPinSet(student)).toBe(false);
    });

    it('should return true when pinHash has value', () => {
      const student = createV2Student();
      expect(hasPinSet(student)).toBe(true);
    });
  });

  describe('migrateToV2', () => {
    it('should update schema version to current', () => {
      const student = createV1Student();
      const migrated = migrateToV2(student);
      expect(migrated.schema).toBe(SCHEMA_VERSION);
    });

    it('should set pinHash to empty string', () => {
      const student = createV1Student();
      const migrated = migrateToV2(student);
      expect(migrated.pinHash).toBe('');
    });

    it('should preserve all existing data', () => {
      const student = createV1Student();
      const migrated = migrateToV2(student);

      expect(migrated.serviceId).toBe(student.serviceId);
      expect(migrated.name).toBe(student.name);
      expect(migrated.attempted).toBe(student.attempted);
      expect(migrated.correct).toBe(student.correct);
      expect(migrated.pages).toEqual(student.pages);
      expect(migrated.release).toBe(student.release);
    });

    it('should not modify already current schema', () => {
      const student = createV2Student();
      const result = migrateToV2(student);
      expect(result).toEqual(student);
    });
  });

  describe('completePinSetup', () => {
    it('should set pinHash', () => {
      const student = createV1Student();
      const pinHash = 'newHashValue';
      const result = completePinSetup(student, pinHash);
      expect(result.pinHash).toBe(pinHash);
    });

    it('should set pinCreatedAt to current timestamp', () => {
      const student = createV1Student();
      const before = new Date().toISOString();
      const result = completePinSetup(student, 'hash');
      const after = new Date().toISOString();

      expect(result.pinCreatedAt).toBeDefined();
      expect(result.pinCreatedAt! >= before).toBe(true);
      expect(result.pinCreatedAt! <= after).toBe(true);
    });

    it('should update schema to current version', () => {
      const student = createV1Student();
      const result = completePinSetup(student, 'hash');
      expect(result.schema).toBe(SCHEMA_VERSION);
    });

    it('should preserve existing data', () => {
      const student = createV1Student();
      const result = completePinSetup(student, 'hash');

      expect(result.serviceId).toBe(student.serviceId);
      expect(result.attempted).toBe(student.attempted);
      expect(result.pages).toEqual(student.pages);
    });
  });

  describe('resetPin', () => {
    it('should clear pinHash', () => {
      const student = createV2Student();
      const result = resetPin(student);
      expect(result.pinHash).toBe('');
    });

    it('should set pinResetAt timestamp', () => {
      const student = createV2Student();
      const before = new Date().toISOString();
      const result = resetPin(student);
      const after = new Date().toISOString();

      expect(result.pinResetAt).toBeDefined();
      expect(result.pinResetAt! >= before).toBe(true);
      expect(result.pinResetAt! <= after).toBe(true);
    });

    it('should preserve other student data', () => {
      const student = createV2Student();
      const result = resetPin(student);

      expect(result.serviceId).toBe(student.serviceId);
      expect(result.name).toBe(student.name);
      expect(result.attempted).toBe(student.attempted);
      expect(result.pages).toEqual(student.pages);
      expect(result.pinCreatedAt).toBe(student.pinCreatedAt);
    });
  });
});
