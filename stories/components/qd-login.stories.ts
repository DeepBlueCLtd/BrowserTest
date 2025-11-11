import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-login';
import type { QdLogin } from '../../src/components/qd-login';

/**
 * The `qd-login` component provides a login form for students to enter
 * their service ID and name. It validates inputs and emits a `qd:login`
 * event with session data on successful submission.
 *
 * ## Features
 * - Service ID validation (2-10 alphanumeric characters)
 * - Name validation (1-100 characters)
 * - Shadow DOM for style isolation
 * - Accessible form with labels and hints
 * - Emits `qd:login` custom event
 */
const meta: Meta<QdLogin> = {
  title: 'Components/Login',
  component: 'qd-login',
  tags: ['autodocs'],
  argTypes: {
    release: {
      control: 'text',
      description: 'Release identifier (e.g., "02-2025")',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Current month-year' },
      },
    },
    docId: {
      control: 'text',
      description: 'Document identifier (e.g., "core-acs")',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Student login component for the Sonar Quiz System. Captures service ID and name with validation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<QdLogin>;

/**
 * Default login form appearance
 */
export const Default: Story = {
  render: () => html`
    <qd-login
      release="02-2025"
      docId="core-acs"
      @qd:login=${(e: CustomEvent) => {
        console.log('Login event:', e.detail);
        alert(`Login successful!
Service ID: ${e.detail.serviceId}
Name: ${e.detail.name}
Release: ${e.detail.release}`);
      }}
    ></qd-login>
  `,
};

/**
 * Login form without release/docId specified (will infer from current date)
 */
export const WithoutReleaseInfo: Story = {
  render: () => html`
    <qd-login
      @qd:login=${(e: CustomEvent) => {
        console.log('Login event (auto-release):', e.detail);
      }}
    ></qd-login>
  `,
};

/**
 * Login form with pre-filled values (for demonstration)
 * Note: In production, inputs start empty
 */
export const FilledForm: Story = {
  render: () => html`
    <qd-login release="02-2025" docId="core-acs"></qd-login>
    <script>
      // Note: This is for demo purposes only
      // In production, form always starts empty
      document.addEventListener('DOMContentLoaded', () => {
        const login = document.querySelector('qd-login');
        if (login?.shadowRoot) {
          const serviceIdInput = login.shadowRoot.querySelector(
            'input[name="serviceId"]'
          );
          const nameInput = login.shadowRoot.querySelector('input[name="name"]');
          if (serviceIdInput) serviceIdInput.value = 'RN2344';
          if (nameInput) nameInput.value = 'Smith, J';
        }
      });
    </script>
  `,
};

/**
 * Test validation with invalid inputs
 */
export const ValidationDemo: Story = {
  render: () => html`
    <div style="max-width: 400px; margin: 0 auto;">
      <qd-login release="02-2025" docId="core-acs"></qd-login>
      <div style="margin-top: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
        <h3 style="margin-top: 0;">Validation Rules:</h3>
        <ul style="margin: 0; padding-left: 1.5rem;">
          <li><strong>Service ID:</strong> 2-10 alphanumeric characters</li>
          <li><strong>Name:</strong> 1-100 characters, any format</li>
        </ul>
        <h4 style="margin-bottom: 0.5rem;">Try these test cases:</h4>
        <ul style="margin: 0; padding-left: 1.5rem;">
          <li>Service ID: "X" (too short - should fail)</li>
          <li>Service ID: "RN2344" (valid)</li>
          <li>Service ID: "AB@123" (invalid - contains @)</li>
          <li>Name: "" (empty - should fail)</li>
          <li>Name: "Smith, J" (valid)</li>
        </ul>
      </div>
    </div>
  `,
};

/**
 * Multiple instances on same page (should work independently)
 */
export const MultipleInstances: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; padding: 2rem;"
    >
      <div>
        <h3 style="text-align: center;">Session 1 - Morning Class</h3>
        <qd-login
          release="02-2025"
          docId="morning-session"
          @qd:login=${(e: CustomEvent) => {
            console.log('Morning session login:', e.detail);
          }}
        ></qd-login>
      </div>
      <div>
        <h3 style="text-align: center;">Session 2 - Afternoon Class</h3>
        <qd-login
          release="02-2025"
          docId="afternoon-session"
          @qd:login=${(e: CustomEvent) => {
            console.log('Afternoon session login:', e.detail);
          }}
        ></qd-login>
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
      <h3>Desktop View (400px+ wide)</h3>
      <div style="max-width: 1200px; margin: 0 auto 2rem;">
        <qd-login release="02-2025"></qd-login>
      </div>

      <h3>Mobile View (320px wide)</h3>
      <div style="max-width: 320px; margin: 0 auto;">
        <qd-login release="02-2025"></qd-login>
      </div>
    </div>
  `,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Dark mode styling (custom CSS variables can be used)
 */
export const DarkModeExample: Story = {
  render: () => html`
    <div
      style="background: #1e1e1e; padding: 2rem; min-height: 100vh; color: white;"
    >
      <style>
        qd-login {
          --background-color: #2d2d2d;
          --text-color: #ffffff;
          --border-color: #404040;
        }
      </style>
      <qd-login release="02-2025"></qd-login>
      <p style="text-align: center; margin-top: 2rem; opacity: 0.7;">
        Note: Dark mode requires CSS variable support (not yet implemented)
      </p>
    </div>
  `,
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

/**
 * Event handling demonstration
 */
export const EventHandling: Story = {
  render: () => html`
    <div style="max-width: 600px; margin: 0 auto;">
      <qd-login
        release="02-2025"
        docId="event-demo"
        @qd:login=${(e: CustomEvent) => {
          const log = document.getElementById('event-log');
          if (log) {
            const entry = document.createElement('div');
            entry.style.padding = '0.5rem';
            entry.style.marginBottom = '0.5rem';
            entry.style.background = '#e8f5e9';
            entry.style.borderLeft = '4px solid #4caf50';
            entry.innerHTML = `
              <strong>Login Event Fired!</strong><br>
              <small>Service ID: ${e.detail.serviceId}</small><br>
              <small>Name: ${e.detail.name}</small><br>
              <small>Release: ${e.detail.release}</small><br>
              <small>Time: ${new Date(e.detail.loginTime).toLocaleTimeString()}</small>
            `;
            log.prepend(entry);
          }
        }}
      ></qd-login>

      <div style="margin-top: 2rem;">
        <h3>Event Log:</h3>
        <div
          id="event-log"
          style="border: 1px solid #ccc; border-radius: 4px; padding: 1rem; min-height: 100px; max-height: 300px; overflow-y: auto;"
        >
          <p style="color: #666; text-align: center;">
            Submit the form to see events logged here
          </p>
        </div>
      </div>
    </div>
  `,
};
