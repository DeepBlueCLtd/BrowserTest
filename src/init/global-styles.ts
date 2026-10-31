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

    /* Visually hidden text that screen readers still announce (SRD 013 A11Y-02) */
    .qd-sr-only {
      position: absolute !important;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
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

    /* Non-colour correctness cue: a mark plus hidden text (SRD 013 A11Y-02) */
    .qd-answer-feedback {
      display: inline-block;
      margin-top: 4px;
      font-size: 0.9em;
      font-weight: 600;
    }

    .qd-answer-correct .qd-answer-feedback {
      color: #1e7b34;
    }

    .qd-answer-incorrect .qd-answer-feedback {
      color: #b02a37;
    }

    /* Invalid numeric input message (SRD 013 UX-03) */
    .qd-input-error {
      display: block;
      margin-top: 4px;
      font-size: 0.85em;
      color: #b02a37;
    }

    .qd-quiz-interactive .qd-quiz-input[aria-invalid='true'] {
      border-color: #b02a37;
      outline-color: #b02a37;
    }

    /* Prompt shown above quiz tables while nobody is logged in (SRD 013 UX-05) */
    .qd-login-notice {
      margin: 0 0 8px;
      padding: 6px 10px;
      border-left: 3px solid #1d6fb8;
      background: #e8f1fb;
      color: #0b4f8a;
      font-size: 0.9em;
    }

    /*
     * Narrow screens: give the header's panel container its own full-width row
     * so the login and status panels stay on screen (SRD 013 UX-06)
     */
    /* !important: Oxygen's c-no-wrap and Bootstrap's navbar-collapse rules
       outrank a single class; these only touch elements we marked */
    @media (max-width: 1000px) {
      .qd-panel-host-parent {
        flex-wrap: wrap !important;
      }

      .qd-panel-host-parent > .qd-panel-host {
        flex: 1 1 100% !important;
        max-width: 100% !important;
        justify-content: flex-end;
      }

      .qd-panel-host qd-login,
      .qd-panel-host qd-status,
      .qd-panel-host qd-instructor {
        max-width: 100%;
      }
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
