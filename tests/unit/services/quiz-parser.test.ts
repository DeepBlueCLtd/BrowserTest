/**
 * Unit tests for quiz table parser
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  parseQuizTable,
  findQuizTables,
  validateAnswer,
} from '../../../src/services/quiz-parser.js';
import type { QuizQuestion } from '../../../src/types/contracts.js';

describe('Quiz Table Parser', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('parseQuizTable()', () => {
    it('should parse MCQ table correctly', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <thead><tr><th>Question</th><th>Answer</th><th>Detail</th></tr></thead>
        <tbody>
          <tr>
            <td>What is the capital of France?</td>
            <td>2</td>
            <td><ol><li>London</li><li>Paris</li><li>Berlin</li></ol></td>
          </tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.element).toBe(table);
      expect(result.questions).toHaveLength(1);
      expect(result.errors).toBeUndefined();

      const question = result.questions[0];
      expect(question?.text).toBe('What is the capital of France?');
      expect(question?.kind).toBe('mcq');
      expect(question?.correctAnswer).toBe('2');
      expect(question?.options).toEqual(['London', 'Paris', 'Berlin']);
    });

    it('should parse numeric table correctly', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>What is pi?</td>
            <td>3.14</td>
            <td>0.01</td>
          </tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.questions).toHaveLength(1);
      expect(result.errors).toBeUndefined();

      const question = result.questions[0];
      expect(question?.text).toBe('What is pi?');
      expect(question?.kind).toBe('numeric');
      expect(question?.correctAnswer).toBe('3.14');
      expect(question?.tolerance).toBe(0.01);
    });

    it('should parse multiple questions', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>Question 1</td>
            <td>1</td>
            <td><ol><li>A</li><li>B</li></ol></td>
          </tr>
          <tr>
            <td>Question 2</td>
            <td>42</td>
            <td>5</td>
          </tr>
          <tr>
            <td>Question 3</td>
            <td>3</td>
            <td><ol><li>X</li><li>Y</li><li>Z</li></ol></td>
          </tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.questions).toHaveLength(3);
      expect(result.errors).toBeUndefined();

      expect(result.questions[0]?.kind).toBe('mcq');
      expect(result.questions[1]?.kind).toBe('numeric');
      expect(result.questions[2]?.kind).toBe('mcq');
    });

    it('should fail if table missing qd-quiz class', () => {
      const table = document.createElement('table');
      table.innerHTML = '<tbody><tr><td>Q</td><td>A</td><td>D</td></tr></tbody>';

      const result = parseQuizTable(table);

      expect(result.errors).toContain('Table must have class "qd-quiz"');
      expect(result.questions).toHaveLength(0);
    });

    it('should fail if table has no data rows', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = '<thead><tr><th>Q</th><th>A</th><th>D</th></tr></thead><tbody></tbody>';

      const result = parseQuizTable(table);

      expect(result.errors).toContain('Quiz table has no data rows');
      expect(result.questions).toHaveLength(0);
    });

    it('should fail if row has wrong number of columns', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr><td>Q</td><td>A</td></tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.errors).toContainEqual(
        expect.stringContaining('Row 1 has 2 columns, expected 3'),
      );
    });

    it('should fail if question text is empty', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td></td>
            <td>1</td>
            <td><ol><li>A</li></ol></td>
          </tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.errors).toContainEqual(expect.stringContaining('empty question text'));
    });

    it('should fail if answer is empty', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>Question</td>
            <td></td>
            <td><ol><li>A</li></ol></td>
          </tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.errors).toContainEqual(expect.stringContaining('empty answer'));
    });

    it('should fail if MCQ has no options', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>Question</td>
            <td>1</td>
            <td><ol></ol></td>
          </tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.errors).toContainEqual(expect.stringContaining('has no options'));
    });

    it('should fail if numeric question has invalid tolerance', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>Question</td>
            <td>3.14</td>
            <td>not-a-number</td>
          </tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.errors).toContainEqual(expect.stringContaining('invalid tolerance'));
    });

    it('should trim whitespace from question text', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>  Question with whitespace  </td>
            <td>1</td>
            <td><ol><li>A</li></ol></td>
          </tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.questions[0]?.text).toBe('Question with whitespace');
    });

    it('should trim whitespace from answer', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>Question</td>
            <td>  1  </td>
            <td><ol><li>A</li></ol></td>
          </tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.questions[0]?.correctAnswer).toBe('1');
    });

    it('should trim whitespace from MCQ options', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>Question</td>
            <td>1</td>
            <td><ol><li>  Option A  </li><li>  Option B  </li></ol></td>
          </tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.questions[0]?.options).toEqual(['Option A', 'Option B']);
    });

    it('should filter out empty options from MCQ list', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr>
            <td>Question</td>
            <td>1</td>
            <td><ol><li>A</li><li></li><li>B</li></ol></td>
          </tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.questions[0]?.options).toEqual(['A', 'B']);
    });

    it('should include row numbers in error messages', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.innerHTML = `
        <tbody>
          <tr><td>Q1</td><td>1</td><td><ol><li>A</li></ol></td></tr>
          <tr><td></td><td>2</td><td><ol><li>B</li></ol></td></tr>
          <tr><td>Q3</td><td>3</td><td><ol><li>C</li></ol></td></tr>
        </tbody>
      `;

      const result = parseQuizTable(table);

      expect(result.errors).toContainEqual(expect.stringContaining('Row 2'));
    });
  });

  describe('findQuizTables()', () => {
    it('should find all quiz tables in document', () => {
      container.innerHTML = `
        <table class="qd-quiz">
          <tbody><tr><td>Q1</td><td>1</td><td><ol><li>A</li></ol></td></tr></tbody>
        </table>
        <table class="other-table">
          <tbody><tr><td>Not a quiz</td></tr></tbody>
        </table>
        <table class="qd-quiz">
          <tbody><tr><td>Q2</td><td>2</td><td><ol><li>B</li></ol></td></tr></tbody>
        </table>
      `;

      const results = findQuizTables(document);

      expect(results).toHaveLength(2);
      expect(results[0]?.questions).toHaveLength(1);
      expect(results[1]?.questions).toHaveLength(1);
    });

    it('should return empty array if no quiz tables found', () => {
      container.innerHTML = '<table class="other-table"><tbody><tr><td>X</td></tr></tbody></table>';

      const results = findQuizTables(document);

      expect(results).toHaveLength(0);
    });

    it('should accept custom document parameter', () => {
      const customDoc = document.implementation.createHTMLDocument('Test');
      customDoc.body.innerHTML = `
        <table class="qd-quiz">
          <tbody><tr><td>Q</td><td>1</td><td><ol><li>A</li></ol></td></tr></tbody>
        </table>
      `;

      const results = findQuizTables(customDoc);

      expect(results).toHaveLength(1);
    });
  });

  describe('validateAnswer()', () => {
    describe('MCQ questions', () => {
      const mcqQuestion: QuizQuestion = {
        text: 'Question',
        kind: 'mcq',
        correctAnswer: '2',
        options: ['A', 'B', 'C'],
      };

      it('should return true for correct answer', () => {
        expect(validateAnswer(mcqQuestion, '2')).toBe(true);
      });

      it('should return false for incorrect answer', () => {
        expect(validateAnswer(mcqQuestion, '1')).toBe(false);
        expect(validateAnswer(mcqQuestion, '3')).toBe(false);
      });

      it('should return false for empty answer', () => {
        expect(validateAnswer(mcqQuestion, '')).toBe(false);
      });

      it('should trim whitespace from answer', () => {
        expect(validateAnswer(mcqQuestion, '  2  ')).toBe(true);
      });

      it('should require exact match', () => {
        expect(validateAnswer(mcqQuestion, '2.0')).toBe(false);
        expect(validateAnswer(mcqQuestion, 'B')).toBe(false);
      });
    });

    describe('Numeric questions', () => {
      const numericQuestion: QuizQuestion = {
        text: 'What is pi?',
        kind: 'numeric',
        correctAnswer: '3.14',
        tolerance: 0.01,
      };

      it('should return true for exact answer', () => {
        expect(validateAnswer(numericQuestion, '3.14')).toBe(true);
      });

      it('should return true for answer within tolerance', () => {
        expect(validateAnswer(numericQuestion, '3.15')).toBe(true); // 0.01 away
        expect(validateAnswer(numericQuestion, '3.14')).toBe(true); // exact
        expect(validateAnswer(numericQuestion, '3.145')).toBe(true); // 0.005 away
        expect(validateAnswer(numericQuestion, '3.135')).toBe(true); // 0.005 away
      });

      it('should return false for answer outside tolerance', () => {
        expect(validateAnswer(numericQuestion, '3.16')).toBe(false);
        expect(validateAnswer(numericQuestion, '3.12')).toBe(false);
      });

      it('should return false for non-numeric answer', () => {
        expect(validateAnswer(numericQuestion, 'not-a-number')).toBe(false);
      });

      it('should return false for empty answer', () => {
        expect(validateAnswer(numericQuestion, '')).toBe(false);
      });

      it('should trim whitespace from answer', () => {
        expect(validateAnswer(numericQuestion, '  3.14  ')).toBe(true);
      });

      it('should handle zero tolerance', () => {
        const zeroToleranceQuestion: QuizQuestion = {
          text: 'Exact value',
          kind: 'numeric',
          correctAnswer: '42',
          tolerance: 0,
        };

        expect(validateAnswer(zeroToleranceQuestion, '42')).toBe(true);
        expect(validateAnswer(zeroToleranceQuestion, '42.0')).toBe(true);
        expect(validateAnswer(zeroToleranceQuestion, '42.01')).toBe(false);
        expect(validateAnswer(zeroToleranceQuestion, '41.99')).toBe(false);
      });

      it('should handle undefined tolerance as zero', () => {
        const noToleranceQuestion: QuizQuestion = {
          text: 'Exact value',
          kind: 'numeric',
          correctAnswer: '10',
        };

        expect(validateAnswer(noToleranceQuestion, '10')).toBe(true);
        expect(validateAnswer(noToleranceQuestion, '10.01')).toBe(false);
      });
    });
  });
});
