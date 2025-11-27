/**
 * Storybook stories for qd-confirm-dialog component
 *
 * Demonstrates confirmation dialogs with various states.
 * Feature: 007-lit-component-refactor
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-confirm-dialog.js';

const meta: Meta = {
  title: 'Components/ConfirmDialog',
  component: 'qd-confirm-dialog',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Reusable confirmation dialog for destructive or important actions.

**Features:**
- Customizable title and message (supports HTML)
- Configurable button text for confirm/cancel
- Destructive mode (red confirm button)
- Uses qd-modal base for backdrop, Escape key, focus management
- Emits qd:confirm and qd:cancel events

**Properties:**
- \`open\`: Boolean - whether dialog is visible
- \`title\`: String - dialog header (default: "Confirm")
- \`message\`: String - body text (supports HTML)
- \`confirmText\`: String - confirm button text (default: "Confirm")
- \`cancelText\`: String - cancel button text (default: "Cancel")
- \`destructive\`: Boolean - red confirm button styling

**Events:**
- \`qd:confirm\`: Emitted when confirm button is clicked
- \`qd:cancel\`: Emitted when cancel button is clicked or dialog dismissed
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
 * Basic confirmation dialog with default styling.
 */
export const Default: Story = {
  render: () => html`
    <qd-confirm-dialog open title="Confirm Action" message="Are you sure you want to proceed?">
    </qd-confirm-dialog>
  `,
};

/**
 * Destructive Action
 *
 * Confirmation for a destructive action with red button.
 */
export const DestructiveAction: Story = {
  render: () => html`
    <qd-confirm-dialog
      open
      title="Delete Item"
      message="This action cannot be undone. All data will be permanently removed."
      confirmText="Delete"
      cancelText="Keep"
      destructive
    >
    </qd-confirm-dialog>
  `,
};

/**
 * Custom Button Text
 *
 * Dialog with customized confirm and cancel buttons.
 */
export const CustomButtonText: Story = {
  render: () => html`
    <qd-confirm-dialog
      open
      title="Save Changes"
      .message=${'You have unsaved changes. Would you like to save before leaving?'}
      confirmText="Save &amp; Exit"
      cancelText="Discard Changes"
    >
    </qd-confirm-dialog>
  `,
};

/**
 * HTML Message
 *
 * Message with HTML formatting.
 */
export const HtmlMessage: Story = {
  render: () => html`
    <qd-confirm-dialog
      open
      title="Reset PIN"
      .message=${"Reset PIN for <strong>John Smith</strong> (ID: RS1234)?<br><span style='font-size: 11px; color: #666;'>They will need to create a new PIN on next login.</span>"}
      confirmText="Reset PIN"
      destructive
    >
    </qd-confirm-dialog>
  `,
};

/**
 * Interactive
 *
 * Demonstrates opening, confirming, and canceling.
 */
export const Interactive: Story = {
  render: () => {
    const openDialog = () => {
      const dialog = document.querySelector('qd-confirm-dialog');
      dialog?.show();
    };

    const handleConfirm = () => {
      alert('Confirmed!');
    };

    const handleCancel = () => {
      alert('Cancelled');
    };

    return html`
      <div style="padding: 20px;">
        <button
          @click=${openDialog}
          style="padding: 8px 16px; background: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Delete Item
        </button>

        <qd-confirm-dialog
          title="Delete Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          destructive
          @qd:confirm=${handleConfirm}
          @qd:cancel=${handleCancel}
        >
        </qd-confirm-dialog>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the button to open the confirmation dialog. Choose Confirm or Cancel (or press
            Escape) to close.
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * Non-Destructive Confirmation
 *
 * Standard blue confirm button for non-dangerous actions.
 */
export const NonDestructive: Story = {
  render: () => html`
    <qd-confirm-dialog
      open
      title="Publish Document"
      message="This document will be published and visible to all users."
      confirmText="Publish"
      cancelText="Cancel"
    >
    </qd-confirm-dialog>
  `,
};
