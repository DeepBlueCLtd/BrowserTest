#!/usr/bin/env node

/**
 * Answer leak check for published DITA output (SRD 013 ANS-10).
 *
 * Fails when a published page holds a quiz answer, or a numeric tolerance, in
 * plain text instead of the "qd1:" encoding added by
 * dita/template/xslt/inc/quizAnswerEncoding.xsl, or when the WebHelp search
 * index is still present (ANS-03).
 *
 * Usage:
 *   npm run check:answer-leak -- dita/out/oxygen
 *   node scripts/check-answer-leak.js <output-dir>
 *
 * Exit code 1 when anything leaks, so it can gate a release.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const ENCODED_PREFIX = 'qd1:';
const NUMERIC_ONLY = /^[0-9+\-.]+$/;
export const SEARCH_INDEX_DIR = join('oxygen-webhelp', 'app', 'search', 'index');

/**
 * Find plaintext answers and tolerances in one HTML page.
 *
 * @param {string} html - Page source
 * @returns {{row: number, column: 'answer' | 'tolerance', value: string}[]} Leaks
 */
export function findLeaksInHtml(html) {
  const { document } = new JSDOM(html).window;
  const leaks = [];
  for (const table of document.querySelectorAll('table.qd-quiz')) {
    table.querySelectorAll('tbody tr').forEach((row, index) => {
      const cells = row.querySelectorAll('td');
      const answer = cells[1]?.textContent?.trim() ?? '';
      if (answer && !answer.startsWith(ENCODED_PREFIX)) {
        leaks.push({ row: index + 1, column: 'answer', value: answer });
      }
      const detail = cells[2];
      const tolerance = detail?.textContent?.trim() ?? '';
      if (
        detail &&
        detail.children.length === 0 &&
        NUMERIC_ONLY.test(tolerance) &&
        !tolerance.startsWith(ENCODED_PREFIX)
      ) {
        leaks.push({ row: index + 1, column: 'tolerance', value: tolerance });
      }
    });
  }
  return leaks;
}

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
 * Check a whole output folder.
 *
 * @param {string} outputDir - Published WebHelp output folder
 * @returns {{leaks: {file: string, row: number, column: string, value: string}[], searchIndex: boolean}}
 */
export function checkOutput(outputDir) {
  const leaks = [];
  for (const file of htmlFiles(outputDir)) {
    for (const leak of findLeaksInHtml(readFileSync(file, 'utf8'))) {
      leaks.push({ file: relative(outputDir, file), ...leak });
    }
  }
  return { leaks, searchIndex: existsSync(join(outputDir, SEARCH_INDEX_DIR)) };
}

function main() {
  const outputDir = process.argv[2];
  if (!outputDir || !existsSync(outputDir)) {
    console.error('Usage: node scripts/check-answer-leak.js <published-output-dir>');
    process.exit(2);
  }
  const { leaks, searchIndex } = checkOutput(outputDir);
  for (const leak of leaks) {
    console.error(`LEAK ${leak.file} row ${leak.row} ${leak.column}: "${leak.value}"`);
  }
  if (searchIndex) {
    console.error(
      `LEAK ${SEARCH_INDEX_DIR} exists. Delete it before distributing: the index holds page text.`,
    );
  }
  if (leaks.length > 0 || searchIndex) {
    console.error(
      `\n❌ ${leaks.length} plaintext value(s)${searchIndex ? ' and a search index' : ''}`,
    );
    process.exit(1);
  }
  console.log('✅ No plaintext quiz answers and no search index');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
