/**
 * Sonar Quiz System - Main Entry Point
 * Version: 0.1.0
 *
 * Progressive enhancement system for DITA-published quiz HTML.
 * Auto-initializes on DOMContentLoaded and enhances quiz tables
 * with interactive elements.
 */

import { CSS_CLASSES, ELEMENT_IDS } from './types/contracts';
import type { AnswerRecord } from './types/contracts';
import { findQuizTables } from './services/quiz-parser';
import {
  enhanceQuizTable,
  prepareAllQuizTables,
  activateAllQuizTables,
  injectQuizStyles,
} from './enhancers/quiz-table';
import { enhanceAllAnalysisTables } from './enhancers/analysis-table';
import { getSessionService } from './services/session';
import { getStorageAdapter } from './services/storage/indexeddb';
import { initializeHomeBadges } from './enhancers/home-badges';

// Import components to register custom elements
import './components/qd-login';
import './components/qd-status';
import './components/qd-storage-monitor';

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
  /** Selector for element to insert login component before (e.g., "#qd-status", ".content") */
  loginInsertBeforeSelector?: string;
  /** Title for login component fieldset */
  loginTitle?: string;
  /** CSS selector for navbar container where status panel will be injected as last child (e.g., ".wh_top_menu_and_indexterms_link", ".navbar-nav", "#header-nav") */
  statusPanelContainer?: string;
  /** CSS class name for the container element that holds the document title (e.g., "wh_publication_title") */
  titleContainerClass?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SonarQuizConfig = {
  debug: false,
  autoEnhance: true,
  quizTableSelector: `table.${CSS_CLASSES.QUIZ_TABLE}`,
  loginInsertBeforeSelector: undefined,
  loginTitle: 'Core Skills Assessment',
  statusPanelContainer: '.wh_top_menu_and_indexterms_link', // Oxygen WebHelp default
  titleContainerClass: 'wh_publication_title', // Oxygen WebHelp default
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

  // Check if status panel exists (which includes its own login view)
  if (doc.querySelector('qd-status')) {
    log('Status panel present, skipping standalone login injection');
    return;
  }

  const login = doc.createElement('qd-login');

  // Try to extract docId from meta tags
  const docIdMeta = doc.querySelector('meta[name="document-id"]');

  if (docIdMeta) {
    login.setAttribute('docId', docIdMeta.getAttribute('content') || '');
  }

  // Set title from config
  if (config.loginTitle) {
    login.setAttribute('title', config.loginTitle);
  }

  // Set titleContainerClass from config
  if (config.titleContainerClass) {
    login.setAttribute('titleContainerClass', config.titleContainerClass);
  }

  // Determine insertion point
  let insertionParent: Element | null = null;
  let insertionReference: Element | null = null;

  if (config.loginInsertBeforeSelector) {
    // Try to find the specified element to insert before
    insertionReference = doc.querySelector(config.loginInsertBeforeSelector);
    if (insertionReference) {
      insertionParent = insertionReference.parentElement;
      log(`Inserting login before element: ${config.loginInsertBeforeSelector}`);
    } else {
      log(`Element not found: ${config.loginInsertBeforeSelector}, falling back to default`);
    }
  }

  // Fallback to default insertion logic
  if (!insertionParent) {
    insertionParent = doc.querySelector('main') || doc.querySelector('article') || doc.body;
    insertionReference = insertionParent?.firstChild as Element | null;
  }

  if (insertionParent) {
    insertionParent.insertBefore(login, insertionReference);
    log('Login component injected');
  }
}

/**
 * Inject status panel component
 */
function injectStatusPanel(doc: Document = document): void {
  // Skip if no container selector configured
  if (!config.statusPanelContainer) {
    log('Status panel container selector not configured, skipping injection');
    return;
  }

  // Look for navbar container using configured selector
  const navbarContainer = doc.querySelector(config.statusPanelContainer);

  if (!navbarContainer) {
    log(`No navbar container found (looking for ${config.statusPanelContainer})`);
    return;
  }

  // Check if status panel already exists
  if (navbarContainer.querySelector('#qd-status')) {
    log('Status panel already present');
    return;
  }

  // Create wrapper div with styling to match navbar items
  const wrapper = doc.createElement('div');
  wrapper.id = ELEMENT_IDS.STATUS_PANEL;
  wrapper.style.cssText = 'display:inline-block; vertical-align:middle; margin-left:auto;';

  // Create and inject status component
  const status = doc.createElement('qd-status');
  wrapper.appendChild(status);

  // Append as last child of navbar container
  navbarContainer.appendChild(wrapper);
  log(`Status panel injected into ${config.statusPanelContainer} as last child`);
}

/**
 * Inject storage monitor component (development tool)
 * Only injects when debug mode is enabled
 *
 * Enable debug mode via:
 * - Script tag: <script data-sonar-quiz data-debug="true">
 * - Programmatic: SonarQuiz.init({ debug: true })
 */
function injectStorageMonitor(doc: Document = document): void {
  // Only inject in debug mode
  if (!config.debug) {
    return;
  }

  // Check if storage monitor already exists
  if (doc.querySelector('qd-storage-monitor')) {
    log('Storage monitor already present');
    return;
  }

  // Create and inject storage monitor with Sonar-specific database name
  const monitor = doc.createElement('qd-storage-monitor');
  monitor.setAttribute('dbName', 'SonarQuizDB');
  doc.body.appendChild(monitor);
  log('Storage monitor injected');
}

/**
 * Prepare all quiz tables on the page (hide metadata, pre-login)
 */
function prepareAllTables(doc: Document = document): void {
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

    // Prepare even if there are errors (partial preparation)
    if (parsed.questions.length > 0) {
      log(
        `Preparing table ${index + 1} with ${parsed.questions.length} questions (hiding metadata)`,
      );
    }
  });

  // Prepare all quiz tables (hide metadata only)
  prepareAllQuizTables(doc);
  log('All quiz tables prepared (metadata hidden)');
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
 * Handle answer saved event - update cache and persist
 *
 * @param questionIndex - Index of the question being answered
 * @param answer - The saved answer record
 * @param table - The table element containing the quiz
 */
function handleAnswerSaved(
  questionIndex: number,
  answer: AnswerRecord,
  table: HTMLTableElement,
): void {
  const sessionService = getSessionService();

  // Get current cache
  let cache = sessionService.getCache();

  if (!cache) {
    log('No cache found, creating new one');
    cache = {
      totals: { answered: 0, correct: 0 },
      pages: {},
    };
  }

  // Determine current page ID
  const pageIdMeta = document.querySelector('meta[name="page-id"]');
  const pageId =
    pageIdMeta?.getAttribute('content') ||
    table.getAttribute('data-page-id') ||
    document.location.pathname.replace(/^.*\//, '').replace(/\.html?$/, '') ||
    'unknown-page';

  // Initialize page data if it doesn't exist
  if (!cache.pages[pageId]) {
    cache.pages[pageId] = {
      answered: 0,
      correct: 0,
      state: 'unstarted',
    };
  }

  // Store the answer at the question index (add answers array to PageCache)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const pageCache = cache.pages[pageId] as any; // Type assertion needed since PageCache interface doesn't have answers yet
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!pageCache.answers) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    pageCache.answers = [];
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  pageCache.answers[questionIndex] = answer;

  // Recalculate totals from all stored answers
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const pageAnswers = (pageCache.answers as AnswerRecord[]).filter(
    (a: AnswerRecord) => a !== undefined,
  );
  cache.pages[pageId].answered = pageAnswers.length;
  cache.pages[pageId].correct = pageAnswers.filter((a: AnswerRecord) => a.success).length;

  // Recalculate global totals from all pages
  cache.totals.answered = Object.values(cache.pages).reduce(
    (sum, page) => sum + (page.answered || 0),
    0,
  );
  cache.totals.correct = Object.values(cache.pages).reduce(
    (sum, page) => sum + (page.correct || 0),
    0,
  );

  // Set page state
  const totalQuestionsOnPage = table.querySelectorAll('tbody tr').length;
  if (cache.pages[pageId].answered === 0) {
    cache.pages[pageId].state = 'unstarted';
  } else if (
    cache.pages[pageId].answered === totalQuestionsOnPage &&
    cache.pages[pageId].correct === totalQuestionsOnPage
  ) {
    cache.pages[pageId].state = 'complete';
  } else {
    cache.pages[pageId].state = 'incomplete';
  }

  // Save updated cache
  sessionService.saveCache(cache);

  // Update status panel with new totals
  const statusPanel = document.querySelector(
    'qd-status',
  ) as import('./components/qd-status').QdStatus;
  if (statusPanel) {
    statusPanel.attempted = cache.totals.answered;
    statusPanel.correct = cache.totals.correct;
    // Calculate total from cache
    const totalQuestions = Object.values(cache.pages).reduce((sum, page) => sum + page.answered, 0);
    statusPanel.total = totalQuestions;
    log(
      'Status panel updated - attempted:',
      cache.totals.answered,
      'correct:',
      cache.totals.correct,
    );
  }

  // Persist to IndexedDB
  const session = sessionService.getSession();
  if (session) {
    const storage = getStorageAdapter();
    storage
      .getStudent(session.release, session.serviceId)
      .then(async (record) => {
        if (record) {
          // Update record with new totals
          record.attempted = cache.totals.answered;
          record.correct = cache.totals.correct;
          record.updated = new Date().toISOString();

          // Update page data with answers
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          const pageAnswers = (cache.pages[pageId] as any)?.answers || [];
          record.pages[pageId] = {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            answers: pageAnswers,
            state: cache.pages[pageId]?.state || 'incomplete',
          };

          await storage.saveStudent(record);
          log('Student record saved to IndexedDB');
        }
      })
      .catch((error) => {
        console.error('Failed to save to IndexedDB:', error);
        // In debug mode, re-throw to fail fast
        if (config.debug) {
          throw error;
        }
      });
  }

  // Emit state-changed event
  const stateChangedEvent = new CustomEvent('qd:state-changed', {
    detail: {
      pageId,
      state: cache.pages[pageId]?.state || 'unstarted',
    },
    bubbles: true,
  });
  document.dispatchEvent(stateChangedEvent);

  log('Cache updated and state-changed event emitted');

  // Update session activity
  sessionService.updateActivity();
}

/**
 * Clear all quiz answers from the current page
 */
function clearQuizAnswers(): void {
  // Find the quiz table
  const table = document.querySelector('table.qd-quiz') as HTMLTableElement;
  if (!table) {
    log('No quiz table found, nothing to clear');
    return;
  }

  // Clear all answer cells
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    const tableRow = row as HTMLTableRowElement;
    const answerCell = tableRow.cells[1]; // Answer column
    if (!answerCell) return;

    // Find and clear input/select elements
    const input = answerCell.querySelector('input');
    const select = answerCell.querySelector('select');

    if (input) {
      input.value = '';
    } else if (select) {
      select.value = ''; // Reset to blank option
    }

    // Remove visual feedback classes
    answerCell.classList.remove('qd-answer-correct', 'qd-answer-incorrect');
  });

  log('Quiz answers cleared from current page');
}

/**
 * Restore previous answers from session cache
 */
function restorePreviousAnswers(): void {
  const sessionService = getSessionService();
  const cache = sessionService.getCache();

  if (!cache) {
    log('No cache found, skipping answer restoration');
    return;
  }

  // Determine current page ID
  const pageIdMeta = document.querySelector('meta[name="page-id"]');
  const pageId =
    pageIdMeta?.getAttribute('content') ||
    document.location.pathname.replace(/^.*\//, '').replace(/\.html?$/, '') ||
    'unknown-page';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const pageCache = cache.pages[pageId] as any;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!pageCache || !pageCache.answers || pageCache.answers.length === 0) {
    log('No previous answers found for page:', pageId);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const answers = pageCache.answers as AnswerRecord[];
  log(
    'Restoring',
    answers.filter((a: AnswerRecord) => a).length,
    'previous answers for page:',
    pageId,
  );

  // Find the quiz table
  const table = document.querySelector('table.qd-quiz') as HTMLTableElement;
  if (!table) {
    log('No quiz table found, cannot restore answers');
    return;
  }

  // Restore each answer
  answers.forEach((answer: AnswerRecord, questionIndex: number) => {
    if (!answer) return;

    const allRows = table.querySelectorAll('tbody tr');
    const row = allRows[questionIndex] as HTMLTableRowElement | undefined;
    if (!row) return;

    const answerCell = row.cells[1]; // Answer column
    if (!answerCell) return;

    // Find the input/select element and set its value
    const input = answerCell.querySelector('input');
    const select = answerCell.querySelector('select');

    if (input) {
      input.value = answer.answer;
    } else if (select) {
      select.value = answer.answer;
    }

    // Apply visual feedback (use correct CSS class names)
    answerCell.classList.remove('qd-answer-correct', 'qd-answer-incorrect');
    if (answer.success) {
      answerCell.classList.add('qd-answer-correct');
    } else {
      answerCell.classList.add('qd-answer-incorrect');
    }
  });

  log('Previous answers restored successfully');
}

/**
 * Setup event listeners for quiz system
 */
function setupEventListeners(doc: Document = document): void {
  // Listen for login events
  doc.addEventListener('qd:login', (e: Event) => {
    const sessionData = (e as CustomEvent<import('./types/contracts').SessionData>).detail;
    log('Login event received:', sessionData);

    // Store session in sessionStorage
    sessionStorage.setItem('qd/session', JSON.stringify(sessionData));
    log('Session stored in sessionStorage');

    // Initialize student record in IndexedDB if it doesn't exist
    // Note: Using void to explicitly discard the Promise return value
    void (async () => {
      try {
        const storage = getStorageAdapter();
        await storage.init();

        // Try to load existing record, or create new one
        const existingRecord = await storage.getStudent(sessionData.release, sessionData.serviceId);

        if (!existingRecord) {
          // Create new student record
          const docId =
            doc.querySelector('meta[name="document-id"]')?.getAttribute('content') || 'unknown';
          const newRecord: import('./types/contracts').StudentRecord = {
            schema: 1,
            docId,
            serviceId: sessionData.serviceId,
            name: sessionData.name,
            release: sessionData.release,
            attempted: 0,
            correct: 0,
            updated: new Date().toISOString(),
            pages: {},
          };
          await storage.saveStudent(newRecord);
          log('Created new student record in IndexedDB');
        } else {
          log('Loaded existing student record from IndexedDB');
        }
      } catch (error) {
        console.error('Failed to initialize student record:', error);
        // In debug mode, re-throw to fail fast
        if (config.debug) {
          throw error;
        }
      }
    })();

    // Activate quiz tables (inject interactive controls)
    activateAllQuizTables(doc);
    log('Quiz tables activated (interactive controls injected)');

    // Restore previous answers from session cache if logged in
    restorePreviousAnswers();

    // Enhance analysis tables (inject input fields)
    enhanceAllAnalysisTables();
    log('Analysis tables enhanced (input fields injected)');

    // Initialize or update status panel
    const statusPanel = doc.querySelector('qd-status') as import('./components/qd-status').QdStatus;
    log('Status panel element:', statusPanel);
    if (statusPanel) {
      log('Current isLoggedIn state BEFORE update:', statusPanel.isLoggedIn);
      // Update status panel to show logged-in state
      statusPanel.isLoggedIn = true;
      log('Current isLoggedIn state AFTER update:', statusPanel.isLoggedIn);
      log('Status panel updated with logged-in state');
    } else {
      log('WARNING: Status panel not found in DOM');
    }
  });

  // Listen for answer-saved events
  doc.addEventListener('qd:answer-saved', (e: Event) => {
    const detail = (
      e as CustomEvent<{
        questionIndex: number;
        answer: AnswerRecord;
        tableElement: HTMLTableElement;
      }>
    ).detail;
    log('Answer saved:', detail);

    // Update session cache with full detail (includes questionIndex)
    handleAnswerSaved(detail.questionIndex, detail.answer, detail.tableElement);
  });

  // Listen for logout events
  doc.addEventListener('qd:logout', (_e: Event) => {
    log('Logout event received');
    sessionStorage.removeItem('qd/session');
    sessionStorage.removeItem('qd/state');

    // Clear quiz answers from current page
    clearQuizAnswers();

    // Update status panel to show logged-out state
    const statusPanel = doc.querySelector('qd-status') as import('./components/qd-status').QdStatus;
    log('Status panel element on logout:', statusPanel);
    if (statusPanel) {
      log('Current isLoggedIn state BEFORE logout update:', statusPanel.isLoggedIn);
      statusPanel.isLoggedIn = false;
      // Reset status panel totals
      statusPanel.attempted = 0;
      statusPanel.correct = 0;
      statusPanel.total = 0;
      log('Current isLoggedIn state AFTER logout update:', statusPanel.isLoggedIn);
      log('Status panel updated with logged-out state');
    } else {
      log('WARNING: Status panel not found on logout');
    }
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

  // Initialize IndexedDB early (before storage monitor) to ensure proper schema
  // This prevents the storage monitor from creating an empty database
  const storage = getStorageAdapter();
  storage
    .init()
    .then(() => {
      log('IndexedDB initialized successfully');
    })
    .catch((error) => {
      console.error('Failed to initialize IndexedDB:', error);
      if (config.debug) {
        // Fail fast in debug mode
        throw new Error(
          `IndexedDB initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });

  // Setup event listeners first
  setupEventListeners();

  // Inject login component
  injectLoginComponent();

  // Inject status panel
  injectStatusPanel();

  // Inject storage monitor (development tool)
  injectStorageMonitor();

  // Prepare tables if auto-enhance is enabled (hide metadata pre-login)
  if (config.autoEnhance) {
    prepareAllTables();
  }

  // Initialize home page badges if we're on a home page
  const hasTestLinks = document.querySelectorAll(`.${CSS_CLASSES.TEST_LINK}`).length > 0;
  if (hasTestLinks) {
    initializeHomeBadges();
    log('Home page badges initialized');
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
  const statusPanelContainerAttr = scriptTag?.getAttribute('data-status-panel-container');

  const autoConfig: Partial<SonarQuizConfig> = {};
  if (debugAttr !== null) {
    autoConfig.debug = debugAttr !== 'false';
  }
  if (autoEnhanceAttr !== null) {
    autoConfig.autoEnhance = autoEnhanceAttr !== 'false';
  }
  if (statusPanelContainerAttr !== null) {
    autoConfig.statusPanelContainer = statusPanelContainerAttr;
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
