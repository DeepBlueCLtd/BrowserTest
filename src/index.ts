/**
 * Sonar Quiz System - Entry Point
 *
 * Offline-first interactive quiz and analysis platform for DITA-published content.
 *
 * @packageDocumentation
 */

import { bootstrap } from './init/bootstrap.js';
import { info } from './utils/logger.js';
import { readDOMConfig } from './config/dom-config-reader.js';

// Export quiz table enhancer (Phase 2.1)
export {
  enhanceQuizTable,
  getQuizTableMetadata,
  isQuizTableEnhanced,
} from './enhancers/quiz-table.js';
export type { EnhanceQuizTableOptions } from './enhancers/quiz-table.js';

// Export analysis table enhancer (Phase 2.2)
export {
  enhanceAnalysisTable,
  getAnalysisTableMetadata,
  isAnalysisTableEnhanced,
} from './enhancers/analysis-table.js';
export type { EnhanceAnalysisTableOptions } from './enhancers/analysis-table.js';

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
export { parseQuizTable, validateAnswer } from './services/quiz-parser.js';
export {
  parseAnalysisTable,
  generateTableId,
  generateCellKey,
  isCellEditable,
} from './services/analysis-parser.js';
export { calculateCompletionState } from './services/state-calculator.js';

// Export utilities
export { Debouncer } from './utils/debouncer.js';
export { getJSON, setJSON, clearQuizData } from './utils/storage-helpers.js';
export { info, warn, error } from './utils/logger.js';

// Export obfuscation utilities for console access
export { migrateObfuscation } from './services/storage/obfuscation-migration.js';
export type {
  ObfuscationMigrationResult,
  ObfuscationMigrationDirection,
  ObfuscationMigrationOptions,
} from './services/storage/obfuscation-migration.js';
export {
  deriveKey,
  encode,
  decode,
  isObfuscated,
  OBFUSCATION_PREFIX,
} from './services/storage/obfuscation.js';
export type { ObfuscatedString } from './services/storage/obfuscation.js';

// Export bootstrap (Phase 3)
export { bootstrap, cleanup, isInitialized } from './init/bootstrap.js';
export type { BootstrapConfig } from './init/bootstrap.js';

// Export component injector
export { injectComponents, DEFAULT_CONTAINERS } from './init/component-injector.js';
export type { ComponentInjectorConfig } from './init/component-injector.js';

/**
 * Version information
 */
export const VERSION = '0.1.0-phase3.1';
export const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'development';

// Declare global for build date injection
declare const __BUILD_DATE__: string;

/**
 * Auto-initialize on DOMContentLoaded
 *
 * System always initializes when script loads. Configuration is read from
 * hidden DOM elements injected by DITA publishing (see dom-config-reader.ts).
 */
if (typeof window !== 'undefined') {
  const init = () => {
    info('Auto-initializing Sonar Quiz System');

    // Read configuration from hidden DOM elements
    const domConfig = readDOMConfig();

    // Bootstrap with DOM config
    bootstrap({
      dbName: domConfig.dbName,
      statusPanelContainer: domConfig.statusPanelContainer,
      autoEnhanceQuizTables: true,
      autoEnhanceAnalysisTables: true,
      autoEnhanceHomeBadges: true,
    }).catch((err) => {
      console.error('[FATAL] Bootstrap failed:', err);
    });
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void init());
  } else {
    // DOM already loaded
    void init();
  }
}
