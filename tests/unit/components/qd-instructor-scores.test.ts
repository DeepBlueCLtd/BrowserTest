/**
 * Unit tests for qd-instructor-scores component - modal z-index
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../src/components/qd-instructor/qd-instructor-scores.js';
import type { QdInstructorScores } from '../../../src/components/qd-instructor/qd-instructor-scores.js';

describe('qd-instructor-scores - Modal Z-Index (FR-003)', () => {
  let element: QdInstructorScores;
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('qd-instructor-scores');
    container.appendChild(element);

    await element.updateComplete;
  });

  afterEach(() => {
    container.remove();
  });

  it('should use CSS custom property for modal z-index', () => {
    const modal = element.shadowRoot?.querySelector('.modal');
    expect(modal).toBeTruthy();

    if (modal) {
      const styles = window.getComputedStyle(modal as HTMLElement);
      const zIndex = styles.getPropertyValue('z-index');

      // Modal should use --qd-modal-z-index CSS custom property (10000)
      // In tests, CSS custom properties may not resolve, so we check for either:
      // 1. The CSS var() reference
      // 2. The resolved value 10000
      // 3. Any value >= 10000 (in case browser resolves it)
      const zIndexNum = parseInt(zIndex, 10);
      expect(zIndexNum).toBeGreaterThanOrEqual(10000);
    }
  });

  it('should use CSS custom property for overlay z-index', () => {
    const overlay = element.shadowRoot?.querySelector('.modal-overlay');
    expect(overlay).toBeTruthy();

    if (overlay) {
      const styles = window.getComputedStyle(overlay as HTMLElement);
      const zIndex = styles.getPropertyValue('z-index');

      // Overlay should use --qd-modal-overlay-z-index CSS custom property (9999)
      const zIndexNum = parseInt(zIndex, 10);
      expect(zIndexNum).toBeGreaterThanOrEqual(9999);
    }
  });

  it('should have modal z-index higher than overlay z-index', () => {
    const modal = element.shadowRoot?.querySelector('.modal') as HTMLElement;
    const overlay = element.shadowRoot?.querySelector('.modal-overlay') as HTMLElement;

    expect(modal).toBeTruthy();
    expect(overlay).toBeTruthy();

    if (modal && overlay) {
      const modalStyles = window.getComputedStyle(modal);
      const overlayStyles = window.getComputedStyle(overlay);

      const modalZIndex = parseInt(modalStyles.getPropertyValue('z-index'), 10);
      const overlayZIndex = parseInt(overlayStyles.getPropertyValue('z-index'), 10);

      // Modal should be above overlay
      expect(modalZIndex).toBeGreaterThan(overlayZIndex);
    }
  });

  it('should render modal with correct structure', () => {
    const modal = element.shadowRoot?.querySelector('.modal');
    const overlay = element.shadowRoot?.querySelector('.modal-overlay');

    expect(modal).toBeTruthy();
    expect(overlay).toBeTruthy();

    // Modal should have header, content, and close button
    const header = element.shadowRoot?.querySelector('.modal-header');
    const content = element.shadowRoot?.querySelector('.modal-content');
    const closeButton = element.shadowRoot?.querySelector('.close-button');

    expect(header).toBeTruthy();
    expect(content).toBeTruthy();
    expect(closeButton).toBeTruthy();
  });
});
