/**
 * Bootstrap Module
 * Main initialization logic for the Sonar Quiz System
 */

import { info, warn } from '../utils/logger.js';
import { EventCoordinator } from './event-coordinator.js';
import { SessionCoordinator } from './session-coordinator.js';
import { injectComponents, type ComponentInjectorConfig } from './component-injector.js';
import { enhanceQuizTable } from '../enhancers/quiz-table.js';
import { enhanceAnalysisTable } from '../enhancers/analysis-table.js';
import { enhanceHomeBadges } from '../enhancers/home-badges.js';

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

    .qd-quiz-interactive .qd-correct {
      background-color: #d4edda;
      border-color: #28a745;
    }

    .qd-quiz-interactive .qd-incorrect {
      background-color: #f8d7da;
      border-color: #dc3545;
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
export function bootstrap(config: BootstrapConfig = {}): void {
  if (state.initialized) {
    warn('Bootstrap already initialized, skipping');
    return;
  }

  info('Bootstrapping Sonar Quiz System...');

  // 0. Inject required global styles
  injectGlobalStyles();

  // 1. Initialize event coordinator
  const eventCoordinator = new EventCoordinator();
  eventCoordinator.initialize();
  state.eventCoordinator = eventCoordinator;

  // 2. Initialize session coordinator
  const sessionCoordinator = new SessionCoordinator();
  sessionCoordinator.initialize();
  state.sessionCoordinator = sessionCoordinator;

  // 3. Inject UI components
  injectComponents({
    statusPanelContainer: config.statusPanelContainer,
    storageMonitorContainer: config.storageMonitorContainer,
    dbName: config.dbName,
    debug: config.debug,
  });

  // 4. Auto-enhance tables if enabled
  if (config.autoEnhanceQuizTables !== false) {
    enhanceAllQuizTables();
  }

  if (config.autoEnhanceAnalysisTables !== false) {
    enhanceAllAnalysisTables();
  }

  if (config.autoEnhanceHomeBadges !== false) {
    enhanceHomeBadgesIfPresent();
  }

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
