/**
 * Quiz Answer Service
 *
 * Orchestrates quiz answer saving workflow:
 * - Validates answers against correct answers
 * - Updates student records in storage
 * - Manages cache updates
 *
 * This service separates storage orchestration from UI logic,
 * making it easier to test and maintain.
 */

import type {
  SessionData,
  SessionCache,
  AnswerRecord,
  QuizQuestion,
  PageId,
} from '../types/contracts.js';
import { validateAnswer } from './quiz-parser.js';
import { getStorageService } from './storage-service.js';
import { warn } from '../utils/logger.js';

/**
 * Parameters for saving a quiz answer
 */
export interface SaveAnswerParams {
  session: SessionData;
  pageId: PageId;
  questionIndex: number;
  answer: string;
  question: QuizQuestion;
  totalQuestions: number;
}

/**
 * Result of saving a quiz answer
 */
export interface SaveAnswerResult {
  /** Whether the answer was correct */
  success: boolean;
  /** Updated session cache */
  cache: SessionCache;
  /** The created answer record */
  answerRecord: AnswerRecord;
  /** Page completion state after this answer */
  pageState?: 'unstarted' | 'incomplete' | 'complete';
}

/**
 * Quiz Answer Service
 *
 * Handles all storage operations for quiz answer submissions.
 * Separates business logic from UI updates.
 */
export class QuizAnswerService {
  /**
   * Save a quiz answer to storage
   *
   * @param params - Answer submission parameters
   * @returns Result with success status, cache, and state
   *
   * @example
   * ```typescript
   * const service = new QuizAnswerService();
   * const result = await service.saveAnswer({
   *   session,
   *   pageId: 'quiz-1',
   *   questionIndex: 0,
   *   answer: 'A',
   *   question: { kind: 'mcq', correctAnswer: 'A', options: [...] },
   *   totalQuestions: 5
   * });
   *
   * if (result.success) {
   *   console.log('Correct answer!');
   * }
   * ```
   */
  async saveAnswer(params: SaveAnswerParams): Promise<SaveAnswerResult> {
    const { session, pageId, questionIndex, answer, question, totalQuestions } = params;

    // Validate answer
    const success = validateAnswer(question, answer);

    // Create answer record
    const answerRecord: AnswerRecord = {
      answer: answer.trim(),
      success,
      timestamp: new Date().toISOString(),
    };

    // Get storage service
    const storageService = getStorageService();

    // Load student record from IndexedDB
    let studentRecord;
    try {
      studentRecord = await storageService.loadStudentRecord(session);
    } catch (err) {
      warn('Failed to load student record, answer not saved', err);
      throw new Error('Failed to load student record');
    }

    // Update record with new answer
    const updatedRecord = storageService.updateRecordWithAnswer(
      studentRecord,
      pageId,
      questionIndex,
      answerRecord,
      totalQuestions,
    );

    // Save updated record to IndexedDB
    try {
      await storageService.saveStudentRecord(updatedRecord);
    } catch (err) {
      warn('Failed to save student record to IndexedDB', err);
      throw new Error('Failed to save student record');
    }

    // Build cache from updated record
    const cache = storageService.buildCache(updatedRecord);

    // Get page state for event emission
    const pageData = updatedRecord.pages[pageId];
    const pageState = pageData?.state;

    return {
      success,
      cache,
      answerRecord,
      pageState,
    };
  }

  /**
   * Validate an answer without saving
   *
   * @param question - Question data
   * @param answer - User's answer
   * @returns True if answer is correct
   */
  validateAnswer(question: QuizQuestion, answer: string): boolean {
    return validateAnswer(question, answer);
  }
}

/**
 * Singleton instance
 */
let serviceInstance: QuizAnswerService | null = null;

/**
 * Get the quiz answer service instance (singleton)
 *
 * @returns QuizAnswerService instance
 */
export function getQuizAnswerService(): QuizAnswerService {
  if (!serviceInstance) {
    serviceInstance = new QuizAnswerService();
  }
  return serviceInstance;
}

/**
 * Reset the service instance (for testing)
 */
export function resetQuizAnswerService(): void {
  serviceInstance = null;
}
