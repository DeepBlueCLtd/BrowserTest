/**
 * Storybook stories for qd-scores-modal component
 *
 * Demonstrates scores modal with student data and expandable rows.
 * Feature: 007-lit-component-refactor
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/components/qd-scores-modal.js';
import type { StudentRecord } from '../../src/types/contracts.js';

const meta: Meta = {
  title: 'Components/ScoresModal',
  component: 'qd-scores-modal',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Modal displaying student scores with expandable per-page breakdown.

**Features:**
- Summary view with attempted/correct/percentage for each student
- Expandable rows showing per-page answer details
- Color-coded correct (green) / incorrect (red) answers
- Alphabetically sorted student list
- Uses qd-modal base for backdrop, Escape key, focus trap

**Properties:**
- \`open\`: Boolean - whether modal is visible
- \`students\`: StudentRecord[] - student data to display

**Events:**
- \`close\`: Emitted when modal closes
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const sampleStudents: StudentRecord[] = [
  {
    schema: 1,
    docId: 'doc-1',
    release: '01-2025',
    serviceId: 'ALICE001',
    name: 'Alice Anderson',
    attempted: 10,
    correct: 9,
    updated: '2025-01-15T10:30:00Z',
    pages: {
      'quiz-page-1': {
        state: 'complete',
        answers: [
          { answer: 'A', success: true, timestamp: '2025-01-15T10:00:00Z' },
          { answer: 'B', success: true, timestamp: '2025-01-15T10:01:00Z' },
          { answer: 'C', success: true, timestamp: '2025-01-15T10:02:00Z' },
        ],
      },
      'quiz-page-2': {
        state: 'complete',
        answers: [
          { answer: '42', success: true, timestamp: '2025-01-15T10:10:00Z' },
          { answer: '3.14', success: true, timestamp: '2025-01-15T10:11:00Z' },
          { answer: '99', success: false, timestamp: '2025-01-15T10:12:00Z' },
        ],
      },
    },
  },
  {
    schema: 1,
    docId: 'doc-2',
    release: '01-2025',
    serviceId: 'BOB00002',
    name: 'Bob Baker',
    attempted: 6,
    correct: 4,
    updated: '2025-01-15T11:00:00Z',
    pages: {
      'quiz-page-1': {
        state: 'incomplete',
        answers: [
          { answer: 'A', success: true, timestamp: '2025-01-15T10:30:00Z' },
          { answer: 'D', success: false, timestamp: '2025-01-15T10:31:00Z' },
          { answer: 'C', success: true, timestamp: '2025-01-15T10:32:00Z' },
        ],
      },
      'quiz-page-2': {
        state: 'incomplete',
        answers: [
          { answer: '40', success: false, timestamp: '2025-01-15T10:40:00Z' },
          { answer: '3.14', success: true, timestamp: '2025-01-15T10:41:00Z' },
          { answer: '100', success: true, timestamp: '2025-01-15T10:42:00Z' },
        ],
      },
    },
  },
  {
    schema: 1,
    docId: 'doc-3',
    release: '01-2025',
    serviceId: 'CHARLIE3',
    name: 'Charlie Chen',
    attempted: 3,
    correct: 3,
    updated: '2025-01-15T09:00:00Z',
    pages: {
      'quiz-page-1': {
        state: 'complete',
        answers: [
          { answer: 'A', success: true, timestamp: '2025-01-15T09:00:00Z' },
          { answer: 'B', success: true, timestamp: '2025-01-15T09:01:00Z' },
          { answer: 'C', success: true, timestamp: '2025-01-15T09:02:00Z' },
        ],
      },
    },
  },
];

/**
 * Default with Sample Data
 *
 * Shows modal with multiple students and their scores.
 */
export const Default: Story = {
  render: () => html` <qd-scores-modal open .students=${sampleStudents}></qd-scores-modal> `,
};

/**
 * Empty State
 *
 * Shows modal when no students have data.
 */
export const EmptyState: Story = {
  render: () => html` <qd-scores-modal open .students=${[]}></qd-scores-modal> `,
};

/**
 * Single Student
 *
 * Shows modal with just one student.
 */
export const SingleStudent: Story = {
  render: () => html` <qd-scores-modal open .students=${[sampleStudents[0]]}></qd-scores-modal> `,
};

/**
 * Perfect Score
 *
 * Shows a student with 100% correct answers.
 */
export const PerfectScore: Story = {
  render: () => {
    const perfectStudent: StudentRecord = {
      schema: 1,
      docId: 'perfect',
      release: '01-2025',
      serviceId: 'PERF0001',
      name: 'Perfect Paula',
      attempted: 5,
      correct: 5,
      updated: '2025-01-15T12:00:00Z',
      pages: {
        'quiz-page-1': {
          state: 'complete',
          answers: [
            { answer: 'A', success: true, timestamp: '2025-01-15T12:00:00Z' },
            { answer: 'B', success: true, timestamp: '2025-01-15T12:01:00Z' },
            { answer: 'C', success: true, timestamp: '2025-01-15T12:02:00Z' },
            { answer: 'D', success: true, timestamp: '2025-01-15T12:03:00Z' },
            { answer: 'E', success: true, timestamp: '2025-01-15T12:04:00Z' },
          ],
        },
      },
    };

    return html` <qd-scores-modal open .students=${[perfectStudent]}></qd-scores-modal> `;
  },
};

/**
 * Low Score
 *
 * Shows students with low scores (mostly incorrect).
 */
export const LowScores: Story = {
  render: () => {
    const lowScoreStudents: StudentRecord[] = [
      {
        schema: 1,
        docId: 'low1',
        release: '01-2025',
        serviceId: 'LOW00001',
        name: 'Struggling Steve',
        attempted: 10,
        correct: 2,
        updated: '2025-01-15T13:00:00Z',
        pages: {
          'quiz-page-1': {
            state: 'incomplete',
            answers: [
              { answer: 'X', success: false, timestamp: '2025-01-15T13:00:00Z' },
              { answer: 'Y', success: false, timestamp: '2025-01-15T13:01:00Z' },
              { answer: 'C', success: true, timestamp: '2025-01-15T13:02:00Z' },
            ],
          },
        },
      },
      {
        schema: 1,
        docId: 'low2',
        release: '01-2025',
        serviceId: 'LOW00002',
        name: 'Learning Larry',
        attempted: 5,
        correct: 0,
        updated: '2025-01-15T14:00:00Z',
        pages: {
          'quiz-page-1': {
            state: 'incomplete',
            answers: [
              { answer: 'wrong', success: false, timestamp: '2025-01-15T14:00:00Z' },
              { answer: 'nope', success: false, timestamp: '2025-01-15T14:01:00Z' },
            ],
          },
        },
      },
    ];

    return html` <qd-scores-modal open .students=${lowScoreStudents}></qd-scores-modal> `;
  },
};

/**
 * Interactive Open/Close
 *
 * Shows how to open and close the modal via button.
 */
export const Interactive: Story = {
  render: () => {
    const openModal = () => {
      const modal = document.querySelector('qd-scores-modal');
      modal?.show();
    };

    return html`
      <div style="padding: 20px;">
        <button
          @click=${openModal}
          style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          View Student Scores
        </button>

        <qd-scores-modal .students=${sampleStudents} @close=${() => {}}></qd-scores-modal>

        <div
          style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the button to open the scores modal. Press Escape or click outside to close.
          </p>
        </div>
      </div>
    `;
  },
};
