/**
 * Tests for validation-helpers.ts
 *
 * Feature: 007-lit-component-refactor
 * TDD: These tests are written FIRST, before implementation.
 */
import { describe, it, expect } from 'vitest';
import {
  validateStudentForm,
  sanitizePinInput,
  validatePinMatch,
} from '../../../src/utils/validation-helpers';

describe('validation-helpers', () => {
  describe('validateStudentForm', () => {
    it('returns empty array for valid input', () => {
      const errors = validateStudentForm('John Doe', 'AB1234', '1234');
      expect(errors).toEqual([]);
    });

    it('returns error for empty name', () => {
      const errors = validateStudentForm('', 'AB1234', '1234');
      expect(errors).toContain('Name required');
    });

    it('returns error for whitespace-only name', () => {
      const errors = validateStudentForm('   ', 'AB1234', '1234');
      expect(errors).toContain('Name required');
    });

    it('returns error for empty service ID', () => {
      const errors = validateStudentForm('John', '', '1234');
      expect(errors).toContain('Service ID required');
    });

    it('returns error for service ID too short', () => {
      const errors = validateStudentForm('John', 'A', '1234');
      expect(errors).toContain('Service ID must be 2-10 alphanumeric characters');
    });

    it('returns error for service ID too long', () => {
      const errors = validateStudentForm('John', 'ABCDEFGHIJK', '1234');
      expect(errors).toContain('Service ID must be 2-10 alphanumeric characters');
    });

    it('returns error for service ID with special characters', () => {
      const errors = validateStudentForm('John', 'AB@123', '1234');
      expect(errors).toContain('Service ID must be 2-10 alphanumeric characters');
    });

    it('accepts valid service ID at min length (2)', () => {
      const errors = validateStudentForm('John', 'AB', '1234');
      expect(errors).toEqual([]);
    });

    it('accepts valid service ID at max length (10)', () => {
      const errors = validateStudentForm('John', 'ABCD123456', '1234');
      expect(errors).toEqual([]);
    });

    it('returns error for empty PIN', () => {
      const errors = validateStudentForm('John', 'AB1234', '');
      expect(errors).toContain('PIN required');
    });

    it('returns error for PIN too short', () => {
      const errors = validateStudentForm('John', 'AB1234', '123');
      expect(errors).toContain('PIN must be exactly 4 digits');
    });

    it('returns error for PIN too long', () => {
      const errors = validateStudentForm('John', 'AB1234', '12345');
      expect(errors).toContain('PIN must be exactly 4 digits');
    });

    it('returns error for PIN with non-digits', () => {
      const errors = validateStudentForm('John', 'AB1234', '12ab');
      expect(errors).toContain('PIN must be exactly 4 digits');
    });

    it('returns multiple errors for multiple issues', () => {
      const errors = validateStudentForm('', 'A', '12');
      expect(errors.length).toBe(3);
      expect(errors).toContain('Name required');
      expect(errors).toContain('Service ID must be 2-10 alphanumeric characters');
      expect(errors).toContain('PIN must be exactly 4 digits');
    });
  });

  describe('sanitizePinInput', () => {
    it('removes non-digit characters', () => {
      expect(sanitizePinInput('12a3b4')).toBe('1234');
    });

    it('returns empty string for all non-digits', () => {
      expect(sanitizePinInput('abcd')).toBe('');
    });

    it('preserves digits only', () => {
      expect(sanitizePinInput('1-2-3-4')).toBe('1234');
    });

    it('handles empty string', () => {
      expect(sanitizePinInput('')).toBe('');
    });

    it('handles spaces', () => {
      expect(sanitizePinInput('1 2 3 4')).toBe('1234');
    });

    it('preserves all digits from numeric input', () => {
      expect(sanitizePinInput('1234')).toBe('1234');
    });

    it('handles special characters', () => {
      expect(sanitizePinInput('!@#$1234%^&*')).toBe('1234');
    });
  });

  describe('validatePinMatch', () => {
    it('returns true when PINs match', () => {
      expect(validatePinMatch('1234', '1234')).toBe(true);
    });

    it('returns false when PINs do not match', () => {
      expect(validatePinMatch('1234', '5678')).toBe(false);
    });

    it('returns false when one PIN is empty', () => {
      expect(validatePinMatch('1234', '')).toBe(false);
    });

    it('returns true when both PINs are empty', () => {
      expect(validatePinMatch('', '')).toBe(true);
    });

    it('is case-sensitive for alphanumeric PINs', () => {
      expect(validatePinMatch('abcd', 'ABCD')).toBe(false);
    });
  });
});
