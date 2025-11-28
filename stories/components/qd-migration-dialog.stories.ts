/**
 * Storybook stories for qd-migration-dialog component
 *
 * Demonstrates database migration dialog with various states.
 * Feature: 009-encrypt-stored-data
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-migration-dialog.js';

const meta: Meta = {
  title: 'Components/MigrationDialog',
  component: 'qd-migration-dialog',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Migration dialog for handling storage format mismatch during login.

**Purpose:**
When the \`ENCRYPT_STORAGE\` build flag doesn't match the format of stored data,
this dialog allows instructors to migrate all records to the correct format.

**Features:**
- Shows mismatch details (expected vs found format)
- Requires instructor password for authorization
- Runs migration via migrateObfuscation()
- Progress and error/success states
- Uses qd-modal base for backdrop, Escape key, focus management

**Properties:**
- \`open\`: Boolean - whether dialog is visible
- \`expected\`: String - expected format ('plain' or 'obfuscated')
- \`found\`: String - actual format found in storage
- \`dbName\`: String - database name for migration
- \`releaseId\`: String - release ID for key derivation

**Events:**
- \`qd:migration-complete\`: Emitted on successful migration with {migrated, skipped} counts
- \`qd:migration-cancel\`: Emitted when user cancels
        `,
      },
    },
  },
  decorators: [
    (story) => {
      // Setup: inject instructor hash for password validation
      // Password: "pwd" => SHA-256 hash truncated to 12 chars
      const setupDom = () => {
        if (!document.getElementById('qd-instructor-hash')) {
          const hashSpan = document.createElement('span');
          hashSpan.id = 'qd-instructor-hash';
          hashSpan.style.display = 'none';
          hashSpan.textContent = 'a1159e9df367'; // First 12 chars of SHA-256("pwd")
          document.body.appendChild(hashSpan);
        }
      };
      setupDom();
      return story();
    },
  ],
};

export default meta;
type Story = StoryObj;

/**
 * Plain to Obfuscated
 *
 * Shows dialog when plain data found but obfuscated expected.
 */
export const PlainToObfuscated: Story = {
  render: () => html`
    <qd-migration-dialog
      open
      expected="obfuscated"
      found="plain"
      dbName="BrowserTestDB"
      releaseId="TRV Connectors Autumn 2025"
    >
    </qd-migration-dialog>
  `,
};

/**
 * Obfuscated to Plain
 *
 * Shows dialog when obfuscated data found but plain expected.
 */
export const ObfuscatedToPlain: Story = {
  render: () => html`
    <qd-migration-dialog
      open
      expected="plain"
      found="obfuscated"
      dbName="BrowserTestDB"
      releaseId="TRV Connectors Autumn 2025"
    >
    </qd-migration-dialog>
  `,
};

/**
 * Interactive
 *
 * Demonstrates opening and event handling.
 */
export const Interactive: Story = {
  render: () => {
    const handleComplete = (e: CustomEvent<{ migrated: number; skipped: number }>) => {
      alert(`Migration complete: ${e.detail.migrated} migrated, ${e.detail.skipped} skipped`);
    };

    const handleCancel = () => {
      alert('Migration cancelled');
    };

    const openDialog = () => {
      const dialog = document.querySelector('qd-migration-dialog');
      if (dialog) {
        dialog.open = true;
      }
    };

    return html`
      <div style="padding: 20px;">
        <button
          @click=${openDialog}
          style="padding: 8px 16px; background: #f57c00; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Trigger Migration Dialog
        </button>

        <qd-migration-dialog
          expected="obfuscated"
          found="plain"
          dbName="BrowserTestDB"
          releaseId="TRV Connectors Autumn 2025"
          @qd:migration-complete=${handleComplete}
          @qd:migration-cancel=${handleCancel}
        >
        </qd-migration-dialog>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0;"><strong>Test Instructions:</strong></p>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Click the button to open the dialog</li>
            <li>Enter instructor password: <code>pwd</code></li>
            <li>Click "Migrate Database" to simulate migration</li>
            <li>Or click Cancel to dismiss</li>
          </ol>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
            Note: In Storybook, actual migration won't run (no real IndexedDB data).
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * Closed State
 *
 * Dialog in closed state (not visible).
 */
export const Closed: Story = {
  render: () => html`
    <div style="padding: 20px;">
      <p>The migration dialog is closed (open=false). Nothing should be visible.</p>
      <qd-migration-dialog
        expected="obfuscated"
        found="plain"
        dbName="BrowserTestDB"
        releaseId="TRV Connectors Autumn 2025"
      >
      </qd-migration-dialog>
    </div>
  `,
};
