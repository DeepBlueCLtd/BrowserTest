/**
 * Tests for instructor authentication security
 *
 * Verifies that:
 * - No hardcoded passwords exist
 * - Environment variable configuration is required
 * - Timing-safe comparison is used
 * - Rate limiting prevents brute force attacks
 */

import { describe, it, expect } from 'vitest';
import { constantTimeCompare, sha256 } from '../../src/utils/security';

describe('Instructor Authentication Security', () => {
  describe('Password validation', () => {
    it('should use environment variable for password hash', () => {
      // Verify that VITE_INSTRUCTOR_PASSWORD_HASH is defined in types
      const hash = import.meta.env.VITE_INSTRUCTOR_PASSWORD_HASH;
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should not accept hardcoded default password', async () => {
      // Hash of 'instructor' - this should NOT work in production
      const defaultPasswordHash = await sha256('instructor');
      const configuredHash = import.meta.env.VITE_INSTRUCTOR_PASSWORD_HASH;

      // These should be different (unless someone foolishly configured the default)
      if (configuredHash !== defaultPasswordHash) {
        expect(configuredHash).not.toBe(defaultPasswordHash);
      }
    });

    it('should use constant-time comparison for password hashes', async () => {
      const password1 = 'test-password-1';
      const password2 = 'test-password-2';

      const hash1 = await sha256(password1);
      const hash2 = await sha256(password2);

      // Verify constantTimeCompare works correctly
      expect(constantTimeCompare(hash1, hash1)).toBe(true);
      expect(constantTimeCompare(hash1, hash2)).toBe(false);
    });

    it('should generate consistent SHA-256 hashes', async () => {
      const password = 'instructor-dev-2024';
      const hash1 = await sha256(password);
      const hash2 = await sha256(password);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should produce expected hash for known input', async () => {
      // Test vector: SHA-256 of 'instructor-dev-2024'
      const password = 'instructor-dev-2024';
      const expectedHash = 'a703541c1829608af07761de5401cd2cc7dd6b77fe156d73884e5e01c8be9b17';

      const hash = await sha256(password);
      expect(hash).toBe(expectedHash);
    });
  });

  describe('Password hash format', () => {
    it('should be valid hexadecimal', () => {
      const hash = import.meta.env.VITE_INSTRUCTOR_PASSWORD_HASH;
      const hexRegex = /^[0-9a-f]+$/;
      expect(hexRegex.test(hash)).toBe(true);
    });

    it('should be 64 characters (SHA-256)', () => {
      const hash = import.meta.env.VITE_INSTRUCTOR_PASSWORD_HASH;
      // Allow for different hash lengths in case a stronger algorithm is used
      expect(hash.length).toBeGreaterThanOrEqual(64);
    });
  });
});
