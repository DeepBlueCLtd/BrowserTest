/**
 * Unit tests for shared instructor-password authentication (T016).
 *
 * Covers SHA-256 + 12-char-truncation hashing and verification against the
 * configured hash element (FR-008).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  hashPassword,
  getExpectedInstructorHash,
  verifyInstructorPassword,
} from '../../src/services/auth/instructor-auth.js';
import { CONFIG_IDS } from '../../src/config/dom-config-reader.js';

function setConfiguredHash(value: string | null): void {
  const existing = document.getElementById(CONFIG_IDS.instructorHash);
  existing?.remove();
  if (value === null) return;
  const span = document.createElement('span');
  span.id = CONFIG_IDS.instructorHash;
  span.textContent = value;
  document.body.appendChild(span);
}

describe('instructor-auth', () => {
  afterEach(() => {
    setConfiguredHash(null);
  });

  describe('hashPassword', () => {
    it('returns a 12-character hex digest', async () => {
      const hash = await hashPassword('secret');
      expect(hash).toMatch(/^[0-9a-f]{12}$/);
    });

    it('is deterministic for the same input', async () => {
      expect(await hashPassword('secret')).toBe(await hashPassword('secret'));
    });

    it('differs for different inputs', async () => {
      expect(await hashPassword('secret')).not.toBe(await hashPassword('other'));
    });

    it('matches the first 12 chars of the full SHA-256 of "secret"', async () => {
      // Known SHA-256("secret") = 2bb80d537b1da3e3...
      expect(await hashPassword('secret')).toBe('2bb80d537b1d');
    });
  });

  describe('getExpectedInstructorHash', () => {
    it('returns the trimmed configured hash', () => {
      setConfiguredHash('  abc123def456  ');
      expect(getExpectedInstructorHash()).toBe('abc123def456');
    });

    it('returns empty string when the element is missing', () => {
      setConfiguredHash(null);
      expect(getExpectedInstructorHash()).toBe('');
    });
  });

  describe('verifyInstructorPassword', () => {
    beforeEach(() => {
      setConfiguredHash(null);
    });

    it('returns true when the password matches the configured hash', async () => {
      setConfiguredHash(await hashPassword('letmein'));
      expect(await verifyInstructorPassword('letmein')).toBe(true);
    });

    it('returns false when the password does not match', async () => {
      setConfiguredHash(await hashPassword('letmein'));
      expect(await verifyInstructorPassword('wrong')).toBe(false);
    });

    it('returns false when no hash is configured', async () => {
      setConfiguredHash(null);
      expect(await verifyInstructorPassword('anything')).toBe(false);
    });
  });
});
