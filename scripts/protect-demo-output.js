#!/usr/bin/env node

/**
 * Apply the Oxygen template's answer protection (SRD 013 WP3) to WebHelp output
 * that was published before the template had it.
 *
 * This is a developer stand-in for republishing in Oxygen, used to bring
 * dita-demo/ (the E2E fixture and PR preview) up to date without an Oxygen
 * licence. It does what the template does, with the same rules:
 *
 * - each qd-quiz Answer cell, and each Detail cell holding only a number, is
 *   rewritten as "qd1:" + the keyed substitution of quizAnswerEncoding.xsl;
 * - #qd-question-total and #qd-answer-key spans follow #qd-db-name, as
 *   customHeader.xsl writes them;
 * - the search box, the search index and its scripts are removed, the
 *   search page shows the notice from wt_search.html, and search
 *   autocomplete is turned off, as f13ldMan-CSA.opt does.
 *
 * A real Oxygen publish replaces this. Content authors never run it.
 *
 * Usage:
 *   npm run protect-dita-demo
 *   node scripts/protect-demo-output.js <output-dir> [KEY]
 */

import { readdirSync, readFileSync, writeFileSync, statSync, rmSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { SEARCH_INDEX_DIR } from './check-answer-leak.js';

const ALPHABET = '0123456789-+.';
const PREFIX = 'qd1:';
/** quizAnswerEncoding.xsl's built-in key, also the value in DITA_project_CSA.xpr */
export const DEFAULT_KEY = 'KXMQBRTLHZWDP';
const NUMERIC_ONLY = /^[0-9+\-.]+$/;
const SEARCH_NOTICE = '<p>Search is turned off for this publication.</p>';

/**
 * Encode one answer as quizAnswerEncoding.xsl does.
 *
 * @param {string} value - Answer or tolerance text
 * @param {string} key - 13 different capital letters
 * @returns {string} "qd1:" + substituted value
 */
export function encodeAnswer(value, key) {
  if (!/^[A-Z]{13}$/.test(key) || new Set(key).size !== 13) {
    throw new Error(`Key must be 13 different capital letters A-Z, got "${key}"`);
  }
  const text = value.replace(/\s+/g, ' ').trim();
  if (!NUMERIC_ONLY.test(text)) {
    throw new Error(`Quiz answer "${text}" may contain only digits, a sign and a decimal point`);
  }
  return PREFIX + [...text].map((ch) => key[ALPHABET.indexOf(ch)]).join('');
}

/** Each qd-quiz table in a page, as {start, end} source offsets. */
function quizTables(html) {
  const tables = [];
  const open = /<table\b[^>]*class="[^"]*\bqd-quiz\b[^"]*"[^>]*>/g;
  let match;
  while ((match = open.exec(html))) {
    const end = html.indexOf('</table>', match.index);
    if (end === -1) break;
    tables.push({ start: match.index, end: end + '</table>'.length });
    open.lastIndex = end;
  }
  return tables;
}

/** Body rows of one table's source. */
function bodyRows(tableHtml) {
  const tbody = tableHtml.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/);
  return tbody ? [...tbody[1].matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/g)].map((m) => m[0]) : [];
}

/**
 * Number of quiz questions in one page.
 *
 * @param {string} html - Page source
 * @returns {number} qd-quiz body rows
 */
export function countQuizRows(html) {
  return quizTables(html).reduce((sum, t) => sum + bodyRows(html.slice(t.start, t.end)).length, 0);
}

/** Encode the non-blank text between tags of a cell's inner HTML. */
function encodeCellText(inner, key) {
  return inner.replace(/(^|>)([^<]+)(?=<|$)/g, (whole, lead, text) =>
    text.trim() === '' || text.trim().startsWith(PREFIX) ? whole : lead + encodeAnswer(text, key),
  );
}

/** Encode the Answer cell, and a numeric Detail cell, of one row. */
function protectRow(row, key) {
  let column = 0;
  return row.replace(/(<td\b[^>]*>)([\s\S]*?)(<\/td>)/g, (whole, open, inner, close) => {
    column += 1;
    const text = inner.trim();
    const numericDetail = column === 3 && !/</.test(inner) && NUMERIC_ONLY.test(text);
    if ((column === 2 && text !== '') || numericDetail) {
      return (
        open + (/</.test(inner) ? encodeCellText(inner, key) : encodeCellText(text, key)) + close
      );
    }
    return whole;
  });
}

/** Index just past the element that opens at `start`, matching nested tags of the same name. */
function elementEnd(html, start, tag) {
  const pattern = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'g');
  pattern.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = pattern.exec(html))) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) return pattern.lastIndex;
  }
  return -1;
}

/** Remove every <div> whose opening tag matches `opening`. */
function removeDivs(html, opening) {
  let out = html;
  let match;
  while ((match = opening.exec(out))) {
    const end = elementEnd(out, match.index, 'div');
    if (end === -1) break;
    out = out.slice(0, match.index) + out.slice(end);
    opening.lastIndex = 0;
  }
  return out;
}

/** Set or add a hidden config span directly after `after`. */
function setSpan(html, id, value, after) {
  const span = `<span id="${id}" style="display:none;">${value}</span>`;
  const existing = new RegExp(`<span id="${id}"[^>]*>[^<]*</span>`);
  if (existing.test(html)) return html.replace(existing, span);
  const anchor = html.match(after);
  if (!anchor) return html;
  const at = anchor.index + anchor[0].length;
  return html.slice(0, at) + span + html.slice(at);
}

/**
 * Apply the template's protection to one page.
 *
 * @param {string} html - Page source
 * @param {{key: string, total: string}} options - Answer key and question total
 * @returns {string} Protected page source
 */
export function protectHtml(html, { key, total }) {
  let out = html;
  for (const table of quizTables(out).reverse()) {
    const source = out.slice(table.start, table.end);
    const protectedTable = source.replace(/<tbody\b[^>]*>[\s\S]*?<\/tbody>/, (tbody) =>
      tbody.replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/g, (row) => protectRow(row, key)),
    );
    out = out.slice(0, table.start) + protectedTable + out.slice(table.end);
  }
  out = setSpan(out, 'qd-question-total', total, /<span id="qd-db-name"[^>]*>[^<]*<\/span>/);
  out = setSpan(out, 'qd-answer-key', key, /<span id="qd-question-total"[^>]*>[^<]*<\/span>/);
  out = removeDivs(out, /<div\b[^>]*class="[^"]*\bwh_search_input\b[^"]*"[^>]*>/);
  out = out.replace(
    /[ \t]*<script\b[^>]*src="[^"]*app\/search\/index\/[^"]*"[^>]*><\/script>\r?\n?/g,
    '',
  );
  return out;
}

/**
 * Replace the search page's results area with the template's notice.
 *
 * @param {string} html - search.html source
 * @returns {string} Updated source
 */
export function protectSearchPage(html) {
  const opening = /<div\b[^>]*id="results"[^>]*>\s*<div class="row">/.exec(html);
  if (!opening) return html;
  const rowStart = html.indexOf('<div class="row">', opening.index);
  const rowEnd = elementEnd(html, rowStart, 'div');
  if (rowEnd === -1) return html;
  return `${html.slice(0, rowStart)}<div class="row">\n                ${SEARCH_NOTICE}\n            </div>${html.slice(rowEnd)}`;
}

/**
 * Turn off search autocomplete, as the template's f13ldMan-CSA.opt does: its
 * script throws on every page once the search box is gone.
 */
function disableAutocomplete(propertiesFile) {
  if (!existsSync(propertiesFile)) return;
  const source = readFileSync(propertiesFile, 'utf8');
  const out = source.replace(/("webhelp\.enable\.search\.autocomplete"\s*:\s*)"[^"]*"/, '$1"no"');
  if (out !== source) writeFileSync(propertiesFile, out);
}

/** Every .html file under a directory. */
function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...htmlFiles(path));
    else if (name.endsWith('.html')) out.push(path);
  }
  return out;
}

/**
 * Protect a whole WebHelp output folder in place.
 *
 * @param {string} outputDir - Published output folder
 * @param {{key?: string}} [options] - Answer key (default: the template's)
 * @returns {{pages: number, questionTotal: number}} Pages written and question total
 */
export function protectOutput(outputDir, { key = DEFAULT_KEY } = {}) {
  const files = htmlFiles(outputDir);
  const sources = new Map(files.map((file) => [file, readFileSync(file, 'utf8')]));
  const questionTotal = [...sources.values()].reduce((sum, html) => sum + countQuizRows(html), 0);
  const total = questionTotal > 0 ? String(questionTotal) : '';
  for (const [file, html] of sources) {
    let out = protectHtml(html, { key, total });
    if (basename(file) === 'search.html') out = protectSearchPage(out);
    if (out !== html) writeFileSync(file, out);
  }
  rmSync(join(outputDir, SEARCH_INDEX_DIR), { recursive: true, force: true });
  disableAutocomplete(join(outputDir, 'oxygen-webhelp', 'app', 'options', 'properties.js'));
  return { pages: files.length, questionTotal };
}

function main() {
  const [outputDir, key = DEFAULT_KEY] = process.argv.slice(2);
  if (!outputDir) {
    console.error('Usage: node scripts/protect-demo-output.js <output-dir> [KEY]');
    process.exit(2);
  }
  const { pages, questionTotal } = protectOutput(outputDir, { key });
  console.log(`Protected ${pages} page(s); question total ${questionTotal}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
