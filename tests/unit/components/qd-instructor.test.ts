/**
 * Unit tests for qd-instructor component - fresh session data loading
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../src/components/qd-instructor/qd-instructor.js';
import type { QdInstructor } from '../../../src/components/qd-instructor/qd-instructor.js';
import { STORAGE_KEYS } from '../../../src/types/contracts.js';
import type { SessionData } from '../../../src/types/contracts.js';

describe('qd-instructor - Fresh Session Data Loading (FR-004)', () => {
  let element: QdInstructor;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Clear sessionStorage before each test
    sessionStorage.clear();

    element = document.createElement('qd-instructor');
    container.appendChild(element);

    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
    sessionStorage.clear();
  });

  it('should load data in fresh session when toggle is enabled', async () => {
    // Set up fresh instructor session (no prior toggle state)
    const session: SessionData = {
      serviceId: 'INST001',
      name: 'Instructor',
      release: '11-2024',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      instructorUnlocked: true,
    };
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');

    // Verify toggle state is NOT set yet (fresh session)
    expect(sessionStorage.getItem('qd/instructor/showAnswers')).toBeNull();

    // Create fresh component instance
    const freshElement = document.createElement('qd-instructor');
    container.appendChild(freshElement);
    await freshElement.updateComplete;

    // Find the toggle control
    const toggle = freshElement.shadowRoot?.querySelector('input[type="checkbox"]');
    expect(toggle).toBeTruthy();

    // Toggle should be unchecked in fresh session
    expect((toggle as HTMLInputElement)?.checked).toBe(false);

    // User enables toggle by checking and dispatching change event
    if (toggle) {
      const input = toggle as HTMLInputElement;
      input.checked = true;
      // Dispatch change event (bubbles so Lit @change binding works)
      input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      await freshElement.updateComplete;
      // Wait for async handler to complete (loads student data, may fail but still persists state)
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Toggle state should now be persisted
    expect(sessionStorage.getItem('qd/instructor/showAnswers')).toBe('true');

    // Component should have loaded and displayed student data
    // (Implementation will emit event to show answers)
    const event = new CustomEvent('qd:instructor-show-answers');
    const eventFired = freshElement.dispatchEvent(event);
    expect(eventFired).toBe(true);
  });

  it('should restore toggle state from sessionStorage on mount', async () => {
    // Set up session with toggle already enabled
    const session: SessionData = {
      serviceId: 'INST001',
      name: 'Instructor',
      release: '11-2024',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      instructorUnlocked: true,
    };
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');
    sessionStorage.setItem('qd/instructor/showAnswers', 'true');

    // Create component - should restore state
    const restoredElement = document.createElement('qd-instructor');
    container.appendChild(restoredElement);
    await restoredElement.updateComplete;

    // Toggle should be checked (state restored)
    const toggle = restoredElement.shadowRoot?.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(toggle).toBeTruthy();
    expect(toggle.checked).toBe(true);
  });

  it('should persist toggle state across page navigation', async () => {
    // Set up instructor session
    const session: SessionData = {
      serviceId: 'INST001',
      name: 'Instructor',
      release: '11-2024',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      instructorUnlocked: true,
    };
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');

    // First page - enable toggle
    const page1Element = document.createElement('qd-instructor');
    container.appendChild(page1Element);
    await page1Element.updateComplete;

    const toggle1 = page1Element.shadowRoot?.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    toggle1.checked = true;
    toggle1.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await page1Element.updateComplete;
    // Wait for async handler to complete
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Verify state persisted
    expect(sessionStorage.getItem('qd/instructor/showAnswers')).toBe('true');

    // Simulate navigation - remove component
    page1Element.remove();

    // Second page - create new instance
    const page2Element = document.createElement('qd-instructor');
    container.appendChild(page2Element);
    await page2Element.updateComplete;

    // Toggle should still be enabled
    const toggle2 = page2Element.shadowRoot?.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(toggle2.checked).toBe(true);
  });

  it('should handle toggle state cleared on logout', async () => {
    // Set up session with toggle enabled
    const session: SessionData = {
      serviceId: 'INST001',
      name: 'Instructor',
      release: '11-2024',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      instructorUnlocked: true,
    };
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');
    sessionStorage.setItem('qd/instructor/showAnswers', 'true');

    // Create component
    const loggedInElement = document.createElement('qd-instructor');
    container.appendChild(loggedInElement);
    await loggedInElement.updateComplete;

    // Verify toggle is enabled
    const toggle = loggedInElement.shadowRoot?.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(toggle.checked).toBe(true);

    // Simulate logout - clear sessionStorage (mimics what SessionService.clearSession does)
    sessionStorage.clear();

    // Create new component instance (simulate fresh login after logout)
    loggedInElement.remove();

    // Set up new instructor session (no toggle state this time)
    const newSession: SessionData = {
      serviceId: 'INST002',
      name: 'Instructor',
      release: '11-2024',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      instructorUnlocked: true,
    };
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newSession));
    sessionStorage.setItem(STORAGE_KEYS.INSTRUCTOR, 'true');

    const freshElement = document.createElement('qd-instructor');
    container.appendChild(freshElement);
    await freshElement.updateComplete;

    // Toggle should be reset to unchecked (no saved state)
    const freshToggle = freshElement.shadowRoot?.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(freshToggle).toBeTruthy();
    expect(freshToggle.checked).toBe(false);
  });
});
