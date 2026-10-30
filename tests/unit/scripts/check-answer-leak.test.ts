/**
 * Unit tests for the published-output answer leak check (SRD 013 ANS-10).
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  findLeaksInHtml,
  checkOutput,
  SEARCH_INDEX_DIR,
} from '../../../scripts/check-answer-leak.js';

const page = (answer: string, detail: string): string => `<table class="qd-quiz">
  <thead><tr><th>Q</th><th>A</th><th>D</th></tr></thead>
  <tbody><tr><td>Question</td><td>${answer}</td><td>${detail}</td></tr></tbody></table>`;

describe('check-answer-leak', () => {
  let dir = '';
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('reports a plaintext answer and tolerance', () => {
    expect(findLeaksInHtml(page('1500', '50'))).toEqual([
      { row: 1, column: 'answer', value: '1500' },
      { row: 1, column: 'tolerance', value: '50' },
    ]);
  });

  it('accepts encoded values and readable MCQ options', () => {
    expect(findLeaksInHtml(page('qd1:XRKK', 'qd1:RK'))).toEqual([]);
    expect(findLeaksInHtml(page('qd1:X', '<ol><li>Option 12</li></ol>'))).toEqual([]);
  });

  it('ignores tables that are not quizzes', () => {
    expect(findLeaksInHtml('<table><tbody><tr><td>Q</td><td>15</td></tr></tbody></table>')).toEqual(
      [],
    );
  });

  it('walks an output folder and reports a search index', () => {
    dir = mkdtempSync(join(tmpdir(), 'qd-leak-'));
    mkdirSync(join(dir, 'Pages'));
    writeFileSync(join(dir, 'Pages', 'quiz.html'), page('15', 'qd1:M'));
    mkdirSync(join(dir, SEARCH_INDEX_DIR), { recursive: true });

    const result = checkOutput(dir);
    expect(result.leaks).toEqual([
      { file: join('Pages', 'quiz.html'), row: 1, column: 'answer', value: '15' },
    ]);
    expect(result.searchIndex).toBe(true);
  });
});
