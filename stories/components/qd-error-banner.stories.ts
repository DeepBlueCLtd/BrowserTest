/**
 * Storybook stories for qd-error-banner component
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-error-banner.js';

const meta: Meta = {
  title: 'Components/QdErrorBanner',
  component: 'qd-error-banner',
  tags: ['autodocs'],
  argTypes: {
    message: { control: 'text' },
    severity: {
      control: 'select',
      options: ['error', 'warning', 'info'],
    },
    dismissable: { control: 'boolean' },
    autoDismissMs: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Error severity banner for validation errors and critical issues
 */
export const Error: Story = {
  args: {
    message: 'Invalid quiz table format: Expected 3 columns, found 2',
    severity: 'error',
    dismissable: true,
    autoDismissMs: 0,
  },
  render: (args) => html`
    <qd-error-banner
      message=${args.message}
      severity=${args.severity}
      ?dismissable=${args.dismissable}
      autoDismissMs=${args.autoDismissMs}
    ></qd-error-banner>
  `,
};

/**
 * Warning severity banner for non-critical issues
 */
export const Warning: Story = {
  args: {
    message: 'Question 5 has no correct answer specified',
    severity: 'warning',
    dismissable: true,
    autoDismissMs: 0,
  },
  render: (args) => html`
    <qd-error-banner
      message=${args.message}
      severity=${args.severity}
      ?dismissable=${args.dismissable}
      autoDismissMs=${args.autoDismissMs}
    ></qd-error-banner>
  `,
};

/**
 * Info severity banner for helpful information
 */
export const Info: Story = {
  args: {
    message: 'Quiz data saved successfully',
    severity: 'info',
    dismissable: true,
    autoDismissMs: 0,
  },
  render: (args) => html`
    <qd-error-banner
      message=${args.message}
      severity=${args.severity}
      ?dismissable=${args.dismissable}
      autoDismissMs=${args.autoDismissMs}
    ></qd-error-banner>
  `,
};

/**
 * Auto-dismissing banner (dismisses after 3 seconds)
 */
export const AutoDismiss: Story = {
  args: {
    message: 'This message will disappear in 3 seconds',
    severity: 'info',
    dismissable: true,
    autoDismissMs: 3000,
  },
  render: (args) => html`
    <div>
      <p style="color: #666; font-size: 13px; margin-bottom: 8px;">
        ℹ️ This banner will auto-dismiss after 3 seconds
      </p>
      <qd-error-banner
        message=${args.message}
        severity=${args.severity}
        ?dismissable=${args.dismissable}
        autoDismissMs=${args.autoDismissMs}
      ></qd-error-banner>
    </div>
  `,
};

/**
 * Non-dismissable banner (no close button)
 */
export const NonDismissable: Story = {
  args: {
    message: 'Critical error: Cannot proceed without fixing this issue',
    severity: 'error',
    dismissable: false,
    autoDismissMs: 0,
  },
  render: (args) => html`
    <qd-error-banner
      message=${args.message}
      severity=${args.severity}
      ?dismissable=${args.dismissable}
      autoDismissMs=${args.autoDismissMs}
    ></qd-error-banner>
  `,
};
