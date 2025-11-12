/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-status';
import type { QdStatus } from '../../src/components/qd-status';

/**
 * The `qd-status` component displays student quiz progress with color-coded
 * status indicators (Red/Amber/Green), question counts, and a progress bar.
 *
 * ## Color Coding
 * - **Red (Unstarted)**: No questions answered
 * - **Amber (Incomplete)**: Some answered OR any incorrect
 * - **Green (Complete)**: All answered AND all correct
 *
 * ## Features
 * - Real-time progress tracking
 * - Percentage calculation
 * - ARIA live regions for accessibility
 * - Responsive layout
 */
const meta: Meta<QdStatus> = {
  title: 'Components/Status Panel',
  component: 'qd-status',
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: ['unstarted', 'incomplete', 'complete'],
      description: 'Completion state of the quiz',
      table: {
        type: { summary: 'CompletionState' },
        defaultValue: { summary: 'unstarted' },
      },
    },
    attempted: {
      control: 'number',
      description: 'Number of questions attempted',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    correct: {
      control: 'number',
      description: 'Number of correct answers',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    total: {
      control: 'number',
      description: 'Total number of questions',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    isLoggedIn: {
      control: 'boolean',
      description: 'Whether the user is logged in',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    insertAfterSelector: {
      control: 'text',
      description:
        'CSS selector (id/class) to insert component after. If not found, component will not be displayed.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '' },
      },
    },
    release: {
      control: 'text',
      description: 'Release identifier for login component',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '' },
      },
    },
    docId: {
      control: 'text',
      description: 'Document identifier for login component',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '' },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Progress status panel with R/A/G color coding for quiz completion tracking. Supports both logged in (progress view) and not logged in (login view) states.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<QdStatus>;

/**
 * Unstarted state - No questions answered yet (RED)
 */
export const Unstarted: Story = {
  args: {
    state: 'unstarted',
    attempted: 0,
    correct: 0,
    total: 10,
    isLoggedIn: true,
  },
};

/**
 * Incomplete state - Some questions answered (AMBER)
 */
export const Incomplete: Story = {
  args: {
    state: 'incomplete',
    attempted: 5,
    correct: 3,
    total: 10,
    isLoggedIn: true,
  },
};

/**
 * Complete state - All questions correct (GREEN)
 */
export const Complete: Story = {
  args: {
    state: 'complete',
    attempted: 10,
    correct: 10,
    total: 10,
    isLoggedIn: true,
  },
};

/**
 * Early progress - Just started
 */
export const EarlyProgress: Story = {
  args: {
    state: 'incomplete',
    attempted: 2,
    correct: 2,
    total: 20,
    isLoggedIn: true,
  },
};

/**
 * Mid progress - Halfway through
 */
export const MidProgress: Story = {
  args: {
    state: 'incomplete',
    attempted: 10,
    correct: 8,
    total: 20,
    isLoggedIn: true,
  },
};

/**
 * Late progress - Almost done but has errors
 */
export const LateProgress: Story = {
  args: {
    state: 'incomplete',
    attempted: 18,
    correct: 15,
    total: 20,
    isLoggedIn: true,
  },
};

/**
 * All attempted but some incorrect
 */
export const AllAttemptedWithErrors: Story = {
  args: {
    state: 'incomplete',
    attempted: 10,
    correct: 7,
    total: 10,
    isLoggedIn: true,
  },
};

/**
 * Poor performance - Many incorrect
 */
export const PoorPerformance: Story = {
  args: {
    state: 'incomplete',
    attempted: 10,
    correct: 3,
    total: 10,
    isLoggedIn: true,
  },
};

/**
 * Perfect score - 100%
 */
export const PerfectScore: Story = {
  args: {
    state: 'complete',
    attempted: 50,
    correct: 50,
    total: 50,
    isLoggedIn: true,
  },
};

/**
 * Interactive demo - Click to change states
 */
export const InteractiveDemo: Story = {
  render: () => {
    let currentState = 0;
    const states = [
      { state: 'unstarted', attempted: 0, correct: 0, total: 10 },
      { state: 'incomplete', attempted: 3, correct: 2, total: 10 },
      { state: 'incomplete', attempted: 7, correct: 5, total: 10 },
      { state: 'incomplete', attempted: 10, correct: 8, total: 10 },
      { state: 'complete', attempted: 10, correct: 10, total: 10 },
    ];

    return html`
      <div style="max-width: 500px; margin: 0 auto;">
        <qd-status
          id="demo-status"
          state="${states[0].state}"
          attempted="${states[0].attempted}"
          correct="${states[0].correct}"
          total="${states[0].total}"
          isLoggedIn
        ></qd-status>

        <div style="margin-top: 2rem; text-align: center;">
          <button
            style="padding: 0.75rem 1.5rem; font-size: 1rem; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;"
            @click=${() => {
              const status = document.getElementById('demo-status') as any;
              currentState = (currentState + 1) % states.length;
              const newState = states[currentState];
              status.state = newState.state;
              status.attempted = newState.attempted;
              status.correct = newState.correct;
              status.total = newState.total;
            }}
          >
            Advance Progress
          </button>
          <p style="margin-top: 1rem; color: #666;">Click to simulate quiz progress</p>
        </div>
      </div>
    `;
  },
};

/**
 * Multiple panels showing different states
 */
export const ComparisonView: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; padding: 1rem;"
    >
      <div>
        <h3 style="text-align: center; margin-bottom: 1rem;">Not Started</h3>
        <qd-status state="unstarted" attempted="0" correct="0" total="10" isLoggedIn></qd-status>
      </div>

      <div>
        <h3 style="text-align: center; margin-bottom: 1rem;">In Progress</h3>
        <qd-status state="incomplete" attempted="5" correct="4" total="10" isLoggedIn></qd-status>
      </div>

      <div>
        <h3 style="text-align: center; margin-bottom: 1rem;">Completed</h3>
        <qd-status state="complete" attempted="10" correct="10" total="10" isLoggedIn></qd-status>
      </div>
    </div>
  `,
};

/**
 * Large quiz with many questions
 */
export const LargeQuiz: Story = {
  args: {
    state: 'incomplete',
    attempted: 75,
    correct: 68,
    total: 100,
    isLoggedIn: true,
  },
};

/**
 * Small quiz with few questions
 */
export const SmallQuiz: Story = {
  args: {
    state: 'incomplete',
    attempted: 2,
    correct: 1,
    total: 3,
    isLoggedIn: true,
  },
};

/**
 * Responsive layout test
 */
export const ResponsiveLayout: Story = {
  render: () => html`
    <div style="padding: 1rem;">
      <h3>Desktop View (500px)</h3>
      <div style="max-width: 500px; margin-bottom: 2rem;">
        <qd-status state="incomplete" attempted="7" correct="5" total="10" isLoggedIn></qd-status>
      </div>

      <h3>Tablet View (400px)</h3>
      <div style="max-width: 400px; margin-bottom: 2rem;">
        <qd-status state="incomplete" attempted="7" correct="5" total="10" isLoggedIn></qd-status>
      </div>

      <h3>Mobile View (320px)</h3>
      <div style="max-width: 320px;">
        <qd-status state="incomplete" attempted="7" correct="5" total="10" isLoggedIn></qd-status>
      </div>
    </div>
  `,
};

/**
 * Real-time update simulation
 */
export const RealTimeUpdates: Story = {
  render: () => {
    let interval: number;
    let attempted = 0;
    let correct = 0;
    const total = 10;

    return html`
      <div style="max-width: 500px; margin: 0 auto;">
        <qd-status
          id="realtime-status"
          state="unstarted"
          attempted="0"
          correct="0"
          total="10"
          isLoggedIn
        ></qd-status>

        <div
          style="margin-top: 2rem; text-align: center; display: flex; gap: 1rem; justify-content: center;"
        >
          <button
            style="padding: 0.75rem 1.5rem; font-size: 1rem; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;"
            @click=${() => {
              const status = document.getElementById('realtime-status') as any;
              attempted = 0;
              correct = 0;

              interval = window.setInterval(() => {
                if (attempted < total) {
                  attempted++;
                  // 80% chance of correct answer
                  if (Math.random() > 0.2) {
                    correct++;
                  }

                  status.attempted = attempted;
                  status.correct = correct;
                  status.state =
                    attempted === total && correct === total ? 'complete' : 'incomplete';
                } else {
                  clearInterval(interval);
                }
              }, 500);
            }}
          >
            Start Simulation
          </button>

          <button
            style="padding: 0.75rem 1.5rem; font-size: 1rem; background: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer;"
            @click=${() => {
              clearInterval(interval);
              const status = document.getElementById('realtime-status') as any;
              status.state = 'unstarted';
              status.attempted = 0;
              status.correct = 0;
            }}
          >
            Reset
          </button>
        </div>
        <p style="text-align: center; margin-top: 1rem; color: #666;">
          Simulates answering questions in real-time
        </p>
      </div>
    `;
  },
};

/**
 * Accessibility demonstration
 */
export const AccessibilityFeatures: Story = {
  render: () => html`
    <div style="max-width: 600px; margin: 0 auto;">
      <qd-status state="incomplete" attempted="6" correct="4" total="10" isLoggedIn></qd-status>

      <div style="margin-top: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
        <h3 style="margin-top: 0;">Accessibility Features:</h3>
        <ul style="margin-bottom: 0;">
          <li><strong>ARIA live region:</strong> Announces updates to screen readers</li>
          <li><strong>Progress bar:</strong> Has role="progressbar" with aria attributes</li>
          <li><strong>Color indicators:</strong> Supplemented with text labels</li>
          <li><strong>Semantic HTML:</strong> Proper heading hierarchy</li>
          <li><strong>Keyboard accessible:</strong> All information visible without interaction</li>
        </ul>
      </div>
    </div>
  `,
};

/**
 * Not logged in state - Shows login component
 */
export const NotLoggedIn: Story = {
  args: {
    isLoggedIn: false,
    release: '02-2025',
    docId: 'core-acs',
    state: 'unstarted',
    attempted: 0,
    correct: 0,
    total: 10,
  },
};

/**
 * Header menu nav bar scenario - Status panel appears after last button
 */
export const WithHeaderMenuNavBar: Story = {
  render: () => {
    let isLoggedIn = false;

    return html`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Header Menu Nav Bar (100px tall) -->
        <nav
          style="
            height: 100px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            padding: 0 2rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          "
        >
          <div style="display: flex; align-items: center; gap: 2rem; width: 100%;">
            <h1 style="color: white; margin: 0; font-size: 1.5rem; font-weight: 600;">
              Sonar Quiz System
            </h1>

            <div style="display: flex; gap: 1rem; margin-left: auto;">
              <button
                style="
                  padding: 0.75rem 1.5rem;
                  background: rgba(255, 255, 255, 0.2);
                  color: white;
                  border: 1px solid rgba(255, 255, 255, 0.3);
                  border-radius: 4px;
                  cursor: pointer;
                  font-weight: 500;
                  transition: background 0.2s;
                "
                onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                onmouseout="this.style.background='rgba(255,255,255,0.2)'"
              >
                Home
              </button>

              <button
                style="
                  padding: 0.75rem 1.5rem;
                  background: rgba(255, 255, 255, 0.2);
                  color: white;
                  border: 1px solid rgba(255, 255, 255, 0.3);
                  border-radius: 4px;
                  cursor: pointer;
                  font-weight: 500;
                  transition: background 0.2s;
                "
                onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                onmouseout="this.style.background='rgba(255,255,255,0.2)'"
              >
                Quizzes
              </button>

              <button
                id="last-menu-button"
                style="
                  padding: 0.75rem 1.5rem;
                  background: rgba(255, 255, 255, 0.2);
                  color: white;
                  border: 1px solid rgba(255, 255, 255, 0.3);
                  border-radius: 4px;
                  cursor: pointer;
                  font-weight: 500;
                  transition: background 0.2s;
                "
                onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                onmouseout="this.style.background='rgba(255,255,255,0.2)'"
              >
                Analysis
              </button>
            </div>
          </div>
        </nav>

        <!-- Content Area -->
        <div style="padding: 2rem;">
          <!-- Status panel configured to appear after #last-menu-button -->
          <div style="margin-bottom: 2rem;">
            <qd-status
              id="demo-status-panel"
              .isLoggedIn=${isLoggedIn}
              insertAfterSelector="#last-menu-button"
              release="02-2025"
              docId="core-acs"
              state="incomplete"
              attempted="5"
              correct="3"
              total="10"
            ></qd-status>
          </div>

          <div style="text-align: center; margin-top: 2rem;">
            <button
              style="
                padding: 0.75rem 1.5rem;
                font-size: 1rem;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
              "
              @click=${() => {
                const status = document.getElementById('demo-status-panel') as any;
                isLoggedIn = !isLoggedIn;
                status.isLoggedIn = isLoggedIn;
              }}
            >
              Toggle Login State
            </button>
            <p style="margin-top: 1rem; color: #666;">
              Click to toggle between logged in and not logged in states
            </p>
          </div>

          <!-- Sample content -->
          <div style="margin-top: 3rem;">
            <h2>Sample Quiz Content</h2>
            <p style="color: #666; line-height: 1.6;">
              This demonstrates how the status panel integrates with a page that has a header menu
              navigation bar. The panel is configured to appear after the last button in the menu
              bar using the <code>insertAfterSelector</code> property.
            </p>
            <p style="color: #666; line-height: 1.6;">
              When not logged in, the panel displays a login form with the header "Login to view
              your progress". When logged in, it shows the progress panel with R/A/G indicators.
            </p>
          </div>
        </div>
      </div>
    `;
  },
};
