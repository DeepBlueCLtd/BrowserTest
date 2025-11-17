/**
 * Unit tests for qd-instructor-unlock component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../../../src/components/qd-instructor/qd-instructor-unlock.js';
import type { QdInstructorUnlock } from '../../../../src/components/qd-instructor/qd-instructor-unlock.js';

describe('qd-instructor-unlock', () => {
  let element: QdInstructorUnlock;
  let container: HTMLDivElement;

  beforeEach(async () => {
    // Set env var for password
    vi.stubEnv('VITE_INSTRUCTOR_PASSWORD_HASH', 'abc123');

    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('qd-instructor-unlock');
    container.appendChild(element);

    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
  });

  describe('rendering', () => {
    it('should render password form', () => {
      const form = element.shadowRoot?.querySelector('form');
      expect(form).toBeTruthy();
    });

    it('should render password input', () => {
      const input = element.shadowRoot?.querySelector('input[type="password"]');
      expect(input).toBeTruthy();
    });

    it('should render submit button', () => {
      const button = element.shadowRoot?.querySelector('button[type="submit"]');
      expect(button).toBeTruthy();
    });
  });

  describe('password input', () => {
    it('should update password state on input', async () => {
      const input = element.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
      input.value = 'test123';
      input.dispatchEvent(new Event('input'));
      await element.updateComplete;

      expect(element['password']).toBe('test123');
    });

    it('should clear error on input', async () => {
      element['error'] = 'Invalid password';
      await element.updateComplete;

      const input = element.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
      input.value = 'test123';
      input.dispatchEvent(new Event('input'));
      await element.updateComplete;

      expect(element['error']).toBe('');
    });
  });

  describe('submit button state', () => {
    it('should disable button when password empty', async () => {
      const button = element.shadowRoot?.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should enable button when password entered', async () => {
      element['password'] = 'test123';
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });
  });

  describe('rate limiting', () => {
    it('should show countdown when locked', async () => {
      element['remainingSeconds'] = 5;
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.textContent).toContain('Locked (5s)');
      expect(button.disabled).toBe(true);
    });

    it('should display error message when locked', async () => {
      element['remainingSeconds'] = 10;
      element['error'] = 'Too many attempts. Try again in 10s';
      await element.updateComplete;

      const error = element.shadowRoot?.querySelector('.error');
      expect(error?.textContent).toContain('Too many attempts');
    });
  });

  describe('accessibility', () => {
    it('should have autocomplete attribute', () => {
      const input = element.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
      expect(input.autocomplete).toBe('current-password');
    });

    it('should have required attribute', () => {
      const input = element.shadowRoot?.querySelector('input[type="password"]') as HTMLInputElement;
      expect(input.required).toBe(true);
    });
  });
});
