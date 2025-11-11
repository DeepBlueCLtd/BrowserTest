import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import type { ParsedQuizTable, QuizQuestion } from '../../../src/types/contracts';
import { parseQuizTable, validateAnswer, findQuizTables } from '../../../src/services/quiz-parser';

/**
 * Tests for Quiz Table Parser
 *
 * The quiz parser is responsible for:
 * - Detecting and parsing quiz tables with class "qd-quiz"
 * - Identifying question types (MCQ vs numeric)
 * - Extracting questions, answers, and options
 * - Validating table structure
 */

describe('Quiz Table Parser', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    global.document = document as unknown as Document;
  });

  describe('MCQ Detection', () => {
    it('should detect MCQ when Detail column contains <ol>', () => {
      const table = createQuizTable([
        {
          question: 'What is active sonar?',
          answer: '1',
          detail: '<ol><li>Uses sound reflections</li><li>Listens only</li></ol>',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].kind).toBe('mcq');
    });

    it('should extract MCQ options from ordered list', () => {
      const table = createQuizTable([
        {
          question: 'What is the primary function of sonar?',
          answer: '3',
          detail: `
            <ol>
              <li>Navigate using stars</li>
              <li>Communicate with vessels</li>
              <li>Detect underwater objects using sound waves</li>
              <li>Measure water depth only</li>
            </ol>
          `,
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].options).toEqual([
        'Navigate using stars',
        'Communicate with vessels',
        'Detect underwater objects using sound waves',
        'Measure water depth only',
      ]);
    });

    it('should handle MCQ with empty list items gracefully', () => {
      const table = createQuizTable([
        {
          question: 'Which type of sonar?',
          answer: '1',
          detail: '<ol><li>Active</li><li></li><li>Passive</li></ol>',
        },
      ]);

      const result = parseQuizTable(table);
      // Empty items should be filtered out
      expect(result.questions[0].options).toEqual(['Active', 'Passive']);
    });

    it('should extract correct answer for MCQ (1-indexed)', () => {
      const table = createQuizTable([
        {
          question: 'What is active sonar?',
          answer: '2',
          detail: '<ol><li>Option A</li><li>Option B</li><li>Option C</li></ol>',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].correctAnswer).toBe('2');
    });

    it('should handle MCQ with single option', () => {
      const table = createQuizTable([
        {
          question: 'Is this valid?',
          answer: '1',
          detail: '<ol><li>Only option</li></ol>',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].options).toHaveLength(1);
      expect(result.questions[0].options[0]).toBe('Only option');
    });
  });

  describe('Numeric Detection', () => {
    it('should detect numeric when Detail column contains tolerance number', () => {
      const table = createQuizTable([
        {
          question: 'What is the speed of sound in seawater (m/s)?',
          answer: '1500',
          detail: '50',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].kind).toBe('numeric');
    });

    it('should extract tolerance value for numeric questions', () => {
      const table = createQuizTable([
        {
          question: 'At what frequency (kHz) does hull-mounted sonar operate?',
          answer: '5',
          detail: '0.5',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].tolerance).toBe(0.5);
    });

    it('should extract correct answer for numeric questions', () => {
      const table = createQuizTable([
        {
          question: 'What is the speed of sound in seawater (m/s)?',
          answer: '1500',
          detail: '50',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].correctAnswer).toBe('1500');
    });

    it('should handle numeric question with decimal tolerance', () => {
      const table = createQuizTable([
        {
          question: 'Measure the frequency',
          answer: '12.5',
          detail: '0.25',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].tolerance).toBe(0.25);
    });

    it('should handle numeric question with zero tolerance', () => {
      const table = createQuizTable([
        {
          question: 'Exact value required',
          answer: '100',
          detail: '0',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].tolerance).toBe(0);
      expect(result.questions[0].kind).toBe('numeric');
    });

    it('should handle negative numeric answers', () => {
      const table = createQuizTable([
        {
          question: 'What is the temperature change?',
          answer: '-15',
          detail: '2',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].correctAnswer).toBe('-15');
      expect(result.questions[0].kind).toBe('numeric');
    });
  });

  describe('Question Text Extraction', () => {
    it('should extract question text from first column', () => {
      const table = createQuizTable([
        {
          question: 'What is the primary function of a sonar system?',
          answer: '1',
          detail: '<ol><li>Option A</li></ol>',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].text).toBe(
        'What is the primary function of a sonar system?',
      );
    });

    it('should trim whitespace from question text', () => {
      const table = createQuizTable([
        {
          question: '  What is active sonar?  ',
          answer: '1',
          detail: '<ol><li>Option A</li></ol>',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].text).toBe('What is active sonar?');
    });

    it('should handle multi-line question text', () => {
      const table = createQuizTable([
        {
          question: 'What is the speed of sound\nin seawater?',
          answer: '1500',
          detail: '50',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions[0].text).toContain('speed of sound');
      expect(result.questions[0].text).toContain('seawater');
    });
  });

  describe('Table Structure Validation', () => {
    it('should require exactly 3 columns', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      const tbody = table.createTBody();
      const row = tbody.insertRow();
      row.insertCell().textContent = 'Question';
      row.insertCell().textContent = 'Answer';
      // Missing Detail column

      const result = parseQuizTable(table);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('expected 3');
    });

    it('should detect quiz tables by class "qd-quiz"', () => {
      const table = createQuizTable([
        {
          question: 'Test question',
          answer: '1',
          detail: '<ol><li>Option</li></ol>',
        },
      ]);

      expect(table.classList.contains('qd-quiz')).toBe(true);
    });

    it('should handle table with header row', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';

      // Add header
      const thead = table.createTHead();
      const headerRow = thead.insertRow();
      headerRow.insertCell().textContent = 'Question';
      headerRow.insertCell().textContent = 'Answer';
      headerRow.insertCell().textContent = 'Detail';

      // Add data row
      const tbody = table.createTBody();
      const row = tbody.insertRow();
      row.insertCell().textContent = 'What is sonar?';
      row.insertCell().textContent = '1';
      row.insertCell().innerHTML = '<ol><li>Sound Navigation</li></ol>';

      const result = parseQuizTable(table);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].text).toBe('What is sonar?');
    });

    it('should handle empty quiz table', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      table.createTBody();

      const result = parseQuizTable(table);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('no data rows');
    });
  });

  describe('Mixed Question Types', () => {
    it('should parse table with both MCQ and numeric questions', () => {
      const table = createQuizTable([
        {
          question: 'What is active sonar?',
          answer: '1',
          detail: '<ol><li>Uses reflections</li><li>Listens only</li></ol>',
        },
        {
          question: 'Speed of sound in water (m/s)?',
          answer: '1500',
          detail: '50',
        },
        {
          question: 'Which type of sonar?',
          answer: '2',
          detail: '<ol><li>Active</li><li>Passive</li></ol>',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.questions).toHaveLength(3);
      expect(result.questions[0].kind).toBe('mcq');
      expect(result.questions[1].kind).toBe('numeric');
      expect(result.questions[2].kind).toBe('mcq');
    });
  });

  describe('Error Cases', () => {
    it('should report error for invalid MCQ (no options)', () => {
      const table = createQuizTable([
        {
          question: 'Invalid MCQ',
          answer: '1',
          detail: '<ol></ol>',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('no options');
    });

    it('should report error for invalid numeric tolerance (non-number)', () => {
      const table = createQuizTable([
        {
          question: 'Invalid numeric',
          answer: '100',
          detail: 'not a number',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('invalid tolerance');
    });

    it('should handle missing answer column', () => {
      const table = document.createElement('table');
      table.className = 'qd-quiz';
      const tbody = table.createTBody();
      const row = tbody.insertRow();
      row.insertCell().textContent = 'Question';
      row.insertCell().textContent = ''; // Empty answer
      row.insertCell().textContent = '10';

      const result = parseQuizTable(table);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('empty answer');
    });

    it('should handle malformed HTML in detail column', () => {
      const table = createQuizTable([
        {
          question: 'Test',
          answer: '1',
          detail: '<ol><li>Unclosed tag',
        },
      ]);

      const result = parseQuizTable(table);
      // Browser should handle HTML parsing
      expect(result).toBeDefined();
    });
  });

  describe('Integration with ParsedQuizTable type', () => {
    it('should return ParsedQuizTable with element reference', () => {
      const table = createQuizTable([
        {
          question: 'Test question',
          answer: '1',
          detail: '<ol><li>Option A</li></ol>',
        },
      ]);

      const result: ParsedQuizTable = parseQuizTable(table);
      expect(result.element).toBe(table);
      expect(result.questions).toBeInstanceOf(Array);
      expect(result.questions).toHaveLength(1);
    });

    it('should return undefined errors when no errors', () => {
      const table = createQuizTable([
        {
          question: 'Valid question',
          answer: '1',
          detail: '<ol><li>Option A</li></ol>',
        },
      ]);

      const result = parseQuizTable(table);
      expect(result.errors).toBeUndefined();
    });
  });

  describe('validateAnswer function', () => {
    it('should validate MCQ answer correctly', () => {
      const question: QuizQuestion = {
        text: 'Test',
        kind: 'mcq',
        correctAnswer: '2',
        options: ['A', 'B', 'C'],
      };

      expect(validateAnswer(question, '2')).toBe(true);
      expect(validateAnswer(question, '1')).toBe(false);
      expect(validateAnswer(question, '3')).toBe(false);
    });

    it('should validate numeric answer within tolerance', () => {
      const question: QuizQuestion = {
        text: 'Test',
        kind: 'numeric',
        correctAnswer: '1500',
        tolerance: 50,
      };

      expect(validateAnswer(question, '1500')).toBe(true);
      expect(validateAnswer(question, '1525')).toBe(true);
      expect(validateAnswer(question, '1475')).toBe(true);
      expect(validateAnswer(question, '1551')).toBe(false);
      expect(validateAnswer(question, '1449')).toBe(false);
    });

    it('should reject empty answers', () => {
      const question: QuizQuestion = {
        text: 'Test',
        kind: 'mcq',
        correctAnswer: '1',
        options: ['A'],
      };

      expect(validateAnswer(question, '')).toBe(false);
      expect(validateAnswer(question, '  ')).toBe(false);
    });

    it('should handle numeric with zero tolerance', () => {
      const question: QuizQuestion = {
        text: 'Test',
        kind: 'numeric',
        correctAnswer: '100',
        tolerance: 0,
      };

      expect(validateAnswer(question, '100')).toBe(true);
      expect(validateAnswer(question, '100.1')).toBe(false);
      expect(validateAnswer(question, '99.9')).toBe(false);
    });
  });

  describe('findQuizTables function', () => {
    it('should find all quiz tables in document', () => {
      // Create multiple quiz tables
      createQuizTable([
        { question: 'Q1', answer: '1', detail: '<ol><li>A</li></ol>' },
      ]);
      createQuizTable([
        { question: 'Q2', answer: '100', detail: '10' },
      ]);

      const results = findQuizTables(document);
      expect(results).toHaveLength(2);
      expect(results[0].questions).toHaveLength(1);
      expect(results[1].questions).toHaveLength(1);
    });

    it('should return empty array when no quiz tables found', () => {
      const results = findQuizTables(document);
      expect(results).toEqual([]);
    });
  });

  // Helper function to create quiz tables for testing
  function createQuizTable(
    rows: Array<{ question: string; answer: string; detail: string }>,
  ): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'qd-quiz';

    // Add header
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    headerRow.insertCell().textContent = 'Question';
    headerRow.insertCell().textContent = 'Answer';
    headerRow.insertCell().textContent = 'Detail';

    // Add data rows
    const tbody = table.createTBody();
    rows.forEach((rowData) => {
      const row = tbody.insertRow();
      row.insertCell().textContent = rowData.question;
      row.insertCell().textContent = rowData.answer;
      row.insertCell().innerHTML = rowData.detail;
    });

    document.body.appendChild(table);
    return table;
  }
});
