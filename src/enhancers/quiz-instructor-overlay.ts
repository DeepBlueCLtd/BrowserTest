/**
 * Quiz instructor overlay.
 *
 * Renders (and clears) the per-question list of student answers shown when an
 * instructor toggles "show answers". Extracted from `quiz-table.ts`.
 *
 * SECURITY (FR-004): student-controlled name/answer fields are rendered via
 * `textContent`, never `innerHTML`, so any HTML they contain is inert text.
 */

import type { SessionData } from '../types/contracts.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import type { QuizTableMetadata } from './quiz-table.js';
import { getStorageService } from '../services/storage-service.js';
import { formatStudentAnswersForDisplay } from '../services/answer-display.js';
import { getJSON } from '../utils/storage-helpers.js';
import { info, error as logError } from '../utils/logger.js';

/**
 * Show student answers for all questions in a table (instructor mode).
 *
 * @param table - Quiz table element
 * @param metadata - Table metadata
 */
export async function showStudentAnswersForTable(
  table: HTMLTableElement,
  metadata: QuizTableMetadata,
): Promise<void> {
  const { pageId, parsed } = metadata;
  if (!pageId) return;

  const session = getJSON<SessionData>(STORAGE_KEYS.SESSION);
  if (!session) return;

  // Get storage service to load all student records
  const storageService = getStorageService();

  try {
    // Load all student records for current release
    const students = await storageService.getStudentsByRelease(session.release);

    // Check if there are any students
    if (students.length === 0) {
      info('No student data available for this release');
      alert(
        'No student data available for this release. Students need to log in and answer questions first.',
      );
      return;
    }

    // Get tbody rows
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));

    // For each question, collect student answers and display
    parsed.questions.forEach((_question, questionIndex) => {
      const row = rows[questionIndex];
      if (!row) return;

      const cells = Array.from(row.querySelectorAll('td'));
      const answerCell = cells[1];
      if (!answerCell) return;

      // Remove any existing student answers display
      const existingDisplay = answerCell.querySelector('.qd-student-answers');
      if (existingDisplay) {
        existingDisplay.remove();
      }

      // Use pure helper function to format student answers
      const studentAnswers = formatStudentAnswersForDisplay(students, pageId, questionIndex);

      // Create display element from formatted data
      if (studentAnswers.length > 0) {
        const display = document.createElement('div');
        display.className = 'qd-student-answers';

        studentAnswers.forEach((sa) => {
          const answerDiv = document.createElement('div');
          answerDiv.className = `qd-student-answer ${sa.cssClass}`;

          // Format: Name (last 4 of serviceId): answer [timestamp] (FR-007: 24-hour format)
          // SECURITY (FR-004): student-controlled name/answer are set via
          // textContent so any HTML they contain renders as inert text, never
          // as live markup. Never use innerHTML for student-supplied data.
          const nameSpan = document.createElement('span');
          nameSpan.className = 'qd-student-name';
          nameSpan.textContent = `${sa.name} (${sa.maskedServiceId})`;

          const answerSpan = document.createElement('span');
          answerSpan.className = 'qd-student-answer-text';
          answerSpan.textContent = sa.answer;

          const timestampSpan = document.createElement('span');
          timestampSpan.className = 'qd-timestamp';
          timestampSpan.textContent = sa.formattedTimestamp;

          answerDiv.append(
            nameSpan,
            document.createTextNode(': '),
            answerSpan,
            document.createTextNode(' '),
            timestampSpan,
          );

          display.appendChild(answerDiv);
        });

        answerCell.appendChild(display);
      }
    });

    info(`Displayed student answers for ${students.length} students on page ${pageId}`);
  } catch (err) {
    logError('Failed to load student answers', err as Error);
  }
}

/**
 * Hide student answers for all questions in a table.
 *
 * @param table - Quiz table element
 */
export function hideStudentAnswersForTable(table: HTMLTableElement): void {
  const displays = table.querySelectorAll('.qd-student-answers');
  displays.forEach((display) => display.remove());
  info('Hid student answers from quiz table');
}
