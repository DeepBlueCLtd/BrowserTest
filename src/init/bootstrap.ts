/**
 * Bootstrap Module
 * Main initialization logic for the Sonar Quiz System
 */

import { info, warn } from '../utils/logger.js';
import { EventCoordinator } from './event-coordinator.js';
import { SessionCoordinator } from './session-coordinator.js';
import { injectComponents, type ComponentInjectorConfig } from './component-injector.js';
import { enhanceQuizTable, getQuizTableMetadata } from '../enhancers/quiz-table.js';
import { enhanceAnalysisTable } from '../enhancers/analysis-table.js';
import { enhanceHomeBadges } from '../enhancers/home-badges.js';
import { getStorageService } from '../services/storage-service.js';
import { getJSON, setJSON } from '../utils/storage-helpers.js';
import { STORAGE_KEYS, type SessionData, type SessionCache } from '../types/contracts.js';

/**
 * Inject global CSS styles required by the quiz system
 * Must be called before any table enhancement
 */
function injectGlobalStyles(): void {
  // Check if styles already injected
  if (document.getElementById('qd-global-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'qd-global-styles';
  style.textContent = `
    /* Sonar Quiz System - Global Styles */
    .qd-hidden {
      display: none !important;
    }

    /* Quiz table interactive mode styles */
    .qd-quiz-interactive .qd-quiz-input {
      width: 100%;
      padding: 0.5rem;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    /* Validation styling for answer cells */
    .qd-quiz-interactive .qd-answer-correct {
      background-color: #d4edda !important;
      border-color: #28a745 !important;
    }

    .qd-quiz-interactive .qd-answer-incorrect {
      background-color: #f8d7da !important;
      border-color: #dc3545 !important;
    }

    /* Home page badge styles (R/A/G indicators) */
    .qd-badge-red {
      border-left: 4px solid #d32f2f !important;
      background-color: #ffebee !important;
    }

    .qd-badge-amber {
      border-left: 4px solid #ff9800 !important;
      background-color: #fff3e0 !important;
    }

    .qd-badge-green {
      border-left: 4px solid #4caf50 !important;
      background-color: #e8f5e9 !important;
    }

    /* Instructor mode: Student answers display */
    .qd-student-answers {
      margin-top: 12px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #dee2e6;
    }

    .qd-student-answer {
      font-size: 12px;
      padding: 4px 0;
      line-height: 1.4;
    }

    .qd-student-answer.qd-correct {
      color: #28a745;
    }

    .qd-student-answer.qd-incorrect {
      color: #dc3545;
    }

    .qd-student-name {
      font-weight: 600;
    }

    .qd-student-answer-text {
      margin: 0 4px;
    }

    .qd-timestamp {
      color: #6c757d;
      font-size: 11px;
      margin-left: 8px;
    }
  `;

  document.head.appendChild(style);
  info('Global styles injected');
}

/**
 * Bootstrap configuration options
 */
export interface BootstrapConfig extends ComponentInjectorConfig {
  /** Auto-enhance quiz tables on init */
  autoEnhanceQuizTables?: boolean;
  /** Auto-enhance analysis tables on init */
  autoEnhanceAnalysisTables?: boolean;
  /** Auto-enhance home page badges on init */
  autoEnhanceHomeBadges?: boolean;
}

/**
 * Bootstrap state
 */
interface BootstrapState {
  initialized: boolean;
  eventCoordinator?: EventCoordinator;
  sessionCoordinator?: SessionCoordinator;
}

const state: BootstrapState = {
  initialized: false,
};

/**
 * Initialize the Sonar Quiz System
 *
 * @param config - Bootstrap configuration
 */
export async function bootstrap(config: BootstrapConfig = {}): Promise<void> {
  if (state.initialized) {
    warn('Bootstrap already initialized, skipping');
    return;
  }

  info('Bootstrapping Sonar Quiz System...');

  // 0. Inject required global styles
  injectGlobalStyles();

  // 1. Initialize storage service (IndexedDB)
  const dbName = config.dbName || 'BrowserTest';
  const storageService = getStorageService(dbName);
  await storageService.init();

  // 2. Initialize event coordinator
  const eventCoordinator = new EventCoordinator();
  eventCoordinator.initialize();
  state.eventCoordinator = eventCoordinator;

  // 3. Initialize session coordinator
  const sessionCoordinator = new SessionCoordinator();
  sessionCoordinator.initialize();
  state.sessionCoordinator = sessionCoordinator;

  // 4. Inject UI components
  injectComponents({
    statusPanelContainer: config.statusPanelContainer,
    storageMonitorContainer: config.storageMonitorContainer,
    dbName: config.dbName,
    debug: config.debug,
  });

  // 5. Auto-enhance tables if enabled
  if (config.autoEnhanceQuizTables !== false) {
    enhanceAllQuizTables();
  }

  if (config.autoEnhanceAnalysisTables !== false) {
    enhanceAllAnalysisTables();
  }

  if (config.autoEnhanceHomeBadges !== false) {
    enhanceHomeBadgesIfPresent();
  }

  // 6. Check for existing session and upgrade tables if logged in
  await checkExistingSessionAndUpgradeTables();

  state.initialized = true;
  info('Bootstrap complete');
}

/**
 * Enhance all quiz tables found in the document
 * Initially enhances in non-interactive mode (hide answers for security)
 * Upgraded to interactive mode after login via event coordinator
 */
function enhanceAllQuizTables(): void {
  const tables = document.querySelectorAll<HTMLTableElement>('table.qd-quiz');

  if (tables.length === 0) {
    info('No quiz tables found to enhance');
    return;
  }

  info(`Enhancing ${tables.length} quiz table(s) in non-interactive mode...`);

  let enhanced = 0;
  for (const table of Array.from(tables)) {
    try {
      enhanceQuizTable(table, { interactive: false });
      enhanced++;
    } catch (err) {
      warn(`Failed to enhance quiz table: ${(err as Error).message}`);
    }
  }

  info(`Enhanced ${enhanced} of ${tables.length} quiz table(s) (non-interactive)`);
}

/**
 * Enhance all analysis tables found in the document
 * Initially enhances in non-interactive mode (read-only)
 * Upgraded to interactive mode after login via event coordinator
 */
function enhanceAllAnalysisTables(): void {
  const tables = document.querySelectorAll<HTMLTableElement>('table.qd-analysis');

  if (tables.length === 0) {
    info('No analysis tables found to enhance');
    return;
  }

  info(`Enhancing ${tables.length} analysis table(s) in non-interactive mode...`);

  let enhanced = 0;
  for (const table of Array.from(tables)) {
    try {
      enhanceAnalysisTable(table, { interactive: false });
      enhanced++;
    } catch (err) {
      warn(`Failed to enhance analysis table: ${(err as Error).message}`);
    }
  }

  info(`Enhanced ${enhanced} of ${tables.length} analysis table(s) (non-interactive)`);
}

/**
 * Enhance home page badges if .quizPageBtn links exist
 */
function enhanceHomeBadgesIfPresent(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>('.quizPageBtn');

  if (links.length === 0) {
    info('No .quizPageBtn links found, skipping badge enhancement');
    return;
  }

  info(`Enhancing home page badges for ${links.length} link(s)...`);

  try {
    enhanceHomeBadges();
    info('Home page badges enhanced');
  } catch (err) {
    warn(`Failed to enhance home badges: ${(err as Error).message}`);
  }
}

/**
 * Check for existing session and upgrade tables to interactive mode
 * Called during bootstrap to handle page navigation with active session
 */
async function checkExistingSessionAndUpgradeTables(): Promise<void> {
  // Check if session exists
  const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
  if (!session) {
    info('No existing session, tables remain in non-interactive mode');
    return;
  }

  // Check if instructor mode - instructors don't need interactive tables
  const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === 'true';
  if (isInstructor) {
    info('Instructor session detected, revealing answers in non-interactive tables');
    // Reveal answer and detail columns for instructor (they're hidden by default in non-interactive mode)
    const quizTables = document.querySelectorAll<HTMLTableElement>('table.qd-quiz');
    quizTables.forEach((table) => {
      // Get parsed metadata (contains correct answers)
      const metadata = getQuizTableMetadata(table);
      if (!metadata) return;

      // Remove qd-hidden class from answer column (column 1)
      const answerCells = table.querySelectorAll('td:nth-child(2), th:nth-child(2)');
      answerCells.forEach((cell, index) => {
        cell.classList.remove('qd-hidden');
        // Restore answer text from parsed metadata (skip header row)
        if (index > 0 && cell instanceof HTMLTableCellElement) {
          const questionIndex = index - 1;
          const question = metadata.parsed.questions[questionIndex];
          if (question) {
            cell.textContent = question.correctAnswer;
          }
        }
      });

      // Remove qd-hidden class from detail column (column 2)
      const detailCells = table.querySelectorAll('td:nth-child(3), th:nth-child(3)');
      detailCells.forEach((cell) => cell.classList.remove('qd-hidden'));
    });
    return;
  }

  info(`Existing session detected for ${session.serviceId}, upgrading tables to interactive mode`);

  // Load or rebuild cache from IndexedDB
  const storageService = getStorageService();
  let cache = getJSON<SessionCache>(STORAGE_KEYS.CACHE);

  if (!cache) {
    info('Cache not found, rebuilding from IndexedDB...');
    try {
      const studentRecord = await storageService.loadStudentRecord(session);
      cache = storageService.buildCache(studentRecord);
      setJSON(STORAGE_KEYS.CACHE, cache);
      info(`Cache rebuilt from IndexedDB: ${cache.totals.total} total questions`);
    } catch {
      warn('Failed to rebuild cache from IndexedDB, using empty cache');
      cache = {
        totals: { total: 0, answered: 0, correct: 0 },
        pages: {},
      };
      setJSON(STORAGE_KEYS.CACHE, cache);
    }
  }

  // Extract pageId from URL filename
  const pathname = window.location.pathname;
  const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
  const pageId = filename.replace(/\.html?$/i, '');

  if (!pageId) {
    info('No pageId found, skipping table upgrade');
    return;
  }

  // Upgrade quiz tables to interactive mode
  const quizTables = document.querySelectorAll<HTMLTableElement>('table.qd-quiz');
  if (quizTables.length > 0) {
    info(`Upgrading ${quizTables.length} quiz table(s) to interactive mode...`);
    quizTables.forEach((table) => {
      enhanceQuizTable(table, { interactive: true, pageId });
    });
  }

  // Upgrade analysis tables to interactive mode
  const analysisTables = document.querySelectorAll<HTMLTableElement>('table.qd-analysis');
  if (analysisTables.length > 0) {
    info(`Upgrading ${analysisTables.length} analysis table(s) to interactive mode...`);
    analysisTables.forEach((table) => {
      enhanceAnalysisTable(table, { interactive: true, pageId });
    });
  }
}

/**
 * Cleanup bootstrap resources
 */
export function cleanup(): void {
  if (!state.initialized) {
    warn('Bootstrap not initialized, nothing to cleanup');
    return;
  }

  info('Cleaning up bootstrap resources...');

  state.eventCoordinator?.cleanup();
  state.sessionCoordinator?.cleanup();

  state.initialized = false;
  state.eventCoordinator = undefined;
  state.sessionCoordinator = undefined;

  info('Bootstrap cleanup complete');
}

/**
 * Check if bootstrap is initialized
 */
export function isInitialized(): boolean {
  return state.initialized;
}

/**
 * Get the event coordinator instance
 */
export function getEventCoordinator(): EventCoordinator | undefined {
  return state.eventCoordinator;
}

/**
 * Get the session coordinator instance
 */
export function getSessionCoordinator(): SessionCoordinator | undefined {
  return state.sessionCoordinator;
}
