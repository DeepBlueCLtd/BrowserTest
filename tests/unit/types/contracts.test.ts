/**
 * Contracts Smoke Test - Phase 0
 *
 * Verifies that frozen type contracts are properly exported
 * and accessible for import.
 */

import { describe, it, expect } from 'vitest';
import * as contracts from '../../../src/types/contracts';

describe('Frozen Contracts - Phase 0', () => {
  it('should export all core type guards and constants', () => {
    // Verify constants are exported
    expect(contracts.SCHEMA_VERSION).toBe(1);
    expect(contracts.SESSION_TIMEOUT_MS).toBe(30 * 60 * 1000);
    expect(contracts.EVENT_NAMESPACE).toBe('qd');
  });

  it('should export STORAGE_KEYS constants', () => {
    expect(contracts.STORAGE_KEYS).toBeDefined();
    expect(contracts.STORAGE_KEYS.SESSION).toBe('qd/session');
    expect(contracts.STORAGE_KEYS.CACHE).toBe('qd/state');
    expect(contracts.STORAGE_KEYS.INSTRUCTOR).toBe('qd/instructor');
  });

  it('should export CSS_CLASSES constants', () => {
    expect(contracts.CSS_CLASSES).toBeDefined();
    expect(contracts.CSS_CLASSES.QUIZ_TABLE).toBe('qd-quiz');
    expect(contracts.CSS_CLASSES.PAGE_TABLE).toBe('qd-page');
    expect(contracts.CSS_CLASSES.ANALYSIS_TABLE).toBe('qd-analysis');
    expect(contracts.CSS_CLASSES.TEST_LINK).toBe('quizPageBtn');
  });

  it('should export ELEMENT_IDS constants', () => {
    expect(contracts.ELEMENT_IDS).toBeDefined();
    expect(contracts.ELEMENT_IDS.STATUS_PANEL).toBe('qd-status');
  });

  it('should export LIMITS constants', () => {
    expect(contracts.LIMITS).toBeDefined();
    expect(contracts.LIMITS.MAX_QUESTIONS_PER_PAGE).toBe(100);
    expect(contracts.LIMITS.MAX_CELL_CONTENT_LENGTH).toBe(500);
    expect(contracts.LIMITS.MAX_NAME_LENGTH).toBe(100);
    expect(contracts.LIMITS.MAX_SERVICE_ID_LENGTH).toBe(10);
  });
});
