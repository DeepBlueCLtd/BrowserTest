#!/usr/bin/env node

/**
 * Finalise published DITA output before distributing it (SRD 013).
 *
 *  1. Count the quiz questions (body rows of qd-quiz tables) across every
 *     page and write the count into each page's #qd-question-total span, so
 *     the student panel can say "12 of 40 answered" (SCO-05). The span is
 *     emitted empty by dita/template/xslt/inc/customHeader.xsl.
 *  2. Delete the WebHelp search index, which holds page text (ANS-03).
 *  3. Run the answer leak check (ANS-10) and fail if anything leaks.
 *
 * Usage:
 *   npm run finalise:output -- dita/out/oxygen
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import { checkOutput, SEARCH_INDEX_DIR } from './check-answer-leak.js';

const TOTAL_SPAN = /(<span[^>]*id="qd-question-total"[^>]*>)[^<]*(<\/span>)/;

/** Every .html file under a directory. */
function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      out.push(...htmlFiles(path));
    } else if (name.endsWith('.html')) {
      out.push(path);
    }
  }
  return out;
}

/**
 * Count quiz questions in one page.
 *
 * @param {string} html - Page source
 * @returns {number} Body rows across the page's qd-quiz tables
 */
export function countQuestions(html) {
  const { document } = new JSDOM(html).window;
  let count = 0;
  for (const table of document.querySelectorAll('table.qd-quiz')) {
    count += table.querySelectorAll('tbody tr').length;
  }
  return count;
}

/**
 * Write the question total into a page's #qd-question-total span.
 *
 * @param {string} html - Page source
 * @param {number} total - Publication question total
 * @returns {{html: string, stamped: boolean}} Updated source, and whether a span was found
 */
export function stampQuestionTotal(html, total) {
  if (!TOTAL_SPAN.test(html)) {
    return { html, stamped: false };
  }
  return { html: html.replace(TOTAL_SPAN, `$1${total}$2`), stamped: true };
}

/**
 * Finalise an output folder in place.
 *
 * @param {string} outputDir - Published WebHelp output folder
 * @returns {{total: number, stamped: number, leaks: object[], searchIndex: boolean}}
 */
export function finaliseOutput(outputDir) {
  const files = htmlFiles(outputDir);
  const total = files.reduce((sum, file) => sum + countQuestions(readFileSync(file, 'utf8')), 0);

  let stamped = 0;
  for (const file of files) {
    const result = stampQuestionTotal(readFileSync(file, 'utf8'), total);
    if (result.stamped) {
      writeFileSync(file, result.html);
      stamped++;
    }
  }

  const index = join(outputDir, SEARCH_INDEX_DIR);
  if (existsSync(index)) {
    rmSync(index, { recursive: true, force: true });
  }

  const { leaks, searchIndex } = checkOutput(outputDir);
  return { total, stamped, leaks, searchIndex };
}

function main() {
  const outputDir = process.argv[2];
  if (!outputDir || !existsSync(outputDir)) {
    console.error('Usage: node scripts/finalise-output.js <published-output-dir>');
    process.exit(2);
  }
  const { total, stamped, leaks, searchIndex } = finaliseOutput(outputDir);
  console.log(`Question total ${total}, stamped into ${stamped} page(s)`);
  if (stamped === 0) {
    console.warn(
      '⚠️  No #qd-question-total span found: was the output built with the current template?',
    );
  }
  for (const leak of leaks) {
    console.error(`LEAK ${leak.file} row ${leak.row} ${leak.column}: "${leak.value}"`);
  }
  if (leaks.length > 0 || searchIndex) {
    console.error(
      '❌ Output still holds plaintext answers or a search index. Do not distribute it.',
    );
    process.exit(1);
  }
  console.log('✅ Output finalised: no plaintext answers and no search index');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
