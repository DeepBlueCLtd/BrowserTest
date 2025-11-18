/**
 * Storybook stories for qd-storage-monitor component
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-storage-monitor.js';

const meta: Meta = {
  title: 'Components/QdStorageMonitor',
  component: 'qd-storage-monitor',
  tags: ['autodocs'],
  argTypes: {
    dbName: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Storage monitor for development debugging
 *
 * **Features:**
 * - Real-time IndexedDB and sessionStorage inspection
 * - Expand/collapse JSON objects
 * - Clear individual keys or all storage
 * - Keyboard shortcut: `Ctrl+Shift+D` to toggle visibility
 * - Auto-injected when `data-debug="true"` on script tag
 *
 * **Usage:**
 * ```html
 * <qd-storage-monitor dbName="BrowserTest"></qd-storage-monitor>
 * ```
 */
export const Default: Story = {
  args: {
    dbName: 'BrowserTest',
  },
  render: (args) => {
    // Add some sample sessionStorage data
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'qd/session',
        JSON.stringify({
          serviceId: 'TEST001',
          name: 'John Doe',
          release: '01-2025',
          loginTime: new Date().toISOString(),
        }),
      );
      sessionStorage.setItem(
        'qd/cache',
        JSON.stringify({
          'quiz-1': { state: 'complete', attempted: 5, correct: 4 },
          'quiz-2': { state: 'incomplete', attempted: 2, correct: 1 },
        }),
      );
    }

    return html`
      <div>
        <div
          style="background: #f0f0f0; padding: 16px; margin-bottom: 16px; border-radius: 4px; font-size: 13px;"
        >
          <strong>🔍 Storage Monitor (Development Tool)</strong><br />
          <br />
          <strong>Keyboard Shortcut:</strong> Press
          <kbd
            style="background: white; padding: 2px 6px; border: 1px solid #ccc; border-radius: 3px;"
            >Ctrl+Shift+D</kbd
          >
          to toggle visibility<br />
          <br />
          <strong>Features:</strong>
          <ul style="margin: 8px 0; padding-left: 20px;">
            <li>Real-time IndexedDB inspection</li>
            <li>SessionStorage viewer</li>
            <li>Expand/collapse JSON objects</li>
            <li>Clear individual keys or all storage</li>
          </ul>
          <strong>Note:</strong> The monitor starts hidden. Use the keyboard shortcut to show it in
          the bottom-right corner.
        </div>
        <qd-storage-monitor dbName=${args.dbName}></qd-storage-monitor>
      </div>
    `;
  },
};

/**
 * Custom database name
 *
 * Configure the IndexedDB database name to monitor a different database.
 */
export const CustomDatabase: Story = {
  args: {
    dbName: 'MyCustomDB',
  },
  render: (args) => html`
    <div>
      <p style="color: #666; font-size: 13px; margin-bottom: 8px;">
        Monitoring IndexedDB database: <strong>${args.dbName}</strong>
      </p>
      <qd-storage-monitor dbName=${args.dbName}></qd-storage-monitor>
    </div>
  `,
};

/**
 * Always visible (for demonstration)
 *
 * This story shows the monitor with `hidden="false"` for easier preview.
 */
export const AlwaysVisible: Story = {
  args: {
    dbName: 'BrowserTest',
  },
  render: (args) => {
    // Add sample data
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('demo-key-1', 'Simple string value');
      sessionStorage.setItem('demo-key-2', JSON.stringify({ nested: { data: true } }));
    }

    return html`
      <div>
        <p style="color: #666; font-size: 13px; margin-bottom: 8px;">
          ℹ️ This story shows the monitor always visible for demonstration purposes.
        </p>
        <qd-storage-monitor dbName=${args.dbName} hidden="false"></qd-storage-monitor>
      </div>
    `;
  },
};
