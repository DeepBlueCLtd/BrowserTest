/**
 * Storybook stories for Home Page Badge Enhancement
 *
 * Demonstrates R/A/G (Red/Amber/Green) badge application to navigation links
 * based on page completion states.
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { enhanceHomeBadges } from '../../src/enhancers/home-badges.js';
import type { SessionCache } from '../../src/types/contracts.js';
import { setJSON } from '../../src/utils/storage-helpers.js';
import { STORAGE_KEYS } from '../../src/types/contracts.js';

const meta: Meta = {
  title: 'Enhancers/Home Badges',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Home page badge enhancement applies R/A/G badges to navigation links based on quiz completion status.

**Badge Colors:**
- 🔴 Red: Unstarted (no answers provided)
- 🟠 Amber: Incomplete (some answered OR any incorrect)
- 🟢 Green: Complete (all answered AND all correct)

**Features:**
- Real-time updates via qd:state-changed events
- Handles missing cache gracefully
- Preserves existing link styling
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Helper to create session cache with specified states
 */
function createCacheWithStates(states: Record<string, 'unstarted' | 'incomplete' | 'complete'>) {
  const cache: SessionCache = {
    serviceId: 'RN9999',
    name: 'Storybook User',
    release: '11-2024',
    pages: {},
  };

  Object.entries(states).forEach(([pageId, state]) => {
    cache.pages[pageId] = {
      state,
      answers: [],
      ...(state !== 'unstarted' && {
        quiz: {
          attempted: 3,
          correct: state === 'complete' ? 3 : 1,
        },
      }),
    };
  });

  return cache;
}

/**
 * Story: All Badge States
 *
 * Shows navigation links with all three badge states.
 */
export const AllBadgeStates: Story = {
  render: () => {
    // Set up cache with different states
    const cache = createCacheWithStates({
      'lesson-1': 'complete',
      'lesson-2': 'incomplete',
      'lesson-3': 'unstarted',
    });
    setJSON(STORAGE_KEYS.CACHE, cache);

    // Enhance badges after DOM renders
    setTimeout(() => {
      enhanceHomeBadges();
    }, 100);

    return html`
      <style>
        .demo-nav {
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .demo-nav h2 {
          margin-top: 0;
        }
        .demo-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .demo-nav li {
          margin: 10px 0;
        }
        .quizPageBtn {
          display: inline-block;
          padding: 10px 15px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 4px;
          text-decoration: none;
          color: #333;
          transition: all 0.3s;
        }
        .quizPageBtn:hover {
          border-color: #999;
          transform: translateX(5px);
        }
        .qd-badge-red {
          border-left: 6px solid #dc3545;
        }
        .qd-badge-amber {
          border-left: 6px solid #ffc107;
        }
        .qd-badge-green {
          border-left: 6px solid #28a745;
        }
        .badge-legend {
          margin-top: 30px;
          padding: 15px;
          background: white;
          border-radius: 4px;
        }
        .badge-legend h3 {
          margin-top: 0;
        }
        .legend-item {
          margin: 8px 0;
        }
        .legend-badge {
          display: inline-block;
          width: 20px;
          height: 20px;
          border-radius: 3px;
          margin-right: 10px;
        }
        .legend-badge.red {
          background: #dc3545;
        }
        .legend-badge.amber {
          background: #ffc107;
        }
        .legend-badge.green {
          background: #28a745;
        }
      </style>

      <div class="demo-nav">
        <h2>Course Navigation</h2>
        <p>Badges show completion status for each lesson:</p>
        <nav>
          <ul>
            <li>
              <a href="#lesson1" class="quizPageBtn" data-page-id="lesson-1">
                Lesson 1: Basic Arithmetic
              </a>
            </li>
            <li>
              <a href="#lesson2" class="quizPageBtn" data-page-id="lesson-2">
                Lesson 2: Algebra Concepts
              </a>
            </li>
            <li>
              <a href="#lesson3" class="quizPageBtn" data-page-id="lesson-3">
                Lesson 3: Geometry Basics
              </a>
            </li>
          </ul>
        </nav>

        <div class="badge-legend">
          <h3>Badge Legend</h3>
          <div class="legend-item">
            <span class="legend-badge red"></span>
            <strong>Red:</strong> Unstarted (no answers provided)
          </div>
          <div class="legend-item">
            <span class="legend-badge amber"></span>
            <strong>Amber:</strong> Incomplete (some answered OR any incorrect)
          </div>
          <div class="legend-item">
            <span class="legend-badge green"></span>
            <strong>Green:</strong> Complete (all answered AND all correct)
          </div>
        </div>
      </div>
    `;
  },
};

/**
 * Story: Dynamic Badge Updates
 *
 * Demonstrates real-time badge updates when state changes.
 * Includes buttons to simulate state transitions.
 */
export const DynamicUpdates: Story = {
  render: () => {
    // Initialize with all unstarted
    const cache = createCacheWithStates({
      'lesson-1': 'unstarted',
    });
    setJSON(STORAGE_KEYS.CACHE, cache);

    // Enhance badges
    setTimeout(() => {
      enhanceHomeBadges();
    }, 100);

    // Helper to update state
    const updateState = (state: 'incomplete' | 'complete') => {
      const cache = createCacheWithStates({ 'lesson-1': state });
      setJSON(STORAGE_KEYS.CACHE, cache);

      // Emit state changed event
      const event = new CustomEvent('qd:state-changed', {
        detail: { pageId: 'lesson-1', state },
      });
      document.dispatchEvent(event);
    };

    return html`
      <style>
        .demo-dynamic {
          padding: 20px;
        }
        .quizPageBtn {
          display: inline-block;
          padding: 15px 20px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 4px;
          text-decoration: none;
          color: #333;
          font-size: 16px;
          margin: 20px 0;
        }
        .qd-badge-red {
          border-left: 8px solid #dc3545;
        }
        .qd-badge-amber {
          border-left: 8px solid #ffc107;
        }
        .qd-badge-green {
          border-left: 8px solid #28a745;
        }
        .controls {
          margin-top: 20px;
        }
        .controls button {
          padding: 10px 20px;
          margin-right: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-incomplete {
          background: #ffc107;
          color: #000;
        }
        .btn-complete {
          background: #28a745;
          color: white;
        }
      </style>

      <div class="demo-dynamic">
        <h2>Dynamic Badge Updates</h2>
        <p>Click buttons to simulate quiz completion and watch the badge update in real-time:</p>

        <a href="#lesson1" class="quizPageBtn" data-page-id="lesson-1">
          Lesson 1: Mathematics Quiz
        </a>

        <div class="controls">
          <button class="btn-incomplete" @click="${() => updateState('incomplete')}">
            Mark Incomplete
          </button>
          <button class="btn-complete" @click="${() => updateState('complete')}">
            Mark Complete
          </button>
        </div>

        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          <em>Note: In the real application, state changes are triggered by quiz interactions.</em>
        </p>
      </div>
    `;
  },
};

/**
 * Story: Empty Cache Handling
 *
 * Shows how badges behave when no cache data exists.
 * All links should display red badges (unstarted state).
 */
export const EmptyCache: Story = {
  render: () => {
    // Clear cache to test empty state
    sessionStorage.removeItem(STORAGE_KEYS.CACHE);

    setTimeout(() => {
      enhanceHomeBadges();
    }, 100);

    return html`
      <style>
        .demo-empty {
          padding: 20px;
        }
        .quizPageBtn {
          display: block;
          padding: 10px 15px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 4px;
          text-decoration: none;
          color: #333;
          margin: 10px 0;
          max-width: 300px;
        }
        .qd-badge-red {
          border-left: 6px solid #dc3545;
        }
      </style>

      <div class="demo-empty">
        <h2>Empty Cache (No Session Data)</h2>
        <p>When no cache exists, all badges default to red (unstarted):</p>

        <a href="#lesson1" class="quizPageBtn" data-page-id="lesson-1">Lesson 1</a>
        <a href="#lesson2" class="quizPageBtn" data-page-id="lesson-2">Lesson 2</a>
        <a href="#lesson3" class="quizPageBtn" data-page-id="lesson-3">Lesson 3</a>

        <p style="margin-top: 20px; color: #666;">
          This demonstrates graceful degradation when users haven't started any quizzes yet.
        </p>
      </div>
    `;
  },
};
