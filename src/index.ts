/**
 * Sonar Quiz System - Entry Point
 *
 * Offline-first interactive quiz and analysis platform for DITA-published content.
 *
 * @packageDocumentation
 */

import { bootstrap } from './init/bootstrap.js';
import { info } from './utils/logger.js';

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
 * Auto-initialize on DOMContentLoaded if script tag has data-sonar-quiz attribute
 */
if (typeof window !== 'undefined') {
  // Check for data-sonar-quiz attribute on script tag
  const scripts = document.querySelectorAll('script[data-sonar-quiz]');

  if (scripts.length > 0) {
    const scriptEl = scripts[0] as HTMLScriptElement;

    // Read configuration from data attributes
    const debug = scriptEl.getAttribute('data-debug') === 'true';
    const dbName = scriptEl.getAttribute('data-db-name') || 'SonarQuizDB';
    const statusPanelContainer = scriptEl.getAttribute('data-status-panel-container');

    // Auto-initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        info('Auto-initializing Sonar Quiz System from script tag');
        bootstrap({
          debug,
          dbName,
          statusPanelContainer: statusPanelContainer || undefined,
          autoEnhanceQuizTables: true,
          autoEnhanceAnalysisTables: true,
          autoEnhanceHomeBadges: true,
        });
      });
    } else {
      // DOM already loaded
      info('Auto-initializing Sonar Quiz System (DOM already loaded)');
      bootstrap({
        debug,
        dbName,
        statusPanelContainer: statusPanelContainer || undefined,
        autoEnhanceQuizTables: true,
        autoEnhanceAnalysisTables: true,
        autoEnhanceHomeBadges: true,
      });
    }
  }
}
