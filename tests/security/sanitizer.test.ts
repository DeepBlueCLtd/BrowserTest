/**
 * Tests for DOM sanitization utilities
 *
 * Security requirement: Prevent XSS attacks by sanitizing all user input
 * before inserting into the DOM.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeInput, createSafeElement } from '../../src/utils/dom-sanitizer';

describe('sanitizeInput', () => {
  it('should escape HTML tags', () => {
    const input = '<script>alert("XSS")</script>';
    const result = sanitizeInput(input);
    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('should escape HTML entities', () => {
    const input = '<b>Bold</b> & <i>Italic</i>';
    const result = sanitizeInput(input);
    expect(result).toBe('&lt;b&gt;Bold&lt;&#x2F;b&gt; &amp; &lt;i&gt;Italic&lt;&#x2F;i&gt;');
  });

  it('should handle quotes', () => {
    const input = 'Say "hello" and \'goodbye\'';
    const result = sanitizeInput(input);
    expect(result).toContain('&quot;');
    expect(result).toContain('&#x27;');
  });

  it('should handle empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('should handle plain text unchanged (except entities)', () => {
    const input = 'Plain text with no special chars';
    const result = sanitizeInput(input);
    expect(result).toBe(input);
  });

  it('should prevent XSS via event handlers', () => {
    const input = '<img src=x onerror="alert(1)">';
    const result = sanitizeInput(input);
    // Angle brackets should be escaped
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
    // Result is safe - no executable code
    expect(result).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  it('should prevent XSS via javascript: protocol', () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeInput(input);
    // Angle brackets should be escaped
    expect(result).not.toContain('<a');
    expect(result).toContain('&lt;a');
    // Result is safe - no executable code
    expect(result).toBe('&lt;a href=&quot;javascript:alert(1)&quot;&gt;Click&lt;&#x2F;a&gt;');
  });

  it('should handle unicode characters', () => {
    const input = 'Hello 世界 🌍';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello 世界 🌍');
  });

  it('should handle newlines and whitespace', () => {
    const input = 'Line 1\nLine 2\tTabbed';
    const result = sanitizeInput(input);
    expect(result).toBe('Line 1\nLine 2\tTabbed');
  });
});

describe('createSafeElement', () => {
  it('should create element with safe text content', () => {
    const el = createSafeElement('div', '<script>alert("XSS")</script>');
    expect(el.tagName).toBe('DIV');
    expect(el.textContent).toBe('<script>alert("XSS")</script>');
    expect(el.innerHTML).not.toContain('<script>');
  });

  it('should create span by default', () => {
    const el = createSafeElement(undefined, 'Test');
    expect(el.tagName).toBe('SPAN');
    expect(el.textContent).toBe('Test');
  });

  it('should apply className if provided', () => {
    const el = createSafeElement('div', 'Test', 'my-class');
    expect(el.className).toBe('my-class');
  });

  it('should prevent script execution', () => {
    const el = createSafeElement('div', '<img src=x onerror="alert(1)">');
    document.body.appendChild(el);
    // textContent contains the raw input (treated as text)
    expect(el.textContent).toBe('<img src=x onerror="alert(1)">');
    // innerHTML has HTML-escaped version (safe to display)
    expect(el.innerHTML).toContain('&lt;img');
    expect(el.innerHTML).not.toContain('<img'); // No actual img tag
    document.body.removeChild(el);
  });

  it('should handle empty content', () => {
    const el = createSafeElement('div', '');
    expect(el.textContent).toBe('');
  });
});
