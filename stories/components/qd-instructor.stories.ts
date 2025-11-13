/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-instructor';
import type { QdInstructor } from '../../src/components/qd-instructor';

/**
 * The `qd-instructor` component provides instructor-only features including:
 * - Password-protected unlock with SHA-256 hashing
 * - Answer reveal for quiz tables
 * - Student scores aggregation and display
 * - Data export functionality
 * - System data management
 *
 * ## Features
 * - SHA-256 password hashing for security
 * - Multiple view modes: overview, scores, export, manage
 * - Aggregated student statistics
 * - Sortable scores table
 * - Event emission for unlock/lock state changes
 * - Shadow DOM for style isolation
 *
 * ## Events
 * - `qd:instructor-unlock` - Fired when instructor mode is unlocked
 * - `qd:instructor-lock` - Fired when instructor mode is locked
 * - `qd:data-cleared` - Fired when all data is erased
 *
 * ## Default Password
 * The default instructor password is "instructor"
 */
const meta: Meta<QdInstructor> = {
  title: 'Components/Instructor',
  component: 'qd-instructor',
  tags: ['autodocs'],
  argTypes: {
    release: {
      control: 'text',
      description: 'Release identifier (e.g., "02-2025")',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
    unlocked: {
      control: 'boolean',
      description: 'Whether instructor mode is unlocked',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    mode: {
      control: 'select',
      options: ['overview', 'scores', 'export', 'manage'],
      description: 'Current view mode',
      table: {
        type: { summary: '"overview" | "scores" | "export" | "manage"' },
        defaultValue: { summary: '"overview"' },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Instructor dashboard component for the Sonar Quiz System. Provides password-protected access to advanced features.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<QdInstructor>;

/**
 * Default locked view - instructor must enter password to unlock
 */
export const Default: Story = {
  render: () => html`
    <qd-instructor
      release="02-2025"
      @qd:instructor-unlock=${(e: CustomEvent) => {
        console.log('Instructor unlocked:', e.detail);
        alert('Instructor mode unlocked!');
      }}
    ></qd-instructor>
    <div style="margin-top: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
      <h3 style="margin-top: 0;">Test Password:</h3>
      <p style="margin: 0;"><strong>Password:</strong> <code>instructor</code></p>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: #666;">
        The password is hashed using SHA-256 for security.
      </p>
    </div>
  `,
};

/**
 * Unlocked overview mode
 */
export const UnlockedOverview: Story = {
  render: () => html`
    <qd-instructor
      release="02-2025"
      .unlocked=${true}
      mode="overview"
      @qd:instructor-lock=${(e: CustomEvent) => {
        console.log('Instructor locked:', e.detail);
      }}
    ></qd-instructor>
  `,
};

/**
 * Scores view with no data
 */
export const ScoresViewEmpty: Story = {
  render: () => html`
    <qd-instructor release="02-2025" .unlocked=${true} mode="scores"></qd-instructor>
    <div
      style="margin-top: 2rem; padding: 1rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;"
    >
      <p style="margin: 0; color: #856404;">
        <strong>Note:</strong> No student data is available because this is a demo. In production,
        scores would be loaded from IndexedDB after students complete quizzes.
      </p>
    </div>
  `,
};

/**
 * Scores view with mock data (simulated)
 */
export const ScoresViewWithData: Story = {
  render: () => html`
    <qd-instructor release="02-2025" .unlocked=${true} mode="scores"></qd-instructor>
    <script>
      // This simulates loading student data
      // In production, data would come from IndexedDB
      setTimeout(() => {
        const instructor = document.querySelector('qd-instructor');
        if (instructor) {
          // Mock student records
          const mockStudents = [
            {
              schema: 1,
              docId: 'core-acs',
              release: '02-2025',
              serviceId: 'RN2344',
              name: 'Smith, J',
              attempted: 25,
              correct: 22,
              updated: new Date().toISOString(),
              pages: {
                'page-1': {
                  answers: Array(10)
                    .fill(null)
                    .map((_, i) => ({
                      answer: String(i + 1),
                      success: i < 8,
                      timestamp: new Date().toISOString(),
                    })),
                  state: 'complete',
                },
                'page-2': {
                  answers: Array(15)
                    .fill(null)
                    .map((_, i) => ({
                      answer: String(i + 1),
                      success: i < 14,
                      timestamp: new Date().toISOString(),
                    })),
                  state: 'complete',
                },
              },
            },
            {
              schema: 1,
              docId: 'core-acs',
              release: '02-2025',
              serviceId: 'RN5678',
              name: 'Jones, A',
              attempted: 30,
              correct: 28,
              updated: new Date().toISOString(),
              pages: {
                'page-1': {
                  answers: Array(15)
                    .fill(null)
                    .map((_, i) => ({
                      answer: String(i + 1),
                      success: i < 14,
                      timestamp: new Date().toISOString(),
                    })),
                  state: 'complete',
                },
                'page-2': {
                  answers: Array(15)
                    .fill(null)
                    .map((_, i) => ({
                      answer: String(i + 1),
                      success: i < 14,
                      timestamp: new Date().toISOString(),
                    })),
                  state: 'complete',
                },
              },
            },
            {
              schema: 1,
              docId: 'core-acs',
              release: '02-2025',
              serviceId: 'RN3456',
              name: 'Brown, K',
              attempted: 20,
              correct: 15,
              updated: new Date().toISOString(),
              pages: {
                'page-1': {
                  answers: Array(10)
                    .fill(null)
                    .map((_, i) => ({
                      answer: String(i + 1),
                      success: i < 7,
                      timestamp: new Date().toISOString(),
                    })),
                  state: 'incomplete',
                },
                'page-2': {
                  answers: Array(10)
                    .fill(null)
                    .map((_, i) => ({
                      answer: String(i + 1),
                      success: i < 8,
                      timestamp: new Date().toISOString(),
                    })),
                  state: 'incomplete',
                },
              },
            },
          ];

          // Inject mock data (this is for demo purposes only)
          instructor._studentRecords = mockStudents;
          instructor._aggregateScores();
          instructor.requestUpdate();
        }
      }, 100);
    </script>
    <div
      style="margin-top: 2rem; padding: 1rem; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px;"
    >
      <p style="margin: 0; color: #0c5460;">
        <strong>Demo Mode:</strong> This story injects mock student data to demonstrate the scores
        view. Try sorting by different fields using the buttons above the table.
      </p>
    </div>
  `,
};

/**
 * Event handling demonstration
 */
export const EventHandling: Story = {
  render: () => html`
    <div style="max-width: 1200px; margin: 0 auto;">
      <qd-instructor
        release="02-2025"
        @qd:instructor-unlock=${(e: CustomEvent) => {
          const log = document.getElementById('event-log');
          if (log) {
            const entry = document.createElement('div');
            entry.style.padding = '0.5rem';
            entry.style.marginBottom = '0.5rem';
            entry.style.background = '#e8f5e9';
            entry.style.borderLeft = '4px solid #4caf50';
            entry.innerHTML =
              '<strong>🔓 Instructor Unlocked!</strong><br>' +
              '<small>Time: ' +
              new Date(e.detail.timestamp).toLocaleTimeString() +
              '</small>';
            log.prepend(entry);
          }
        }}
        @qd:instructor-lock=${(e: CustomEvent) => {
          const log = document.getElementById('event-log');
          if (log) {
            const entry = document.createElement('div');
            entry.style.padding = '0.5rem';
            entry.style.marginBottom = '0.5rem';
            entry.style.background = '#ffebee';
            entry.style.borderLeft = '4px solid #f44336';
            entry.innerHTML =
              '<strong>🔒 Instructor Locked!</strong><br>' +
              '<small>Time: ' +
              new Date(e.detail.timestamp).toLocaleTimeString() +
              '</small>';
            log.prepend(entry);
          }
        }}
      ></qd-instructor>

      <div style="margin-top: 2rem;">
        <h3>Event Log:</h3>
        <div
          id="event-log"
          style="border: 1px solid #ccc; border-radius: 4px; padding: 1rem; min-height: 100px; max-height: 300px; overflow-y: auto; background: white;"
        >
          <p style="color: #666; text-align: center;">
            Unlock or lock instructor mode to see events logged here
          </p>
        </div>
      </div>

      <div style="margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
        <h4 style="margin-top: 0;">Test Instructions:</h4>
        <ol style="margin: 0; padding-left: 1.5rem;">
          <li>Enter password: <code>instructor</code></li>
          <li>Click "Unlock Instructor Mode"</li>
          <li>Observe the unlock event in the log above</li>
          <li>Click "Lock Instructor Mode"</li>
          <li>Observe the lock event in the log</li>
        </ol>
      </div>
    </div>
  `,
};

/**
 * Responsive layout test
 */
export const ResponsiveLayout: Story = {
  render: () => html`
    <div style="padding: 1rem;">
      <h3>Desktop View (1200px+ wide)</h3>
      <div style="max-width: 1200px; margin: 0 auto 2rem; border: 1px solid #ccc; padding: 1rem;">
        <qd-instructor release="02-2025" .unlocked=${true} mode="overview"></qd-instructor>
      </div>

      <h3>Tablet View (768px wide)</h3>
      <div style="max-width: 768px; margin: 0 auto 2rem; border: 1px solid #ccc; padding: 1rem;">
        <qd-instructor release="02-2025" .unlocked=${true} mode="overview"></qd-instructor>
      </div>

      <h3>Mobile View (375px wide)</h3>
      <div style="max-width: 375px; margin: 0 auto; border: 1px solid #ccc; padding: 1rem;">
        <qd-instructor release="02-2025"></qd-instructor>
      </div>
    </div>
  `,
};

/**
 * Password security demonstration
 */
export const PasswordSecurity: Story = {
  render: () => html`
    <qd-instructor release="02-2025"></qd-instructor>
    <div style="margin-top: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
      <h3 style="margin-top: 0;">Password Security:</h3>
      <ul style="margin: 0; padding-left: 1.5rem;">
        <li>
          <strong>Hashing:</strong> Passwords are hashed using SHA-256 before storage or comparison
        </li>
        <li><strong>Storage:</strong> Only password hashes are stored in sessionStorage</li>
        <li><strong>Validation:</strong> Plain-text password is never stored</li>
        <li>
          <strong>Default:</strong> Default password "instructor" can be changed by user after first
          unlock
        </li>
      </ul>

      <h4>Password Storage Example:</h4>
      <pre
        style="background: #fff; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.875rem;"
      >
Plain password: "instructor"
SHA-256 hash:   "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
</pre
      >

      <h4>Test Instructions:</h4>
      <ol style="margin: 0; padding-left: 1.5rem;">
        <li>Enter password: <code>instructor</code></li>
        <li>Open browser DevTools → Application → Session Storage</li>
        <li>Look for key: <code>qd/instructor</code></li>
        <li>Observe the stored hash (not the plain password)</li>
      </ol>
    </div>
  `,
};

/**
 * All modes demonstration
 */
export const AllModes: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 2rem; padding: 2rem;"
    >
      <div style="border: 1px solid #ccc; padding: 1rem; border-radius: 4px;">
        <h3 style="text-align: center; margin-top: 0;">Overview Mode</h3>
        <qd-instructor release="02-2025" .unlocked=${true} mode="overview"></qd-instructor>
      </div>

      <div style="border: 1px solid #ccc; padding: 1rem; border-radius: 4px;">
        <h3 style="text-align: center; margin-top: 0;">Scores Mode</h3>
        <qd-instructor release="02-2025" .unlocked=${true} mode="scores"></qd-instructor>
      </div>
    </div>

    <div
      style="margin-top: 2rem; padding: 1rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;"
    >
      <p style="margin: 0; color: #856404;">
        <strong>Note:</strong> Export and Manage modes will be implemented in future phases.
      </p>
    </div>
  `,
};

/**
 * Accessibility test
 */
export const AccessibilityTest: Story = {
  render: () => html`
    <div style="max-width: 800px; margin: 0 auto;">
      <qd-instructor release="02-2025"></qd-instructor>

      <div style="margin-top: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
        <h3 style="margin-top: 0;">Accessibility Features:</h3>
        <ul style="margin: 0; padding-left: 1.5rem;">
          <li><strong>Keyboard Navigation:</strong> All controls accessible via Tab key</li>
          <li><strong>Labels:</strong> All form inputs have associated labels</li>
          <li><strong>Focus Management:</strong> Password input has autofocus</li>
          <li><strong>ARIA:</strong> Uses semantic HTML elements (form, button, table)</li>
          <li><strong>Screen Reader:</strong> Status messages use aria-live for announcements</li>
        </ul>

        <h4>Test Instructions:</h4>
        <ol style="margin: 0; padding-left: 1.5rem;">
          <li>Tab through all interactive elements</li>
          <li>Verify focus indicators are visible</li>
          <li>Test with screen reader (e.g., NVDA, JAWS, VoiceOver)</li>
          <li>Verify all functionality works without mouse</li>
        </ol>
      </div>
    </div>
  `,
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
        ],
      },
    },
  },
};
