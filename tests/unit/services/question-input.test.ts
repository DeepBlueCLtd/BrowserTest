/**
 * Tests for question-input.ts service
 *
 * Feature: 007-lit-component-refactor
 * TDD: These tests are written FIRST, before implementation.
 */
import { describe, it, expect } from 'vitest';
import { getQuestionInputSpec } from '../../../src/services/question-input';
import type { QuizQuestion, AnswerRecord } from '../../../src/types/contracts';

describe('question-input service', () => {
  describe('getQuestionInputSpec', () => {
    describe('MCQ questions', () => {
      it('returns select type for MCQ question', () => {
        const question: QuizQuestion = {
          text: 'Question text',
          kind: 'mcq',
          correctAnswer: '2',
          options: ['Option A', 'Option B', 'Option C'],
        };

        const spec = getQuestionInputSpec(question);

        expect(spec.type).toBe('select');
      });

      it('includes options with 1-indexed values', () => {
        const question: QuizQuestion = {
          text: 'Question text',
          kind: 'mcq',
          correctAnswer: '1',
          options: ['First', 'Second', 'Third'],
        };

        const spec = getQuestionInputSpec(question);

        expect(spec.options).toHaveLength(3);
        expect(spec.options![0]).toEqual({ value: '1', text: '1. First' });
        expect(spec.options![1]).toEqual({ value: '2', text: '2. Second' });
        expect(spec.options![2]).toEqual({ value: '3', text: '3. Third' });
      });

      it('includes placeholder option spec', () => {
        const question: QuizQuestion = {
          text: 'Question text',
          kind: 'mcq',
          correctAnswer: '1',
          options: ['A', 'B'],
        };

        const spec = getQuestionInputSpec(question);

        expect(spec.placeholder).toBe('Select an answer...');
      });

      it('sets value from existing answer', () => {
        const question: QuizQuestion = {
          text: 'Question text',
          kind: 'mcq',
          correctAnswer: '2',
          options: ['A', 'B', 'C'],
        };
        const existingAnswer: AnswerRecord = {
          answer: '2',
          success: true,
          timestamp: '2025-01-01T00:00:00Z',
        };

        const spec = getQuestionInputSpec(question, existingAnswer);

        expect(spec.value).toBe('2');
      });

      it('sets empty value when no existing answer', () => {
        const question: QuizQuestion = {
          text: 'Question text',
          kind: 'mcq',
          correctAnswer: '1',
          options: ['A', 'B'],
        };

        const spec = getQuestionInputSpec(question);

        expect(spec.value).toBe('');
      });

      it('returns empty options array when options undefined', () => {
        const question: QuizQuestion = {
          text: 'Question text',
          kind: 'mcq',
          correctAnswer: '1',
        };

        const spec = getQuestionInputSpec(question);

        expect(spec.options).toEqual([]);
      });
    });

    describe('Numeric questions', () => {
      it('returns text type for numeric question', () => {
        const question: QuizQuestion = {
          text: 'Question text',
          kind: 'numeric',
          correctAnswer: '42',
        };

        const spec = getQuestionInputSpec(question);

        expect(spec.type).toBe('text');
      });

      it('includes placeholder for numeric input', () => {
        const question: QuizQuestion = {
          text: 'Question text',
          kind: 'numeric',
          correctAnswer: '100',
        };

        const spec = getQuestionInputSpec(question);

        expect(spec.placeholder).toBe('Enter value');
      });

      it('sets value from existing answer', () => {
        const question: QuizQuestion = {
          text: 'Question text',
          kind: 'numeric',
          correctAnswer: '42',
        };
        const existingAnswer: AnswerRecord = {
          answer: '42',
          success: true,
          timestamp: '2025-01-01T00:00:00Z',
        };

        const spec = getQuestionInputSpec(question, existingAnswer);

        expect(spec.value).toBe('42');
      });

      it('sets empty value when no existing answer', () => {
        const question: QuizQuestion = {
          text: 'Question text',
          kind: 'numeric',
          correctAnswer: '42',
        };

        const spec = getQuestionInputSpec(question);

        expect(spec.value).toBe('');
      });

      it('does not include options for numeric question', () => {
        const question: QuizQuestion = {
          text: 'Question text',
          kind: 'numeric',
          correctAnswer: '42',
        };

        const spec = getQuestionInputSpec(question);

        expect(spec.options).toBeUndefined();
      });
    });

    describe('common properties', () => {
      it('includes className for all question types', () => {
        const mcq: QuizQuestion = { text: 'Q1', kind: 'mcq', correctAnswer: '1', options: ['A'] };
        const numeric: QuizQuestion = { text: 'Q2', kind: 'numeric', correctAnswer: '1' };

        expect(getQuestionInputSpec(mcq).className).toBe('qd-quiz-input');
        expect(getQuestionInputSpec(numeric).className).toBe('qd-quiz-input');
      });
    });
  });
});
