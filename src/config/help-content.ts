/**
 * Help Content Configuration
 *
 * Centralized help text for all panels. Edit this file to update help content.
 * Feature: 008-user-guidance-popups
 */

export type HelpPanelType = 'login' | 'status' | 'instructor';

export interface HelpContent {
  title: string;
  body: string;
}

/**
 * Help content for each panel type
 */
export const HELP_CONTENT: Record<HelpPanelType, HelpContent> = {
  login: {
    title: 'Login Help',
    body: '<p>Enter <strong>Name</strong> and <strong>Service ID</strong> to log in.  Provide a new <strong>PIN</strong> if this is your first visit to this release of this document, otherwise use the PIN you previously created. Your instructor is able to reset PINs.  See the <b>Feedback</b> page for more support.</p><p> <strong>Instructors:</strong> click "Instructor" for instructor login page (password accompanies distribution).</p>',
  },

  status: {
    title: 'Student View',
    body: '<p>Page color coding:<ul><li><strong style="color:#4caf50">Green</strong>=All correct </li><li><strong style="color:#ff9800">Amber</strong>=Some answered </li><li><strong style="color:#d32f2f">Red</strong>=None yet</li></ul></p><p>You can view your overall progress at attempted questions in the <b>Test Progress</b> panel.</p>',
  },

  instructor: {
    title: 'Instructor Tools',
    body: '<p><ul><li><strong>Show current answers</strong>: Toggle for display of student answers for the current page.</li><li><strong>View All Scores</strong>: View table scores for all students.</li><li><strong>Reset PIN</strong>: Reset student PINs.</li><li><strong>Export CSV</strong>: CSV download of all scores/answers.</li><li><strong>Erase All Data</strong>: Clear all stored student data.</li></ul></p>',
  },
};

/**
 * Get help content for a panel type
 */
export function getHelpContent(panelType: HelpPanelType): HelpContent {
  return HELP_CONTENT[panelType];
}
