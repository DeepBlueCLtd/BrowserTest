/**
 * Storybook stories for qd-login component
 *
 * Demonstrates horizontal login form with student and instructor modes.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-login.js';

const meta: Meta = {
  title: 'Components/Login',
  component: 'qd-login',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Compact authentication component for students and instructors.

**Features:**
- Horizontal single-row layout (responsive)
- Student login: Name + Service ID (2-10 alphanumeric)
- Instructor button opens password modal
- Release version read from document title (.wh_publication_title .title)
- SHA-256 password hashing for instructor auth
- Emits \`qd:login\` event with role: 'student' | 'instructor'

**Event Detail:**
\`\`\`typescript
{
  serviceId: string,
  name: string,
  release: string,  // from document title
  role: 'student' | 'instructor'
}
\`\`\`

**Required Setup:**
\`\`\`html
<div class="wh_publication_title">
  <span class="title">TRV Connectors Autumn 2025</span>
</div>
\`\`\`

**Instructor Setup:**
\`\`\`html
<!-- SHA-256 hash of password -->
<div id="instructor.password.hash" style="display: none;">
  hash_here
</div>
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Default Login Form
 *
 * Shows horizontal layout with Name, Service ID, Login, and Instructor buttons.
 */
export const Default: Story = {
  render: () => {
    // Add release title element
    const titleExists = document.querySelector('.wh_publication_title');
    if (!titleExists) {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'wh_publication_title';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = 'TRV Connectors Autumn 2025';
      titleContainer.appendChild(titleSpan);
      document.body.insertBefore(titleContainer, document.body.firstChild);
    }

    setTimeout(() => {
      const loginComponent = document.querySelector('qd-login');
      if (loginComponent) {
        loginComponent.addEventListener('qd:login', ((e: CustomEvent) => {
          console.log('Login event:', e.detail);
          const detail = e.detail as {
            role: string;
            serviceId: string;
            name: string;
            release: string;
          };
          alert(
            `Login successful!\\n\\nRole: ${detail.role}\\nService ID: ${detail.serviceId}\\nName: ${detail.name}\\nRelease: ${detail.release}`,
          );
        }) as EventListener);
      }
    }, 100);

    return html`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <qd-login></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0; font-weight: 500;">Try Student Login:</p>
          <ul style="margin: 0 0 15px 0; padding-left: 20px;">
            <li><strong>Name:</strong> John Smith</li>
            <li><strong>Service ID:</strong> RN2344 (2-10 alphanumeric)</li>
          </ul>

          <p style="margin: 0 0 10px 0; font-weight: 500;">Or Click "Instructor":</p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Opens password modal</li>
            <li>For demo: Password hash not configured (will show error)</li>
          </ul>

          <p style="margin: 15px 0 0 0; color: #666;">
            Check browser console for <code>qd:login</code> event details.
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * With Custom Title
 *
 * Demonstrates customizable title property.
 */
export const CustomTitle: Story = {
  render: () => {
    const titleExists = document.querySelector('.wh_publication_title');
    if (!titleExists) {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'wh_publication_title';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = 'TRV Connectors Autumn 2025';
      titleContainer.appendChild(titleSpan);
      document.body.insertBefore(titleContainer, document.body.firstChild);
    }

    setTimeout(() => {
      const loginComponent = document.querySelector('qd-login');
      loginComponent?.addEventListener('qd:login', ((e: CustomEvent) => {
        // eslint-disable-next-line no-console
        console.log('Login event:', e.detail);
      }) as EventListener);
    }, 100);

    return html`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <qd-login title="Training Quiz System"></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">✓ Title customized via <code>title</code> property</p>
        </div>
      </div>
    `;
  },
};

/**
 * Instructor Password Demo
 *
 * Shows instructor modal with working password authentication.
 */
export const InstructorPasswordDemo: Story = {
  render: () => {
    const titleExists = document.querySelector('.wh_publication_title');
    if (!titleExists) {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'wh_publication_title';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = 'TRV Connectors Autumn 2025';
      titleContainer.appendChild(titleSpan);
      document.body.insertBefore(titleContainer, document.body.firstChild);
    }

    // Add instructor password hash (SHA-256 of "test123")
    const hashExists = document.getElementById('instructor.password.hash');
    if (!hashExists) {
      const hashElement = document.createElement('div');
      hashElement.id = 'instructor.password.hash';
      hashElement.style.display = 'none';
      hashElement.textContent = 'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae';
      document.body.appendChild(hashElement);
    }

    setTimeout(() => {
      const loginComponent = document.querySelector('qd-login');
      if (loginComponent) {
        loginComponent.addEventListener('qd:login', ((e: CustomEvent) => {
          // eslint-disable-next-line no-console
          console.log('Login event:', e.detail);
          const detail = e.detail as {
            role: string;
            serviceId: string;
            name: string;
            release: string;
          };
          alert(
            `${detail.role.toUpperCase()} LOGIN!\\n\\nService ID: ${detail.serviceId}\\nName: ${detail.name}\\nRelease: ${detail.release}`,
          );
        }) as EventListener);
      }
    }, 100);

    return html`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <qd-login></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0; font-weight: 500;">Instructor Login Demo:</p>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Click "Instructor" button</li>
            <li>Enter password: <code>test123</code></li>
            <li>Click "Login" in modal</li>
            <li>Event emits with <code>role: 'instructor'</code></li>
          </ol>

          <p style="margin: 15px 0 0 0; color: #666;">
            Password is hashed with SHA-256 before comparison.
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * Validation Examples
 *
 * Shows various validation scenarios.
 */
export const ValidationExamples: Story = {
  render: () => {
    const titleExists = document.querySelector('.wh_publication_title');
    if (!titleExists) {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'wh_publication_title';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = 'TRV Connectors Autumn 2025';
      titleContainer.appendChild(titleSpan);
      document.body.insertBefore(titleContainer, document.body.firstChild);
    }

    setTimeout(() => {
      const loginComponent = document.querySelector('qd-login');
      loginComponent?.addEventListener('qd:login', ((e: CustomEvent) => {
        // eslint-disable-next-line no-console
        console.log('Login event:', e.detail);
      }) as EventListener);
    }, 100);

    return html`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <h2 style="margin-top: 0;">Validation Rules</h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div
            style="padding: 15px; background: #e8f5e9; border-radius: 4px; border-left: 3px solid #4caf50;"
          >
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #2e7d32;">Valid Inputs</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
              <li><strong>Name:</strong> Any non-empty string</li>
              <li><strong>Service ID:</strong> 2-10 alphanumeric</li>
              <li>Examples: RN2344, ABC123, XY</li>
            </ul>
          </div>

          <div
            style="padding: 15px; background: #ffebee; border-radius: 4px; border-left: 3px solid #d32f2f;"
          >
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #c62828;">Invalid Inputs</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
              <li>Empty name or service ID</li>
              <li>Service ID: &lt; 2 or &gt; 10 chars</li>
              <li>Service ID: Non-alphanumeric (e.g., "RN-234")</li>
            </ul>
          </div>
        </div>

        <qd-login></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Try submitting with invalid data to see real-time validation errors.
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * Missing Release Title
 *
 * Demonstrates error when release title element is missing.
 */
export const MissingReleaseTitle: Story = {
  render: () => {
    // Explicitly remove title element if it exists
    const titleExists = document.querySelector('.wh_publication_title');
    if (titleExists) {
      titleExists.remove();
    }

    setTimeout(() => {
      const loginComponent = document.querySelector('qd-login');
      loginComponent?.addEventListener('qd:login', ((e: CustomEvent) => {
        // eslint-disable-next-line no-console
        console.log('Login event:', e.detail);
      }) as EventListener);
    }, 100);

    return html`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <qd-login></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #ffebee; border-left: 4px solid #d32f2f; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0; font-weight: 500; color: #c62828;">
            ⚠️ Release title element is missing
          </p>
          <p style="margin: 0;">
            Try logging in - you'll see an error: "Release not found (missing .wh_publication_title
            .title element)"
          </p>
          <p style="margin: 15px 0 0 0; color: #666;">
            Required:
            <code
              >&lt;div class="wh_publication_title"&gt;&lt;span class="title"&gt;TRV Connectors
              Autumn 2025&lt;/span&gt;&lt;/div&gt;</code
            >
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
    const titleExists = document.querySelector('.wh_publication_title');
    if (!titleExists) {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'wh_publication_title';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = 'TRV Connectors Autumn 2025';
      titleContainer.appendChild(titleSpan);
      document.body.insertBefore(titleContainer, document.body.firstChild);
    }

    setTimeout(() => {
      const loginComponent = document.querySelector('qd-login');
      loginComponent?.addEventListener('qd:login', ((e: CustomEvent) => {
        // eslint-disable-next-line no-console
        console.log('Login event:', e.detail);
      }) as EventListener);
    }, 100);

    return html`<qd-login></qd-login>`;
  },
};
