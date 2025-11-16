/**
 * Sonar Quiz System - Main Entry Point
 * Version: 0.1.0
 *
 * Progressive enhancement system for DITA-published quiz HTML.
 * Auto-initializes on DOMContentLoaded and enhances quiz tables
 * with interactive elements.
 */

import { CSS_CLASSES, ELEMENT_IDS, SESSION_TIMEOUT_MS } from './types/contracts';
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

  // Try to extract release and docId from meta tags or document
  const releaseMeta = doc.querySelector('meta[name="release"]');
  const docIdMeta = doc.querySelector('meta[name="document-id"]');

  if (releaseMeta) {
    login.setAttribute('release', releaseMeta.getAttribute('content') || '');
  }
  if (docIdMeta) {
    login.setAttribute('docId', docIdMeta.getAttribute('content') || '');
  }

  // Set title from config
  if (config.loginTitle) {
    login.setAttribute('title', config.loginTitle);
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
    (a: AnswerRecord) => a !== undefined && a !== null,
  );
  cache.pages[pageId].answered = pageAnswers.length;
  cache.pages[pageId].correct = pageAnswers.filter((a: AnswerRecord) => a && a.success).length;

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
 * Restore an existing session on page load
 * This allows users to navigate between pages without re-logging in
 *
 * @param session - The session data to restore
 */
async function restoreSession(session: import('./types/contracts').SessionData): Promise<void> {
  const sessionService = getSessionService();

  try {
    // Load student record from IndexedDB
    const storage = getStorageAdapter();
    const studentRecord = await storage.getStudent(session.release, session.serviceId);

    if (!studentRecord) {
      log('No student record found, session cannot be fully restored');
      return;
    }

    // Rebuild session cache from student record
    const cache: import('./types/contracts').SessionCache = {
      totals: {
        answered: studentRecord.attempted,
        correct: studentRecord.correct,
      },
      pages: {},
    };

    // Populate cache with page data
    Object.entries(studentRecord.pages).forEach(([pageId, pageData]) => {
      const answers = pageData.answers || [];
      // Filter out null and undefined values
      const validAnswers = answers.filter(
        (a: import('./types/contracts').AnswerRecord) => a !== null && a !== undefined,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageCache: any = {
        answered: validAnswers.length,
        correct: validAnswers.filter((a: import('./types/contracts').AnswerRecord) => a.success)
          .length,
        state: pageData.state || 'unstarted',
        // Store answers array for restoration (not in PageCache type but needed for restoration)
        answers: pageData.answers || [],
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      cache.pages[pageId] = pageCache;
    });

    // Save cache to sessionStorage
    sessionService.saveCache(cache);
    log('Session cache restored from IndexedDB');

    // Wait for qd-status component to be defined before updating it
    await customElements.whenDefined('qd-status');

    // Update status panel to show logged-in state
    const statusPanel = document.querySelector(
      'qd-status',
    ) as import('./components/qd-status').QdStatus;
    if (statusPanel) {
      statusPanel.isLoggedIn = true;
      statusPanel.attempted = cache.totals.answered;
      statusPanel.correct = cache.totals.correct;
      statusPanel.total = cache.totals.answered; // Total questions attempted
      log('Status panel updated with restored session');
    } else {
      log('WARNING: Status panel not found after component definition');
    }

    // Activate quiz tables if present on this page
    if (hasQuizTables()) {
      activateAllQuizTables(document);
      log('Quiz tables activated from restored session');

      // Restore previous answers for current page
      restorePreviousAnswers();
    }

    // Enhance analysis tables if present
    const analysisTables = document.querySelectorAll('table.qd-analysis');
    log(`Found ${analysisTables.length} analysis tables on this page`);
    if (analysisTables.length > 0) {
      enhanceAllAnalysisTables();
      log(`Analysis tables enhanced from restored session (${analysisTables.length} tables)`);
    } else {
      log('No analysis tables to enhance on this page');
    }

    // Update home badges if on home page
    const hasTestLinks = document.querySelectorAll(`.${CSS_CLASSES.TEST_LINK}`).length > 0;
    if (hasTestLinks) {
      // Re-initialize badges with restored cache
      initializeHomeBadges();
      log('Home badges updated with restored session');
    }

    // Update activity time
    sessionService.updateActivity();
  } catch (error) {
    console.error('Failed to restore session:', error);
    // Clear invalid session
    sessionService.clearSession();
  }
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

    // Handle login asynchronously to load student record and restore state
    void (async () => {
      try {
        const storage = getStorageAdapter();
        await storage.init();

        // Try to load existing record, or create new one
        const existingRecord = await storage.getStudent(sessionData.release, sessionData.serviceId);

        let studentRecord: import('./types/contracts').StudentRecord;

        if (!existingRecord) {
          // Create new student record
          const docId =
            doc.querySelector('meta[name="document-id"]')?.getAttribute('content') || 'unknown';
          studentRecord = {
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
          await storage.saveStudent(studentRecord);
          log('Created new student record in IndexedDB');
        } else {
          studentRecord = existingRecord;
          log('Loaded existing student record from IndexedDB');

          // Rebuild cache from student record for answer restoration
          const sessionService = getSessionService();
          const cache: import('./types/contracts').SessionCache = {
            totals: {
              answered: studentRecord.attempted,
              correct: studentRecord.correct,
            },
            pages: {},
          };

          // Populate cache with page data including answers
          Object.entries(studentRecord.pages).forEach(([pageId, pageData]) => {
            const answers = pageData.answers || [];
            const validAnswers = answers.filter(
              (a: import('./types/contracts').AnswerRecord) => a !== null && a !== undefined,
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pageCache: any = {
              answered: validAnswers.length,
              correct: validAnswers.filter(
                (a: import('./types/contracts').AnswerRecord) => a.success,
              ).length,
              state: pageData.state || 'unstarted',
              answers: pageData.answers || [],
            };
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            cache.pages[pageId] = pageCache;
          });

          // Save cache to sessionStorage
          sessionService.saveCache(cache);
          log('Session cache rebuilt from existing student record');
        }

        // Activate quiz tables (inject interactive controls)
        activateAllQuizTables(doc);
        log('Quiz tables activated (interactive controls injected)');

        // Restore previous answers from session cache (now populated)
        restorePreviousAnswers();

        // Enhance analysis tables (inject input fields)
        const analysisTables = doc.querySelectorAll('table.qd-analysis');
        log(`Found ${analysisTables.length} analysis tables to enhance`);
        if (analysisTables.length > 0) {
          enhanceAllAnalysisTables();
          log(`Analysis tables enhanced (${analysisTables.length} tables)`);
        }

        // Initialize or update status panel
        const statusPanel = doc.querySelector(
          'qd-status',
        ) as import('./components/qd-status').QdStatus;
        log('Status panel element:', statusPanel);
        if (statusPanel) {
          log('Current isLoggedIn state BEFORE update:', statusPanel.isLoggedIn);
          // Update status panel to show logged-in state
          statusPanel.isLoggedIn = true;
          // Update with totals from cache
          if (existingRecord) {
            statusPanel.attempted = studentRecord.attempted;
            statusPanel.correct = studentRecord.correct;
            statusPanel.total = studentRecord.attempted;
          }
          log('Current isLoggedIn state AFTER update:', statusPanel.isLoggedIn);
          log('Status panel updated with logged-in state');
        } else {
          log('WARNING: Status panel not found in DOM');
        }

        // Update home page badges if we're on a home page
        const hasTestLinks = doc.querySelectorAll(`.${CSS_CLASSES.TEST_LINK}`).length > 0;
        if (hasTestLinks) {
          initializeHomeBadges();
          log('Home badges updated after login');
        }
      } catch (error) {
        console.error('Failed to initialize student record:', error);
        // In debug mode, re-throw to fail fast
        if (config.debug) {
          throw error;
        }
      }
    })();
  });

  // Listen for instructor login events
  doc.addEventListener('qd:instructor-login', (e: Event) => {
    const detail = (e as CustomEvent<{ timestamp: string; release: string }>).detail;
    log('Instructor login event received:', detail);

    // Store instructor session marker
    const instructorSession = {
      instructorMode: true,
      release: detail.release,
      loginTime: detail.timestamp,
      instructorUnlocked: true,
    };
    sessionStorage.setItem('qd/instructor-session', JSON.stringify(instructorSession));
    log('Instructor session stored in sessionStorage');

    // Set instructor unlocked in session service
    const sessionService = getSessionService();
    const instructorSessionData: import('./types/contracts').SessionData = {
      serviceId: 'INSTRUCTOR',
      name: 'Instructor',
      release: detail.release,
      loginTime: detail.timestamp,
      lastActivity: detail.timestamp,
      expiresAt: new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString(),
      instructorUnlocked: true,
    };
    sessionService.createSession(
      instructorSessionData.serviceId,
      instructorSessionData.name,
      instructorSessionData.release,
    );
    sessionService.unlockInstructor();

    // Prepare quiz tables for answer reveal
    prepareAllQuizTables(doc);

    // Hide login component and show instructor panel in status location
    const loginComponent = doc.querySelector('qd-login');
    if (loginComponent) {
      loginComponent.style.display = 'none';
    }

    // Dispatch a custom event to signal components to show instructor UI
    const instructorShowEvent = new CustomEvent('qd:instructor-show', {
      detail: { release: detail.release },
      bubbles: true,
    });
    doc.dispatchEvent(instructorShowEvent);

    log('Instructor mode activated');
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

    // Reset home page badges if we're on a home page
    const hasTestLinks = doc.querySelectorAll(`.${CSS_CLASSES.TEST_LINK}`).length > 0;
    if (hasTestLinks) {
      initializeHomeBadges();
      log('Home badges reset after logout');
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
async function init(userConfig?: Partial<SonarQuizConfig>): Promise<void> {
  // Merge user config with defaults
  config = { ...DEFAULT_CONFIG, ...userConfig };

  log('Initializing Sonar Quiz System...');
  log('Configuration:', config);

  // Inject quiz table styles
  injectQuizStyles();
  log('Quiz styles injected');

  // Initialize IndexedDB early (before storage monitor) to ensure proper schema
  // This prevents the storage monitor from creating an empty database
  const storage = getStorageAdapter();

  // Wait for IndexedDB to be ready before proceeding with session restoration
  try {
    await storage.init();
    log('IndexedDB initialized successfully');
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    if (config.debug) {
      // Fail fast in debug mode
      throw new Error(
        `IndexedDB initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    // In production, continue without storage (session won't persist)
    log('Continuing without persistent storage');
  }

  // Setup event listeners first
  setupEventListeners();

  // Inject status panel first (if navbar exists)
  // This prevents duplicate login forms
  injectStatusPanel();

  // Inject standalone login component only if status panel wasn't injected
  injectLoginComponent();

  // Inject storage monitor (development tool)
  injectStorageMonitor();

  // Initialize home page badges if we're on a home page
  const hasTestLinks = document.querySelectorAll(`.${CSS_CLASSES.TEST_LINK}`).length > 0;
  if (hasTestLinks) {
    initializeHomeBadges();
    log('Home page badges initialized');
  }

  // ALWAYS prepare quiz tables to hide answers (security requirement)
  // This must run on every page load regardless of login state
  if (hasQuizTables()) {
    log('Quiz tables detected');

    // CRITICAL: Always prepare tables to hide correct answers from students
    // This is a security requirement and must not be conditional
    prepareAllTables();
    log('Quiz tables prepared (answers hidden)');
  } else {
    log('No quiz tables found on this page');
  }

  // Restore existing session if present and not expired
  const sessionService = getSessionService();
  const existingSession = sessionService.getSession();
  if (existingSession && !sessionService.isExpired()) {
    log(
      'Restoring existing session for:',
      existingSession.name,
      'ServiceID:',
      existingSession.serviceId,
    );

    // Restore session by triggering the same logic as login
    try {
      await restoreSession(existingSession);
      log('Session restoration complete');
    } catch (error) {
      console.error('Failed to restore session on init:', error);
      sessionService.clearSession();
    }
  } else if (existingSession && sessionService.isExpired()) {
    log('Session expired, clearing session data');
    sessionService.clearSession();
  } else {
    log('No existing session found or session not valid');
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
    document.addEventListener('DOMContentLoaded', () => {
      init(autoConfig).catch((error) => {
        console.error('[SonarQuiz] Initialization failed:', error);
      });
    });
  } else {
    init(autoConfig).catch((error) => {
      console.error('[SonarQuiz] Initialization failed:', error);
    });
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
