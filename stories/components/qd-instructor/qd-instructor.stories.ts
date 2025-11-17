/**
 * Storybook stories for qd-instructor component
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../src/components/qd-instructor/qd-instructor.js';
import type { QdInstructor } from '../../../src/components/qd-instructor/qd-instructor.js';
import type { StudentRecord } from '../../../src/types/contracts.js';

const meta: Meta = {
  title: 'Components/QdInstructor',
  component: 'qd-instructor',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// Sample student data
const mockStudents: StudentRecord[] = [
  {
    schema: 1,
    docId: 'doc-1',
    updated: '2025-01-15T10:00:00Z',
    serviceId: 'TEST001',
    name: 'Alice Johnson',
    release: '01-2025',
    attempted: 15,
    correct: 12,
    pages: {
      'quiz-1': {
        state: 'complete',
        answers: [
          { answer: 'a', success: true, timestamp: '2025-01-15T09:00:00Z' },
          { answer: 'b', success: true, timestamp: '2025-01-15T09:01:00Z' },
        ],
      },
      'quiz-2': {
        state: 'incomplete',
        answers: [
          { answer: '42', success: false, timestamp: '2025-01-15T09:30:00Z' },
        ],
      },
    },
  },
  {
    schema: 1,
    docId: 'doc-2',
    updated: '2025-01-15T11:00:00Z',
    serviceId: 'TEST002',
    name: 'Bob Smith',
    release: '01-2025',
    attempted: 10,
    correct: 10,
    pages: {
      'quiz-1': {
        state: 'complete',
        answers: [
          { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00Z' },
          { answer: 'b', success: true, timestamp: '2025-01-15T10:01:00Z' },
        ],
      },
    },
  },
];

/**
 * Default locked state - shows unlock form
 *
 * **Test Password:** `instructor123`
 *
 * **How it works:** The password hash is read from a hidden DOM element with `id="instructor.password.hash"`.
 * This element is injected by the Oxygen XSL transform during DITA publishing. This allows different
 * passwords per deployment without rebuilding the JavaScript bundle.
 *
 * **Generate Hash:**
 * ```bash
 * echo -n "your-password" | openssl dgst -sha256
 * ```
 */
export const Locked: Story = {
  render: () => {
    // Hash for "instructor123"
    const passwordHash = 'c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5';

    return html`
      <div>
        <!-- Hidden password hash element (mimics Oxygen XSL injection) -->
        <span id="instructor.password.hash" style="display:none;">${passwordHash}</span>

        <div style="background: #f0f0f0; padding: 16px; margin-bottom: 16px; border-radius: 4px; font-family: monospace; font-size: 12px;">
          <strong>🔐 Instructor Password Required</strong><br/>
          <br/>
          <strong>Test Password:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 3px;">instructor123</code><br/>
          <br/>
          <strong>Password Storage:</strong> The hash is read from a hidden DOM element <code>&lt;span id="instructor.password.hash"&gt;</code>
          injected by Oxygen XSL transform. This story includes the hash for "instructor123".<br/>
          <br/>
          <strong>Generate a hash:</strong><br/>
          <code>echo -n "your-password" | openssl dgst -sha256</code><br/>
          <br/>
          <strong>Rate Limiting:</strong> After 5 failed attempts, the form will lock with exponential backoff (2s, 4s, 8s, 16s, 30s max).
        </div>
        <qd-instructor></qd-instructor>
      </div>
    `;
  },
};

/**
 * Unlocked state with student data
 *
 * This story bypasses authentication to show the unlocked instructor panel with sample data.
 * The horizontal layout includes: View Scores | Export CSV | Erase All Data | Logout
 */
export const Unlocked: Story = {
  render: () => {
    const container = html`
      <div>
        <div style="background: #e7f3ff; padding: 12px; margin-bottom: 16px; border-radius: 4px; font-size: 13px;">
          <strong>ℹ️ Unlocked State:</strong> This story shows the instructor panel with 2 sample students (Alice: 80% completion, Bob: 100% completion).
        </div>
        <qd-instructor></qd-instructor>
      </div>
    `;

    // Unlock and set data after render
    setTimeout(() => {
      const element = document.querySelector('qd-instructor') as QdInstructor;
      if (element) {
        element.unlock();
        element.setStudents(mockStudents);
      }
    }, 100);

    return container;
  },
};

/**
 * Unlocked with no student data
 *
 * Shows the instructor panel when no students have submitted data yet.
 * The Export CSV button will be disabled, and the scores modal will show "No student data available".
 */
export const UnlockedNoData: Story = {
  render: () => {
    const container = html`
      <div>
        <div style="background: #fff3cd; padding: 12px; margin-bottom: 16px; border-radius: 4px; font-size: 13px;">
          <strong>⚠️ Empty State:</strong> No student data available. Export and View Scores buttons will reflect this state.
        </div>
        <qd-instructor></qd-instructor>
      </div>
    `;

    setTimeout(() => {
      const element = document.querySelector('qd-instructor') as QdInstructor;
      if (element) {
        element.unlock();
        element.setStudents([]);
      }
    }, 100);

    return container;
  },
};
