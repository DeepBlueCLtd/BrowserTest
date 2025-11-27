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
    body: `
      <h3>Welcome to BrowserTest</h3>
      <p>Enter your Service ID and name to log in as a student and track your quiz progress.</p>
      <p><strong>Instructors:</strong> Click the "Instructor" button to access admin features.</p>
    `,
  },

  status: {
    title: 'Understanding Your Score',
    body: `
      <h3>Score Indicators</h3>
      <p>Your score reflects your progress on quiz pages you have visited.</p>
      <p>
        <strong style="color:#4caf50">Green</strong> = All questions answered correctly<br>
        <strong style="color:#ff9800">Amber</strong> = Some questions answered<br>
        <strong style="color:#d32f2f">Red</strong> = No questions answered yet
      </p>
    `,
  },

  instructor: {
    title: 'Instructor Tools',
    body: `
      <h3>Available Features</h3>
      <p><strong>Show Student Answers:</strong> Toggle to display student responses on the current page.</p>
      <p><strong>View All Scores:</strong> See summary of all student results.</p>
      <p><strong>Reset PINs:</strong> Clear student PIN codes if they need to re-authenticate.</p>
      <p><strong>Export CSV:</strong> Download detailed answer data for analysis.</p>
      <p><strong>Erase All Data:</strong> Clear the database for a new student cohort.</p>
    `,
  },
};

/**
 * Get help content for a panel type
 */
export function getHelpContent(panelType: HelpPanelType): HelpContent {
  return HELP_CONTENT[panelType];
}
