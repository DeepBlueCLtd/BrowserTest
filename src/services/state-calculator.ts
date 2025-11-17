/**
 * Completion State Calculator
 *
 * Functions for calculating page completion states based on answer data.
 *
 * State Rules (from CLAUDE.md):
 * - unstarted: No answers provided
 * - incomplete: Some answered OR any incorrect
 * - complete: All answered AND all correct
 */

import type { AnswerRecord, CompletionState } from '../types/contracts.js';

/**
 * Calculate the completion state for a page
 *
 * @param answers - Array of answer records for the page
 * @param totalQuestions - Total number of questions on the page
 * @returns Completion state (unstarted | incomplete | complete)
 *
 * @example
 * ```typescript
 * const answers = [
 *   { answer: 'a', success: true, timestamp: '2024-11-16T10:00:00Z' },
 *   { answer: 'b', success: false, timestamp: '2024-11-16T10:01:00Z' },
 * ];
 * const state = calculateCompletionState(answers, 3); // 'incomplete' (not all answered)
 * ```
 */
export function calculateCompletionState(
  answers: AnswerRecord[],
  totalQuestions: number,
): CompletionState {
  // Handle edge case: no questions
  if (totalQuestions === 0) {
    return 'unstarted';
  }

  // Check if unstarted
  if (isPageUnstarted(answers)) {
    return 'unstarted';
  }

  // Check if complete
  if (isPageComplete(answers, totalQuestions)) {
    return 'complete';
  }

  // Otherwise, it's incomplete
  return 'incomplete';
}

/**
 * Check if a page is complete
 *
 * A page is complete when:
 * - All questions are answered
 * - All answered questions are correct
 *
 * @param answers - Array of answer records
 * @param totalQuestions - Total number of questions
 * @returns True if page is complete
 */
export function isPageComplete(answers: AnswerRecord[], totalQuestions: number): boolean {
  // Must have answered all questions
  if (answers.length !== totalQuestions) {
    return false;
  }

  // All answers must be correct
  return answers.every((answer) => answer.success === true);
}

/**
 * Check if a page is unstarted
 *
 * A page is unstarted when no answers have been provided.
 *
 * @param answers - Array of answer records
 * @returns True if page is unstarted
 */
export function isPageUnstarted(answers: AnswerRecord[]): boolean {
  return answers.length === 0;
}

/**
 * Count the number of correct answers
 *
 * @param answers - Array of answer records
 * @returns Number of correct answers
 */
export function countCorrectAnswers(answers: AnswerRecord[]): number {
  return answers.filter((answer) => answer.success === true).length;
}

/**
 * Calculate success percentage
 *
 * @param answers - Array of answer records
 * @param totalQuestions - Total number of questions
 * @returns Percentage of correct answers (0-100)
 *
 * @example
 * ```typescript
 * const answers = [
 *   { answer: 'a', success: true, timestamp: '...' },
 *   { answer: 'b', success: false, timestamp: '...' },
 *   { answer: 'c', success: true, timestamp: '...' },
 * ];
 * const percentage = calculateSuccessPercentage(answers, 3); // 67 (2 out of 3 correct)
 * ```
 */
export function calculateSuccessPercentage(
  answers: AnswerRecord[],
  totalQuestions: number,
): number {
  if (totalQuestions === 0) {
    return 0;
  }

  const correct = countCorrectAnswers(answers);
  return Math.round((correct / totalQuestions) * 100);
}
