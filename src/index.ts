/**
 * Sonar Quiz System - Main Entry Point
 * Version: 0.1.0
 *
 * This is the main entry point for the Sonar Quiz System.
 * In Phase 0, this file contains minimal bootstrap code.
 * Full implementation will be added in subsequent phases.
 */

import { CSS_CLASSES, ELEMENT_IDS } from './types/contracts.js';

/**
 * Initialize the Sonar Quiz System
 * This function is called automatically on DOMContentLoaded
 */
function init() {
  // Phase 0: Bootstrap complete
  // Phase 1+: Will add table detection and enhancement logic

  // Debug logging disabled in production
  if (process.env.NODE_ENV === 'development') {
    console.warn('[SonarQuiz] Initializing...');
    console.warn('[SonarQuiz] Phase 0 - Bootstrap complete');
    console.warn('[SonarQuiz] Looking for tables with classes:', CSS_CLASSES);
    console.warn('[SonarQuiz] Looking for status panel with ID:', ELEMENT_IDS.STATUS_PANEL);
  }
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// Export for ESM consumers
export { init };

// IIFE global export
if (typeof window !== 'undefined') {
  interface WindowWithSonarQuiz extends Window {
    SonarQuiz?: { init: typeof init };
  }
  (window as WindowWithSonarQuiz).SonarQuiz = { init };
}
