/**
 * Unit tests for quiz table enhancer - logout state clearing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { enhanceQuizTable } from '../../../src/enhancers/quiz-table.js';
import { STORAGE_KEYS } from '../../../src/types/contracts.js';
import type { SessionData } from '../../../src/types/contracts.js';

describe('Quiz Table Enhancer - Logout State Clearing', () => {
  let table: HTMLTableElement;

  beforeEach(() => {
    // Clear sessionStorage
    sessionStorage.clear();

    // Create a minimal quiz table structure
    table = document.createElement('table');
    table.className = 'qd-quiz';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Question</th>
          <th>Answer</th>
          <th>Detail</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>What is 2+2?</td>
          <td>4</td>
          <td>±0.1</td>
        </tr>
        <tr>
          <td>What is 3+3?</td>
          <td>6</td>
          <td>±0.1</td>
        </tr>
      </tbody>
    `;

    document.body.appendChild(table);

    // Set up session for interactive mode
    const session: SessionData = {
      serviceId: 'RN2344',
      name: 'Alice Student',
      release: '11-2024',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      instructorUnlocked: false,
    };
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  });

  afterEach(() => {
    document.body.removeChild(table);
    sessionStorage.clear();
  });

  it('should clear color-coded feedback on logout (FR-001, FR-002)', () => {
    // Enhance table in interactive mode
    enhanceQuizTable(table, { interactive: true, pageId: 'test-page' });

    // Simulate student answering questions with color-coded feedback
    const tbody = table.querySelector('tbody');
    const rows = tbody?.querySelectorAll('tr');
    expect(rows).toBeDefined();
    expect(rows?.length).toBe(2);

    if (rows) {
      const firstAnswerCell = rows[0]?.querySelector('td:nth-child(2)');
      const secondAnswerCell = rows[1]?.querySelector('td:nth-child(2)');

      // Add color-coded classes (simulating correct/incorrect answers)
      firstAnswerCell?.classList.add('qd-answer-correct');
      secondAnswerCell?.classList.add('qd-answer-incorrect');

      // Verify classes are present
      expect(firstAnswerCell?.classList.contains('qd-answer-correct')).toBe(true);
      expect(secondAnswerCell?.classList.contains('qd-answer-incorrect')).toBe(true);

      // Emit logout event
      const logoutEvent = new CustomEvent('qd:logout', {
        detail: {
          serviceId: 'RN2344',
          timestamp: new Date().toISOString(),
        },
      });
      document.dispatchEvent(logoutEvent);

      // Verify color-coded classes are removed
      expect(firstAnswerCell?.classList.contains('qd-answer-correct')).toBe(false);
      expect(secondAnswerCell?.classList.contains('qd-answer-incorrect')).toBe(false);
    }
  });

  it('should clear student answer displays on logout (FR-001, FR-002)', () => {
    // Enhance table in interactive mode
    enhanceQuizTable(table, { interactive: true, pageId: 'test-page' });

    // Simulate instructor view with student answers displayed
    const tbody = table.querySelector('tbody');
    const firstRow = tbody?.querySelector('tr');
    const firstAnswerCell = firstRow?.querySelector('td:nth-child(2)');

    if (firstAnswerCell) {
      // Add student answers display
      const studentAnswersDiv = document.createElement('div');
      studentAnswersDiv.className = 'qd-student-answers';
      studentAnswersDiv.innerHTML = `
        <div class="qd-student-answer qd-correct">
          <span class="qd-student-name">Alice (2344)</span>:
          <span class="qd-student-answer-text">4</span>
          <span class="qd-timestamp">Nov 19 14:23</span>
        </div>
      `;
      firstAnswerCell.appendChild(studentAnswersDiv);

      // Verify student answers are present
      expect(firstAnswerCell.querySelector('.qd-student-answers')).toBeDefined();

      // Emit logout event
      const logoutEvent = new CustomEvent('qd:logout', {
        detail: {
          serviceId: 'RN2344',
          timestamp: new Date().toISOString(),
        },
      });
      document.dispatchEvent(logoutEvent);

      // Verify student answers are removed
      expect(firstAnswerCell.querySelector('.qd-student-answers')).toBeNull();
    }
  });

  it('should not throw error if table has no color-coded cells on logout', () => {
    // Enhance table in interactive mode
    enhanceQuizTable(table, { interactive: true, pageId: 'test-page' });

    // Emit logout event without any color-coded cells
    const logoutEvent = new CustomEvent('qd:logout', {
      detail: {
        serviceId: 'RN2344',
        timestamp: new Date().toISOString(),
      },
    });

    expect(() => document.dispatchEvent(logoutEvent)).not.toThrow();
  });
});
