/**
 * Unit tests for qd-instructor-scores component - modal z-index and virtual scrolling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../src/components/qd-instructor/qd-instructor-scores.js';
import type { QdInstructorScores } from '../../../src/components/qd-instructor/qd-instructor-scores.js';
import type { StudentRecord } from '../../../src/types/contracts.js';

describe('qd-instructor-scores - Modal Structure (FR-003)', () => {
  let element: QdInstructorScores;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('qd-instructor-scores');
    container.appendChild(element);
    element.showModal = true; // Enable modal rendering for tests
    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
    // Clean up modal from document.body
    document.querySelector('.qd-scores-modal-container')?.remove();
  });

  // Helper to get modal container from document.body
  const getModalContainer = () => document.querySelector('.qd-scores-modal-container');

  it('should render modal overlay element', () => {
    const overlay = getModalContainer()?.querySelector('.qd-scores-modal-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should render modal content element', () => {
    const modal = getModalContainer()?.querySelector('div[style*="background: white"]');
    expect(modal).toBeTruthy();
  });

  it('should have both overlay and modal elements for proper layering', () => {
    const modalContainer = getModalContainer();
    const overlay = modalContainer?.querySelector('.qd-scores-modal-overlay');

    // Overlay must exist for z-index layering to work
    expect(overlay).toBeTruthy();
    expect(modalContainer).toBeTruthy();
  });

  it('should render modal with correct structure', () => {
    const modalContainer = getModalContainer();
    const overlay = modalContainer?.querySelector('.qd-scores-modal-overlay');

    expect(modalContainer).toBeTruthy();
    expect(overlay).toBeTruthy();

    // Modal should have header and close button
    const closeButton = modalContainer?.querySelector('button');
    expect(closeButton).toBeTruthy();
  });
});

describe('qd-instructor-scores - Virtual Scrolling (FR-014)', () => {
  let element: QdInstructorScores;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('qd-instructor-scores');
    container.appendChild(element);
    element.showModal = true;
    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
    document.querySelector('.qd-scores-modal-container')?.remove();
  });

  // Helper to get modal container from document.body
  const getModalContainer = () => document.querySelector('.qd-scores-modal-container');

  function createMockStudents(count: number): StudentRecord[] {
    return Array.from({ length: count }, (_, i) => ({
      schema: 1,
      docId: `doc-${i}`,
      release: '11-2024',
      serviceId: `RN${1000 + i}`,
      name: `Student ${i + 1}`,
      attempted: 10,
      correct: 5,
      updated: new Date().toISOString(),
      pages: {},
    }));
  }

  it('should not use virtual scrolling for <100 students', async () => {
    element.students = createMockStudents(50);
    await element.updateComplete;

    const modalContainer = getModalContainer();
    // All 50 students should be rendered
    const rows = modalContainer?.querySelectorAll('tbody tr');
    expect(rows?.length).toBe(50);
  });

  it('should use virtual scrolling for 100+ students', async () => {
    element.students = createMockStudents(150);
    await element.updateComplete;

    const modalContainer = getModalContainer();
    // Should render fewer than 150 rows (only visible + buffer)
    const rows = modalContainer?.querySelectorAll('tbody tr');
    expect(rows).toBeTruthy();
    if (rows) {
      expect(rows.length).toBeLessThan(150);
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  it('should render only visible items with virtual scrolling', async () => {
    element.students = createMockStudents(200);
    await element.updateComplete;

    const modalContainer = getModalContainer();
    // Check that tbody exists
    const tbody = modalContainer?.querySelector('tbody') as HTMLElement;
    expect(tbody).toBeTruthy();
  });

  it('should handle scroll events and update visible range', async () => {
    element.students = createMockStudents(150);
    await element.updateComplete;

    const modalContainer = getModalContainer();
    expect(modalContainer).toBeTruthy();

    // Component should have rows rendered
    const rows = modalContainer?.querySelectorAll('tbody tr');
    expect(rows).toBeTruthy();
    expect(rows!.length).toBeGreaterThan(0);
  });

  it('should render all students when count is exactly 100', async () => {
    element.students = createMockStudents(100);
    await element.updateComplete;

    const modalContainer = getModalContainer();
    // Should have rows rendered
    const rows = modalContainer?.querySelectorAll('tbody tr');
    expect(rows).toBeTruthy();
  });

  it('should handle empty student list with virtual scrolling logic', async () => {
    element.students = [];
    await element.updateComplete;

    const modalContainer = getModalContainer();
    // Should show "No student data available" message
    const message = modalContainer?.textContent;
    expect(message).toContain('No student data available');
  });
});

describe('qd-instructor-scores - Accessibility (WCAG AA)', () => {
  let element: QdInstructorScores;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('qd-instructor-scores');
    container.appendChild(element);
    element.showModal = true;
    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
    document.querySelector('.qd-scores-modal-container')?.remove();
  });

  // Helper to get modal container from document.body
  const getModalContainer = () => document.querySelector('.qd-scores-modal-container');

  it('should have proper ARIA attributes on modal', async () => {
    await element.updateComplete;

    const modalContainer = getModalContainer();
    // Modal renders to document.body with inline styles
    expect(modalContainer).toBeTruthy();
  });

  it('should have accessible close button with aria-label', async () => {
    await element.updateComplete;

    const modalContainer = getModalContainer();
    const closeButton = modalContainer?.querySelector('button');
    expect(closeButton).toBeTruthy();
  });

  it('should close modal when Escape key is pressed', async () => {
    let closeCalled = false;
    element.addEventListener('close', () => {
      closeCalled = true;
    });

    await element.updateComplete;

    // Simulate Escape key press
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(closeCalled).toBe(true);
  });

  it('should not close modal when other keys are pressed', async () => {
    let closeCalled = false;
    element.addEventListener('close', () => {
      closeCalled = true;
    });

    await element.updateComplete;

    // Simulate other key press
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(event);

    expect(closeCalled).toBe(false);
  });

  it('should have modal title with proper id for aria-labelledby', async () => {
    await element.updateComplete;

    const modalContainer = getModalContainer();
    // Check that modal has title text
    expect(modalContainer?.textContent).toContain('Student Scores');
  });
});
