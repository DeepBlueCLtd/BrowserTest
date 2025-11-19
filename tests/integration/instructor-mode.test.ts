/**
 * Integration Tests for Student-to-Instructor Transition
 *
 * Tests the complete workflow of logging in as student, then logging out
 * and logging in as instructor, verifying no student state leakage.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionService } from '../../src/services/session.js';
import { enhanceQuizTable } from '../../src/enhancers/quiz-table.js';
import { STORAGE_KEYS } from '../../src/types/contracts.js';

describe('Student-to-Instructor Transition (FR-001, FR-002)', () => {
  let container: HTMLDivElement;
  let table: HTMLTableElement;
  let sessionService: SessionService;

  beforeEach(() => {
    // Create container and table
    container = document.createElement('div');
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
    container.appendChild(table);
    document.body.appendChild(container);

    // Clear storage
    sessionStorage.clear();

    // Create session service
    sessionService = new SessionService();
  });

  afterEach(() => {
    container.remove();
    sessionStorage.clear();
  });

  it('should clear student UI state when transitioning from student to instructor', () => {
    // ===== STUDENT SESSION =====
    // 1. Student logs in
    const studentSession = sessionService.createSession('RN2344', 'Alice Student', '11-2024');
    expect(studentSession.instructorUnlocked).toBe(false);

    // 2. Enhance table in interactive mode
    enhanceQuizTable(table, { interactive: true, pageId: 'test-page' });

    // 3. Simulate student answering questions with color-coded feedback
    const tbody = table.querySelector('tbody');
    const rows = tbody?.querySelectorAll('tr');
    const firstAnswerCell = rows?.[0]?.querySelector('td:nth-child(2)');
    const secondAnswerCell = rows?.[1]?.querySelector('td:nth-child(2)');

    // Add color-coded classes (simulating correct/incorrect answers)
    firstAnswerCell?.classList.add('qd-answer-correct');
    secondAnswerCell?.classList.add('qd-answer-incorrect');

    // Verify student UI state is present
    expect(firstAnswerCell?.classList.contains('qd-answer-correct')).toBe(true);
    expect(secondAnswerCell?.classList.contains('qd-answer-incorrect')).toBe(true);

    // 4. Student logs out
    sessionService.clearSession();

    // Verify session is cleared
    expect(sessionStorage.getItem(STORAGE_KEYS.SESSION)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.CACHE)).toBeNull();

    // Verify student UI state is cleared
    expect(firstAnswerCell?.classList.contains('qd-answer-correct')).toBe(false);
    expect(secondAnswerCell?.classList.contains('qd-answer-incorrect')).toBe(false);

    // ===== INSTRUCTOR SESSION =====
    // 5. Instructor logs in
    const instructorSession = sessionService.createSession('INST001', 'Instructor', '11-2024');
    sessionService.unlockInstructor();

    // 6. Verify instructor session is active
    expect(instructorSession.serviceId).toBe('INST001');
    expect(sessionService.isInstructorUnlocked()).toBe(true);

    // 7. Verify no student-specific UI state remains
    expect(firstAnswerCell?.classList.contains('qd-answer-correct')).toBe(false);
    expect(firstAnswerCell?.classList.contains('qd-answer-incorrect')).toBe(false);
    expect(secondAnswerCell?.classList.contains('qd-answer-correct')).toBe(false);
    expect(secondAnswerCell?.classList.contains('qd-answer-incorrect')).toBe(false);

    // 8. Verify no student answer displays remain
    expect(table.querySelectorAll('.qd-student-answers').length).toBe(0);
  });

  it('should clear instructor toggle state on logout', () => {
    // 1. Instructor logs in
    sessionService.createSession('INST001', 'Instructor', '11-2024');
    sessionService.unlockInstructor();

    // 2. Set toggle state
    sessionStorage.setItem('qd/instructor/showAnswers', 'true');
    sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');

    // Verify state exists
    expect(sessionStorage.getItem('qd/instructor/showAnswers')).toBe('true');
    expect(sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR)).toBe('true');

    // 3. Logout
    sessionService.clearSession();

    // 4. Verify toggle state is cleared
    expect(sessionStorage.getItem('qd/instructor/showAnswers')).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR)).toBeNull();
  });

  it('should allow multiple student-instructor-student transitions without state pollution', () => {
    // First student session
    sessionService.createSession('RN2344', 'Alice', '11-2024');
    enhanceQuizTable(table, { interactive: true, pageId: 'test-page' });

    const firstCell = table.querySelector('tbody tr td:nth-child(2)');
    firstCell?.classList.add('qd-answer-correct');
    expect(firstCell?.classList.contains('qd-answer-correct')).toBe(true);

    sessionService.clearSession();
    expect(firstCell?.classList.contains('qd-answer-correct')).toBe(false);

    // Instructor session
    sessionService.createSession('INST001', 'Instructor', '11-2024');
    sessionService.unlockInstructor();
    sessionStorage.setItem('qd/instructor/showAnswers', 'true');

    sessionService.clearSession();
    expect(sessionStorage.getItem('qd/instructor/showAnswers')).toBeNull();

    // Second student session
    sessionService.createSession('RN5678', 'Bob', '11-2024');
    const session = sessionService.getSession();
    expect(session?.serviceId).toBe('RN5678');
    expect(session?.instructorUnlocked).toBe(false);
    expect(sessionStorage.getItem('qd/instructor/showAnswers')).toBeNull();

    // Verify clean slate for second student
    expect(firstCell?.classList.contains('qd-answer-correct')).toBe(false);
    expect(firstCell?.classList.contains('qd-answer-incorrect')).toBe(false);
  });
});
