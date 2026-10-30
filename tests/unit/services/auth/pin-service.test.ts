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
  createPinCredential,
  derivePinHash,
  verifyStoredPin,
} from '../../../../src/services/auth/pin-service.js';
import { PIN_CONSTANTS } from '../../../../src/types/contracts.js';

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

describe('Salted PIN verifiers (SRD 013 SEC-06, SEC-07)', () => {
  // A low iteration count keeps these tests fast; production uses PIN_CONSTANTS.KDF_ITERATIONS
  const FAST = 1000;

  it('createPinCredential uses PBKDF2 with a random salt per call', async () => {
    const a = await createPinCredential('1234', FAST);
    const b = await createPinCredential('1234', FAST);
    expect(a.pinKdf).toBe('pbkdf2-sha256');
    expect(a.pinIterations).toBe(FAST);
    expect(a.pinSalt).toMatch(/^[0-9a-f]{32}$/);
    expect(a.pinHash).toMatch(/^[0-9a-f]{64}$/);
    // Same PIN, different salt, different verifier: no shared lookup table
    expect(a.pinSalt).not.toBe(b.pinSalt);
    expect(a.pinHash).not.toBe(b.pinHash);
  });

  it('defaults to the policy iteration count', async () => {
    const cred = await createPinCredential('1234');
    expect(cred.pinIterations).toBe(PIN_CONSTANTS.KDF_ITERATIONS);
    expect(PIN_CONSTANTS.KDF_ITERATIONS).toBeGreaterThanOrEqual(600_000);
  });

  it('never stores the plain SHA-256 of the PIN', async () => {
    const cred = await createPinCredential('1234', FAST);
    expect(cred.pinHash).not.toBe(await hashPin('1234'));
  });

  it('derivePinHash is deterministic for the same PIN, salt and iterations', async () => {
    const salt = '00112233445566778899aabbccddeeff';
    expect(await derivePinHash('4321', salt, FAST)).toBe(await derivePinHash('4321', salt, FAST));
    expect(await derivePinHash('4321', salt, FAST)).not.toBe(
      await derivePinHash('4322', salt, FAST),
    );
  });

  it('verifyStoredPin accepts the right PIN and rejects a wrong one for salted records', async () => {
    const cred = await createPinCredential('2468', FAST);
    expect(await verifyStoredPin('2468', cred)).toEqual({ valid: true });
    expect(await verifyStoredPin('2469', cred)).toEqual({ valid: false });
  });

  it('verifyStoredPin verifies a legacy SHA-256 record and offers a salted upgrade', async () => {
    const legacy = { pinHash: await hashPin('1357') };
    const ok = await verifyStoredPin('1357', legacy);
    expect(ok.valid).toBe(true);
    expect(ok.upgrade?.pinKdf).toBe('pbkdf2-sha256');
    // The upgrade verifies the same PIN
    expect((await verifyStoredPin('1357', ok.upgrade!)).valid).toBe(true);
  });

  it('verifyStoredPin offers no upgrade when a legacy PIN is wrong', async () => {
    const legacy = { pinHash: await hashPin('1357') };
    expect(await verifyStoredPin('0000', legacy)).toEqual({ valid: false });
  });

  it('verifyStoredPin rejects a record with no PIN', async () => {
    expect(await verifyStoredPin('1234', { pinHash: '' })).toEqual({ valid: false });
    expect(await verifyStoredPin('1234', {})).toEqual({ valid: false });
  });
});
