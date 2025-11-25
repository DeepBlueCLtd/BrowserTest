/**
 * Question Input Service
 *
 * Pure functions for generating question input specifications.
 * No DOM dependencies - returns data structures that can be tested
 * without browser environment.
 *
 * Feature: 007-lit-component-refactor
 */

import type { QuizQuestion, AnswerRecord } from '../types/contracts.js';

/**
 * Option specification for MCQ dropdowns
 */
export interface OptionSpec {
  value: string;
  text: string;
}

/**
 * Specification for rendering a question input
 */
export interface QuestionInputSpec {
  /** Input type: 'select' for MCQ, 'text' for numeric */
  type: 'select' | 'text';
  /** CSS class name */
  className: string;
  /** Placeholder text */
  placeholder: string;
  /** Current value (from existing answer or empty) */
  value: string;
  /** Options for select (MCQ only) */
  options?: OptionSpec[];
}

/**
 * Get input specification for a quiz question
 *
 * Returns a data structure describing how to render the input,
 * without creating DOM elements.
 *
 * @param question - Quiz question configuration
 * @param existingAnswer - Existing answer record (optional)
 * @returns Input specification
 */
export function getQuestionInputSpec(
  question: QuizQuestion,
  existingAnswer?: AnswerRecord,
): QuestionInputSpec {
  if (question.kind === 'mcq') {
    // MCQ question - select dropdown
    const options: OptionSpec[] = (question.options || []).map((optionText, index) => ({
      value: String(index + 1), // 1-indexed
      text: `${index + 1}. ${optionText}`,
    }));

    return {
      type: 'select',
      className: 'qd-quiz-input',
      placeholder: 'Select an answer...',
      value: existingAnswer?.answer || '',
      options,
    };
  } else {
    // Numeric question - text input
    return {
      type: 'text',
      className: 'qd-quiz-input',
      placeholder: 'Enter value',
      value: existingAnswer?.answer || '',
    };
  }
}
