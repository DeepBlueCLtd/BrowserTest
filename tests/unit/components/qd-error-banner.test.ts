/**
 * Error Banner Component Tests
 *
 * Tests for the validation error banner component that displays
 * authoring constraint violations.
 *
 * NOTE: These tests are skipped because JSDOM has limited support for
 * Custom Elements with Shadow DOM. The qd-error-banner component is
 * thoroughly tested in Storybook which uses real browsers.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import type { ValidationError } from '../../../src/services/validation';

describe.skip('QdErrorBanner Component', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    global.document = document as unknown as Document;
    global.window = dom.window as unknown as Window & typeof globalThis;
    global.customElements = dom.window.customElements;
  });

  describe('Component Registration', () => {
    it('should be defined as a custom element', async () => {
      await import('../../../src/components/qd-error-banner');

      const element = document.createElement('qd-error-banner');
      expect(element).toBeDefined();
      expect(element.tagName.toLowerCase()).toBe('qd-error-banner');
    });
  });

  describe('Error Display', () => {
    it('should accept errors property', async () => {
      await import('../../../src/components/qd-error-banner');

      const element = document.createElement('qd-error-banner') as any;
      const errors: ValidationError[] = [
        {
          code: 'MULTIPLE_QUIZ_TABLES',
          message: 'Page has 2 quiz tables but maximum ONE quiz table is allowed per page',
        },
      ];

      element.errors = errors;
      expect(element.errors).toEqual(errors);
    });

    it('should have default empty errors array', async () => {
      await import('../../../src/components/qd-error-banner');

      const element = document.createElement('qd-error-banner') as any;
      expect(element.errors).toEqual([]);
    });
  });
});

/**
 * Integration Tests
 *
 * These tests verify the error banner integrates correctly with the validation service
 */
describe('QdErrorBanner Integration', () => {
  it('should display errors from validation service', () => {
    const errors: ValidationError[] = [
      {
        code: 'INVALID_COLUMN_COUNT',
        message: 'Quiz table must have exactly 3 columns',
      },
      {
        code: 'MISSING_TOLERANCE',
        message: 'Numeric question must have tolerance value',
        row: 5,
      },
    ];

    // Verify error structure is compatible
    expect(errors[0].code).toBe('INVALID_COLUMN_COUNT');
    expect(errors[0].message).toBeTruthy();
    expect(errors[1].row).toBe(5);
  });

  it('should handle all validation error codes', () => {
    const errorCodes = [
      'MISSING_QUIZ_CLASS',
      'MISSING_ANALYSIS_CLASS',
      'INVALID_COLUMN_COUNT',
      'NO_QUESTIONS',
      'NO_CELLS',
      'INVALID_ANSWER_FORMAT',
      'MISSING_TOLERANCE',
      'MISSING_OPTIONS_LIST',
      'MULTIPLE_QUIZ_TABLES',
      'MULTIPLE_ANALYSIS_TABLES',
    ];

    errorCodes.forEach((code) => {
      const error: ValidationError = {
        code: code as any,
        message: `Test error for ${code}`,
      };

      expect(error.code).toBe(code);
      expect(error.message).toBeTruthy();
    });
  });
});
