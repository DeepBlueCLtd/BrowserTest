/**
 * State Calculation Tests
 *
 * Tests for calculating page completion states based on answer data.
 * States: unstarted | incomplete | complete
 *
 * Rules:
 * - unstarted: No answers provided
 * - incomplete: Some answered OR any incorrect
 * - complete: All answered AND all correct
 */

import { describe, it, expect } from 'vitest';
import type { AnswerRecord } from '../../../src/types/contracts';
import {
  calculateCompletionState,
  isPageComplete,
  isPageUnstarted,
} from '../../../src/services/state-calculator';

describe('State Calculator', () => {
  describe('calculateCompletionState()', () => {
    it('should return "unstarted" for no answers', () => {
      const state = calculateCompletionState([], 5);
      expect(state).toBe('unstarted');
    });

    it('should return "incomplete" for partial answers', () => {
      const answers: AnswerRecord[] = [
        { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
        { answer: 'b', success: true, timestamp: '2025-01-15T10:01:00.000Z' },
      ];

      const state = calculateCompletionState(answers, 5);
      expect(state).toBe('incomplete');
    });

    it('should return "incomplete" for all answered but some incorrect', () => {
      const answers: AnswerRecord[] = [
        { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
        { answer: 'b', success: false, timestamp: '2025-01-15T10:01:00.000Z' },
        { answer: 'c', success: true, timestamp: '2025-01-15T10:02:00.000Z' },
      ];

      const state = calculateCompletionState(answers, 3);
      expect(state).toBe('incomplete');
    });

    it('should return "complete" for all answered and all correct', () => {
      const answers: AnswerRecord[] = [
        { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
        { answer: 'b', success: true, timestamp: '2025-01-15T10:01:00.000Z' },
        { answer: 'c', success: true, timestamp: '2025-01-15T10:02:00.000Z' },
      ];

      const state = calculateCompletionState(answers, 3);
      expect(state).toBe('complete');
    });

    it('should handle single question pages', () => {
      const answers: AnswerRecord[] = [
        { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
      ];

      const state = calculateCompletionState(answers, 1);
      expect(state).toBe('complete');
    });

    it('should handle zero totalQuestions', () => {
      const state = calculateCompletionState([], 0);
      expect(state).toBe('unstarted');
    });

    it('should return "incomplete" if more answers than questions', () => {
      const answers: AnswerRecord[] = [
        { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
        { answer: 'b', success: true, timestamp: '2025-01-15T10:01:00.000Z' },
        { answer: 'c', success: true, timestamp: '2025-01-15T10:02:00.000Z' },
      ];

      // More answers than questions = incomplete
      const state = calculateCompletionState(answers, 2);
      expect(state).toBe('incomplete');
    });
  });

  describe('isPageComplete()', () => {
    it('should return false for no answers', () => {
      const complete = isPageComplete([], 5);
      expect(complete).toBe(false);
    });

    it('should return false for partial answers', () => {
      const answers: AnswerRecord[] = [
        { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
      ];

      const complete = isPageComplete(answers, 5);
      expect(complete).toBe(false);
    });

    it('should return false for all answered but some incorrect', () => {
      const answers: AnswerRecord[] = [
        { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
        { answer: 'b', success: false, timestamp: '2025-01-15T10:01:00.000Z' },
      ];

      const complete = isPageComplete(answers, 2);
      expect(complete).toBe(false);
    });

    it('should return true for all answered and all correct', () => {
      const answers: AnswerRecord[] = [
        { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
        { answer: 'b', success: true, timestamp: '2025-01-15T10:01:00.000Z' },
        { answer: 'c', success: true, timestamp: '2025-01-15T10:02:00.000Z' },
      ];

      const complete = isPageComplete(answers, 3);
      expect(complete).toBe(true);
    });
  });

  describe('isPageUnstarted()', () => {
    it('should return true for empty answers array', () => {
      const unstarted = isPageUnstarted([]);
      expect(unstarted).toBe(true);
    });

    it('should return false for any answers', () => {
      const answers: AnswerRecord[] = [
        { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
      ];

      const unstarted = isPageUnstarted(answers);
      expect(unstarted).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single correct answer', () => {
      const answers: AnswerRecord[] = [
        { answer: 'a', success: true, timestamp: '2025-01-15T10:00:00.000Z' },
      ];

      const state = calculateCompletionState(answers, 1);
      expect(state).toBe('complete');
    });

    it('should handle single incorrect answer', () => {
      const answers: AnswerRecord[] = [
        { answer: 'a', success: false, timestamp: '2025-01-15T10:00:00.000Z' },
      ];

      const state = calculateCompletionState(answers, 1);
      expect(state).toBe('incomplete');
    });

    it('should handle all incorrect answers', () => {
      const answers: AnswerRecord[] = [
        { answer: 'a', success: false, timestamp: '2025-01-15T10:00:00.000Z' },
        { answer: 'b', success: false, timestamp: '2025-01-15T10:01:00.000Z' },
        { answer: 'c', success: false, timestamp: '2025-01-15T10:02:00.000Z' },
      ];

      const state = calculateCompletionState(answers, 3);
      expect(state).toBe('incomplete');
    });

    it('should handle large number of questions', () => {
      const answers: AnswerRecord[] = Array.from({ length: 100 }, (_, i) => ({
        answer: `answer-${i}`,
        success: true,
        timestamp: '2025-01-15T10:00:00.000Z',
      }));

      const state = calculateCompletionState(answers, 100);
      expect(state).toBe('complete');
    });
  });
});
