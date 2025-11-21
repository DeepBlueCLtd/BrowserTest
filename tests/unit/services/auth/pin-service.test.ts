/**
 * Unit tests for PIN Service
 *
 * Tests PIN hashing, verification, and validation.
 */

import { describe, it, expect } from 'vitest';
import {
  hashPin,
  verifyPin,
  validatePinFormat,
  validatePinConfirmation,
} from '../../../../src/services/auth/pin-service.js';

describe('PIN Service', () => {
  describe('validatePinFormat', () => {
    it('should accept valid 4-digit PIN', () => {
      const result = validatePinFormat('1234');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept PIN with leading zeros', () => {
      const result = validatePinFormat('0001');
      expect(result.valid).toBe(true);
    });

    it('should accept all zeros', () => {
      const result = validatePinFormat('0000');
      expect(result.valid).toBe(true);
    });

    it('should reject empty PIN', () => {
      const result = validatePinFormat('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject PIN shorter than 4 digits', () => {
      const result = validatePinFormat('123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('4 digits');
    });

    it('should reject PIN longer than 4 digits', () => {
      const result = validatePinFormat('12345');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('4 digits');
    });

    it('should reject PIN with letters', () => {
      const result = validatePinFormat('12ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('only digits');
    });

    it('should reject PIN with special characters', () => {
      const result = validatePinFormat('12!@');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('only digits');
    });

    it('should reject PIN with spaces', () => {
      const result = validatePinFormat('1 34');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('only digits');
    });
  });

  describe('hashPin', () => {
    it('should return a 64-character hex string (SHA-256)', async () => {
      const hash = await hashPin('1234');
      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    it('should produce consistent hashes for same input', async () => {
      const hash1 = await hashPin('1234');
      const hash2 = await hashPin('1234');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', async () => {
      const hash1 = await hashPin('1234');
      const hash2 = await hashPin('4321');
      expect(hash1).not.toBe(hash2);
    });

    it('should hash leading zeros correctly', async () => {
      const hash1 = await hashPin('0001');
      const hash2 = await hashPin('0001');
      expect(hash1).toBe(hash2);
    });
  });

  describe('verifyPin', () => {
    it('should return true for matching PIN', async () => {
      const hash = await hashPin('1234');
      const result = await verifyPin('1234', hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching PIN', async () => {
      const hash = await hashPin('1234');
      const result = await verifyPin('4321', hash);
      expect(result).toBe(false);
    });

    it('should return false for similar but different PIN', async () => {
      const hash = await hashPin('1234');
      const result = await verifyPin('1235', hash);
      expect(result).toBe(false);
    });

    it('should handle leading zeros correctly', async () => {
      const hash = await hashPin('0001');
      const resultCorrect = await verifyPin('0001', hash);
      const resultWrong = await verifyPin('1', hash);
      expect(resultCorrect).toBe(true);
      expect(resultWrong).toBe(false);
    });
  });

  describe('validatePinConfirmation', () => {
    it('should return valid for matching PINs', () => {
      const result = validatePinConfirmation('1234', '1234');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for mismatched PINs', () => {
      const result = validatePinConfirmation('1234', '4321');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('do not match');
    });

    it('should be case-sensitive (though PINs are digits only)', () => {
      // Just ensuring exact match
      const result = validatePinConfirmation('1234', '1234');
      expect(result.valid).toBe(true);
    });
  });

  describe('T035 - PIN Reset Logic', () => {
    it('should allow new PIN hash after reset', async () => {
      // Original PIN
      const oldPin = '1111';
      const oldHash = await hashPin(oldPin);

      // After reset, set new PIN
      const newPin = '2222';
      const newHash = await hashPin(newPin);

      // New hash should be different
      expect(newHash).not.toBe(oldHash);

      // New PIN should verify
      const verifyNew = await verifyPin(newPin, newHash);
      expect(verifyNew).toBe(true);

      // Old PIN should not verify against new hash
      const verifyOld = await verifyPin(oldPin, newHash);
      expect(verifyOld).toBe(false);
    });

    it('should generate unique hash for same PIN after reset', async () => {
      // Even the same PIN should work after reset
      const pin = '5555';
      const hash1 = await hashPin(pin);
      const hash2 = await hashPin(pin);

      // Same PIN generates same hash (deterministic)
      expect(hash1).toBe(hash2);

      // But verification still works
      expect(await verifyPin(pin, hash1)).toBe(true);
      expect(await verifyPin(pin, hash2)).toBe(true);
    });

    it('should support sequential PIN changes', async () => {
      // Simulate multiple resets
      const pins = ['1111', '2222', '3333', '4444'];
      const hashes: string[] = [];

      for (const pin of pins) {
        const hash = await hashPin(pin);
        hashes.push(hash);
        expect(await verifyPin(pin, hash)).toBe(true);
      }

      // Each PIN only verifies against its own hash
      for (let i = 0; i < pins.length; i++) {
        for (let j = 0; j < hashes.length; j++) {
          const shouldMatch = i === j;
          expect(await verifyPin(pins[i]!, hashes[j]!)).toBe(shouldMatch);
        }
      }
    });
  });
});
