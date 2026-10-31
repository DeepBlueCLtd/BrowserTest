/**
 * Integration tests: quiz tables published with encoded answers (SRD 013 WP3).
 *
 * Builds tables the way quizAnswerEncoding.xsl publishes them and checks the
 * student and instructor paths end to end in the DOM.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { enhanceQuizTable, getQuizTableMetadata } from '../../src/enhancers/quiz-table.js';
import { revealInstructorAnswers } from '../../src/enhancers/instructor-answer-reveal.js';
import { validateAnswer } from '../../src/services/quiz-parser.js';
import { ANSWER_ALPHABET, ENCODED_PREFIX } from '../../src/services/answer-encoding.js';
import { STORAGE_KEYS, type SessionData } from '../../src/types/contracts.js';

const KEY = 'KXMQBRTLHZWDP';
const encode = (value: string): string =>
  ENCODED_PREFIX + [...value].map((ch) => KEY[ANSWER_ALPHABET.indexOf(ch)]).join('');

function publishedNumericTable(): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'qd-quiz';
  table.innerHTML = `
    <thead><tr><th>Question</th><th>Correct Value</th><th>Tolerance</th></tr></thead>
    <tbody>
      <tr><td>Speed of sound (m/s)?</td><td>${encode('1500')}</td><td>${encode('50')}</td></tr>
      <tr><td>Pulse (ms)?</td><td>${encode('-2.5')}</td><td>${encode('0.5')}</td></tr>
    </tbody>`;
  document.body.appendChild(table);
  return table;
}

function publishedMcqTable(): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'qd-quiz';
  table.innerHTML = `
    <thead><tr><th>Question</th><th>Answer</th><th>Options</th></tr></thead>
    <tbody><tr><td>SONAR?</td><td>${encode('1')}</td>
      <td><ol><li>Sound Navigation And Ranging</li><li>Other</li></ol></td></tr></tbody>`;
  document.body.appendChild(table);
  return table;
}

function setKey(key: string | null): void {
  document.getElementById('qd-answer-key')?.remove();
  if (key === null) return;
  const span = document.createElement('span');
  span.id = 'qd-answer-key';
  span.style.display = 'none';
  span.textContent = key;
  document.body.appendChild(span);
}

describe('encoded quiz answers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
  });

  it('decodes answers and tolerances for validation', () => {
    setKey(KEY);
    const table = publishedNumericTable();
    expect(enhanceQuizTable(table, { interactive: false })).toBe(true);
    const [first, second] = getQuizTableMetadata(table)!.parsed.questions;
    expect(first).toMatchObject({ kind: 'numeric', correctAnswer: '1500', tolerance: 50 });
    expect(second).toMatchObject({ correctAnswer: '-2.5', tolerance: 0.5 });
    expect(validateAnswer(first!, '1530')).toBe(true);
    expect(validateAnswer(first!, '1600')).toBe(false);
  });

  it('decodes MCQ answers and leaves options readable', () => {
    setKey(KEY);
    const table = publishedMcqTable();
    enhanceQuizTable(table, { interactive: false });
    const question = getQuizTableMetadata(table)!.parsed.questions[0]!;
    expect(question.correctAnswer).toBe('1');
    expect(question.options?.[0]).toBe('Sound Navigation And Ranging');
  });

  it('shows instructors the decoded answer and tolerance', () => {
    setKey(KEY);
    const table = publishedNumericTable();
    enhanceQuizTable(table, { interactive: false });
    revealInstructorAnswers(table, { ...getQuizTableMetadata(table)!, pageId: 'quiz-numeric' });
    const firstRow = table.querySelectorAll('tbody tr')[0]!.querySelectorAll('td');
    expect(firstRow[1]!.textContent).toBe('1500');
    expect(firstRow[2]!.textContent).toBe('50');
  });

  it('works for a logged-in student', () => {
    setKey(KEY);
    const session: SessionData = {
      serviceId: 'RN1',
      name: 'A',
      release: 'R',
      loginTime: '',
      lastActivity: '',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      instructorUnlocked: false,
    };
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    const table = publishedNumericTable();
    enhanceQuizTable(table, { interactive: false });
    expect(enhanceQuizTable(table, { interactive: true, pageId: 'quiz-numeric' })).toBe(true);
    expect(table.querySelectorAll('tbody input')).toHaveLength(2);
    // The encoded values are gone from the DOM, as plain answers were before
    expect(table.innerHTML).not.toContain(ENCODED_PREFIX);
  });

  it('leaves a table un-enhanced when the key is missing (ANS-09)', () => {
    setKey(null);
    const table = publishedNumericTable();
    expect(enhanceQuizTable(table, { interactive: false })).toBe(false);
    expect(getQuizTableMetadata(table)).toBeUndefined();
  });

  it('still reads plain tables from older publications without a key', () => {
    setKey(null);
    const table = document.createElement('table');
    table.className = 'qd-quiz';
    table.innerHTML = `<thead><tr><th>Q</th><th>A</th><th>T</th></tr></thead>
      <tbody><tr><td>Q1</td><td>15</td><td>2</td></tr></tbody>`;
    document.body.appendChild(table);
    expect(enhanceQuizTable(table, { interactive: false })).toBe(true);
    expect(getQuizTableMetadata(table)!.parsed.questions[0]!.correctAnswer).toBe('15');
  });
});
