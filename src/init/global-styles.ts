/**
 * Global style injection.
 *
 * Owns the single global CSS literal required by the quiz system (the only
 * non-Shadow-DOM CSS) and injects it once. Extracted from `bootstrap.ts` so the
 * bootstrap module stays a thin sequencer.
 */

import { info } from '../utils/logger.js';

/** Global CSS injected once into <head>. */
const GLOBAL_CSS = `
    /* Sonar Quiz System - Global Styles */
    .qd-hidden {
      display: none !important;
    }

    /* Quiz table interactive mode styles */
    .qd-quiz-interactive .qd-quiz-input {
      width: 100%;
      padding: 0.5rem;
      font-size: inherit;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    /* Ensure select elements inherit font properly */
    .qd-quiz-interactive select.qd-quiz-input {
      font-family: inherit;
      font-size: inherit;
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

    /* Instructor-mode student answers/entries are now rendered by the
       Shadow-DOM <qd-student-answers> / <qd-student-entries> components, which
       own their styles. No global rules are needed here. */

    /* Modal error message styles (needed because qd-modal moves to body) */
    .error-message {
      color: #d32f2f;
      font-size: 12px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
      border-left: 3px solid #d32f2f;
    }
  `;

/**
 * Inject the global CSS once. Must be called before any table enhancement.
 */
export function injectGlobalStyles(): void {
  // Check if styles already injected
  if (document.getElementById('qd-global-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'qd-global-styles';
  style.textContent = GLOBAL_CSS;

  document.head.appendChild(style);
  info('Global styles injected');
}
