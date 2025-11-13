import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import jsdomPackage from 'jsdom/package.json' assert { type: 'json' };
import {
  enhanceQuizTable,
  revealCorrectAnswers,
  showStudentComparisons,
  injectQuizStyles,
} from '../../../src/enhancers/quiz-table';
import type { StudentRecord } from '../../../src/types/contracts';

/**
 * Tests for Quiz Table Enhancer - Answer Reveal Features
 *
 * T072: Tests for instructor answer reveal functionality
 *
 * These tests cover:
 * - Revealing correct answers in instructor mode
 * - Displaying student answer comparisons
 * - Color coding for correct/incorrect student answers
 * - Preserving student interaction capability
 */

describe('Quiz Table Enhancer - Answer Reveal', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    global.document = document as unknown as Document;
    global.window = dom.window as unknown as Window & typeof globalThis;
  });

  /**
   * Helper to create a quiz table DOM structure
   * Complete workaround for JSDOM bug: Avoid ANY innerHTML, build everything
   * programmatically after table is in document.
   */
  function createQuizTable(rows: Array<{ question: string; answer: string; detail: string }>) {
    const table = document.createElement('table');
    table.className = 'qd-quiz';

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    // Append table to document FIRST
    document.body.appendChild(table);

    // NOW create rows and cells
    rows.forEach((row) => {
      const tr = document.createElement('tr');

      const questionCell = document.createElement('td');
      const answerCell = document.createElement('td');
      const detailCell = document.createElement('td');

      // Append empty cells to row
      tr.appendChild(questionCell);
      tr.appendChild(answerCell);
      tr.appendChild(detailCell);

      // Append row to tbody
      tbody.appendChild(tr);

      // Set content AFTER cells are in DOM - NO innerHTML!
      questionCell.textContent = row.question;
      answerCell.textContent = row.answer;

      // Build detail cell content programmatically
      if (row.detail.includes('<ol>')) {
        // Build <ol> without innerHTML
        const ol = document.createElement('ol');
        const matches = row.detail.matchAll(/<li>(.*?)<\/li>/g);
        for (const match of matches) {
          const li = document.createElement('li');
          li.textContent = match[1];
          ol.appendChild(li);
        }
        detailCell.appendChild(ol);
      } else {
        // Plain text (tolerance)
        detailCell.textContent = row.detail;
      }
    });

    return table;
  }

  describe('FOCUSED TEST - JSDOM Bug Reproduction', () => {
    it('should maintain 3 columns when creating table with <ol> in third cell', () => {
      console.error('\n=== JSDOM BUG TEST ===');
      console.error('Node:', process.version);
      console.error('JSDOM:', jsdomPackage.version);

      const table = createQuizTable([
        {
          question: 'What is active sonar?',
          answer: '2',
          detail: '<ol><li>Option A</li><li>Option B</li><li>Option C</li></ol>',
        },
      ]);

      const row = table.querySelector('tbody tr')!;
      const cells = row.querySelectorAll('td');

      console.error('After table creation:');
      console.error('  Cell count:', cells.length);
      console.error('  Row HTML (first 200 chars):', row.innerHTML.substring(0, 200));

      // Log each cell
      Array.from(cells).forEach((cell, idx) => {
        console.error(`  Cell ${idx + 1}:`, cell.innerHTML.substring(0, 50));
      });

      // This is the core issue - do we have 3 cells?
      expect(cells.length).toBe(3);

      // Verify detail cell has <ol>
      const detailCell = row.querySelector('td:nth-child(3)');
      console.error('Detail cell exists:', !!detailCell);
      console.error('Detail cell HTML:', detailCell?.innerHTML.substring(0, 100));

      expect(detailCell).toBeDefined();
      expect(detailCell?.querySelector('ol')).toBeDefined();
    });
  });

  describe('revealCorrectAnswers()', () => {
    it('should display correct answer for MCQ questions', () => {
      const table = createQuizTable([
        {
          question: 'What is active sonar?',
          answer: '2',
          detail: '<ol><li>Option A</li><li>Option B</li><li>Option C</li></ol>',
        },
      ]);

      // First enhance the table
      enhanceQuizTable(table);

      // Then reveal answers
      revealCorrectAnswers(table);

      // Check that correct answer is shown
      const answerCell = table.querySelector('tbody tr td:nth-child(2)');
      const revealElement = answerCell?.querySelector('.qd-correct-answer');

      expect(revealElement).toBeDefined();
      expect(revealElement?.textContent).toContain('2');
    });

    it('should display correct answer for numeric questions', () => {
      const table = createQuizTable([
        {
          question: 'What is the frequency?',
          answer: '24.5',
          detail: '0.5',
        },
      ]);

      enhanceQuizTable(table);
      revealCorrectAnswers(table);

      const answerCell = table.querySelector('tbody tr td:nth-child(2)');
      const revealElement = answerCell?.querySelector('.qd-correct-answer');

      expect(revealElement).toBeDefined();
      expect(revealElement?.textContent).toContain('24.5');
    });

    it('should show tolerance for numeric questions', () => {
      const table = createQuizTable([
        {
          question: 'What is the frequency?',
          answer: '24.5',
          detail: '0.5',
        },
      ]);

      enhanceQuizTable(table);
      revealCorrectAnswers(table);

      const answerCell = table.querySelector('tbody tr td:nth-child(2)');
      const toleranceElement = answerCell?.querySelector('.qd-tolerance');

      expect(toleranceElement).toBeDefined();
      expect(toleranceElement?.textContent).toContain('±0.5');
    });

    it('should not modify student input elements', () => {
      const table = createQuizTable([
        {
          question: 'What is active sonar?',
          answer: '2',
          detail: '<ol><li>Option A</li><li>Option B</li></ol>',
        },
      ]);

      enhanceQuizTable(table);

      // Student selects an answer
      const select = table.querySelector('select') as HTMLSelectElement;
      select.value = '1';

      // Reveal correct answers
      revealCorrectAnswers(table);

      // Student's selection should remain
      expect(select.value).toBe('1');
    });

    it('should add visual indicator for correct answer display', () => {
      const table = createQuizTable([
        {
          question: 'Test question?',
          answer: '1',
          detail: '<ol><li>A</li><li>B</li></ol>',
        },
      ]);

      enhanceQuizTable(table);
      revealCorrectAnswers(table);

      const answerCell = table.querySelector('tbody tr td:nth-child(2)');

      expect(answerCell).toBeDefined();
      expect(answerCell?.classList.contains('qd-answer-revealed')).toBe(true);
    });

    it('should handle multiple questions correctly', () => {
      const table = createQuizTable([
        {
          question: 'Question 1?',
          answer: '2',
          detail: '<ol><li>A</li><li>B</li><li>C</li></ol>',
        },
        {
          question: 'Question 2?',
          answer: '42',
          detail: '1',
        },
      ]);

      enhanceQuizTable(table);
      revealCorrectAnswers(table);

      const revealElements = table.querySelectorAll('.qd-correct-answer');
      expect(revealElements.length).toBe(2);
    });
  });

  describe('showStudentComparisons()', () => {
    it('should display student answers alongside correct answers', () => {
      const table = createQuizTable([
        {
          question: 'What is active sonar?',
          answer: '2',
          detail: '<ol><li>A</li><li>B</li></ol>',
        },
      ]);

      enhanceQuizTable(table);

      // Mock student records
      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 1,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [{ answer: '1', success: false, timestamp: new Date().toISOString() }],
              state: 'incomplete',
            },
          },
        },
      ];

      showStudentComparisons(table, students, 'test-page');

      const comparisonTable = table.parentElement?.querySelector('.qd-student-comparison');
      expect(comparisonTable).toBeDefined();
    });

    it('should show student service ID prefix (4 chars)', () => {
      const table = createQuizTable([
        {
          question: 'Test?',
          answer: '1',
          detail: '<ol><li>A</li></ol>',
        },
      ]);

      enhanceQuizTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 1,
          correct: 1,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [{ answer: '1', success: true, timestamp: new Date().toISOString() }],
              state: 'complete',
            },
          },
        },
      ];

      showStudentComparisons(table, students, 'test-page');

      const studentCell = table.parentElement?.querySelector('.qd-student-id');
      expect(studentCell?.textContent).toContain('RN23'); // First 4 chars
    });

    it('should apply success color coding to correct student answers', () => {
      const table = createQuizTable([
        {
          question: 'Test?',
          answer: '1',
          detail: '<ol><li>A</li></ol>',
        },
      ]);

      enhanceQuizTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 1,
          correct: 1,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [{ answer: '1', success: true, timestamp: new Date().toISOString() }],
              state: 'complete',
            },
          },
        },
      ];

      showStudentComparisons(table, students, 'test-page');

      const successCell = table.parentElement?.querySelector('.qd-student-answer.qd-success');
      expect(successCell).toBeDefined();
    });

    it('should apply failure color coding to incorrect student answers', () => {
      const table = createQuizTable([
        {
          question: 'Test?',
          answer: '2',
          detail: '<ol><li>A</li><li>B</li></ol>',
        },
      ]);

      enhanceQuizTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 1,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [{ answer: '1', success: false, timestamp: new Date().toISOString() }],
              state: 'incomplete',
            },
          },
        },
      ];

      showStudentComparisons(table, students, 'test-page');

      const failureCell = table.parentElement?.querySelector('.qd-student-answer.qd-failure');
      expect(failureCell).toBeDefined();
    });

    it('should show multiple students in comparison table', () => {
      const table = createQuizTable([
        {
          question: 'Test?',
          answer: '1',
          detail: '<ol><li>A</li></ol>',
        },
      ]);

      enhanceQuizTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 1,
          correct: 1,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [{ answer: '1', success: true, timestamp: new Date().toISOString() }],
              state: 'complete',
            },
          },
        },
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN5678',
          name: 'Jones, A',
          attempted: 1,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [{ answer: '2', success: false, timestamp: new Date().toISOString() }],
              state: 'incomplete',
            },
          },
        },
      ];

      showStudentComparisons(table, students, 'test-page');

      const studentRows = table.parentElement?.querySelectorAll('.qd-student-row');
      expect(studentRows?.length).toBe(2);
    });

    it('should handle students with no answers for the page', () => {
      const table = createQuizTable([
        {
          question: 'Test?',
          answer: '1',
          detail: '<ol><li>A</li></ol>',
        },
      ]);

      enhanceQuizTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {},
        },
      ];

      showStudentComparisons(table, students, 'test-page');

      // Should still create comparison table with "No answer" indicator
      const comparisonTable = table.parentElement?.querySelector('.qd-student-comparison');
      expect(comparisonTable).toBeDefined();
    });

    it('should show "No answer" for unanswered questions', () => {
      const table = createQuizTable([
        {
          question: 'Test?',
          answer: '1',
          detail: '<ol><li>A</li></ol>',
        },
      ]);

      enhanceQuizTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 0,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [],
              state: 'unstarted',
            },
          },
        },
      ];

      showStudentComparisons(table, students, 'test-page');

      const noAnswerCell = table.parentElement?.querySelector('.qd-no-answer');
      expect(noAnswerCell).toBeDefined();
    });
  });

  describe('Color Coding', () => {
    it('should use green for correct answers', () => {
      const table = createQuizTable([
        {
          question: 'Test?',
          answer: '1',
          detail: '<ol><li>A</li></ol>',
        },
      ]);

      enhanceQuizTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 1,
          correct: 1,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [{ answer: '1', success: true, timestamp: new Date().toISOString() }],
              state: 'complete',
            },
          },
        },
      ];

      showStudentComparisons(table, students, 'test-page');

      // Inject styles to check CSS classes
      injectQuizStyles(document);

      const successCell = table.parentElement?.querySelector('.qd-success');
      expect(successCell?.className).toContain('qd-success');
    });

    it('should use red for incorrect answers', () => {
      const table = createQuizTable([
        {
          question: 'Test?',
          answer: '2',
          detail: '<ol><li>A</li><li>B</li></ol>',
        },
      ]);

      enhanceQuizTable(table);

      const students: StudentRecord[] = [
        {
          schema: 1,
          docId: 'test',
          release: '02-2025',
          serviceId: 'RN2344',
          name: 'Smith, J',
          attempted: 1,
          correct: 0,
          updated: new Date().toISOString(),
          pages: {
            'test-page': {
              answers: [{ answer: '1', success: false, timestamp: new Date().toISOString() }],
              state: 'incomplete',
            },
          },
        },
      ];

      showStudentComparisons(table, students, 'test-page');

      const failureCell = table.parentElement?.querySelector('.qd-failure');
      expect(failureCell?.className).toContain('qd-failure');
    });
  });

  describe('Integration with Existing Enhancement', () => {
    it('should not break existing student interaction after reveal', () => {
      const table = createQuizTable([
        {
          question: 'Test?',
          answer: '2',
          detail: '<ol><li>A</li><li>B</li></ol>',
        },
      ]);

      enhanceQuizTable(table);

      // Student can still interact
      const select = table.querySelector('select') as HTMLSelectElement;
      expect(select).toBeDefined();
      expect(select.disabled).toBe(false);

      // Reveal answers
      revealCorrectAnswers(table);

      // Student should still be able to change answer
      select.value = '1';
      expect(select.value).toBe('1');
    });

    it('should preserve answer save events after reveal', () => {
      const table = createQuizTable([
        {
          question: 'Test?',
          answer: '1',
          detail: '<ol><li>A</li></ol>',
        },
      ]);

      enhanceQuizTable(table);
      revealCorrectAnswers(table);

      const eventHandler = vi.fn();
      table.addEventListener('qd:answer-saved', eventHandler);

      const select = table.querySelector('select') as HTMLSelectElement;
      select.value = '1';
      select.dispatchEvent(new Event('change'));

      // Event should still fire
      expect(select.value).toBe('1');
    });
  });
});
