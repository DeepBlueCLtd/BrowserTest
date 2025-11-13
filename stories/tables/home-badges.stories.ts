/**
 * Home Page Badge Stories
 *
 * Visual stories showing how progress badges appear on home page navigation links.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import type { SessionCache } from '../../src/types/contracts';
import { injectBadges } from '../../src/enhancers/home-badges';

const meta: Meta = {
  title: 'Tables/Home Page Badges',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

/**
 * Helper to create a home page mock with navigation links
 */
function createHomePage(cache: SessionCache | null): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto; padding: 2rem;">
      <h1>Training Manual - Table of Contents</h1>
      <nav>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 1rem 0;">
            <a href="chapter-1.html" class="quizPageBtn" style="display: inline-flex; align-items: center; text-decoration: none; color: #0066cc; font-size: 1.1rem;">
              Chapter 1: Introduction to Sonar Systems
            </a>
          </li>
          <li style="margin: 1rem 0;">
            <a href="chapter-2.html" class="quizPageBtn" style="display: inline-flex; align-items: center; text-decoration: none; color: #0066cc; font-size: 1.1rem;">
              Chapter 2: Operating Principles
            </a>
          </li>
          <li style="margin: 1rem 0;">
            <a href="chapter-3.html" class="quizPageBtn" style="display: inline-flex; align-items: center; text-decoration: none; color: #0066cc; font-size: 1.1rem;">
              Chapter 3: Signal Processing
            </a>
          </li>
          <li style="margin: 1rem 0;">
            <a href="chapter-4.html" class="quizPageBtn" style="display: inline-flex; align-items: center; text-decoration: none; color: #0066cc; font-size: 1.1rem;">
              Chapter 4: Target Classification
            </a>
          </li>
          <li style="margin: 1rem 0;">
            <a href="chapter-5.html" class="quizPageBtn" style="display: inline-flex; align-items: center; text-decoration: none; color: #0066cc; font-size: 1.1rem;">
              Chapter 5: Advanced Techniques
            </a>
          </li>
        </ul>
      </nav>
    </div>
  `;

  // Inject badges
  setTimeout(() => {
    injectBadges(container, cache);
  }, 0);

  return container;
}

/**
 * All Unstarted - No progress made yet
 */
export const AllUnstarted: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 0, correct: 0 },
      pages: {
        'chapter-1': { state: 'unstarted', answered: 0, correct: 0 },
        'chapter-2': { state: 'unstarted', answered: 0, correct: 0 },
        'chapter-3': { state: 'unstarted', answered: 0, correct: 0 },
        'chapter-4': { state: 'unstarted', answered: 0, correct: 0 },
        'chapter-5': { state: 'unstarted', answered: 0, correct: 0 },
      },
    };

    return createHomePage(cache);
  },
};

/**
 * Mixed Progress - Student has started working through the chapters
 */
export const MixedProgress: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 15, correct: 12 },
      pages: {
        'chapter-1': { state: 'complete', answered: 5, correct: 5 },
        'chapter-2': { state: 'complete', answered: 5, correct: 5 },
        'chapter-3': { state: 'incomplete', answered: 3, correct: 2 },
        'chapter-4': { state: 'incomplete', answered: 2, correct: 0 },
        'chapter-5': { state: 'unstarted', answered: 0, correct: 0 },
      },
    };

    return createHomePage(cache);
  },
};

/**
 * All Complete - Student has finished all chapters
 */
export const AllComplete: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 25, correct: 25 },
      pages: {
        'chapter-1': { state: 'complete', answered: 5, correct: 5 },
        'chapter-2': { state: 'complete', answered: 5, correct: 5 },
        'chapter-3': { state: 'complete', answered: 5, correct: 5 },
        'chapter-4': { state: 'complete', answered: 5, correct: 5 },
        'chapter-5': { state: 'complete', answered: 5, correct: 5 },
      },
    };

    return createHomePage(cache);
  },
};

/**
 * No Cache - Shows gray badges when no session data exists
 */
export const NoCache: Story = {
  render: () => {
    return createHomePage(null);
  },
};

/**
 * Partial Cache - Some pages have data, others don't
 */
export const PartialCache: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 10, correct: 8 },
      pages: {
        'chapter-1': { state: 'complete', answered: 5, correct: 5 },
        'chapter-2': { state: 'incomplete', answered: 3, correct: 2 },
        'chapter-3': { state: 'incomplete', answered: 2, correct: 1 },
        // chapter-4 and chapter-5 not in cache (will show gray)
      },
    };

    return createHomePage(cache);
  },
};

/**
 * All Incomplete - Student has started but not completed any chapter
 */
export const AllIncomplete: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 15, correct: 8 },
      pages: {
        'chapter-1': { state: 'incomplete', answered: 3, correct: 2 },
        'chapter-2': { state: 'incomplete', answered: 3, correct: 1 },
        'chapter-3': { state: 'incomplete', answered: 3, correct: 2 },
        'chapter-4': { state: 'incomplete', answered: 3, correct: 1 },
        'chapter-5': { state: 'incomplete', answered: 3, correct: 2 },
      },
    };

    return createHomePage(cache);
  },
};

/**
 * Interactive Demo - Shows badges updating as progress changes
 */
export const InteractiveDemo: Story = {
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 2rem;">
        <h1>Interactive Badge Demo</h1>
        <p style="color: #666;">Use the buttons below to simulate quiz progress and see badges update in real-time.</p>

        <div style="margin: 2rem 0; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
          <h3>Controls</h3>
          <button id="btn-unstarted" style="margin: 0.5rem; padding: 0.5rem 1rem; cursor: pointer;">
            Reset to Unstarted
          </button>
          <button id="btn-incomplete" style="margin: 0.5rem; padding: 0.5rem 1rem; cursor: pointer;">
            Simulate Incomplete
          </button>
          <button id="btn-complete" style="margin: 0.5rem; padding: 0.5rem 1rem; cursor: pointer;">
            Mark as Complete
          </button>
          <button id="btn-mixed" style="margin: 0.5rem; padding: 0.5rem 1rem; cursor: pointer;">
            Mixed Progress
          </button>
        </div>

        <nav id="nav-links">
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 1rem 0;">
              <a href="page-1.html" class="quizPageBtn" style="display: inline-flex; align-items: center; text-decoration: none; color: #0066cc; font-size: 1.1rem;">
                Test Page 1
              </a>
            </li>
            <li style="margin: 1rem 0;">
              <a href="page-2.html" class="quizPageBtn" style="display: inline-flex; align-items: center; text-decoration: none; color: #0066cc; font-size: 1.1rem;">
                Test Page 2
              </a>
            </li>
            <li style="margin: 1rem 0;">
              <a href="page-3.html" class="quizPageBtn" style="display: inline-flex; align-items: center; text-decoration: none; color: #0066cc; font-size: 1.1rem;">
                Test Page 3
              </a>
            </li>
          </ul>
        </nav>
      </div>
    `;

    const navContainer = container.querySelector('#nav-links') as HTMLElement;

    // Button handlers
    setTimeout(() => {
      const btnUnstarted = container.querySelector('#btn-unstarted');
      const btnIncomplete = container.querySelector('#btn-incomplete');
      const btnComplete = container.querySelector('#btn-complete');
      const btnMixed = container.querySelector('#btn-mixed');

      btnUnstarted?.addEventListener('click', () => {
        const cache: SessionCache = {
          totals: { answered: 0, correct: 0 },
          pages: {
            'page-1': { state: 'unstarted', answered: 0, correct: 0 },
            'page-2': { state: 'unstarted', answered: 0, correct: 0 },
            'page-3': { state: 'unstarted', answered: 0, correct: 0 },
          },
        };
        injectBadges(navContainer, cache);
      });

      btnIncomplete?.addEventListener('click', () => {
        const cache: SessionCache = {
          totals: { answered: 6, correct: 3 },
          pages: {
            'page-1': { state: 'incomplete', answered: 2, correct: 1 },
            'page-2': { state: 'incomplete', answered: 2, correct: 1 },
            'page-3': { state: 'incomplete', answered: 2, correct: 1 },
          },
        };
        injectBadges(navContainer, cache);
      });

      btnComplete?.addEventListener('click', () => {
        const cache: SessionCache = {
          totals: { answered: 9, correct: 9 },
          pages: {
            'page-1': { state: 'complete', answered: 3, correct: 3 },
            'page-2': { state: 'complete', answered: 3, correct: 3 },
            'page-3': { state: 'complete', answered: 3, correct: 3 },
          },
        };
        injectBadges(navContainer, cache);
      });

      btnMixed?.addEventListener('click', () => {
        const cache: SessionCache = {
          totals: { answered: 8, correct: 6 },
          pages: {
            'page-1': { state: 'complete', answered: 3, correct: 3 },
            'page-2': { state: 'incomplete', answered: 3, correct: 2 },
            'page-3': { state: 'incomplete', answered: 2, correct: 1 },
          },
        };
        injectBadges(navContainer, cache);
      });

      // Initial render
      btnUnstarted?.dispatchEvent(new Event('click'));
    }, 0);

    return container;
  },
};
