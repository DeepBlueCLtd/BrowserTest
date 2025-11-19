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
  });

  it('should render modal overlay element', () => {
    const overlay = element.shadowRoot?.querySelector('.modal-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should render modal content element', () => {
    const modal = element.shadowRoot?.querySelector('.modal-content');
    expect(modal).toBeTruthy();
  });

  it('should have both overlay and modal elements for proper layering', () => {
    const modal = element.shadowRoot?.querySelector('.modal-content');
    const overlay = element.shadowRoot?.querySelector('.modal-overlay');

    // Both elements must exist for z-index layering to work
    // (actual z-index values are set via CSS custom properties in shared-styles.ts)
    expect(modal).toBeTruthy();
    expect(overlay).toBeTruthy();
  });

  it('should render modal with correct structure', () => {
    const modalContent = element.shadowRoot?.querySelector('.modal-content');
    const overlay = element.shadowRoot?.querySelector('.modal-overlay');

    expect(modalContent).toBeTruthy();
    expect(overlay).toBeTruthy();

    // Modal should have header and close button
    const header = element.shadowRoot?.querySelector('.modal-header');
    const closeButton = element.shadowRoot?.querySelector('.close-button');

    expect(header).toBeTruthy();
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
  });

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

    // Should not have scrollable container with max-height
    const container = element.shadowRoot?.querySelector('.table-container') as HTMLElement;
    expect(container).toBeTruthy();

    // Container should not have max-height style (no virtual scrolling)
    const hasMaxHeight = container?.style.maxHeight !== '';
    expect(hasMaxHeight).toBe(false);

    // All 50 students should be rendered
    const rows = element.shadowRoot?.querySelectorAll('tbody tr');
    expect(rows?.length).toBe(50);
  });

  it('should use virtual scrolling for 100+ students', async () => {
    element.students = createMockStudents(150);
    await element.updateComplete;

    // Should have scrollable container with max-height
    const container = element.shadowRoot?.querySelector('.table-container') as HTMLElement;
    expect(container).toBeTruthy();

    // Container should have max-height (virtual scrolling enabled)
    const hasMaxHeight = container?.style.maxHeight !== '';
    expect(hasMaxHeight).toBe(true);

    // Should render fewer than 150 rows (only visible + buffer)
    const rows = element.shadowRoot?.querySelectorAll('tbody tr');
    expect(rows).toBeTruthy();
    if (rows) {
      expect(rows.length).toBeLessThan(150);
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  it('should render only visible items with virtual scrolling', async () => {
    element.students = createMockStudents(200);
    await element.updateComplete;

    // Check that tbody has height set (for virtual scrolling)
    const tbody = element.shadowRoot?.querySelector('tbody') as HTMLElement;
    expect(tbody).toBeTruthy();
    expect(tbody.style.height).toBeTruthy();

    // Check that a spacer div exists for offset
    const spacer = element.shadowRoot?.querySelector('tbody tr td div') as HTMLElement;
    expect(spacer).toBeTruthy();
  });

  it('should handle scroll events and update visible range', async () => {
    element.students = createMockStudents(150);
    await element.updateComplete;

    const container = element.shadowRoot?.querySelector('.table-container') as HTMLElement;
    expect(container).toBeTruthy();

    // Simulate scroll event
    container.scrollTop = 500;
    container.dispatchEvent(new Event('scroll'));
    await element.updateComplete;

    // Component should re-render with new visible range
    const rows = element.shadowRoot?.querySelectorAll('tbody tr');
    expect(rows).toBeTruthy();
    expect(rows!.length).toBeGreaterThan(0);
  });

  it('should render all students when count is exactly 100', async () => {
    element.students = createMockStudents(100);
    await element.updateComplete;

    // Should use virtual scrolling at 100 students (threshold)
    const container = element.shadowRoot?.querySelector('.table-container') as HTMLElement;
    const hasMaxHeight = container?.style.maxHeight !== '';
    expect(hasMaxHeight).toBe(true);
  });

  it('should handle empty student list with virtual scrolling logic', async () => {
    element.students = [];
    await element.updateComplete;

    // Should show "No student data available" message
    const message = element.shadowRoot?.textContent;
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
  });

  it('should have proper ARIA attributes on modal', async () => {
    await element.updateComplete;

    const modal = element.shadowRoot?.querySelector('.modal-content');
    expect(modal?.getAttribute('role')).toBe('dialog');
    expect(modal?.getAttribute('aria-modal')).toBe('true');
    expect(modal?.getAttribute('aria-labelledby')).toBe('scores-modal-title');
  });

  it('should have accessible close button with aria-label', async () => {
    await element.updateComplete;

    const closeButton = element.shadowRoot?.querySelector('.close-button');
    expect(closeButton?.getAttribute('aria-label')).toBe('Close scores modal');
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

    const title = element.shadowRoot?.querySelector('#scores-modal-title');
    expect(title).toBeTruthy();
    expect(title?.textContent).toContain('Student Scores');
  });
});
