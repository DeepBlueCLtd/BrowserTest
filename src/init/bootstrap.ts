/**
 * Bootstrap Module
 * Main initialization logic for the Sonar Quiz System
 */

import { info, warn } from '../utils/logger.js';
import { EventCoordinator } from './event-coordinator.js';
import { SessionCoordinator } from './session-coordinator.js';
import { injectComponents, type ComponentInjectorConfig } from './component-injector.js';
import { enhanceQuizTable, getQuizTableMetadata } from '../enhancers/quiz-table.js';
import { revealInstructorAnswers } from '../enhancers/instructor-answer-reveal.js';
import { enhanceAnalysisTable } from '../enhancers/analysis-table.js';
import { enhanceHomeBadges } from '../enhancers/home-badges.js';
import { getStorageService } from '../services/storage-service.js';
import { getJSON, setJSON } from '../utils/storage-helpers.js';
import { getPageIdFromUrl } from '../utils/page-id.js';
import { injectGlobalStyles } from './global-styles.js';
import { STORAGE_KEYS, type SessionData, type SessionCache } from '../types/contracts.js';

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
  // dbName is REQUIRED - readDOMConfig() throws if missing
  if (!config.dbName) {
    const msg = 'FATAL: dbName not provided in bootstrap config. Processing stopped.';
    console.error(msg);
    throw new Error(msg);
  }
  const storageService = getStorageService(config.dbName);
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
    dbName: config.dbName,
  });

  // 5. Auto-enhance tables if enabled
  if (config.autoEnhanceQuizTables !== false) {
    enhanceAllTables('table.qd-quiz', 'quiz', (table) =>
      enhanceQuizTable(table, { interactive: false }),
    );
  }

  if (config.autoEnhanceAnalysisTables !== false) {
    enhanceAllTables('table.qd-analysis', 'analysis', (table) =>
      enhanceAnalysisTable(table, { interactive: false }),
    );
  }

  if (config.autoEnhanceHomeBadges !== false) {
    enhanceHomeBadgesIfPresent();
  }

  // 6. Check for existing session and upgrade tables if logged in
  await checkExistingSessionAndUpgradeTables();

  // 7. Listen for instructor login events to dynamically reveal answers
  // qd:login with role='instructor' is dispatched by qd-login component
  document.addEventListener('qd:login', (event) => {
    const detail = (event as CustomEvent<{ role?: string }>).detail;
    if (detail?.role === 'instructor') {
      info('Instructor login event received, revealing quiz answers');
      revealQuizAnswersForInstructor();
    }
  });

  state.initialized = true;
  info('Bootstrap complete');
}

/**
 * Enhance all tables matching a selector in non-interactive mode.
 *
 * Shared by quiz and analysis enhancement (they differ only in selector,
 * label, and enhancer). Tables start non-interactive (answers hidden /
 * read-only) and are upgraded to interactive after login.
 *
 * @param selector - CSS selector for the tables
 * @param label - Human-readable label for logging
 * @param enhance - Per-table non-interactive enhancer
 */
function enhanceAllTables(
  selector: string,
  label: string,
  enhance: (table: HTMLTableElement) => void,
): void {
  const tables = document.querySelectorAll<HTMLTableElement>(selector);

  if (tables.length === 0) {
    info(`No ${label} tables found to enhance`);
    return;
  }

  info(`Enhancing ${tables.length} ${label} table(s) in non-interactive mode...`);

  let enhanced = 0;
  for (const table of Array.from(tables)) {
    try {
      enhance(table);
      enhanced++;
    } catch (err) {
      warn(`Failed to enhance ${label} table: ${(err as Error).message}`);
    }
  }

  info(`Enhanced ${enhanced} of ${tables.length} ${label} table(s) (non-interactive)`);
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
 * Reveal quiz answers for instructor mode
 * Called when instructor logs in (either on page load or dynamically via event)
 * Shows answer and detail columns that were hidden for security
 */
function revealQuizAnswersForInstructor(): void {
  const pageId = getPageIdFromUrl();

  // Reveal answer and detail columns for instructor (they're hidden by default in non-interactive mode)
  const quizTables = document.querySelectorAll<HTMLTableElement>('table.qd-quiz');

  if (quizTables.length === 0) {
    info('No quiz tables found to reveal answers for');
    return;
  }

  quizTables.forEach((table) => {
    // Get parsed metadata (contains correct answers)
    const metadata = getQuizTableMetadata(table);
    if (!metadata) return;

    // Update metadata with pageId
    metadata.pageId = pageId;

    // Reveal answers + wire instructor toggles via the shared enhancer.
    // The initial-load path adds the qd-quiz-instructor CSS visibility class.
    revealInstructorAnswers(table, metadata, { addInstructorClass: true });
  });

  info(`Revealed answers for instructor on ${quizTables.length} quiz table(s)`);
}

/**
 * Check for existing session and upgrade tables to interactive mode
 * Called during bootstrap to handle page navigation with active session
 */
async function checkExistingSessionAndUpgradeTables(): Promise<void> {
  // Check if instructor mode FIRST - instructors don't need student session
  const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === 'true';
  if (isInstructor) {
    info('Instructor session detected, revealing answers in non-interactive tables');
    revealQuizAnswersForInstructor();
    return;
  }

  // Check if student session exists
  const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
  if (!session) {
    info('No existing session, tables remain in non-interactive mode');
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

  const pageId = getPageIdFromUrl();

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
