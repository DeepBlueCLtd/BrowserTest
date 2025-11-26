/**
 * Answer Display Service
 *
 * Pure functions for formatting student answer data for display.
 * No DOM dependencies - returns data structures that can be tested
 * without browser environment.
 *
 * Feature: 007-lit-component-refactor
 */

import type { StudentRecord, PageId } from '../types/contracts.js';
import { formatStoredTimestamp } from '../utils/date-helpers.js';

/**
 * Formatted student answer for display
 */
export interface StudentAnswerDisplay {
  /** Student name */
  name: string;
  /** Last 4 digits of service ID */
  maskedServiceId: string;
  /** Answer value */
  answer: string;
  /** Whether answer is correct */
  success: boolean;
  /** Formatted timestamp for display (24-hour format) */
  formattedTimestamp: string;
  /** CSS class based on success: 'qd-correct' or 'qd-incorrect' */
  cssClass: 'qd-correct' | 'qd-incorrect';
}

/**
 * Format student answers for a specific question for display
 *
 * Collects and formats answers from all students for a specific
 * question, ready for rendering in instructor view.
 *
 * @param students - Array of student records
 * @param pageId - Page identifier
 * @param questionIndex - 0-based question index
 * @returns Array of formatted student answers
 */
export function formatStudentAnswersForDisplay(
  students: StudentRecord[],
  pageId: PageId,
  questionIndex: number,
): StudentAnswerDisplay[] {
  const result: StudentAnswerDisplay[] = [];

  for (const student of students) {
    const pageData = student.pages[pageId];
    if (!pageData || !pageData.answers) continue;

    const answerRecord = pageData.answers[questionIndex];
    if (!answerRecord) continue;

    result.push({
      name: student.name,
      maskedServiceId: student.serviceId.slice(-4),
      answer: answerRecord.answer,
      success: answerRecord.success,
      formattedTimestamp: formatStoredTimestamp(answerRecord.timestamp),
      cssClass: answerRecord.success ? 'qd-correct' : 'qd-incorrect',
    });
  }

  return result;
}
