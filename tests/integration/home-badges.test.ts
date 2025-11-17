/**
 * Integration tests for Home Page Badge Enhancement
 *
 * Tests R/A/G badge application and real-time updates on navigation links.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { SessionCache } from '../../src/types/contracts.js';
import { setJSON } from '../../src/utils/storage-helpers.js';
import { STORAGE_KEYS } from '../../src/types/contracts.js';
import { enhanceHomeBadges } from '../../src/enhancers/home-badges.js';

describe('Home Page Badges', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create container for navigation links
    container = document.createElement('div');
    container.innerHTML = `
      <nav>
        <a href="page1.html" class="quizPageBtn" data-page-id="page-1">Lesson 1</a>
        <a href="page2.html" class="quizPageBtn" data-page-id="page-2">Lesson 2</a>
        <a href="page3.html" class="quizPageBtn" data-page-id="page-3">Lesson 3</a>
        <a href="about.html" class="regularLink">About</a>
      </nav>
    `;
    document.body.appendChild(container);

    // Clear storage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    // Cleanup
    container.remove();
    sessionStorage.clear();
  });

  describe('Initial Badge Application', () => {
    it('should apply badges to all .quizPageBtn links', () => {
      // Create session cache with states
      const cache: SessionCache = {
        totals: { answered: 0, correct: 0 },
        pages: {
          'page-1': { state: 'complete', answered: 2, correct: 2, answers: [] },
          'page-2': { state: 'incomplete', answered: 2, correct: 1, answers: [] },
          'page-3': { state: 'unstarted', answered: 0, correct: 0, answers: [] },
        },
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      // Enhance badges
      enhanceHomeBadges();

      // Verify badge classes applied
      const link1 = document.querySelector('[data-page-id="page-1"]');
      const link2 = document.querySelector('[data-page-id="page-2"]');
      const link3 = document.querySelector('[data-page-id="page-3"]');

      expect(link1?.classList.contains('qd-badge-green')).toBe(true);
      expect(link2?.classList.contains('qd-badge-amber')).toBe(true);
      expect(link3?.classList.contains('qd-badge-red')).toBe(true);
    });

    it('should handle missing cache gracefully', () => {
      // No cache in storage
      enhanceHomeBadges();

      // Should not throw, all links should have red badge (unstarted)
      const links = document.querySelectorAll('.quizPageBtn');
      links.forEach((link) => {
        expect(link.classList.contains('qd-badge-red')).toBe(true);
      });
    });

    it('should handle missing pageId gracefully', () => {
      const cache: SessionCache = {
        totals: { answered: 0, correct: 0 },
        pages: {},
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      // Remove data-page-id from one link
      const link = document.querySelector('.quizPageBtn');
      link?.removeAttribute('data-page-id');

      enhanceHomeBadges();

      // Should not throw, link without pageId should have red badge
      expect(link?.classList.contains('qd-badge-red')).toBe(true);
    });

    it('should not affect non-quiz links', () => {
      const cache: SessionCache = {
        totals: { answered: 0, correct: 0 },
        pages: {},
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      enhanceHomeBadges();

      const regularLink = document.querySelector('.regularLink');
      expect(regularLink?.classList.contains('qd-badge-red')).toBe(false);
      expect(regularLink?.classList.contains('qd-badge-amber')).toBe(false);
      expect(regularLink?.classList.contains('qd-badge-green')).toBe(false);
    });
  });

  describe('Real-time Updates', () => {
    it('should update badges when qd:state-changed event fires', () => {
      // Initial cache
      const cache: SessionCache = {
        totals: { answered: 0, correct: 0 },
        pages: {
          'page-1': { state: 'incomplete', answered: 2, correct: 1, answers: [] },
        },
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      enhanceHomeBadges();

      const link1 = document.querySelector('[data-page-id="page-1"]');
      expect(link1?.classList.contains('qd-badge-amber')).toBe(true);

      // Update cache to complete state
      cache.pages['page-1']!.state = 'complete';
      cache.pages['page-1']!.answered = 2;
      cache.pages['page-1']!.correct = 2;
      setJSON(STORAGE_KEYS.CACHE, cache);

      // Emit state changed event
      const event = new CustomEvent('qd:state-changed', {
        detail: { pageId: 'page-1', state: 'complete' },
      });
      document.dispatchEvent(event);

      // Badge should update to green
      expect(link1?.classList.contains('qd-badge-green')).toBe(true);
      expect(link1?.classList.contains('qd-badge-amber')).toBe(false);
    });

    it('should handle badge transitions: red → amber → green', () => {
      const cache: SessionCache = {
        totals: { answered: 0, correct: 0 },
        pages: {
          'page-1': { state: 'unstarted', answered: 0, correct: 0, answers: [] },
        },
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      enhanceHomeBadges();

      const link1 = document.querySelector('[data-page-id="page-1"]');

      // Initial: red
      expect(link1?.classList.contains('qd-badge-red')).toBe(true);

      // Transition to incomplete
      cache.pages['page-1']!.state = 'incomplete';
      cache.pages['page-1']!.answered = 1;
      cache.pages['page-1']!.correct = 0;
      setJSON(STORAGE_KEYS.CACHE, cache);

      const event1 = new CustomEvent('qd:state-changed', {
        detail: { pageId: 'page-1', state: 'incomplete' },
      });
      document.dispatchEvent(event1);

      expect(link1?.classList.contains('qd-badge-amber')).toBe(true);
      expect(link1?.classList.contains('qd-badge-red')).toBe(false);

      // Transition to complete
      cache.pages['page-1']!.state = 'complete';
      cache.pages['page-1']!.answered = 2;
      cache.pages['page-1']!.correct = 2;
      setJSON(STORAGE_KEYS.CACHE, cache);

      const event2 = new CustomEvent('qd:state-changed', {
        detail: { pageId: 'page-1', state: 'complete' },
      });
      document.dispatchEvent(event2);

      expect(link1?.classList.contains('qd-badge-green')).toBe(true);
      expect(link1?.classList.contains('qd-badge-amber')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty cache pages object', () => {
      const cache: SessionCache = {
        totals: { answered: 0, correct: 0 },
        pages: {},
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      enhanceHomeBadges();

      const links = document.querySelectorAll('.quizPageBtn');
      links.forEach((link) => {
        expect(link.classList.contains('qd-badge-red')).toBe(true);
      });
    });

    it('should handle state updates for non-existent pageIds', () => {
      const cache: SessionCache = {
        totals: { answered: 0, correct: 0 },
        pages: {},
      };
      setJSON(STORAGE_KEYS.CACHE, cache);

      enhanceHomeBadges();

      // Emit event for non-existent page
      const event = new CustomEvent('qd:state-changed', {
        detail: { pageId: 'non-existent', state: 'complete' },
      });

      // Should not throw
      expect(() => document.dispatchEvent(event)).not.toThrow();
    });
  });
});
