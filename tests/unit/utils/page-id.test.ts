/**
 * Unit tests for page-id extraction utility
 */

import { describe, it, expect } from 'vitest';
import { getPageIdFromUrl } from '../../../src/utils/page-id.js';

describe('getPageIdFromUrl', () => {
  it('extracts the page id from a root-level filename', () => {
    expect(getPageIdFromUrl('/quiz-index.html')).toBe('quiz-index');
  });

  it('extracts the page id from a nested path', () => {
    expect(getPageIdFromUrl('/training/topics/gram-1.html')).toBe('gram-1');
  });

  it('ignores a query string', () => {
    expect(getPageIdFromUrl('/topics/gram-1.html?attempt=2')).toBe('gram-1');
  });

  it('ignores a hash fragment', () => {
    expect(getPageIdFromUrl('/topics/gram-1.html#question-3')).toBe('gram-1');
  });

  it('ignores both query string and hash fragment', () => {
    expect(getPageIdFromUrl('gram-1.html?x=1#top')).toBe('gram-1');
  });

  it('strips a .htm extension as well as .html', () => {
    expect(getPageIdFromUrl('/legacy/gram-1.htm')).toBe('gram-1');
  });

  it('returns the filename unchanged when there is no .html extension', () => {
    expect(getPageIdFromUrl('/topics/gram-1')).toBe('gram-1');
  });

  it('returns an empty string for a trailing-slash path', () => {
    expect(getPageIdFromUrl('/topics/')).toBe('');
  });

  it('handles a bare filename with no leading slash', () => {
    expect(getPageIdFromUrl('analysis-examples.html')).toBe('analysis-examples');
  });
});
