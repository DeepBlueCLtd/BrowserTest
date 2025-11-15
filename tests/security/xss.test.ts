/**
 * Tests for XSS prevention in quiz content
 *
 * Security requirement: All user-generated or dynamic content must be
 * properly sanitized to prevent script injection attacks.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '../../src/utils/dom-sanitizer';

describe('XSS Prevention', () => {
  describe('Quiz content sanitization', () => {
    it('should prevent XSS in quiz question text', () => {
      const maliciousQuestion = '<script>alert("XSS")</script>What is 2+2?';
      const sanitized = sanitizeInput(maliciousQuestion);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).toContain('What is 2+2?');
    });

    it('should prevent XSS in answer options', () => {
      const maliciousAnswer = '<img src=x onerror="alert(1)">Option A';
      const sanitized = sanitizeInput(maliciousAnswer);

      // Angle brackets must be escaped - this prevents code execution
      expect(sanitized).not.toContain('<img');
      expect(sanitized).toContain('&lt;img');
      expect(sanitized).toContain('Option A');
      // Result is safe - all HTML is escaped
      expect(sanitized).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;Option A');
    });

    it('should prevent XSS in answer details', () => {
      const maliciousDetail = '<a href="javascript:void(0)" onclick="alert(1)">Click here</a>';
      const sanitized = sanitizeInput(maliciousDetail);

      // Angle brackets must be escaped
      expect(sanitized).not.toContain('<a');
      expect(sanitized).toContain('&lt;a');
      // Result is safe - all HTML is escaped
      expect(sanitized).toBe('&lt;a href=&quot;javascript:void(0)&quot; onclick=&quot;alert(1)&quot;&gt;Click here&lt;&#x2F;a&gt;');
    });

    it('should prevent XSS in correct answer reveal', () => {
      const maliciousAnswer = 'The answer is <svg/onload=alert(1)>';
      const sanitized = sanitizeInput(maliciousAnswer);

      // Angle brackets must be escaped
      expect(sanitized).not.toContain('<svg');
      expect(sanitized).toContain('&lt;svg');
      // Result is safe - all HTML is escaped
      expect(sanitized).toBe('The answer is &lt;svg&#x2F;onload=alert(1)&gt;');
    });

    it('should handle mixed content safely', () => {
      const mixedContent = 'Normal text <b>bold</b> and <script>bad()</script>';
      const sanitized = sanitizeInput(mixedContent);

      // All HTML should be escaped
      expect(sanitized).not.toContain('<b>');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;b&gt;');
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).toContain('Normal text');
    });

    it('should prevent data URI attacks', () => {
      const dataUri = '<img src="data:text/html,<script>alert(1)</script>">';
      const sanitized = sanitizeInput(dataUri);

      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('src="data:');
      expect(sanitized).toContain('&lt;img');
    });

    it('should prevent event handler injection', () => {
      const handlers = [
        '<div onload="alert(1)">',
        '<img onerror="alert(1)">',
        '<body onpageshow="alert(1)">',
        '<input onfocus="alert(1)">',
      ];

      handlers.forEach(malicious => {
        const sanitized = sanitizeInput(malicious);
        // Key check: no actual HTML tags (all escaped)
        expect(sanitized).not.toContain('<div');
        expect(sanitized).not.toContain('<img');
        expect(sanitized).not.toContain('<body');
        expect(sanitized).not.toContain('<input');
        // All should start with &lt; (escaped <)
        expect(sanitized).toMatch(/^&lt;/);
      });
    });

    it('should preserve legitimate mathematical expressions', () => {
      const mathExpression = '2 + 2 = 4, 3 < 5, 10 > 8';
      const sanitized = sanitizeInput(mathExpression);

      // Mathematical operators should be escaped but content preserved
      expect(sanitized).toContain('2 + 2 = 4');
      expect(sanitized).toContain('&lt;'); // < escaped
      expect(sanitized).toContain('&gt;'); // > escaped
    });
  });

  describe('Validation error sanitization', () => {
    it('should prevent XSS in validation error messages', () => {
      const maliciousError = 'Invalid input: <img src=x onerror=alert(1)>';
      const sanitized = sanitizeInput(maliciousError);

      expect(sanitized).not.toContain('<img');
      expect(sanitized).toContain('Invalid input:');
      expect(sanitized).toContain('&lt;img');
    });

    it('should handle error messages with special characters', () => {
      const errorWithSpecialChars = 'Value must be > 0 and < 100';
      const sanitized = sanitizeInput(errorWithSpecialChars);

      expect(sanitized).toContain('Value must be');
      expect(sanitized).toContain('&gt;');
      expect(sanitized).toContain('&lt;');
    });

    it('should sanitize user-provided values in error messages', () => {
      const userValue = '<script>alert("XSS")</script>';
      const errorMessage = `Invalid value: ${userValue}`;
      const sanitized = sanitizeInput(errorMessage);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });
  });

  describe('Analysis table content sanitization', () => {
    it('should prevent XSS in editable cell content', () => {
      const maliciousContent = 'My answer: <iframe src="evil.com"></iframe>';
      const sanitized = sanitizeInput(maliciousContent);

      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).toContain('&lt;iframe');
      expect(sanitized).toContain('My answer:');
    });

    it('should handle multi-line content safely', () => {
      const multiLine = 'Line 1\n<script>alert(1)</script>\nLine 3';
      const sanitized = sanitizeInput(multiLine);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Line 1');
      expect(sanitized).toContain('Line 3');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle strings with only whitespace', () => {
      const whitespace = '   \n\t  ';
      expect(sanitizeInput(whitespace)).toBe(whitespace);
    });

    it('should handle very long strings efficiently', () => {
      const longString = 'a'.repeat(10000) + '<script>alert(1)</script>';
      const sanitized = sanitizeInput(longString);

      expect(sanitized.length).toBeGreaterThan(10000);
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle unicode and emoji', () => {
      const unicode = '你好 🌍 <script>alert(1)</script>';
      const sanitized = sanitizeInput(unicode);

      expect(sanitized).toContain('你好');
      expect(sanitized).toContain('🌍');
      expect(sanitized).not.toContain('<script>');
    });
  });
});
