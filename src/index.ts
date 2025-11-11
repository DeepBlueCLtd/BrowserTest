/**
 * Sonar Quiz System - Main Entry Point
 * Version: 0.1.0
 *
 * Progressive enhancement system for DITA-published quiz HTML.
 * Auto-initializes on DOMContentLoaded and enhances quiz tables
 * with interactive elements.
 */

import { CSS_CLASSES, ELEMENT_IDS } from './types/contracts';
import { findQuizTables } from './services/quiz-parser';
import { enhanceQuizTable, injectQuizStyles } from './enhancers/quiz-table';

// Import components to register custom elements
import './components/qd-login';
import './components/qd-status';

/**
 * Configuration for the quiz system
 */
interface SonarQuizConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Auto-enhance tables on init */
  autoEnhance?: boolean;
  /** Selector for quiz tables */
  quizTableSelector?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SonarQuizConfig = {
  debug: false,
  autoEnhance: true,
  quizTableSelector: `table.${CSS_CLASSES.QUIZ_TABLE}`,
};

/**
 * Current configuration
 */
let config: SonarQuizConfig = { ...DEFAULT_CONFIG };

/**
 * Debug logger
 */
function log(...args: unknown[]): void {
  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log('[SonarQuiz]', ...args);
  }
}

/**
 * Error logger (always logs)
 */
function error(...args: unknown[]): void {
  console.error('[SonarQuiz]', ...args);
}

/**
 * Check if page has quiz tables
 */
function hasQuizTables(doc: Document = document): boolean {
  const tables = doc.querySelectorAll(
    config.quizTableSelector || DEFAULT_CONFIG.quizTableSelector!,
  );
  return tables.length > 0;
}

/**
 * Inject login component if not present
 */
function injectLoginComponent(doc: Document = document): void {
  // Check if login component already exists
  if (doc.querySelector('qd-login')) {
    log('Login component already present');
    return;
  }

  // Look for a suitable container (first heading or start of body)
  const container = doc.querySelector('main') || doc.querySelector('article') || doc.body;

  if (container) {
    const login = doc.createElement('qd-login');

    // Try to extract release and docId from meta tags or document
    const releaseMeta = doc.querySelector('meta[name="release"]');
    const docIdMeta = doc.querySelector('meta[name="document-id"]');

    if (releaseMeta) {
      login.setAttribute('release', releaseMeta.getAttribute('content') || '');
    }
    if (docIdMeta) {
      login.setAttribute('docId', docIdMeta.getAttribute('content') || '');
    }

    // Insert at the beginning of the container
    container.insertBefore(login, container.firstChild);
    log('Login component injected');
  }
}

/**
 * Inject status panel component
 */
function injectStatusPanel(doc: Document = document): void {
  // Check if element with id="qd-status" exists
  const statusContainer = doc.getElementById(ELEMENT_IDS.STATUS_PANEL);

  if (!statusContainer) {
    log('No status panel container found (looking for id="qd-status")');
    return;
  }

  // Check if status component already exists
  if (statusContainer.querySelector('qd-status')) {
    log('Status panel already present');
    return;
  }

  // Create and inject status component
  const status = doc.createElement('qd-status');
  statusContainer.appendChild(status);
  log('Status panel injected');
}

/**
 * Enhance all quiz tables on the page
 */
function enhanceAllTables(doc: Document = document): void {
  const parsedTables = findQuizTables(doc);

  log(`Found ${parsedTables.length} quiz tables`);

  parsedTables.forEach((parsed, index) => {
    if (parsed.errors && parsed.errors.length > 0) {
      error(`Table ${index + 1} has validation errors:`, parsed.errors);
      // Show validation banner in debug mode
      if (config.debug) {
        showValidationBanner(parsed.element, parsed.errors);
      }
    }

    // Enhance even if there are errors (partial enhancement)
    if (parsed.questions.length > 0) {
      enhanceQuizTable(parsed.element);
      log(`Enhanced table ${index + 1} with ${parsed.questions.length} questions`);
    }
  });
}

/**
 * Show validation banner for debug mode
 */
function showValidationBanner(table: HTMLTableElement, errors: string[]): void {
  const banner = document.createElement('div');
  banner.style.cssText = `
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
    color: #856404;
  `;
  banner.innerHTML = `
    <strong>⚠️ Quiz Table Validation Errors:</strong>
    <ul style="margin: 0.5rem 0 0 1.5rem;">
      ${errors.map((err) => `<li>${err}</li>`).join('')}
    </ul>
  `;

  table.parentNode?.insertBefore(banner, table);
}

/**
 * Setup event listeners for quiz system
 */
function setupEventListeners(doc: Document = document): void {
  // Listen for login events
  doc.addEventListener('qd:login', (e: Event) => {
    const detail = (e as CustomEvent<unknown>).detail;
    log('Login event:', detail);

    // Store session in sessionStorage
    sessionStorage.setItem('qd/session', JSON.stringify(detail));

    // Initialize or update status panel
    const statusPanel = doc.querySelector('qd-status');
    if (statusPanel) {
      // TODO: Update status panel with session data
      log('Status panel ready for session data');
    }
  });

  // Listen for answer-saved events
  doc.addEventListener('qd:answer-saved', (e: Event) => {
    const detail = (e as CustomEvent<unknown>).detail;
    log('Answer saved:', detail);

    // TODO: Update status panel and session storage
    // This will be fully implemented when storage service is wired up
  });

  // Listen for logout events
  doc.addEventListener('qd:logout', (_e: Event) => {
    log('Logout event');
    sessionStorage.removeItem('qd/session');
    sessionStorage.removeItem('qd/state');
  });

  log('Event listeners setup complete');
}

/**
 * Initialize the Sonar Quiz System
 * This function is called automatically on DOMContentLoaded
 *
 * @param userConfig - Optional configuration overrides
 */
function init(userConfig?: Partial<SonarQuizConfig>): void {
  // Merge user config with defaults
  config = { ...DEFAULT_CONFIG, ...userConfig };

  log('Initializing Sonar Quiz System...');
  log('Configuration:', config);

  // Inject quiz table styles
  injectQuizStyles();
  log('Quiz styles injected');

  // Check for quiz tables
  if (!hasQuizTables()) {
    log('No quiz tables found on this page');
    return;
  }

  log('Quiz tables detected');

  // Setup event listeners first
  setupEventListeners();

  // Inject login component
  injectLoginComponent();

  // Inject status panel
  injectStatusPanel();

  // Enhance tables if auto-enhance is enabled
  if (config.autoEnhance) {
    enhanceAllTables();
  }

  log('Initialization complete');

  // Dispatch init event
  document.dispatchEvent(
    new CustomEvent('qd:init', {
      detail: {
        version: '0.1.0',
        tablesFound: document.querySelectorAll(config.quizTableSelector!).length,
      },
    }),
  );
}

/**
 * Manual table enhancement (for dynamic content)
 */
function enhanceTables(selector?: string): void {
  const tables = document.querySelectorAll<HTMLTableElement>(selector || config.quizTableSelector!);

  tables.forEach((table) => {
    enhanceQuizTable(table);
  });

  log(`Manually enhanced ${tables.length} tables`);
}

/**
 * Get current configuration
 */
function getConfig(): Readonly<SonarQuizConfig> {
  return { ...config };
}

/**
 * Update configuration
 */
function setConfig(newConfig: Partial<SonarQuizConfig>): void {
  config = { ...config, ...newConfig };
  log('Configuration updated:', config);
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  // Check for data attribute configuration
  const scriptTag = document.querySelector('script[data-sonar-quiz]');
  const debugAttr = scriptTag?.getAttribute('data-debug');
  const autoEnhanceAttr = scriptTag?.getAttribute('data-auto-enhance');

  const autoConfig: Partial<SonarQuizConfig> = {};
  if (debugAttr !== null) {
    autoConfig.debug = debugAttr !== 'false';
  }
  if (autoEnhanceAttr !== null) {
    autoConfig.autoEnhance = autoEnhanceAttr !== 'false';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(autoConfig));
  } else {
    init(autoConfig);
  }
}

// Export for ESM consumers
export { init, enhanceTables, getConfig, setConfig };

// Export types
export type { SonarQuizConfig };

// IIFE global export
if (typeof window !== 'undefined') {
  interface WindowWithSonarQuiz extends Window {
    SonarQuiz?: {
      init: typeof init;
      enhanceTables: typeof enhanceTables;
      getConfig: typeof getConfig;
      setConfig: typeof setConfig;
    };
  }
  (window as WindowWithSonarQuiz).SonarQuiz = {
    init,
    enhanceTables,
    getConfig,
    setConfig,
  };
}
