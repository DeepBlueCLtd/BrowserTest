/**
 * Unit tests for the completion state calculator (src/services/state-calculator.ts)
 *
 * State rules (CLAUDE.md "State Calculation"):
 * - unstarted  → no answers provided
 * - incomplete → some answered OR any incorrect
 * - complete   → all answered AND all correct
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCompletionState,
  isPageComplete,
  isPageUnstarted,
  countCorrectAnswers,
  calculateSuccessPercentage,
  calculatePageState,
  countFilledCells,
} from '../../../src/services/state-calculator.js';
import type { AnswerRecord } from '../../../src/types/contracts.js';

const TS = '2024-11-16T10:00:00Z';

function correct(answer = 'a'): AnswerRecord {
  return { answer, success: true, timestamp: TS };
}

function wrong(answer = 'b'): AnswerRecord {
  return { answer, success: false, timestamp: TS };
}

describe('calculateCompletionState()', () => {
  describe('unstarted', () => {
    it('returns unstarted when there are no answers', () => {
      expect(calculateCompletionState([], 3)).toBe('unstarted');
    });

    it('returns unstarted for a page with zero questions', () => {
      expect(calculateCompletionState([], 0)).toBe('unstarted');
    });

    it('returns unstarted for zero questions even if answers exist (edge case)', () => {
      expect(calculateCompletionState([correct()], 0)).toBe('unstarted');
    });
  });

  describe('incomplete', () => {
    it('returns incomplete when only some questions are answered (all correct so far)', () => {
      expect(calculateCompletionState([correct(), correct()], 3)).toBe('incomplete');
    });

    it('returns incomplete when a single question of many is answered', () => {
      expect(calculateCompletionState([correct()], 10)).toBe('incomplete');
    });

    it('returns incomplete when all answered but one is incorrect', () => {
      expect(calculateCompletionState([correct(), wrong(), correct()], 3)).toBe('incomplete');
    });

    it('returns incomplete when all answered and all incorrect', () => {
      expect(calculateCompletionState([wrong(), wrong(), wrong()], 3)).toBe('incomplete');
    });

    it('returns incomplete when partially answered with a mix of correct/incorrect', () => {
      expect(calculateCompletionState([correct(), wrong()], 5)).toBe('incomplete');
    });

    it('returns incomplete when only one wrong answer exists on a one-question page', () => {
      expect(calculateCompletionState([wrong()], 1)).toBe('incomplete');
    });

    it('returns incomplete when more answers than questions are recorded (mismatch)', () => {
      expect(calculateCompletionState([correct(), correct()], 1)).toBe('incomplete');
    });
  });

  describe('complete', () => {
    it('returns complete when all questions answered and all correct', () => {
      expect(calculateCompletionState([correct(), correct(), correct()], 3)).toBe('complete');
    });

    it('returns complete for a single correctly answered question', () => {
      expect(calculateCompletionState([correct()], 1)).toBe('complete');
    });

    it('treats numeric answers the same as MCQ answers', () => {
      expect(calculateCompletionState([correct('42'), correct('3.14')], 2)).toBe('complete');
    });
  });
});

describe('isPageUnstarted()', () => {
  it('is true for an empty answer list', () => {
    expect(isPageUnstarted([])).toBe(true);
  });

  it('is false once any answer exists, correct or not', () => {
    expect(isPageUnstarted([correct()])).toBe(false);
    expect(isPageUnstarted([wrong()])).toBe(false);
  });
});

describe('isPageComplete()', () => {
  it('is true when every question is answered correctly', () => {
    expect(isPageComplete([correct(), correct()], 2)).toBe(true);
  });

  it('is false when not all questions are answered', () => {
    expect(isPageComplete([correct()], 2)).toBe(false);
  });

  it('is false when any answer is incorrect', () => {
    expect(isPageComplete([correct(), wrong()], 2)).toBe(false);
  });

  it('is false when the answer count does not match the question count', () => {
    expect(isPageComplete([correct(), correct(), correct()], 2)).toBe(false);
  });

  it('is true for zero questions and zero answers (vacuous truth)', () => {
    expect(isPageComplete([], 0)).toBe(true);
  });

  it('is false for zero answers with questions remaining', () => {
    expect(isPageComplete([], 3)).toBe(false);
  });
});

describe('countCorrectAnswers()', () => {
  it('returns 0 for no answers', () => {
    expect(countCorrectAnswers([])).toBe(0);
  });

  it('returns 0 when all answers are wrong', () => {
    expect(countCorrectAnswers([wrong(), wrong()])).toBe(0);
  });

  it('counts only successful answers', () => {
    expect(countCorrectAnswers([correct(), wrong(), correct(), wrong(), correct()])).toBe(3);
  });

  it('counts all when all correct', () => {
    expect(countCorrectAnswers([correct(), correct()])).toBe(2);
  });
});

describe('calculateSuccessPercentage()', () => {
  it('returns 0 for zero questions (avoids divide-by-zero)', () => {
    expect(calculateSuccessPercentage([], 0)).toBe(0);
    expect(calculateSuccessPercentage([correct()], 0)).toBe(0);
  });

  it('returns 0 when nothing answered', () => {
    expect(calculateSuccessPercentage([], 4)).toBe(0);
  });

  it('returns 0 when all wrong', () => {
    expect(calculateSuccessPercentage([wrong(), wrong()], 2)).toBe(0);
  });

  it('returns 100 when all correct', () => {
    expect(calculateSuccessPercentage([correct(), correct()], 2)).toBe(100);
  });

  it('rounds to the nearest integer (2 of 3 → 67)', () => {
    expect(calculateSuccessPercentage([correct(), wrong(), correct()], 3)).toBe(67);
  });

  it('rounds down when appropriate (1 of 3 → 33)', () => {
    expect(calculateSuccessPercentage([correct(), wrong(), wrong()], 3)).toBe(33);
  });

  it('bases the percentage on total questions, not answered questions', () => {
    // 1 correct out of 4 questions, only 1 answered → 25%, not 100%
    expect(calculateSuccessPercentage([correct()], 4)).toBe(25);
  });

  it('rounds .5 up (1 of 8 → 13)', () => {
    expect(calculateSuccessPercentage([correct()], 8)).toBe(13);
  });
});

describe('calculatePageState with analysis tables (SRD 013 ANA-04)', () => {
  const analysis = (cells: Record<string, string>, totalCells?: number) => ({
    tableId: 't',
    cells,
    totalCells,
  });
  const right = { answer: '1', success: true, timestamp: 't' };
  const wrong = { answer: '2', success: false, timestamp: 't' };

  it('is unstarted with no answers and no analysis text', () => {
    expect(calculatePageState({ answers: [], analysis: analysis({ a: ' ' }, 2) })).toBe(
      'unstarted',
    );
  });

  it('is incomplete, not unstarted, once any analysis cell has text', () => {
    expect(calculatePageState({ answers: [], analysis: analysis({ a: 'High' }, 6) })).toBe(
      'incomplete',
    );
  });

  it('is complete when every analysis cell is filled and there is no quiz', () => {
    expect(calculatePageState({ answers: [], analysis: analysis({ a: 'x', b: 'y' }, 2) })).toBe(
      'complete',
    );
  });

  it('needs both a complete quiz and a full analysis table', () => {
    const page = { answers: [right, right], totalQuestions: 2 };
    expect(calculatePageState({ ...page, analysis: analysis({ a: 'x' }, 2) })).toBe('incomplete');
    expect(calculatePageState({ ...page, analysis: analysis({ a: 'x', b: 'y' }, 2) })).toBe(
      'complete',
    );
    expect(
      calculatePageState({
        answers: [right, wrong],
        totalQuestions: 2,
        analysis: analysis({ a: 'x', b: 'y' }, 2),
      }),
    ).toBe('incomplete');
  });

  it('treats an older record without a cell count as incomplete', () => {
    expect(calculatePageState({ answers: [], analysis: analysis({ a: 'x' }) })).toBe('incomplete');
  });

  it('matches calculateCompletionState for quiz-only pages', () => {
    expect(calculatePageState({ answers: [right], totalQuestions: 1 })).toBe('complete');
    expect(calculatePageState({ answers: [wrong], totalQuestions: 1 })).toBe('incomplete');
  });

  it('countFilledCells ignores blank cells', () => {
    expect(countFilledCells(analysis({ a: 'x', b: '  ', c: '' }))).toBe(1);
    expect(countFilledCells(undefined)).toBe(0);
  });
});
