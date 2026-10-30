/**
 * Unit tests for decoding quiz answers encoded at publish time (SRD 013 WP3).
 */

import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  ANSWER_ALPHABET,
  ENCODED_PREFIX,
  decodeAnswer,
  isEncodedAnswer,
  isValidAnswerKey,
  readAnswerKey,
  tableNeedsMissingKey,
  AnswerDecodeError,
} from '../../../src/services/answer-encoding.js';

const KEY = 'KXMQBRTLHZWDP';

/** Encode the way quizAnswerEncoding.xsl does: prefix + translate(). */
function encode(value: string, key = KEY): string {
  return ENCODED_PREFIX + [...value].map((ch) => key[ANSWER_ALPHABET.indexOf(ch)]).join('');
}

describe('answer encoding', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('matches the alphabet, prefix and default key in the publishing XSL', () => {
    const xsl = readFileSync(
      resolve(__dirname, '../../../dita/template/xslt/inc/quizAnswerEncoding.xsl'),
      'utf8',
    );
    expect(xsl).toContain(`name="qd:alphabet" as="xs:string" select="'${ANSWER_ALPHABET}'"`);
    expect(xsl).toContain(`name="qd:prefix" as="xs:string" select="'${ENCODED_PREFIX}'"`);
    const defaultKey = /name="qd:default-key" as="xs:string" select="'([A-Z]+)'"/.exec(xsl)?.[1];
    expect(defaultKey && isValidAnswerKey(defaultKey)).toBe(true);
  });

  it('round-trips every alphabet character', () => {
    for (const value of ['1500', '-5', '+2.5', '.5', '0123456789']) {
      expect(decodeAnswer(encode(value), KEY)).toBe(value);
    }
  });

  it('decodes the values the XSL produced in its harness run', () => {
    // From the xslt3 run of quizAnswerEncoding.xsl with the default key
    expect(decodeAnswer('qd1:XR', KEY)).toBe('15');
    expect(decodeAnswer('qd1:WMPR', KEY)).toBe('-2.5');
  });

  it('returns plain values unchanged, so older publications keep working', () => {
    expect(decodeAnswer(' 1500 ', '')).toBe('1500');
    expect(isEncodedAnswer('1500')).toBe(false);
    expect(isEncodedAnswer(' qd1:XR')).toBe(true);
  });

  it('refuses to decode without a valid key', () => {
    expect(() => decodeAnswer(encode('15'), '')).toThrow(AnswerDecodeError);
    expect(() => decodeAnswer(encode('15'), 'AAB')).toThrow(AnswerDecodeError);
  });

  it('refuses letters the key does not map', () => {
    expect(() => decodeAnswer('qd1:XZY', 'ABCDEFGHIJKLM')).toThrow(/does not map/);
  });

  it('validates keys', () => {
    expect(isValidAnswerKey(KEY)).toBe(true);
    expect(isValidAnswerKey('ABCDEFGHIJKLL')).toBe(false); // repeated letter
    expect(isValidAnswerKey('abcdefghijklm')).toBe(false);
    expect(isValidAnswerKey('ABC')).toBe(false);
  });

  it('reads the key from #qd-answer-key', () => {
    document.body.innerHTML = `<span id="qd-answer-key"> ${KEY} </span>`;
    expect(readAnswerKey()).toBe(KEY);
  });

  it('flags a table with encoded values only when the key is unusable (ANS-09)', () => {
    const table = document.createElement('table');
    table.innerHTML = `<tbody><tr><td>Q</td><td>${encode('15')}</td><td>2</td></tr></tbody>`;
    expect(tableNeedsMissingKey(table, '')).toBe(true);
    expect(tableNeedsMissingKey(table, KEY)).toBe(false);
    const plain = document.createElement('table');
    plain.innerHTML = '<tbody><tr><td>Q</td><td>15</td><td>2</td></tr></tbody>';
    expect(tableNeedsMissingKey(plain, '')).toBe(false);
  });
});
