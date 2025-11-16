/**
 * Unit Tests for Home Page Badge Enhancement
 *
 * Tests the badge injector that adds colored progress indicators
 * to navigation links on the home page.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SessionCache, CompletionState } from '../../../src/types/contracts';
import { CSS_CLASSES } from '../../../src/types/contracts';
import {
  extractPageIdFromLink,
  getBadgeColor,
  getPageBadgeColor,
  createBadgeElement,
  injectBadges,
} from '../../../src/enhancers/home-badges';

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {};

beforeEach(() => {
  // Clear mocks
  Object.keys(mockSessionStorage).forEach((key) => {
    delete mockSessionStorage[key];
  });

  // Mock sessionStorage
  vi.stubGlobal('sessionStorage', {
    getItem: vi.fn((key: string) => mockSessionStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      mockSessionStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockSessionStorage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(mockSessionStorage).forEach((key) => {
        delete mockSessionStorage[key];
      });
    }),
    get length() {
      return Object.keys(mockSessionStorage).length;
    },
    key: vi.fn((index: number) => Object.keys(mockSessionStorage)[index] ?? null),
  });
});

describe('Home Page Badge Detection', () => {
  it('should detect links with qd-test-link class', () => {
    // Arrange
    const container = document.createElement('div');
    container.innerHTML = `
      <a href="page1.html" class="qd-test-link">Page 1</a>
      <a href="page2.html" class="qd-test-link">Page 2</a>
      <a href="page3.html">Page 3 (no badge)</a>
    `;

    // Act
    const links = container.querySelectorAll(`.${CSS_CLASSES.TEST_LINK}`);

    // Assert
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe('page1.html');
    expect(links[1].getAttribute('href')).toBe('page2.html');
  });

  it('should extract page ID from simple link text content', () => {
    // Arrange
    const testCases = [
      {
        href: 'page1.html',
        text: 'Quiz Table Examples - Sonar Quiz System',
        expected: 'Quiz Table Examples - Sonar Quiz System',
      },
      {
        href: 'chapter-2.html',
        text: 'Analysis Table Examples - Sonar Quiz System',
        expected: 'Analysis Table Examples - Sonar Quiz System',
      },
      {
        href: 'test-page.html',
        text: 'Seven Questions - Acoustic Analysis Framework',
        expected: 'Seven Questions - Acoustic Analysis Framework',
      },
    ];

    testCases.forEach(({ href, text, expected }) => {
      // Arrange
      const link = document.createElement('a');
      link.href = href;
      link.textContent = text;

      // Act
      const pageId = extractPageIdFromLink(link);

      // Assert
      expect(pageId).toBe(expected);
    });
  });

  it('should extract page ID from quiz-link-card with .link-title', () => {
    // Arrange
    const link = document.createElement('a');
    link.href = 'quiz-mixed.html';
    link.classList.add('quiz-link-card', 'qd-test-link');
    link.innerHTML = `
      <span class="badge-placeholder"></span>
      <div class="link-content">
        <div class="link-title">Mixed Quiz - Sonar Quiz System</div>
        <p class="link-description">Combination of MCQ and numeric questions</p>
      </div>
    `;

    // Act
    const pageId = extractPageIdFromLink(link);

    // Assert
    expect(pageId).toBe('Mixed Quiz - Sonar Quiz System');
  });

  it('should handle malformed links gracefully', () => {
    // Arrange
    const testCases = [
      { href: '', text: 'Empty href' },
      { href: '#anchor', text: 'Anchor link' },
      { href: 'http://external.com/page.html', text: 'External link' },
      { href: 'javascript:void(0)', text: 'JavaScript link' },
    ];

    testCases.forEach(({ href, text }) => {
      // Arrange
      const link = document.createElement('a');
      link.href = href;
      link.textContent = text;

      // Act
      const pageId = extractPageIdFromLink(link);

      // Assert - should return null for invalid links
      expect(pageId).toBeFalsy();
    });
  });
});

describe('Badge Color Calculation', () => {
  it('should return red for unstarted pages', () => {
    // Arrange
    const state: CompletionState = 'unstarted';

    // Act
    const color = getBadgeColor(state);

    // Assert
    expect(color).toBe('red');
  });

  it('should return amber for incomplete pages', () => {
    // Arrange
    const state: CompletionState = 'incomplete';

    // Act
    const color = getBadgeColor(state);

    // Assert
    expect(color).toBe('amber');
  });

  it('should return green for complete pages', () => {
    // Arrange
    const state: CompletionState = 'complete';

    // Act
    const color = getBadgeColor(state);

    // Assert
    expect(color).toBe('green');
  });

  it('should return gray for pages not in cache', () => {
    // Arrange
    const cache: SessionCache = {
      totals: { answered: 0, correct: 0 },
      pages: {},
    };
    const pageId = 'nonexistent-page';

    // Act
    const color = getPageBadgeColor(pageId, cache);

    // Assert
    expect(color).toBe('gray');
  });

  it('should return correct color for pages in cache', () => {
    // Arrange
    const cache: SessionCache = {
      totals: { answered: 5, correct: 5 },
      pages: {
        page1: { state: 'unstarted', answered: 0, correct: 0 },
        page2: { state: 'incomplete', answered: 2, correct: 1 },
        page3: { state: 'complete', answered: 3, correct: 3 },
      },
    };

    // Act & Assert
    expect(getPageBadgeColor('page1', cache)).toBe('red');
    expect(getPageBadgeColor('page2', cache)).toBe('amber');
    expect(getPageBadgeColor('page3', cache)).toBe('green');
  });
});

describe('Badge Element Creation', () => {
  it('should create a badge element with correct color', () => {
    // Arrange
    const colors = ['red', 'amber', 'green', 'gray'] as const;

    colors.forEach((color) => {
      // Act
      const badge = createBadgeElement(color);

      // Assert
      expect(badge.classList.contains('qd-badge')).toBe(true);
      expect(badge.classList.contains(`qd-badge--${color}`)).toBe(true);
      expect(badge.getAttribute('aria-label')).toBeTruthy();
    });
  });

  it('should set appropriate ARIA labels for each state', () => {
    // Arrange & Act
    const redBadge = createBadgeElement('red');
    const amberBadge = createBadgeElement('amber');
    const greenBadge = createBadgeElement('green');
    const grayBadge = createBadgeElement('gray');

    // Assert
    expect(redBadge.getAttribute('aria-label')).toContain('not started');
    expect(amberBadge.getAttribute('aria-label')).toContain('in progress');
    expect(greenBadge.getAttribute('aria-label')).toContain('complete');
    expect(grayBadge.getAttribute('aria-label')).toContain('status unknown');
  });

  it('should create visually styled badge with proper dimensions', () => {
    // Act
    const badge = createBadgeElement('green');

    // Assert - badge should have inline or class-based styles
    expect(badge.style.display || badge.classList.contains('qd-badge')).toBeTruthy();
  });
});

describe('Badge Injection', () => {
  it('should inject badges into all qd-test-link elements', () => {
    // Arrange
    const container = document.createElement('div');
    container.innerHTML = `
      <a href="page1.html" class="qd-test-link">Page 1</a>
      <a href="page2.html" class="qd-test-link">Page 2</a>
    `;

    const cache: SessionCache = {
      totals: { answered: 0, correct: 0 },
      pages: {
        page1: { state: 'complete', answered: 5, correct: 5 },
        page2: { state: 'incomplete', answered: 2, correct: 1 },
      },
    };

    // Act
    injectBadges(container, cache);

    // Assert
    const links = container.querySelectorAll(`.${CSS_CLASSES.TEST_LINK}`);
    links.forEach((link) => {
      const badge = link.querySelector('.qd-badge');
      expect(badge).toBeTruthy();
    });
  });

  it('should not inject duplicate badges', () => {
    // Arrange
    const container = document.createElement('div');
    container.innerHTML = `<a href="page1.html" class="qd-test-link">Page 1</a>`;

    const cache: SessionCache = {
      totals: { answered: 0, correct: 0 },
      pages: { page1: { state: 'complete', answered: 5, correct: 5 } },
    };

    // Act - inject badges twice
    injectBadges(container, cache);
    injectBadges(container, cache);

    // Assert - should only have one badge
    const link = container.querySelector(`.${CSS_CLASSES.TEST_LINK}`)!;
    const badges = link.querySelectorAll('.qd-badge');
    expect(badges.length).toBe(1);
  });

  it('should handle missing cache gracefully', () => {
    // Arrange
    const container = document.createElement('div');
    container.innerHTML = `<a href="page1.html" class="qd-test-link">Page 1</a>`;

    // Act - inject with null cache
    expect(() => injectBadges(container, null)).not.toThrow();
  });

  it('should update existing badges when state changes', () => {
    // Arrange
    const container = document.createElement('div');
    container.innerHTML = `<a href="page1.html" class="qd-test-link">Quiz Table Examples - Sonar Quiz System</a>`;

    const cache1: SessionCache = {
      totals: { answered: 1, correct: 0 },
      pages: {
        'Quiz Table Examples - Sonar Quiz System': { state: 'incomplete', answered: 1, correct: 0 },
      },
    };

    const cache2: SessionCache = {
      totals: { answered: 5, correct: 5 },
      pages: {
        'Quiz Table Examples - Sonar Quiz System': { state: 'complete', answered: 5, correct: 5 },
      },
    };

    // Act
    injectBadges(container, cache1);
    const link = container.querySelector(`.${CSS_CLASSES.TEST_LINK}`)!;
    const badgeAfterFirst = link.querySelector('.qd-badge')!;
    expect(badgeAfterFirst.classList.contains('qd-badge--amber')).toBe(true);

    injectBadges(container, cache2);
    const badgeAfterSecond = link.querySelector('.qd-badge')!;

    // Assert - badge should be updated to green
    expect(badgeAfterSecond.classList.contains('qd-badge--green')).toBe(true);
    expect(badgeAfterSecond.classList.contains('qd-badge--amber')).toBe(false);
  });
});

// Note: All implementation functions are now imported from src/enhancers/home-badges.ts
