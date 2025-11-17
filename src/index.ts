/**
 * Sonar Quiz System - Entry Point
 *
 * Minimal entry point for Phase 2.1 (Quiz Table Enhancement)
 * Full bootstrap/initialization will be added in Phase 3.
 */

// Export quiz table enhancer (Phase 2.1)
export { enhanceQuizTable, getQuizTableMetadata, isQuizTableEnhanced } from './enhancers/quiz-table.js';
export type { EnhanceQuizTableOptions } from './enhancers/quiz-table.js';

// Export types
export type {
  ParsedQuizTable,
  QuizQuestion,
  AnswerRecord,
  CompletionState,
  PageId,
  SessionData,
  SessionCache,
  StudentRecord,
  PageData,
  ReleaseId,
  ServiceId,
  TableId,
  CellKey,
  QuestionKind,
} from './types/contracts.js';

// Export constants
export { STORAGE_KEYS, SCHEMA_VERSION, SESSION_TIMEOUT_MS } from './types/contracts.js';

// Export services
export { parseQuizTable } from './services/quiz-parser.js';
export { validateAnswer } from './services/quiz-parser.js';
export { calculateCompletionState } from './services/state-calculator.js';

// Export utilities
export { Debouncer } from './utils/debouncer.js';
export { getJSON, setJSON, clearQuizData } from './utils/storage-helpers.js';
export { info, warn, error } from './utils/logger.js';

/**
 * Version information
 */
export const VERSION = '0.1.0-phase2.1';
export const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'development';

// Declare global for build date injection
declare const __BUILD_DATE__: string;
