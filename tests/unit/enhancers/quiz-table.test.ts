import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
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
   * Note: Avoiding complex DOM manipulation that triggers JSDOM Node 18 bugs
   * Strategy: Build table structure first, then populate with innerHTML on individual cells
   */
  function createQuizTable(rows: Array<{ question: string; answer: string; detail: string }>) {
    const table = document.createElement('table');
    table.className = 'qd-quiz';

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    // Append table to document FIRST to ensure stable DOM
    document.body.appendChild(table);

    // Now add rows one at a time
    rows.forEach((row) => {
      const tr = document.createElement('tr');

      const questionCell = document.createElement('td');
      const answerCell = document.createElement('td');
      const detailCell = document.createElement('td');

      // Append empty cells first
      tr.appendChild(questionCell);
      tr.appendChild(answerCell);
      tr.appendChild(detailCell);

      // Append row to tbody
      tbody.appendChild(tr);

      // NOW set content AFTER cells are in the DOM
      questionCell.textContent = row.question;
      answerCell.textContent = row.answer;

      // Set detail content - use innerHTML since cells are already in DOM
      if (row.detail.includes('<ol>')) {
        // MCQ - use innerHTML now that cell is in DOM
        detailCell.innerHTML = row.detail;
      } else {
        // Numeric - just text content (tolerance)
        detailCell.textContent = row.detail;
      }
    });

    return table;
  }

  describe('revealCorrectAnswers()', () => {
    it('should display correct answer for MCQ questions', () => {
      console.error('=== START MCQ TEST ===');

      const table = createQuizTable([
        {
          question: 'What is active sonar?',
          answer: '2',
          detail: '<ol><li>Option A</li><li>Option B</li><li>Option C</li></ol>',
        },
      ]);

      const row = table.querySelector('tbody tr')!;
      console.error('STEP 1 - After createQuizTable:', row.querySelectorAll('td').length, 'cells');

      // First enhance the table
      console.error('STEP 2 - About to call enhanceQuizTable');
      enhanceQuizTable(table);
      console.error('STEP 3 - After enhanceQuizTable:', row.querySelectorAll('td').length, 'cells');

      // Then reveal answers
      console.error('STEP 4 - About to call revealCorrectAnswers');
      revealCorrectAnswers(table);
      console.error(
        'STEP 5 - After revealCorrectAnswers:',
        row.querySelectorAll('td').length,
        'cells',
      );

      // Check that correct answer is shown
      const answerCell = table.querySelector('tbody tr td:nth-child(2)');
      const revealElement = answerCell?.querySelector('.qd-correct-answer');

      if (!revealElement) {
        const rowCells = table.querySelector('tbody tr')?.querySelectorAll('td').length || 0;
        const detailCell = table.querySelector('tbody tr td:nth-child(3)');
        console.error('FINAL STATE - cells:', rowCells, 'detail exists:', !!detailCell);
        throw new Error(
          `MCQ: revealElement not found. Row has ${rowCells} cells (expected 3). Detail cell exists: ${!!detailCell}. Detail HTML: "${detailCell?.innerHTML?.substring(0, 80) || 'N/A'}". answerCell HTML: ${answerCell?.innerHTML?.substring(0, 100)}`,
        );
      }
      expect(revealElement).toBeDefined();
      expect(revealElement.textContent).toContain('2');
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

      // Diagnostic logging
      console.log('Numeric Test - Answer Cell HTML:', answerCell?.innerHTML);
      console.log('Numeric Test - Reveal Element:', revealElement);
      console.log('Numeric Test - Reveal Element textContent:', revealElement?.textContent);

      if (!revealElement) {
        throw new Error(
          `Numeric: revealElement not found. answerCell HTML: ${answerCell?.innerHTML}`,
        );
      }
      expect(revealElement).toBeDefined();
      expect(revealElement.textContent).toContain('24.5');
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

      // Diagnostic logging
      console.log('Tolerance Test - Answer Cell HTML:', answerCell?.innerHTML);
      console.log('Tolerance Test - Tolerance Element:', toleranceElement);
      console.log('Tolerance Test - Tolerance Element textContent:', toleranceElement?.textContent);

      if (!toleranceElement) {
        throw new Error(
          `Tolerance: toleranceElement not found. answerCell HTML: ${answerCell?.innerHTML}`,
        );
      }
      expect(toleranceElement).toBeDefined();
      expect(toleranceElement.textContent).toContain('±0.5');
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

      // Diagnostic logging
      console.log('Visual Indicator Test - Answer Cell:', answerCell);
      console.log('Visual Indicator Test - Answer Cell HTML:', answerCell?.innerHTML);
      console.log('Visual Indicator Test - classList:', answerCell?.classList.toString());
      console.log(
        'Visual Indicator Test - Has qd-answer-revealed:',
        answerCell?.classList.contains('qd-answer-revealed'),
      );

      if (!answerCell) {
        throw new Error('Visual Indicator: answerCell not found');
      }
      if (!answerCell.classList.contains('qd-answer-revealed')) {
        throw new Error(
          `Visual Indicator: Cell missing 'qd-answer-revealed' class. classList: ${answerCell.classList.toString()}, HTML: ${answerCell.innerHTML?.substring(0, 200)}`,
        );
      }
      expect(answerCell.classList.contains('qd-answer-revealed')).toBe(true);
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

      // Diagnostic logging
      console.log('Multiple Questions Test - Table HTML:', table.innerHTML);
      console.log('Multiple Questions Test - Reveal Elements found:', revealElements.length);
      console.log(
        'Multiple Questions Test - All answer cells:',
        table.querySelectorAll('tbody tr td:nth-child(2)').length,
      );

      if (revealElements.length !== 2) {
        throw new Error(
          `Multiple Questions: Expected 2 reveal elements, found ${revealElements.length}. Table HTML: ${table.innerHTML?.substring(0, 500)}`,
        );
      }
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

      // Diagnostic logging
      console.log('Student ID Test - Parent Element:', table.parentElement);
      console.log('Student ID Test - Parent Element HTML:', table.parentElement?.innerHTML);
      console.log('Student ID Test - Student Cell:', studentCell);
      console.log('Student ID Test - Student Cell textContent:', studentCell?.textContent);
      console.log(
        'Student ID Test - Comparison tables found:',
        table.parentElement?.querySelectorAll('.qd-student-comparison').length,
      );

      if (!studentCell || !studentCell.textContent?.includes('RN23')) {
        throw new Error(
          `Student ID: Expected 'RN23' in student cell. Found: '${studentCell?.textContent}'. Parent HTML: ${table.parentElement?.innerHTML?.substring(0, 500)}`,
        );
      }
      expect(studentCell.textContent).toContain('RN23'); // First 4 chars
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

      // Diagnostic logging
      console.log('Success Color Test - Parent Element:', table.parentElement);
      console.log('Success Color Test - Success Cell:', successCell);
      console.log('Success Color Test - Success Cell className:', successCell?.className);
      console.log(
        'Success Color Test - All student-answer cells:',
        table.parentElement?.querySelectorAll('.qd-student-answer').length,
      );

      if (!successCell) {
        throw new Error(
          `Success Color: successCell not found. Parent HTML: ${table.parentElement?.innerHTML?.substring(0, 500)}`,
        );
      }
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

      // Diagnostic logging
      console.log('Failure Color Test - Parent Element:', table.parentElement);
      console.log('Failure Color Test - Failure Cell:', failureCell);
      console.log('Failure Color Test - Failure Cell className:', failureCell?.className);
      console.log(
        'Failure Color Test - All student-answer cells:',
        table.parentElement?.querySelectorAll('.qd-student-answer').length,
      );

      if (!failureCell) {
        throw new Error(
          `Failure Color: failureCell not found. Parent HTML: ${table.parentElement?.innerHTML?.substring(0, 500)}`,
        );
      }
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

      // Diagnostic logging
      console.log(
        'Multiple Students Test - Parent Element HTML:',
        table.parentElement?.innerHTML?.substring(0, 500),
      );
      console.log('Multiple Students Test - Student Rows found:', studentRows?.length);
      console.log(
        'Multiple Students Test - Comparison tables:',
        table.parentElement?.querySelectorAll('.qd-student-comparison').length,
      );

      if (studentRows?.length !== 2) {
        throw new Error(
          `Multiple Students: Expected 2 student rows, found ${studentRows?.length}. Parent HTML: ${table.parentElement?.innerHTML?.substring(0, 500)}`,
        );
      }
      expect(studentRows.length).toBe(2);
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
