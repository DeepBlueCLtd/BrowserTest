/**
 * Unit tests for finalising published output (SRD 013 SCO-05, ANS-03).
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  countQuestions,
  stampQuestionTotal,
  finaliseOutput,
} from '../../../scripts/finalise-output.js';

const quizPage = (rows: number, answer = 'qd1:X'): string => `<html><body>
  <header><span id="qd-question-total" style="display:none;"></span></header>
  <table class="qd-quiz"><thead><tr><th>Q</th><th>A</th><th>D</th></tr></thead><tbody>
  ${Array.from({ length: rows }, () => `<tr><td>Q</td><td>${answer}</td><td><ol><li>o</li></ol></td></tr>`).join('')}
  </tbody></table></body></html>`;

describe('finalise-output', () => {
  let dir = '';
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('counts body rows of quiz tables only', () => {
    expect(countQuestions(quizPage(3))).toBe(3);
    expect(countQuestions('<table><tbody><tr><td>x</td></tr></tbody></table>')).toBe(0);
  });

  it('stamps the total into the placeholder span', () => {
    const { html, stamped } = stampQuestionTotal(quizPage(1), 40);
    expect(stamped).toBe(true);
    expect(html).toContain('id="qd-question-total" style="display:none;">40</span>');
    expect(stampQuestionTotal('<p>no span</p>', 40).stamped).toBe(false);
  });

  it('stamps every page with the publication total and removes the search index', () => {
    dir = mkdtempSync(join(tmpdir(), 'qd-final-'));
    mkdirSync(join(dir, 'Pages'));
    writeFileSync(join(dir, 'Pages', 'a.html'), quizPage(5));
    writeFileSync(join(dir, 'Pages', 'b.html'), quizPage(6));
    writeFileSync(join(dir, 'index.html'), quizPage(0));
    const index = join(dir, 'oxygen-webhelp', 'app', 'search', 'index');
    mkdirSync(index, { recursive: true });

    const result = finaliseOutput(dir);

    expect(result.total).toBe(11);
    expect(result.stamped).toBe(3);
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).toContain('>11</span>');
    expect(existsSync(index)).toBe(false);
    expect(result.searchIndex).toBe(false);
    expect(result.leaks).toEqual([]);
  });

  it('reports plaintext answers it finds', () => {
    dir = mkdtempSync(join(tmpdir(), 'qd-final-'));
    writeFileSync(join(dir, 'a.html'), quizPage(1, '3'));
    expect(finaliseOutput(dir).leaks).toHaveLength(1);
  });
});
