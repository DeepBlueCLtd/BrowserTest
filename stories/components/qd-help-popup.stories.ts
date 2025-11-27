/**
 * Storybook stories for qd-help-popup component
 *
 * Demonstrates the help popup modal with various content configurations.
 * Feature: 008-user-guidance-popups
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-help-popup.js';
import '../../src/components/qd-help-trigger.js';

const meta: Meta = {
  title: 'Components/HelpPopup',
  component: 'qd-help-popup',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A modal popup that displays contextual help content.

**Features:**
- Portal rendering to document.body for proper z-index
- Customizable title and HTML content
- Multiple close methods: Escape key, backdrop click, close button
- Focus management (focuses close button, restores on close)
- Accessible (role="dialog", aria-modal, aria-labelledby)

**Properties:**
- \`open\`: Boolean - whether popup is visible
- \`title\`: String - popup header text (default: "Help")
- \`content\`: String - HTML content to display

**Events:**
- \`qd:modal-close\`: Emitted when popup closes

**Accessibility:**
- Dialog role with aria-modal="true"
- aria-labelledby points to title
- Close button has aria-label="Close"
- Focus trapped in popup while open
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Login Help
 *
 * Help content for the login panel.
 */
export const LoginHelp: Story = {
  render: () => html`
    <qd-help-popup
      open
      title="Login Help"
      .content=${'<h3>Welcome to BrowserTest</h3><p>Enter your Service ID and name to log in as a student and track your quiz progress.</p><p>Instructors: Click the "Instructor" button to access admin features.</p>'}
    >
    </qd-help-popup>
  `,
};

/**
 * Status Help
 *
 * Help content for the student status panel.
 */
export const StatusHelp: Story = {
  render: () => html`
    <qd-help-popup
      open
      title="Understanding Your Score"
      .content=${'<h3>Understanding Your Score</h3><p>Your score reflects your progress on quiz pages you have visited.</p><p><strong>Green</strong> = All questions correct<br><strong>Amber</strong> = Some questions answered<br><strong>Red</strong> = No questions answered</p>'}
    >
    </qd-help-popup>
  `,
};

/**
 * Instructor Help
 *
 * Help content for the instructor panel.
 */
export const InstructorHelp: Story = {
  render: () => html`
    <qd-help-popup
      open
      title="Instructor Tools"
      .content=${'<h3>Instructor Tools</h3><p><strong>View Scores</strong>: See all student results.</p><p><strong>Export CSV</strong>: Download detailed answer data.</p><p><strong>Erase Data</strong>: Clear database for new student cohort.</p>'}
    >
    </qd-help-popup>
  `,
};

/**
 * Custom Content
 *
 * Shows how HTML content is rendered.
 */
export const CustomContent: Story = {
  render: () => html`
    <qd-help-popup
      open
      title="Custom Help"
      .content=${'<h3>Getting Started</h3><p>This is a <strong>custom</strong> help popup with <em>formatted</em> content.</p><ul><li>First item</li><li>Second item</li><li>Third item</li></ul><p>Contact: <a href="mailto:support@example.com">support@example.com</a></p>'}
    >
    </qd-help-popup>
  `,
};

/**
 * Interactive
 *
 * Demonstrates opening and closing the popup with the trigger button.
 */
export const Interactive: Story = {
  render: () => {
    const openPopup = () => {
      const popup = document.querySelector('#interactive-popup') as HTMLElement & { open: boolean };
      if (popup) {
        popup.open = true;
      }
    };

    const closePopup = () => {
      const popup = document.querySelector('#interactive-popup') as HTMLElement & { open: boolean };
      if (popup) {
        popup.open = false;
      }
    };

    return html`
      <div style="padding: 20px;">
        <div
          style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
        >
          <span style="font-weight: 600; font-size: 16px;">Click for Help</span>
          <qd-help-trigger panelType="login" @qd:help-open=${openPopup}></qd-help-trigger>
        </div>

        <qd-help-popup
          id="interactive-popup"
          title="Login Help"
          .content=${'<h3>Welcome to BrowserTest</h3><p>Enter your Service ID and name to log in as a student and track your quiz progress.</p><p>Instructors: Click the "Instructor" button to access admin features.</p><p><strong>Contact:</strong> support@example.com</p>'}
          @qd:modal-close=${closePopup}
        >
        </qd-help-popup>

        <div
          style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the ? button to open the help popup. Close with Escape, backdrop click, or the ×
            button.
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * All Three Panels
 *
 * Side-by-side comparison of all three help content types.
 */
export const AllThreePanels: Story = {
  render: () => {
    const openPopup = (id: string) => () => {
      const popup = document.querySelector(`#${id}`) as HTMLElement & { open: boolean };
      if (popup) popup.open = true;
    };

    const closePopup = (id: string) => () => {
      const popup = document.querySelector(`#${id}`) as HTMLElement & { open: boolean };
      if (popup) popup.open = false;
    };

    return html`
      <div style="padding: 20px;">
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div
            style="flex: 1; min-width: 200px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600;">Login Panel</span>
              <qd-help-trigger
                panelType="login"
                @qd:help-open=${openPopup('login-help')}
              ></qd-help-trigger>
            </div>
          </div>

          <div
            style="flex: 1; min-width: 200px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600;">Status Panel</span>
              <qd-help-trigger
                panelType="status"
                @qd:help-open=${openPopup('status-help')}
              ></qd-help-trigger>
            </div>
          </div>

          <div
            style="flex: 1; min-width: 200px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600;">Instructor Panel</span>
              <qd-help-trigger
                panelType="instructor"
                @qd:help-open=${openPopup('instructor-help')}
              ></qd-help-trigger>
            </div>
          </div>
        </div>

        <qd-help-popup
          id="login-help"
          title="Login Help"
          .content=${'<h3>Welcome to BrowserTest</h3><p>Enter your Service ID and name to log in as a student and track your quiz progress.</p><p>Instructors: Click the "Instructor" button to access admin features.</p>'}
          @qd:modal-close=${closePopup('login-help')}
        >
        </qd-help-popup>

        <qd-help-popup
          id="status-help"
          title="Understanding Your Score"
          .content=${'<h3>Understanding Your Score</h3><p>Your score reflects your progress on quiz pages you have visited.</p><p><strong>Green</strong> = All questions correct<br><strong>Amber</strong> = Some questions answered<br><strong>Red</strong> = No questions answered</p>'}
          @qd:modal-close=${closePopup('status-help')}
        >
        </qd-help-popup>

        <qd-help-popup
          id="instructor-help"
          title="Instructor Tools"
          .content=${'<h3>Instructor Tools</h3><p><strong>View Scores</strong>: See all student results.</p><p><strong>Export CSV</strong>: Download detailed answer data.</p><p><strong>Erase Data</strong>: Clear database for new student cohort.</p>'}
          @qd:modal-close=${closePopup('instructor-help')}
        >
        </qd-help-popup>
      </div>
    `;
  },
};
