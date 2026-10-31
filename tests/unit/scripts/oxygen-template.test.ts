/**
 * Structural checks on the Oxygen publishing template (SRD 013 WP3, SCO-05).
 *
 * Oxygen is not available in CI, so these pin the wiring that would otherwise
 * only fail inside an author's publish: every page stylesheet imports the
 * shared header, and the header imports the modules whose functions it calls.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const xslt = (name: string): string =>
  readFileSync(resolve(__dirname, '../../../dita/template/xslt', name), 'utf8');

describe('Oxygen template wiring', () => {
  it.each(['customTopicPage.xsl', 'customMainPage.xsl', 'customSearchPage.xsl'])(
    '%s imports the shared header',
    (file) => {
      expect(xslt(file)).toContain('<xsl:import href="inc/customHeader.xsl"/>');
    },
  );

  it('the header imports the modules whose functions it calls', () => {
    const header = xslt('inc/customHeader.xsl');
    expect(header).toContain('qd:answer-key()');
    expect(header).toContain('$qd:question-total');
    expect(header).toContain('<xsl:import href="quizAnswerEncoding.xsl"/>');
    expect(header).toContain('<xsl:import href="quizQuestionTotal.xsl"/>');
  });

  it('the header writes the answer key and question total spans', () => {
    const header = xslt('inc/customHeader.xsl');
    expect(header).toContain('id="qd-answer-key"');
    expect(header).toContain('id="qd-question-total"');
  });

  it('the question total reads the map and allows a manual override', () => {
    const total = xslt('inc/quizQuestionTotal.xsl');
    expect(total).toContain('<xsl:param name="input.map.url"');
    expect(total).toContain("oxyf:getParameter('qd-question-total')");
  });
});
