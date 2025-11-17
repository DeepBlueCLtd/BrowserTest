/**
 * Storybook stories for Analysis Table Enhancement
 *
 * Demonstrates the single-phase progressive enhancement for analysis tables.
 * Shows cells with class="interactive" becoming editable in interactive mode.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/enhancers/analysis-table.js';
import { enhanceAnalysisTable } from '../../src/enhancers/analysis-table.js';
import { setJSON, clearQuizData } from '../../src/utils/storage-helpers.js';
import { STORAGE_KEYS } from '../../src/types/contracts.js';
import type { SessionData } from '../../src/types/contracts.js';

const meta: Meta = {
  title: 'Enhancers/Analysis Table',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Analysis table enhancement with single-phase pattern.

**Author Constraints:**
- Add class="interactive" to cells that should be editable
- Cells without this class will always be read-only
- Only cells with class="interactive" become contenteditable in interactive mode

**Features:**
- Non-interactive mode: Read-only display
- Interactive mode: Editable cells (with class="interactive")
- Debounced auto-save (500ms)
- Stable cell keys for persistence
- Event emission: qd:analysis-saved
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Helper: Create session data
 */
function createSession(): SessionData {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

  return {
    serviceId: 'RN9999',
    name: 'Storybook User',
    release: '11-2024',
    loginTime: now.toISOString(),
    lastActivity: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    instructorUnlocked: false,
  };
}

/**
 * Non-Interactive Mode
 *
 * Analysis table in read-only mode (pre-login).
 * No cells are editable, regardless of class="interactive".
 */
export const NonInteractiveMode: Story = {
  render: () => {
    // Clear storage before rendering
    clearQuizData();

    return html`
      <div style="padding: 20px; max-width: 800px;">
        <h2>Analysis Table - Non-Interactive Mode</h2>
        <p>
          <strong>Note:</strong> This is the pre-login state. Cells with
          class="interactive" are marked but not editable.
        </p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Question
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Student Answer
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                What is 2+2?
              </td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for student input -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Verify basic arithmetic
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Explain photosynthesis
              </td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for student input -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Check for key concepts: chlorophyll, sunlight, CO2, glucose
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Define democracy
              </td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for student input -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Look for: voting, representation, rights
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 10px; background: #f0f0f0;">
          <strong>Cells marked with class="interactive":</strong> Column 2 (Student Answer) -
          shown with light yellow background for visualization
        </div>
      </div>
    `;
  },
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector('table.qd-analysis') as HTMLTableElement;
    if (table) {
      enhanceAnalysisTable(table, { interactive: false });
    }
  },
};

/**
 * Interactive Mode
 *
 * Analysis table with editing enabled for cells with class="interactive".
 * Cells without this class remain read-only.
 */
export const InteractiveMode: Story = {
  render: () => {
    // Create session
    const session = createSession();
    setJSON(STORAGE_KEYS.SESSION, session);

    return html`
      <div style="padding: 20px; max-width: 800px;">
        <h2>Analysis Table - Interactive Mode</h2>
        <p>
          <strong>Try editing cells in the "Student Answer" column!</strong> These cells have
          class="interactive" and are now contenteditable.
        </p>
        <p>
          Changes are auto-saved after 500ms of inactivity. Check the browser console for
          <code>qd:analysis-saved</code> events.
        </p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Question
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Student Answer (editable)
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Notes (read-only)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                What is 2+2?
              </td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for editing -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Verify basic arithmetic
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Explain photosynthesis
              </td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for editing -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Check for key concepts: chlorophyll, sunlight, CO2, glucose
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Define democracy
              </td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for editing -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Look for: voting, representation, rights
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 10px; background: #e8f5e9;">
          <strong>Editable cells:</strong> Column 2 (class="interactive") - Click to edit!
          <br />
          <strong>Read-only cells:</strong> Columns 1 and 3 (no 'interactive' class)
        </div>
      </div>
    `;
  },
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector('table.qd-analysis') as HTMLTableElement;
    if (table) {
      enhanceAnalysisTable(table, {
        interactive: true,
        pageId: 'storybook-analysis-1',
      });

      // Listen for save events
      document.addEventListener('qd:analysis-saved', ((e: CustomEvent) => {
        console.log('Analysis cell saved:', e.detail);
      }) as EventListener);
    }
  },
};

/**
 * Mixed Editability
 *
 * Demonstrates table with selective editable cells.
 * Only cells with class="interactive" are editable.
 */
export const MixedEditability: Story = {
  render: () => {
    // Create session
    const session = createSession();
    setJSON(STORAGE_KEYS.SESSION, session);

    return html`
      <div style="padding: 20px; max-width: 800px;">
        <h2>Analysis Table - Mixed Editability</h2>
        <p>
          This table demonstrates selective editability. Some cells in the middle column have
          class="interactive" (editable), others don't (read-only).
        </p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Item
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Value
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Name
              </td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Editable -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Enter your name
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Student ID
              </td>
              <td style="border: 1px solid #ccc; padding: 8px; background: #f5f5f5;">
                RN9999
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Pre-filled (read-only, no 'interactive' class)
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Comments
              </td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Editable -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Add your feedback
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Grade
              </td>
              <td style="border: 1px solid #ccc; padding: 8px; background: #f5f5f5;">
                A
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Instructor-assigned (read-only)
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 10px; background: #fff3e0;">
          <strong>Legend:</strong>
          <ul style="margin: 5px 0;">
            <li>
              <strong>Light yellow background:</strong> Editable cells (class="interactive")
            </li>
            <li>
              <strong>Gray background:</strong> Read-only cells (no 'interactive' class)
            </li>
          </ul>
        </div>
      </div>
    `;
  },
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector('table.qd-analysis') as HTMLTableElement;
    if (table) {
      enhanceAnalysisTable(table, {
        interactive: true,
        pageId: 'storybook-analysis-mixed',
      });
    }
  },
};
