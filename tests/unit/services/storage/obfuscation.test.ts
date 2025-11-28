/**
 * Unit Tests: Obfuscation Utilities
 *
 * Tests for the XOR-based obfuscation layer.
 * TDD: Write tests first, verify they fail, then implement.
 */

import { describe, it, expect } from 'vitest';
import {
  deriveKey,
  xorString,
  encode,
  decode,
  isObfuscated,
  OBFUSCATION_PREFIX,
  type ObfuscatedString,
} from '../../../../src/services/storage/obfuscation.js';

describe('obfuscation utilities', () => {
  // T004: deriveKey tests
  describe('deriveKey', () => {
    it('should return a non-empty string for valid release ID', () => {
      const key = deriveKey('TRV Connectors Autumn 2025');
      expect(key).toBeTruthy();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('should return consistent key for same input', () => {
      const key1 = deriveKey('Release 1.0');
      const key2 = deriveKey('Release 1.0');
      expect(key1).toBe(key2);
    });

    it('should return different keys for different inputs', () => {
      const key1 = deriveKey('Release 1.0');
      const key2 = deriveKey('Release 2.0');
      expect(key1).not.toBe(key2);
    });

    it('should handle empty string gracefully', () => {
      const key = deriveKey('');
      expect(typeof key).toBe('string');
    });
  });

  // T005: xorString tests
  describe('xorString', () => {
    it('should XOR a string with a key', () => {
      const input = 'Hello';
      const key = 'KEY';
      const result = xorString(input, key);
      expect(result).not.toBe(input);
      expect(result.length).toBe(input.length);
    });

    it('should be symmetric (XOR twice = original)', () => {
      const input = 'Test Data 123';
      const key = 'secretkey';
      const xored = xorString(input, key);
      const restored = xorString(xored, key);
      expect(restored).toBe(input);
    });

    it('should handle empty input', () => {
      const result = xorString('', 'key');
      expect(result).toBe('');
    });

    it('should handle key shorter than input (cycles)', () => {
      const input = 'ABCDEFGHIJKLMNOP';
      const key = 'XY';
      const result = xorString(input, key);
      expect(result.length).toBe(input.length);
      // XOR with cycling key should still be reversible
      expect(xorString(result, key)).toBe(input);
    });

    it('should handle key longer than input', () => {
      const input = 'AB';
      const key = 'VERYLONGKEY';
      const result = xorString(input, key);
      expect(result.length).toBe(input.length);
      expect(xorString(result, key)).toBe(input);
    });
  });

  // T006: encode tests
  describe('encode', () => {
    it('should return string starting with OBF: prefix', () => {
      const data = { name: 'Alice', score: 100 };
      const key = deriveKey('Test Release');
      const encoded = encode(data, key);
      expect(encoded.startsWith(OBFUSCATION_PREFIX)).toBe(true);
    });

    it('should return valid base64 after prefix', () => {
      const data = { test: 'value' };
      const key = deriveKey('Release');
      const encoded = encode(data, key);
      const base64Part = encoded.slice(OBFUSCATION_PREFIX.length);
      // Valid base64 should not throw when decoded
      expect(() => atob(base64Part)).not.toThrow();
    });

    it('should produce different output for different data', () => {
      const key = deriveKey('Release');
      const encoded1 = encode({ a: 1 }, key);
      const encoded2 = encode({ a: 2 }, key);
      expect(encoded1).not.toBe(encoded2);
    });

    it('should produce different output for different keys', () => {
      const data = { same: 'data' };
      const encoded1 = encode(data, deriveKey('Key1'));
      const encoded2 = encode(data, deriveKey('Key2'));
      expect(encoded1).not.toBe(encoded2);
    });
  });

  // T007: decode tests
  describe('decode', () => {
    it('should decode what encode produced', () => {
      const original = { name: 'Bob', score: 42, nested: { value: true } };
      const key = deriveKey('My Release');
      const encoded = encode(original, key);
      const decoded = decode<typeof original>(encoded, key);
      expect(decoded).toEqual(original);
    });

    it('should preserve all JSON types', () => {
      const original = {
        string: 'text',
        number: 123.45,
        boolean: true,
        nullVal: null,
        array: [1, 2, 3],
        nested: { deep: { value: 'found' } },
      };
      const key = deriveKey('Release');
      const encoded = encode(original, key);
      const decoded = decode<typeof original>(encoded, key);
      expect(decoded).toEqual(original);
    });

    it('should handle Unicode characters', () => {
      const original = { emoji: '🎉', chinese: '你好', arabic: 'مرحبا' };
      const key = deriveKey('Unicode Release');
      const encoded = encode(original, key);
      const decoded = decode<typeof original>(encoded, key);
      expect(decoded).toEqual(original);
    });

    it('should handle empty object', () => {
      const original = {};
      const key = deriveKey('Release');
      const encoded = encode(original, key);
      const decoded = decode<typeof original>(encoded, key);
      expect(decoded).toEqual(original);
    });
  });

  // T008: isObfuscated tests
  describe('isObfuscated', () => {
    it('should return true for OBF: prefixed strings', () => {
      expect(isObfuscated('OBF:abc123')).toBe(true);
      expect(isObfuscated('OBF:')).toBe(true);
    });

    it('should return false for plain objects', () => {
      expect(isObfuscated({ name: 'test' })).toBe(false);
    });

    it('should return false for non-OBF strings', () => {
      expect(isObfuscated('plain string')).toBe(false);
      expect(isObfuscated('obf:lowercase')).toBe(false);
      expect(isObfuscated('OBFmissingcolon')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isObfuscated(null)).toBe(false);
      expect(isObfuscated(undefined)).toBe(false);
    });

    it('should return false for numbers and arrays', () => {
      expect(isObfuscated(123)).toBe(false);
      expect(isObfuscated(['OBF:fake'])).toBe(false);
    });

    it('should work as type guard', () => {
      const value: unknown = 'OBF:test';
      if (isObfuscated(value)) {
        // TypeScript should recognize value as ObfuscatedString here
        const typed: ObfuscatedString = value;
        expect(typed.startsWith('OBF:')).toBe(true);
      }
    });
  });

  // T009: Tamper detection tests
  describe('decode with corrupted data', () => {
    it('should throw for invalid base64', () => {
      const invalidEncoded = 'OBF:not-valid-base64!!!' as ObfuscatedString;
      const key = deriveKey('Release');
      expect(() => decode(invalidEncoded, key)).toThrow();
    });

    it('should throw or return wrong data for tampered payload', () => {
      const original = { name: 'Alice', id: 12345 };
      const key = deriveKey('Release');
      const encoded = encode(original, key);

      // Tamper with the base64 payload significantly
      const base64Part = encoded.slice(OBFUSCATION_PREFIX.length);
      // Reverse a chunk to ensure corruption
      const tampered = `${OBFUSCATION_PREFIX}AAAA${base64Part.slice(4)}` as ObfuscatedString;

      // Tampering should either throw or return different data
      // (XOR corruption typically produces invalid JSON)
      try {
        const decoded = decode<typeof original>(tampered, key);
        // If it doesn't throw, the data should NOT match original
        expect(decoded).not.toEqual(original);
      } catch {
        // Expected - tampered data usually fails JSON parse
        expect(true).toBe(true);
      }
    });

    it('should throw when decoded with wrong key', () => {
      const original = { secret: 'data' };
      const correctKey = deriveKey('Correct Release');
      const wrongKey = deriveKey('Wrong Release');

      const encoded = encode(original, correctKey);

      // Decoding with wrong key should produce garbage that fails JSON parse
      expect(() => decode(encoded, wrongKey)).toThrow();
    });

    it('should throw for empty payload after prefix', () => {
      const emptyPayload = 'OBF:' as ObfuscatedString;
      const key = deriveKey('Release');
      expect(() => decode(emptyPayload, key)).toThrow();
    });
  });
});
