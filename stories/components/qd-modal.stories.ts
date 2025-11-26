/**
 * Storybook stories for qd-modal component
 *
 * Demonstrates base modal component with backdrop, keyboard handling, and focus trap.
 * Feature: 007-lit-component-refactor
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-modal.js';

const meta: Meta = {
  title: 'Components/Modal',
  component: 'qd-modal',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Base modal component with common modal behavior.

**Features:**
- Open/close via \`open\` property or \`show()\`/\`close()\` methods
- Backdrop click to close (when closable=true)
- Escape key to close (when closable=true)
- Focus trap within modal content
- Modal collision: opening a new modal closes any existing open modal
- Slots for header and body content

**Properties:**
- \`open\`: Boolean - whether modal is visible
- \`closable\`: Boolean - whether backdrop/Escape closes modal (default: true)

**Events:**
- \`qd:modal-close\`: Emitted when modal closes via Escape or backdrop click

**Accessibility:**
- \`role="dialog"\` and \`aria-modal="true"\` on content container
- Focus automatically moves to first focusable element on open
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Default Modal
 *
 * Basic modal with header and body content.
 */
export const Default: Story = {
  render: () => {
    const openModal = () => {
      const modal = document.querySelector('qd-modal');
      modal?.show();
    };

    return html`
      <div style="padding: 20px;">
        <button
          @click=${openModal}
          style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Open Modal
        </button>

        <qd-modal>
          <span slot="header">Modal Title</span>
          <div>
            <p>This is the modal body content.</p>
            <p>Click outside or press Escape to close.</p>
          </div>
        </qd-modal>
      </div>
    `;
  },
};

/**
 * Initially Open
 *
 * Modal that starts open.
 */
export const InitiallyOpen: Story = {
  render: () => html`
    <qd-modal open>
      <span slot="header">Welcome</span>
      <div>
        <p>This modal is open by default.</p>
        <button
          style="padding: 6px 12px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          OK
        </button>
      </div>
    </qd-modal>
  `,
};

/**
 * Non-Closable Modal
 *
 * Modal that cannot be closed via backdrop or Escape (must use close() method).
 */
export const NonClosable: Story = {
  render: () => {
    const closeModal = () => {
      const modal = document.querySelector('qd-modal');
      modal?.close();
    };

    return html`
      <qd-modal open .closable=${false}>
        <span slot="header">Required Action</span>
        <div>
          <p>This modal requires explicit action to close.</p>
          <p style="color: #666; font-size: 14px;">Backdrop click and Escape key are disabled.</p>
          <button
            @click=${closeModal}
            style="margin-top: 12px; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            I Understand
          </button>
        </div>
      </qd-modal>
    `;
  },
};

/**
 * With Form Content
 *
 * Modal containing a form with focus management.
 */
export const WithForm: Story = {
  render: () => {
    const openModal = () => {
      const modal = document.querySelector('qd-modal');
      modal?.show();
    };

    return html`
      <div style="padding: 20px;">
        <button
          @click=${openModal}
          style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Open Form Modal
        </button>

        <qd-modal>
          <span slot="header">Login</span>
          <form style="display: flex; flex-direction: column; gap: 12px; min-width: 280px;">
            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Username</label>
              <input
                type="text"
                style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Password</label>
              <input
                type="password"
                style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
                placeholder="Enter password"
              />
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
              <button
                type="button"
                style="padding: 8px 16px; background: #9e9e9e; color: white; border: none; border-radius: 4px; cursor: pointer;"
              >
                Cancel
              </button>
              <button
                type="submit"
                style="padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;"
              >
                Login
              </button>
            </div>
          </form>
        </qd-modal>

        <div
          style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Note: Focus automatically moves to the first input when modal opens.
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * Modal Collision
 *
 * Demonstrates that opening a new modal closes existing one.
 */
export const ModalCollision: Story = {
  render: () => {
    const openModal1 = () => {
      const modal = document.getElementById('modal1') as HTMLElement & { show(): void };
      modal?.show();
    };

    const openModal2 = () => {
      const modal = document.getElementById('modal2') as HTMLElement & { show(): void };
      modal?.show();
    };

    return html`
      <div style="padding: 20px;">
        <div style="display: flex; gap: 8px;">
          <button
            @click=${openModal1}
            style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Open Modal 1
          </button>
          <button
            @click=${openModal2}
            style="padding: 8px 16px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Open Modal 2
          </button>
        </div>

        <qd-modal id="modal1">
          <span slot="header">Modal 1 (Blue)</span>
          <div>
            <p>This is the first modal.</p>
            <button
              @click=${openModal2}
              style="padding: 6px 12px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;"
            >
              Open Modal 2 (closes this one)
            </button>
          </div>
        </qd-modal>

        <qd-modal id="modal2">
          <span slot="header">Modal 2 (Orange)</span>
          <div>
            <p>This is the second modal.</p>
            <p style="color: #666; font-size: 14px;">Modal 1 was automatically closed.</p>
          </div>
        </qd-modal>

        <div
          style="margin-top: 20px; padding: 15px; background: #fff3e0; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Modal collision: When Modal 2 opens, Modal 1 is automatically closed. Only one modal can
            be open at a time.
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * Close Event
 *
 * Shows how to listen for the close event.
 */
export const CloseEvent: Story = {
  render: () => {
    const openModal = () => {
      const modal = document.querySelector('qd-modal');
      modal?.show();
    };

    setTimeout(() => {
      const modal = document.querySelector('qd-modal');
      const log = document.getElementById('event-log');
      modal?.addEventListener('qd:modal-close', () => {
        if (log) {
          const time = new Date().toLocaleTimeString();
          log.innerHTML += `<div>${time}: qd:modal-close event fired</div>`;
        }
      });
    }, 100);

    return html`
      <div style="padding: 20px;">
        <button
          @click=${openModal}
          style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Open Modal
        </button>

        <qd-modal>
          <span slot="header">Event Demo</span>
          <p>Close via backdrop or Escape to trigger event.</p>
        </qd-modal>

        <div
          id="event-log"
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-family: monospace; font-size: 12px; min-height: 60px;"
        >
          <div style="color: #666;">Event log:</div>
        </div>
      </div>
    `;
  },
};
