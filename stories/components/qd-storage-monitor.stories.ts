/**
 * Storage Monitor Stories
 *
 * Demonstrates the storage monitor component with sample data
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-storage-monitor';
import { STORAGE_KEYS } from '../../src/types/contracts';

const meta: Meta = {
  title: 'Development/Storage Monitor',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  render: () => html`<qd-storage-monitor></qd-storage-monitor>`,
};

export default meta;
type Story = StoryObj;

/**
 * Storage monitor with no data
 */
export const Empty: Story = {
  play: () => {
    // Clear all qd-prefixed storage
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('qd')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  },
};

/**
 * Storage monitor with session data
 */
export const WithSessionData: Story = {
  play: () => {
    // Populate sessionStorage with sample data
    sessionStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({
        serviceId: 'RN2344',
        name: 'John Doe',
        release: '01-2025',
        loginTime: '2025-01-15T10:30:00.000Z',
        lastActivity: '2025-01-15T11:45:00.000Z',
        expiresAt: '2025-01-15T12:00:00.000Z',
        instructorUnlocked: false,
      }),
    );

    sessionStorage.setItem(
      STORAGE_KEYS.CACHE,
      JSON.stringify({
        totals: {
          answered: 15,
          correct: 12,
        },
        pages: {
          'gram-1': {
            state: 'complete',
            answered: 5,
            correct: 5,
            last: '2025-01-15T11:30:00.000Z',
          },
          'gram-2': {
            state: 'incomplete',
            answered: 10,
            correct: 7,
            last: '2025-01-15T11:45:00.000Z',
          },
        },
      }),
    );

    sessionStorage.setItem(
      `${STORAGE_KEYS.CACHE}/analysis/gram-1/table-1`,
      JSON.stringify({
        cells: {
          'R1C1#f:abc12345': {
            content: 'Sample answer',
            timestamp: '2025-01-15T11:20:00.000Z',
          },
          'R1C2#f:def67890': {
            content: '42',
            timestamp: '2025-01-15T11:21:00.000Z',
          },
        },
      }),
    );
  },
};

/**
 * Storage monitor with nested complex data
 */
export const WithComplexData: Story = {
  play: () => {
    sessionStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({
        serviceId: 'AB1234',
        name: 'Jane Smith',
        release: '02-2025',
        loginTime: '2025-02-01T09:00:00.000Z',
        lastActivity: '2025-02-01T10:30:00.000Z',
        expiresAt: '2025-02-01T11:00:00.000Z',
        instructorUnlocked: true,
        unlockTime: '2025-02-01T10:15:00.000Z',
      }),
    );

    sessionStorage.setItem(
      STORAGE_KEYS.CACHE,
      JSON.stringify({
        totals: {
          answered: 50,
          correct: 45,
        },
        pages: {
          'unit-1': {
            state: 'complete',
            answered: 10,
            correct: 10,
            last: '2025-02-01T09:30:00.000Z',
          },
          'unit-2': {
            state: 'complete',
            answered: 15,
            correct: 14,
            last: '2025-02-01T10:00:00.000Z',
          },
          'unit-3': {
            state: 'incomplete',
            answered: 25,
            correct: 21,
            last: '2025-02-01T10:30:00.000Z',
          },
        },
      }),
    );

    // Complex nested structure
    sessionStorage.setItem(
      'qd/test-data',
      JSON.stringify({
        metadata: {
          version: '1.0.0',
          created: '2025-02-01T09:00:00.000Z',
          author: 'System',
        },
        results: [
          { id: 1, score: 95, passed: true, details: { attempts: 1, time: 120 } },
          { id: 2, score: 87, passed: true, details: { attempts: 2, time: 180 } },
          { id: 3, score: 62, passed: false, details: { attempts: 3, time: 240 } },
        ],
        summary: {
          total: 3,
          passed: 2,
          failed: 1,
          averageScore: 81.33,
        },
      }),
    );
  },
};

/**
 * Demonstrates event-driven updates
 */
export const EventDrivenUpdates: Story = {
  play: () => {
    sessionStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({
        serviceId: 'TEST001',
        name: 'Test User',
        release: '01-2025',
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        instructorUnlocked: false,
      }),
    );
  },
  render: () => html`
    <qd-storage-monitor></qd-storage-monitor>
    <div style="position: fixed; bottom: 20px; left: 20px; z-index: 10001;">
      <div
        style="background: white; padding: 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
      >
        <h3 style="margin: 0 0 12px 0; font-size: 14px;">Trigger Events</h3>
        <button
          @click=${() => {
            window.dispatchEvent(
              new CustomEvent('qd:login', {
                detail: { serviceId: 'TEST001', timestamp: new Date().toISOString() },
              }),
            );
          }}
          style="display: block; width: 100%; margin-bottom: 8px; padding: 8px; cursor: pointer;"
        >
          Trigger qd:login
        </button>
        <button
          @click=${() => {
            window.dispatchEvent(
              new CustomEvent('qd:answer-saved', {
                detail: { pageId: 'test-page', timestamp: new Date().toISOString() },
              }),
            );
          }}
          style="display: block; width: 100%; margin-bottom: 8px; padding: 8px; cursor: pointer;"
        >
          Trigger qd:answer-saved
        </button>
        <button
          @click=${() => {
            sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');
            window.dispatchEvent(
              new CustomEvent('qd:instructor-unlock', {
                detail: { timestamp: new Date().toISOString() },
              }),
            );
          }}
          style="display: block; width: 100%; margin-bottom: 8px; padding: 8px; cursor: pointer;"
        >
          Trigger qd:instructor-unlock
        </button>
        <button
          @click=${() => {
            window.dispatchEvent(
              new CustomEvent('qd:data-cleared', {
                detail: { timestamp: new Date().toISOString() },
              }),
            );
          }}
          style="display: block; width: 100%; padding: 8px; cursor: pointer;"
        >
          Trigger qd:data-cleared
        </button>
      </div>
    </div>
  `,
};
