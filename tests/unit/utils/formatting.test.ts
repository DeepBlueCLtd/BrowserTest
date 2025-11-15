/**
 * Unit tests for formatting utilities
 */

import { describe, it, expect } from 'vitest';
import { maskServiceId, formatServiceId } from '../../../src/utils/formatting';

describe('maskServiceId', () => {
  describe('standard service IDs (> 3 characters)', () => {
    it('should mask service ID showing only last 3 digits', () => {
      expect(maskServiceId('RN2344')).toBe('***344');
    });

    it('should handle alphanumeric service IDs', () => {
      expect(maskServiceId('ABC123')).toBe('***123');
      expect(maskServiceId('XYZ789')).toBe('***789');
    });

    it('should handle longer service IDs', () => {
      expect(maskServiceId('SERVICE123456')).toBe('***456');
    });

    it('should handle 4-character service IDs', () => {
      expect(maskServiceId('ABCD')).toBe('***BCD');
    });
  });

  describe('short service IDs (<= 3 characters)', () => {
    it('should show all characters for 3-character service ID', () => {
      expect(maskServiceId('ABC')).toBe('***ABC');
    });

    it('should show all characters for 2-character service ID', () => {
      expect(maskServiceId('AB')).toBe('***AB');
    });

    it('should show all characters for 1-character service ID', () => {
      expect(maskServiceId('A')).toBe('***A');
    });

    it('should handle numeric short IDs', () => {
      expect(maskServiceId('123')).toBe('***123');
      expect(maskServiceId('12')).toBe('***12');
      expect(maskServiceId('1')).toBe('***1');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(maskServiceId('')).toBe('***');
    });

    it('should handle service IDs with special characters', () => {
      expect(maskServiceId('RN-2344')).toBe('***344');
      expect(maskServiceId('AB_CD')).toBe('***_CD');
    });

    it('should preserve case in last 3 characters', () => {
      expect(maskServiceId('RNabc')).toBe('***abc');
      expect(maskServiceId('RNABC')).toBe('***ABC');
    });
  });
});

describe('formatServiceId', () => {
  describe('instructor mode', () => {
    it('should show full service ID when isInstructor is true', () => {
      expect(formatServiceId('RN2344', true)).toBe('RN2344');
    });

    it('should show full service ID for any length when isInstructor is true', () => {
      expect(formatServiceId('A', true)).toBe('A');
      expect(formatServiceId('AB', true)).toBe('AB');
      expect(formatServiceId('ABC', true)).toBe('ABC');
      expect(formatServiceId('ABCD', true)).toBe('ABCD');
      expect(formatServiceId('SERVICE123456', true)).toBe('SERVICE123456');
    });

    it('should show empty string as-is for instructors', () => {
      expect(formatServiceId('', true)).toBe('');
    });
  });

  describe('non-instructor mode', () => {
    it('should mask service ID when isInstructor is false', () => {
      expect(formatServiceId('RN2344', false)).toBe('***344');
    });

    it('should mask various length service IDs for non-instructors', () => {
      expect(formatServiceId('A', false)).toBe('***A');
      expect(formatServiceId('AB', false)).toBe('***AB');
      expect(formatServiceId('ABC', false)).toBe('***ABC');
      expect(formatServiceId('ABCD', false)).toBe('***BCD');
      expect(formatServiceId('SERVICE123456', false)).toBe('***456');
    });

    it('should handle empty string for non-instructors', () => {
      expect(formatServiceId('', false)).toBe('***');
    });
  });

  describe('privacy protection', () => {
    it('should hide majority of characters for long service IDs in non-instructor mode', () => {
      const serviceId = 'VERYLONGSERVICEID123';
      const masked = formatServiceId(serviceId, false);

      // Should only show last 3 characters
      expect(masked).toBe('***123');
      expect(masked.length).toBeLessThan(serviceId.length);
    });

    it('should provide consistent masking pattern', () => {
      // All masked IDs should start with ***
      expect(formatServiceId('RN2344', false)).toMatch(/^\*\*\*/);
      expect(formatServiceId('ABC123', false)).toMatch(/^\*\*\*/);
      expect(formatServiceId('XYZ', false)).toMatch(/^\*\*\*/);
    });
  });
});
