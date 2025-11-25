/**
 * Helper Function Type Contracts
 *
 * Feature: 007-lit-component-refactor
 * Purpose: Define interfaces for pure helper functions
 *
 * These types are internal to the application and not persisted.
 */

import type { AnswerRecord, PageData, PageId } from '../../../src/types/contracts';

// =============================================================================
// Validation Helpers (src/utils/validation-helpers.ts)
// =============================================================================

/**
 * Form validation result.
 * Empty array = valid, non-empty = list of error messages.
 */
export type ValidationErrors = string[];

/**
 * Validates student login form fields.
 * @param name - Student name
 * @param serviceId - Service ID
 * @param pin - 4-digit PIN
 * @returns Array of validation error messages (empty if valid)
 */
export type ValidateStudentForm = (
  name: string,
  serviceId: string,
  pin: string
) => ValidationErrors;

/**
 * Sanitizes PIN input to only allow digits.
 * @param input - Raw input string
 * @returns String with non-digit characters removed
 */
export type SanitizePinInput = (input: string) => string;

/**
 * Validates that PIN and confirmation match.
 * @param pin - Original PIN
 * @param confirmPin - Confirmation PIN
 * @returns True if they match
 */
export type ValidatePinMatch = (pin: string, confirmPin: string) => boolean;

// =============================================================================
// Calculation Helpers (src/utils/calculation-helpers.ts)
// =============================================================================

/**
 * Status indicator values for R/A/G progress display.
 */
export type StatusIndicator = 'red' | 'amber' | 'green';

/**
 * Calculates R/A/G status indicator from quiz totals.
 * @param total - Total number of questions
 * @param correct - Number of correct answers
 * @returns 'green' if all correct, 'red' if none, 'amber' otherwise
 */
export type CalculateStatusIndicator = (total: number, correct: number) => StatusIndicator;

/**
 * Calculates percentage with safe division.
 * @param correct - Numerator (correct count)
 * @param attempted - Denominator (attempted count)
 * @returns Rounded percentage (0 if attempted is 0)
 */
export type CalculatePercentage = (correct: number, attempted: number) => number;

/**
 * Totals calculated from page data.
 */
export interface RecalculatedTotals {
  attempted: number;
  correct: number;
}

/**
 * Recalculates totals from all pages in a student record.
 * @param pages - Record of page ID to page data
 * @returns Aggregated attempted and correct counts
 */
export type RecalculateTotalsFromPages = (
  pages: Record<PageId, PageData>
) => RecalculatedTotals;

/**
 * Checks if a session has expired.
 * @param expiresAt - ISO 8601 expiration timestamp
 * @param now - Current time (defaults to new Date())
 * @returns True if session has expired
 */
export type IsSessionExpired = (expiresAt: string, now?: Date) => boolean;

/**
 * Masks a service ID for display (shows last N digits).
 * @param serviceId - Full service ID
 * @param visibleDigits - Number of digits to show (default 4)
 * @returns Masked string like "...1234"
 */
export type MaskServiceId = (serviceId: string, visibleDigits?: number) => string;

// =============================================================================
// Question Input Service (src/services/question-input.ts)
// =============================================================================

/**
 * Specification for rendering a question input control.
 */
export interface QuestionInputSpec {
  /** Input type: 'select' for MCQ, 'text' for numeric */
  type: 'select' | 'text';

  /** Current/default value */
  value: string;

  /** Options for MCQ (undefined for numeric) */
  options?: string[];

  /** Placeholder text for numeric input */
  placeholder?: string;

  /** Whether the input should be disabled */
  disabled?: boolean;
}

/**
 * Parsed question data (subset of QuizQuestion for this service).
 */
export interface QuestionData {
  kind: 'mcq' | 'numeric';
  options?: string[];
}

/**
 * Generates input specification for a quiz question.
 * @param question - Parsed question data
 * @param existingAnswer - Previously saved answer (optional)
 * @returns Specification for rendering the input control
 */
export type GetQuestionInputSpec = (
  question: QuestionData,
  existingAnswer?: AnswerRecord
) => QuestionInputSpec;

// =============================================================================
// Answer Display Service (src/services/answer-display.ts)
// =============================================================================

/**
 * Formatted student answer for instructor review display.
 */
export interface StudentAnswerDisplay {
  /** Student's display name */
  name: string;

  /** Last 4 characters of service ID */
  serviceIdLast4: string;

  /** The answer value */
  answer: string;

  /** Whether the answer was correct */
  success: boolean;

  /** Human-readable timestamp */
  formattedTimestamp: string;
}

/**
 * Minimal student data needed for display formatting.
 */
export interface StudentDisplayData {
  name: string;
  serviceId: string;
  pages: Record<PageId, PageData>;
}

/**
 * Formats student answers for instructor review display.
 * @param students - Array of student records
 * @param pageId - Current page ID
 * @param questionIndex - Index of the question (0-based)
 * @returns Array of formatted display objects
 */
export type FormatStudentAnswersForDisplay = (
  students: StudentDisplayData[],
  pageId: PageId,
  questionIndex: number
) => StudentAnswerDisplay[];
