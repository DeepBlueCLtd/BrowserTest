/**
 * Unit tests for the developer stand-in that applies the Oxygen template's
 * answer protection (SRD 013 WP3) to already-published demo output.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  encodeAnswer,
  countQuizRows,
  protectHtml,
  protectSearchPage,
  protectOutput,
  DEFAULT_KEY,
} from '../../../scripts/protect-demo-output.js';
import { findLeaksInHtml, SEARCH_INDEX_DIR } from '../../../scripts/check-answer-leak.js';
import { decodeAnswer } from '../../../src/services/answer-encoding';

const KEY = 'KXMQBRTLHZWDP';

const header = `<header class="navbar navbar-default wh_header c-nav-bar">
<div class=" wh_search_input navbar-form wh_main_page_search search " role="form"><form id="searchForm"><div><input type="search" id="textToSearch"/></div></form></div>
<div class="wh_top_menu_and_indexterms_link">menu</div>
<span id="qd-db-name" style="display:none;">BrowserTestDB</span></header>`;

const quizPage = `<html><head>
<script src="../oxygen-webhelp/app/search/index/keywords.js?buildId=1"></script>
<script src="../oxygen-webhelp/app/options/properties.js?buildId=1"></script>
</head><body>${header}
<table class="- topic/simpletable simpletable qd-quiz frame-all"><thead><tr><th>Question</th><th>Answer</th><th>Detail</th></tr></thead><tbody><tr class="- topic/strow strow">
  <td class="stentry">MCQ?</td>
  <td class="stentry">3</td>
  <td class="stentry"><ol><li>One 12</li><li>Two</li><li>Three</li></ol></td>
</tr><tr class="- topic/strow strow">
  <td class="stentry">Numeric?</td>
  <td class="stentry">-1.5</td>
  <td class="stentry">0.5</td>
</tr></tbody></table>
<table class="simpletable"><tbody><tr><td>Not a quiz</td><td>42</td><td>7</td></tr></tbody></table>
</body></html>`;

describe('protect-demo-output', () => {
  let dir = '';
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('encodes like quizAnswerEncoding.xsl and decodes with the runtime', () => {
    expect(encodeAnswer('1500', KEY)).toBe('qd1:XRKK');
    expect(encodeAnswer(' -1.5 ', KEY)).toBe('qd1:WXPR');
    expect(decodeAnswer(encodeAnswer('-1.5', KEY), KEY)).toBe('-1.5');
    expect(DEFAULT_KEY).toBe(KEY);
  });

  it('refuses an answer or key the encoding cannot handle', () => {
    expect(() => encodeAnswer('15 kHz', KEY)).toThrow(/15 kHz/);
    expect(() => encodeAnswer('1', 'ABC')).toThrow(/13 different capital letters/);
    expect(() => encodeAnswer('1', 'AAAAAAAAAAAAA')).toThrow(/13 different capital letters/);
  });

  it('counts quiz rows only', () => {
    expect(countQuizRows(quizPage)).toBe(2);
    expect(
      countQuizRows('<table class="simpletable"><tbody><tr><td>x</td></tr></tbody></table>'),
    ).toBe(0);
  });

  it('encodes answers and tolerances, leaving MCQ options and other tables alone', () => {
    const out = protectHtml(quizPage, { key: KEY, total: '2' });
    expect(findLeaksInHtml(out)).toEqual([]);
    expect(out).toContain('<td class="stentry">qd1:Q</td>');
    expect(out).toContain('<td class="stentry">qd1:WXPR</td>');
    expect(out).toContain('<td class="stentry">qd1:KPR</td>');
    expect(out).toContain('<li>One 12</li>');
    expect(out).toContain('<td>42</td><td>7</td>');
  });

  it('writes the key and total spans after the db-name span, once', () => {
    const once = protectHtml(quizPage, { key: KEY, total: '2' });
    const twice = protectHtml(once, { key: KEY, total: '2' });
    for (const out of [once, twice]) {
      expect(out.match(/id="qd-answer-key"/g)).toHaveLength(1);
      expect(out).toContain(
        '<span id="qd-db-name" style="display:none;">BrowserTestDB</span>' +
          '<span id="qd-question-total" style="display:none;">2</span>' +
          `<span id="qd-answer-key" style="display:none;">${KEY}</span>`,
      );
    }
    expect(twice).toContain('qd1:Q</td>');
    expect(twice).not.toContain('qd1:qd1:');
  });

  it('removes the search box and search index scripts', () => {
    const out = protectHtml(quizPage, { key: KEY, total: '2' });
    expect(out).not.toContain('wh_search_input');
    expect(out).not.toContain('textToSearch');
    expect(out).not.toContain('search/index/');
    expect(out).toContain('app/options/properties.js');
    expect(out).toContain('<div class="wh_top_menu_and_indexterms_link">menu</div>');
  });

  it('replaces search results with the notice the template renders', () => {
    const search = `<div class="container-fluid wh_content_area" id="results">
            <div class="row">
        <div class="wh_search_results" id="searchResults"><div class="searchPreload"><div>x</div></div></div>
            </div>
        </div><footer>f</footer>`;
    const out = protectSearchPage(search);
    expect(out).not.toContain('searchResults');
    expect(out).toContain('<p>Search is turned off for this publication.</p>');
    expect(out).toContain('<footer>f</footer>');
  });

  it('protects a whole output folder and deletes the search index', () => {
    dir = mkdtempSync(join(tmpdir(), 'qd-protect-'));
    mkdirSync(join(dir, 'Pages'));
    mkdirSync(join(dir, SEARCH_INDEX_DIR), { recursive: true });
    writeFileSync(join(dir, SEARCH_INDEX_DIR, 'index-1.js'), 'var x = "1500";');
    writeFileSync(join(dir, 'Pages', 'quiz.html'), quizPage);
    writeFileSync(join(dir, 'Pages', 'quiz2.html'), quizPage);
    writeFileSync(join(dir, 'index.html'), `<html><body>${header}</body></html>`);
    mkdirSync(join(dir, 'oxygen-webhelp', 'app', 'options'), { recursive: true });
    const properties = join(dir, 'oxygen-webhelp', 'app', 'options', 'properties.js');
    writeFileSync(properties, '{ "webhelp.enable.search.autocomplete" : "true",\n "x" : "true" }');

    const result = protectOutput(dir, { key: KEY });

    expect(result).toEqual({ pages: 3, questionTotal: 4 });
    expect(existsSync(join(dir, SEARCH_INDEX_DIR))).toBe(false);
    const home = readFileSync(join(dir, 'index.html'), 'utf8');
    expect(home).toContain('<span id="qd-question-total" style="display:none;">4</span>');
    expect(findLeaksInHtml(readFileSync(join(dir, 'Pages', 'quiz.html'), 'utf8'))).toEqual([]);
    expect(readFileSync(properties, 'utf8')).toBe(
      '{ "webhelp.enable.search.autocomplete" : "no",\n "x" : "true" }',
    );
  });
});
