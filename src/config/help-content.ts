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
    body: '<p>Enter Service ID and name to log in. <strong>Instructors:</strong> click "Instructor" for admin.</p>',
  },

  status: {
    title: 'Your Score',
    body: '<p><strong style="color:#4caf50">Green</strong>=All correct <strong style="color:#ff9800">Amber</strong>=Some answered <strong style="color:#d32f2f">Red</strong>=None yet</p>',
  },

  instructor: {
    title: 'Instructor Tools',
    body: '<p><strong>Show Answers</strong>: See responses. <strong>View Scores</strong>: Student results. <strong>Export</strong>: CSV download. <strong>Erase</strong>: Clear data.</p>',
  },
};

/**
 * Get help content for a panel type
 */
export function getHelpContent(panelType: HelpPanelType): HelpContent {
  return HELP_CONTENT[panelType];
}
