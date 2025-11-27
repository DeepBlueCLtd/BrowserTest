/**
 * Storybook stories for qd-help-trigger component
 *
 * Demonstrates the help icon trigger button with various configurations.
 * Feature: 008-user-guidance-popups
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-help-trigger.js';

const meta: Meta = {
  title: 'Components/HelpTrigger',
  component: 'qd-help-trigger',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A small help icon button (?) that triggers contextual help popups.

**Features:**
- Circular blue button with white "?" icon
- Keyboard accessible (focusable button)
- Emits qd:help-open event with panelType detail
- Three panel types: login, status, instructor

**Properties:**
- \`panelType\`: String - which panel this trigger belongs to ('login' | 'status' | 'instructor')

**Events:**
- \`qd:help-open\`: CustomEvent<{panelType: string}> - Emitted when button is clicked

**Accessibility:**
- \`aria-label="Help"\`
- \`title="Help"\`
- Native button element (keyboard accessible)
        `,
      },
    },
  },
  argTypes: {
    panelType: {
      control: { type: 'select' },
      options: ['login', 'status', 'instructor'],
      description: 'Which panel this trigger belongs to',
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Default
 *
 * Basic help trigger with default login panel type.
 */
export const Default: Story = {
  render: () => html` <qd-help-trigger></qd-help-trigger> `,
};

/**
 * Login Panel Type
 *
 * Help trigger for the login panel.
 */
export const LoginPanelType: Story = {
  render: () => html` <qd-help-trigger panelType="login"></qd-help-trigger> `,
};

/**
 * Status Panel Type
 *
 * Help trigger for the student status panel.
 */
export const StatusPanelType: Story = {
  render: () => html` <qd-help-trigger panelType="status"></qd-help-trigger> `,
};

/**
 * Instructor Panel Type
 *
 * Help trigger for the instructor panel.
 */
export const InstructorPanelType: Story = {
  render: () => html` <qd-help-trigger panelType="instructor"></qd-help-trigger> `,
};

/**
 * Interactive
 *
 * Click the button to see the event emitted.
 */
export const Interactive: Story = {
  render: () => {
    const handleHelpOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ panelType: string }>).detail;
      alert(`Help requested for: ${detail.panelType}`);
    };

    return html`
      <div style="padding: 20px;">
        <div style="display: flex; gap: 20px; align-items: center;">
          <div style="text-align: center;">
            <qd-help-trigger panelType="login" @qd:help-open=${handleHelpOpen}></qd-help-trigger>
            <div style="font-size: 12px; margin-top: 8px; color: #666;">Login</div>
          </div>
          <div style="text-align: center;">
            <qd-help-trigger panelType="status" @qd:help-open=${handleHelpOpen}></qd-help-trigger>
            <div style="font-size: 12px; margin-top: 8px; color: #666;">Status</div>
          </div>
          <div style="text-align: center;">
            <qd-help-trigger
              panelType="instructor"
              @qd:help-open=${handleHelpOpen}
            ></qd-help-trigger>
            <div style="font-size: 12px; margin-top: 8px; color: #666;">Instructor</div>
          </div>
        </div>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">Click any help button to see the event with its panelType.</p>
        </div>
      </div>
    `;
  },
};

/**
 * In Context
 *
 * Shows how the help trigger looks in a typical panel header.
 */
export const InContext: Story = {
  render: () => html`
    <div style="padding: 20px;">
      <div
        style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
      >
        <span style="font-weight: 600; font-size: 16px;">Login</span>
        <qd-help-trigger panelType="login"></qd-help-trigger>
      </div>

      <div
        style="margin-top: 16px; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
      >
        <span style="font-weight: 600; font-size: 16px;">Your Progress: 75%</span>
        <qd-help-trigger panelType="status"></qd-help-trigger>
      </div>

      <div
        style="margin-top: 16px; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
      >
        <span style="font-weight: 600; font-size: 16px;">Instructor Tools</span>
        <qd-help-trigger panelType="instructor"></qd-help-trigger>
      </div>
    </div>
  `,
};
