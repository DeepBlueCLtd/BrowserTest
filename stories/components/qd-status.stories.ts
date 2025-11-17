/**
 * Storybook stories for qd-status component
 *
 * Demonstrates student progress display with R/A/G badges and logout.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-status.js';
import { STORAGE_KEYS } from '../../src/types/contracts.js';
import type { SessionCache } from '../../src/types/contracts.js';

const meta: Meta = {
  title: 'Components/Status',
  component: 'qd-status',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Student quiz progress panel with R/A/G status indicators.

**Features:**
- Real-time progress tracking (answered, correct, percentage)
- R/A/G badges for page completion states:
  - 🟢 Green: All questions answered correctly (complete)
  - 🟠 Amber: Some answered or some incorrect (incomplete)
  - 🔴 Red: No answers provided (unstarted)
- Logout button
- Automatic updates via \`qd:state-changed\` events

**Event Emissions:**
- \`qd:logout\`: User clicked logout button

**Storage:**
Reads from sessionStorage key \`${STORAGE_KEYS.CACHE}\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Default Progress Display
 *
 * Shows typical student progress with mixed completion states.
 */
export const Default: Story = {
  render: () => {
    // Set up session cache with sample data
    const cache: SessionCache = {
      totals: { answered: 15, correct: 12 },
      pages: {
        'page-1': { state: 'complete', answered: 5, correct: 5, answers: [] },
        'page-2': { state: 'incomplete', answered: 5, correct: 4, answers: [] },
        'page-3': { state: 'incomplete', answered: 5, correct: 3, answers: [] },
        'page-4': { state: 'unstarted', answered: 0, correct: 0, answers: [] },
      },
    };
    sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));

    setTimeout(() => {
      const statusComponent = document.querySelector('qd-status');
      statusComponent?.addEventListener('qd:logout', () => {
        alert('Logout clicked! In production, this would clear session and return to login.');
      });

      // Trigger initial load
      const event = new CustomEvent('qd:state-changed');
      document.dispatchEvent(event);
    }, 100);

    return html`
      <div style="padding: 20px; max-width: 400px; margin: 0 auto;">
        <qd-status></qd-status>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0; font-weight: 500;">Current Stats:</p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>15 questions answered, 12 correct (80%)</li>
            <li>🟢 1 page complete</li>
            <li>🟠 2 pages incomplete</li>
            <li>🔴 1 page not started</li>
          </ul>
        </div>
      </div>
    `;
  },
};

/**
 * Empty State
 *
 * Shows panel when student hasn't answered any questions yet.
 */
export const EmptyState: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 0, correct: 0 },
      pages: {
        'page-1': { state: 'unstarted', answered: 0, correct: 0, answers: [] },
        'page-2': { state: 'unstarted', answered: 0, correct: 0, answers: [] },
        'page-3': { state: 'unstarted', answered: 0, correct: 0, answers: [] },
      },
    };
    sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));

    setTimeout(() => {
      const event = new CustomEvent('qd:state-changed');
      document.dispatchEvent(event);
    }, 100);

    return html`
      <div style="padding: 20px; max-width: 400px; margin: 0 auto;">
        <qd-status></qd-status>

        <div
          style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            📝 This shows a student's initial state before answering any questions. All pages show
            as "Not Started" (red).
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * Perfect Score
 *
 * Shows panel when student has answered everything correctly.
 */
export const PerfectScore: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 20, correct: 20 },
      pages: {
        'page-1': { state: 'complete', answered: 5, correct: 5, answers: [] },
        'page-2': { state: 'complete', answered: 5, correct: 5, answers: [] },
        'page-3': { state: 'complete', answered: 5, correct: 5, answers: [] },
        'page-4': { state: 'complete', answered: 5, correct: 5, answers: [] },
      },
    };
    sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));

    setTimeout(() => {
      const event = new CustomEvent('qd:state-changed');
      document.dispatchEvent(event);
    }, 100);

    return html`
      <div style="padding: 20px; max-width: 400px; margin: 0 auto;">
        <qd-status></qd-status>

        <div
          style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0; font-weight: 500; color: #2e7d32;">✅ Perfect score!</p>
          <p style="margin: 10px 0 0 0;">20/20 correct (100%). All 4 pages complete (green).</p>
        </div>
      </div>
    `;
  },
};

/**
 * Low Score
 *
 * Shows panel with mostly incorrect answers.
 */
export const LowScore: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 20, correct: 6 },
      pages: {
        'page-1': { state: 'incomplete', answered: 5, correct: 2, answers: [] },
        'page-2': { state: 'incomplete', answered: 5, correct: 1, answers: [] },
        'page-3': { state: 'incomplete', answered: 5, correct: 2, answers: [] },
        'page-4': { state: 'incomplete', answered: 5, correct: 1, answers: [] },
      },
    };
    sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));

    setTimeout(() => {
      const event = new CustomEvent('qd:state-changed');
      document.dispatchEvent(event);
    }, 100);

    return html`
      <div style="padding: 20px; max-width: 400px; margin: 0 auto;">
        <qd-status></qd-status>

        <div
          style="margin-top: 20px; padding: 15px; background: #ffebee; border-left: 4px solid #d32f2f; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0; font-weight: 500; color: #c62828;">⚠️ Low score</p>
          <p style="margin: 10px 0 0 0;">
            6/20 correct (30%). All pages incomplete (amber) due to incorrect answers.
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * Real-time Updates
 *
 * Demonstrates live updates when student answers change.
 */
export const RealTimeUpdates: Story = {
  render: () => {
    let answerCount = 5;
    let correctCount = 4;

    const updateCache = () => {
      const cache: SessionCache = {
        totals: { answered: answerCount, correct: correctCount },
        pages: {
          'page-1': {
            state: answerCount >= 5 && correctCount === answerCount ? 'complete' : 'incomplete',
            answered: Math.min(answerCount, 5),
            correct: Math.min(correctCount, 5),
            answers: [],
          },
        },
      };
      sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));

      // Dispatch update event
      const event = new CustomEvent('qd:state-changed');
      document.dispatchEvent(event);
    };

    // Initial state
    updateCache();

    return html`
      <div style="padding: 20px; max-width: 400px; margin: 0 auto;">
        <qd-status></qd-status>

        <div
          style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0; font-weight: 500;">Simulate Answer Changes:</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button
              style="padding: 6px 12px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
              @click=${() => {
                answerCount += 1;
                correctCount += 1;
                updateCache();
              }}
            >
              ➕ Add Correct Answer
            </button>
            <button
              style="padding: 6px 12px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
              @click=${() => {
                answerCount += 1;
                updateCache();
              }}
            >
              ➕ Add Wrong Answer
            </button>
            <button
              style="padding: 6px 12px; background: #9e9e9e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
              @click=${() => {
                answerCount = 0;
                correctCount = 0;
                updateCache();
              }}
            >
              🔄 Reset
            </button>
          </div>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
            Watch the panel update in real-time as you click the buttons above.
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * Minimal Example
 *
 * Bare component without extra decoration.
 */
export const MinimalExample: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 10, correct: 7 },
      pages: {
        'page-1': { state: 'complete', answered: 5, correct: 5, answers: [] },
        'page-2': { state: 'incomplete', answered: 5, correct: 2, answers: [] },
      },
    };
    sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));

    setTimeout(() => {
      const event = new CustomEvent('qd:state-changed');
      document.dispatchEvent(event);
    }, 100);

    return html`<qd-status></qd-status>`;
  },
};
