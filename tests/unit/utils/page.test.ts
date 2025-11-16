/**
 * Tests for Page ID Extraction Utility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { getPageId } from '../../../src/utils/page';

describe('Page ID Extraction', () => {
  let dom: JSDOM;

  beforeEach(() => {
    // Create a fresh JSDOM instance for each test
    dom = new JSDOM('<!DOCTYPE html><html><head><title></title></head><body></body></html>');
    global.document = dom.window.document as unknown as Document;
  });

  describe('getPageId()', () => {
    it('should extract page ID from document.title', () => {
      document.title = 'Quiz Table Examples - Sonar Quiz System';
      const pageId = getPageId();
      expect(pageId).toBe('Quiz Table Examples - Sonar Quiz System');
    });

    it('should extract page ID from simple title', () => {
      document.title = 'Sonar Basics';
      const pageId = getPageId();
      expect(pageId).toBe('Sonar Basics');
    });

    it('should trim whitespace from title', () => {
      document.title = '  Analysis Table Examples  ';
      const pageId = getPageId();
      expect(pageId).toBe('Analysis Table Examples');
    });

    it('should return "unknown-page" for empty title', () => {
      document.title = '';
      const pageId = getPageId();
      expect(pageId).toBe('unknown-page');
    });

    it('should return "unknown-page" for whitespace-only title', () => {
      document.title = '   ';
      const pageId = getPageId();
      expect(pageId).toBe('unknown-page');
    });

    it('should handle complex titles with special characters', () => {
      document.title = 'Field Manual Pub-10 Mar 2025 - Section 4.2.1';
      const pageId = getPageId();
      expect(pageId).toBe('Field Manual Pub-10 Mar 2025 - Section 4.2.1');
    });

    it('should handle titles with numbers and symbols', () => {
      document.title = 'Chapter 3: Active Sonar & Passive Detection (v2.1)';
      const pageId = getPageId();
      expect(pageId).toBe('Chapter 3: Active Sonar & Passive Detection (v2.1)');
    });
  });
});
