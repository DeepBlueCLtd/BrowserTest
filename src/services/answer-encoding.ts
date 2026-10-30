/**
 * Decoding of quiz answers encoded at publish time (SRD 013 WP3).
 *
 * `dita/template/xslt/inc/quizAnswerEncoding.xsl` writes each Answer cell, and
 * each Detail cell that holds only a numeric tolerance, as `qd1:` followed by
 * a letter substitution of the value. The key (13 different capital letters,
 * mapped in order to {@link ANSWER_ALPHABET}) is published in the hidden
 * `#qd-answer-key` span. Cells without the prefix are plain, so publications
 * built before the encoding keep working.
 *
 * This is obfuscation: the key is in the page. It stops answers being read at
 * a glance in view-source or a text editor.
 */

import { CONFIG_IDS } from '../config/dom-config-reader.js';

/** Characters an encoded value may contain, in the order the key maps them. */
export const ANSWER_ALPHABET = '0123456789-+.';

/** Prefix marking an encoded value (version 1). */
export const ENCODED_PREFIX = 'qd1:';

/**
 * Whether a cell value was encoded at publish time.
 *
 * @param text - Cell text
 * @returns True when it carries the encoding prefix
 */
export function isEncodedAnswer(text: string): boolean {
  return text.trim().startsWith(ENCODED_PREFIX);
}

/**
 * Whether a key is 13 different capital letters.
 *
 * @param key - Candidate key
 * @returns True when the key can decode values
 */
export function isValidAnswerKey(key: string): boolean {
  return /^[A-Z]{13}$/.test(key) && new Set(key).size === ANSWER_ALPHABET.length;
}

/**
 * Read the answer key from the page's `#qd-answer-key` span.
 *
 * @returns The key, or an empty string when absent
 */
export function readAnswerKey(): string {
  return document.getElementById(CONFIG_IDS.answerKey)?.textContent?.trim() ?? '';
}

/** Raised when an encoded value cannot be decoded. */
export class AnswerDecodeError extends Error {}

/**
 * Decode one cell value. Plain values are returned unchanged.
 *
 * @param text - Cell text, encoded or plain
 * @param key - Answer key from the page
 * @returns The plain value
 * @throws AnswerDecodeError when the value is encoded but the key is missing
 *   or invalid, or the value contains letters outside the key
 */
export function decodeAnswer(text: string, key: string): string {
  const value = text.trim();
  if (!value.startsWith(ENCODED_PREFIX)) {
    return value;
  }
  if (!isValidAnswerKey(key)) {
    throw new AnswerDecodeError(
      'Encoded quiz answer found but #qd-answer-key is missing or invalid',
    );
  }
  let plain = '';
  for (const ch of value.slice(ENCODED_PREFIX.length)) {
    const index = key.indexOf(ch);
    if (index < 0) {
      throw new AnswerDecodeError(
        `Encoded quiz answer contains "${ch}", which the key does not map`,
      );
    }
    plain += ANSWER_ALPHABET[index];
  }
  return plain;
}

/**
 * Whether a quiz table holds encoded values that this page cannot decode.
 * Such a table is left as published rather than shown with garbled answers
 * (SRD 013 ANS-09).
 *
 * @param table - Quiz table element
 * @param key - Answer key from the page
 * @returns True when the table must not be enhanced
 */
export function tableNeedsMissingKey(table: HTMLTableElement, key: string): boolean {
  if (isValidAnswerKey(key)) {
    return false;
  }
  return Array.from(table.querySelectorAll('tbody td')).some((cell) =>
    isEncodedAnswer(cell.textContent ?? ''),
  );
}
