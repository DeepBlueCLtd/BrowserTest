/**
 * Quiz Index Page Story
 *
 * Visual story showing how the quiz index (table of contents) page is enhanced
 * with progress badges. This represents the DITA-generated HTML structure
 * for a page listing available quiz pages.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import type { SessionCache } from '../../src/types/contracts';
import { injectBadges } from '../../src/enhancers/home-badges';

const meta: Meta = {
  title: 'Tables/Quiz Index',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

/**
 * Helper to create a quiz index page with DITA-style markup
 */
function createQuizIndexPage(cache: SessionCache | null): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = `
    <style>
      /* DITA-generated styles */
      .body.refbody {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }

      .shortdesc {
        font-size: 1.1rem;
        color: #666;
        margin-bottom: 2rem;
      }

      .section {
        margin: 2rem 0;
      }

      .item-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .xref.enterBtn {
        display: inline-flex;
        align-items: center;
        padding: 1rem 1.5rem;
        background: #f8f9fa;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        text-decoration: none;
        color: #0066cc;
        font-size: 1rem;
        transition: all 0.2s ease;
      }

      .xref.enterBtn:hover {
        background: #e7f3ff;
        border-color: #0066cc;
        transform: translateX(4px);
        box-shadow: 0 2px 8px rgba(0, 102, 204, 0.15);
      }

      .xref.enterBtn.quizPageBtn {
        font-weight: 500;
      }

      /* Badge styles for visualization */
      .qd-badge {
        margin-left: auto;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        flex-shrink: 0;
      }
    </style>

    <div class="- topic/body reference/refbody body refbody">
      <p class="- topic/shortdesc shortdesc">CSA Scheme contents</p>
      <section class="- topic/section section">
        <div class="- topic/div div item-list">
          <a class="- topic/xref xref enterBtn" href="Pages/SubjectDetail.html">
            Detailed description of some event
          </a>
          <a class="- topic/xref xref enterBtn quizPageBtn qd-test-link" href="Pages/gramless-1.html">
            Gramless Gram 1
          </a>
          <a class="- topic/xref xref enterBtn quizPageBtn qd-test-link" href="Pages/gramless-2.html">
            Gramless Gram 2
          </a>
          <a class="- topic/xref xref enterBtn quizPageBtn qd-test-link" href="Pages/gram-1.html">
            Gram 1
          </a>
          <a class="- topic/xref xref enterBtn quizPageBtn qd-test-link" href="Pages/gram-2.html">
            Gram 2 - Spirit of Whale Island
          </a>
          <a class="- topic/xref xref enterBtn quizPageBtn qd-test-link" href="Pages/gram-3.html">
            Gram 1-2
          </a>
        </div>
      </section>
    </div>
  `;

  // Inject badges after DOM is ready
  setTimeout(() => {
    injectBadges(container, cache);
  }, 0);

  return container;
}

/**
 * No Session - All links show gray badges (unstarted)
 */
export const NoSession: Story = {
  render: () => {
    return createQuizIndexPage(null);
  },
};

/**
 * All Unstarted - Student logged in but hasn't started any quizzes
 */
export const AllUnstarted: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 0, correct: 0 },
      pages: {
        gramless1: { state: 'unstarted', answered: 0, correct: 0 },
        gramless2: { state: 'unstarted', answered: 0, correct: 0 },
        gram1: { state: 'unstarted', answered: 0, correct: 0 },
        gram2: { state: 'unstarted', answered: 0, correct: 0 },
        gram3: { state: 'unstarted', answered: 0, correct: 0 },
      },
    };

    return createQuizIndexPage(cache);
  },
};

/**
 * Mixed Progress - Student has completed some quizzes, working on others
 */
export const MixedProgress: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 25, correct: 20 },
      pages: {
        gramless1: { state: 'complete', answered: 5, correct: 5 },
        gramless2: { state: 'complete', answered: 5, correct: 5 },
        gram1: { state: 'incomplete', answered: 5, correct: 3 },
        gram2: { state: 'incomplete', answered: 5, correct: 3 },
        gram3: { state: 'unstarted', answered: 0, correct: 0 },
      },
    };

    return createQuizIndexPage(cache);
  },
};

/**
 * All Complete - Student has successfully completed all quizzes
 */
export const AllComplete: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 50, correct: 50 },
      pages: {
        gramless1: { state: 'complete', answered: 10, correct: 10 },
        gramless2: { state: 'complete', answered: 10, correct: 10 },
        gram1: { state: 'complete', answered: 10, correct: 10 },
        gram2: { state: 'complete', answered: 10, correct: 10 },
        gram3: { state: 'complete', answered: 10, correct: 10 },
      },
    };

    return createQuizIndexPage(cache);
  },
};

/**
 * Some Incomplete - Student has attempted all but not completed any
 */
export const AllIncomplete: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 25, correct: 12 },
      pages: {
        gramless1: { state: 'incomplete', answered: 5, correct: 2 },
        gramless2: { state: 'incomplete', answered: 5, correct: 3 },
        gram1: { state: 'incomplete', answered: 5, correct: 2 },
        gram2: { state: 'incomplete', answered: 5, correct: 3 },
        gram3: { state: 'incomplete', answered: 5, correct: 2 },
      },
    };

    return createQuizIndexPage(cache);
  },
};

/**
 * Partial Cache - Only some pages have data (others show gray)
 */
export const PartialCache: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 15, correct: 12 },
      pages: {
        gramless1: { state: 'complete', answered: 5, correct: 5 },
        gramless2: { state: 'complete', answered: 5, correct: 5 },
        gram1: { state: 'incomplete', answered: 5, correct: 2 },
        // gram2 and gram3 not in cache - will show gray badges
      },
    };

    return createQuizIndexPage(cache);
  },
};

/**
 * Real-world Scenario - Typical student progress through the course
 */
export const TypicalProgress: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 30, correct: 25 },
      pages: {
        gramless1: { state: 'complete', answered: 8, correct: 8 },
        gramless2: { state: 'complete', answered: 7, correct: 7 },
        gram1: { state: 'complete', answered: 5, correct: 5 },
        gram2: { state: 'incomplete', answered: 6, correct: 4 },
        gram3: { state: 'incomplete', answered: 4, correct: 1 },
      },
    };

    return createQuizIndexPage(cache);
  },
};

/**
 * With Non-Quiz Link - Shows that links without qd-test-link class are not enhanced
 */
export const WithNonQuizLink: Story = {
  render: () => {
    const cache: SessionCache = {
      totals: { answered: 10, correct: 10 },
      pages: {
        gramless1: { state: 'complete', answered: 5, correct: 5 },
        gramless2: { state: 'complete', answered: 5, correct: 5 },
      },
    };

    const container = createQuizIndexPage(cache);

    // Add explanatory note
    const note = document.createElement('div');
    note.style.cssText =
      'padding: 1rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; margin: 1rem auto; max-width: 800px;';
    note.innerHTML = `
      <strong>Note:</strong> The first link ("Detailed description of some event") does not have the
      <code>qd-test-link</code> class, so it is not enhanced with a progress badge. Only quiz pages
      with the <code>qd-test-link</code> class receive badges.
    `;
    container.insertBefore(note, container.firstChild);

    return container;
  },
};
