/**
 * Unit tests for instructor password configuration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getInstructorPasswordHash,
  isInstructorPasswordConfigured,
} from '../../../src/config/instructor-password.js';

describe('getInstructorPasswordHash', () => {
  const ELEMENT_ID = 'instructor.password.hash';
  const VALID_HASH =
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';

  beforeEach(() => {
    // Clean up any existing elements
    const existing = document.getElementById(ELEMENT_ID);
    if (existing) {
      existing.remove();
    }
  });

  afterEach(() => {
    // Clean up after each test
    const existing = document.getElementById(ELEMENT_ID);
    if (existing) {
      existing.remove();
    }
  });

  it('should retrieve password hash from DOM', () => {
    // Create element with valid hash
    const span = document.createElement('span');
    span.id = ELEMENT_ID;
    span.style.display = 'none';
    span.textContent = VALID_HASH;
    document.body.appendChild(span);

    const hash = getInstructorPasswordHash();
    expect(hash).toBe(VALID_HASH);
  });

  it('should normalize hash to lowercase', () => {
    const upperHash = VALID_HASH.toUpperCase();

    const span = document.createElement('span');
    span.id = ELEMENT_ID;
    span.textContent = upperHash;
    document.body.appendChild(span);

    const hash = getInstructorPasswordHash();
    expect(hash).toBe(VALID_HASH); // Should be lowercased
  });

  it('should trim whitespace from hash', () => {
    const span = document.createElement('span');
    span.id = ELEMENT_ID;
    span.textContent = `  ${VALID_HASH}  \n`;
    document.body.appendChild(span);

    const hash = getInstructorPasswordHash();
    expect(hash).toBe(VALID_HASH);
  });

  it('should throw error when element not found', () => {
    expect(() => getInstructorPasswordHash()).toThrow(
      /Instructor password hash not found/
    );
  });

  it('should throw error when element is empty', () => {
    const span = document.createElement('span');
    span.id = ELEMENT_ID;
    span.textContent = '';
    document.body.appendChild(span);

    expect(() => getInstructorPasswordHash()).toThrow(/element is empty/);
  });

  it('should throw error when hash format is invalid (too short)', () => {
    const span = document.createElement('span');
    span.id = ELEMENT_ID;
    span.textContent = 'abc123'; // Not 64 characters
    document.body.appendChild(span);

    expect(() => getInstructorPasswordHash()).toThrow(/Invalid password hash format/);
  });

  it('should throw error when hash format is invalid (non-hex)', () => {
    const span = document.createElement('span');
    span.id = ELEMENT_ID;
    span.textContent = 'z'.repeat(64); // Not hex characters
    document.body.appendChild(span);

    expect(() => getInstructorPasswordHash()).toThrow(/Invalid password hash format/);
  });

  it('should accept mixed-case hex', () => {
    const mixedCaseHash =
      '5E884898da28047151d0e56f8DC6292773603d0d6aabbdd62a11ef721d1542d8';

    const span = document.createElement('span');
    span.id = ELEMENT_ID;
    span.textContent = mixedCaseHash;
    document.body.appendChild(span);

    const hash = getInstructorPasswordHash();
    expect(hash).toBe(VALID_HASH); // Normalized to lowercase
  });
});

describe('isInstructorPasswordConfigured', () => {
  const ELEMENT_ID = 'instructor.password.hash';
  const VALID_HASH =
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';

  beforeEach(() => {
    const existing = document.getElementById(ELEMENT_ID);
    if (existing) {
      existing.remove();
    }
  });

  afterEach(() => {
    const existing = document.getElementById(ELEMENT_ID);
    if (existing) {
      existing.remove();
    }
  });

  it('should return true when password is configured', () => {
    const span = document.createElement('span');
    span.id = ELEMENT_ID;
    span.textContent = VALID_HASH;
    document.body.appendChild(span);

    expect(isInstructorPasswordConfigured()).toBe(true);
  });

  it('should return false when element not found', () => {
    expect(isInstructorPasswordConfigured()).toBe(false);
  });

  it('should return false when element is empty', () => {
    const span = document.createElement('span');
    span.id = ELEMENT_ID;
    span.textContent = '';
    document.body.appendChild(span);

    expect(isInstructorPasswordConfigured()).toBe(false);
  });

  it('should return false when hash format is invalid', () => {
    const span = document.createElement('span');
    span.id = ELEMENT_ID;
    span.textContent = 'invalid-hash';
    document.body.appendChild(span);

    expect(isInstructorPasswordConfigured()).toBe(false);
  });
});
