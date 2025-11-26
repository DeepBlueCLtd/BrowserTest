/**
 * Storybook stories for qd-password-modal component
 *
 * Demonstrates password modal with various states.
 * Feature: 007-lit-component-refactor
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-password-modal.js';

const meta: Meta = {
  title: 'Components/PasswordModal',
  component: 'qd-password-modal',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Password entry modal for authentication flows.

**Features:**
- Password input with placeholder
- Custom title support
- Error display capability
- Cancel and Submit buttons
- Uses qd-modal base for backdrop, Escape key, focus trap
- Auto-focuses password input on open

**Properties:**
- \`open\`: Boolean - whether modal is visible
- \`title\`: String - modal header (default: "Enter Password")
- \`error\`: String - error message to display

**Events:**
- \`qd:password-submit\`: Emitted with { password } when form is submitted
- \`close\`: Emitted when modal closes
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Default
 *
 * Basic password modal with default title.
 */
export const Default: Story = {
  render: () => html` <qd-password-modal open></qd-password-modal> `,
};

/**
 * Custom Title
 *
 * Password modal with custom header text.
 */
export const CustomTitle: Story = {
  render: () => html` <qd-password-modal open title="Instructor Login"></qd-password-modal> `,
};

/**
 * With Error
 *
 * Shows error message state.
 */
export const WithError: Story = {
  render: () => html`
    <qd-password-modal open title="Instructor Login" error="Incorrect password"></qd-password-modal>
  `,
};

/**
 * Multiple Errors
 *
 * Shows different error messages.
 */
export const PasswordNotConfigured: Story = {
  render: () => html`
    <qd-password-modal
      open
      title="Instructor Login"
      error="Instructor password not configured"
    ></qd-password-modal>
  `,
};

/**
 * Interactive Open/Close
 *
 * Demonstrates opening and closing the modal.
 */
export const Interactive: Story = {
  render: () => {
    const openModal = () => {
      const modal = document.querySelector('qd-password-modal');
      modal?.show();
    };

    const handleSubmit = (e: Event) => {
      const detail = (e as CustomEvent<{ password: string }>).detail;
      // eslint-disable-next-line no-alert
      alert(`Password submitted: ${detail.password.substring(0, 3)}***`);
      const modal = document.querySelector('qd-password-modal');
      modal?.close();
    };

    return html`
      <div style="padding: 20px;">
        <button
          @click=${openModal}
          style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Open Instructor Login
        </button>

        <qd-password-modal
          title="Instructor Login"
          @qd:password-submit=${handleSubmit}
          @close=${() => {
            /* modal closed */
          }}
        ></qd-password-modal>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the button to open the modal. Enter a password and click Login to submit, or
            Cancel/Escape to close.
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * Error Clear on Input
 *
 * Demonstrates that error clears when user types.
 */
export const ErrorClearsOnInput: Story = {
  render: () => html`
    <div style="padding: 20px;">
      <qd-password-modal
        open
        title="Try Again"
        error="Incorrect password - start typing to clear this error"
      ></qd-password-modal>
    </div>
  `,
};
