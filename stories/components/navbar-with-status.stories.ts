/**
 * Navbar with Status Panel Story
 *
 * Demonstrates the Oxygen WebHelp navbar structure with integrated status panel.
 *
 * **Status Panel Features:**
 * - Shows login form when user not logged in
 * - After login, displays quiz progress (R/A/G state, counts, percentage)
 * - Logout button (bottom-right) clears session and returns to login view
 * - Auto-injected as last child of configured navbar container
 * - Default styling: display:inline-block; vertical-align:middle; margin-left:auto;
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import '../../src/components/qd-status';

const meta: Meta = {
  title: 'Components/Navbar with Status Panel',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

/**
 * Helper to create Oxygen WebHelp navbar structure
 */
function createNavbar(includeStatusPanel = true): HTMLElement {
  const container = document.createElement('div');

  container.innerHTML = `
    <style>
      /* Oxygen WebHelp navbar styles */
      .wh_header_flex_container {
        display: flex;
        align-items: center;
        background: #000;
        color: #fff;
        padding: 0.5rem 1rem;
        gap: 1rem;
      }

      .wh_logo_and_publication_title_container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .wh_publication_title {
        font-size: 1.25rem;
        font-weight: 600;
      }

      .wh_publication_title a {
        color: #fff;
        text-decoration: none;
      }

      .wh_search_input {
        display: flex;
        align-items: center;
      }

      .wh_search_textfield {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px 0 0 4px;
        width: 200px;
      }

      .wh_search_button {
        padding: 0.5rem 1rem;
        background: #0066cc;
        color: #fff;
        border: none;
        border-radius: 0 4px 4px 0;
        cursor: pointer;
      }

      .wh_top_menu_and_indexterms_link {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-left: 1rem;
      }

      .wh_top_menu {
        display: flex;
      }

      .wh_top_menu ul {
        display: flex;
        list-style: none;
        margin: 0;
        padding: 0;
        gap: 1rem;
      }

      .wh_top_menu li {
        margin: 0;
      }

      .wh_top_menu a {
        color: #fff;
        text-decoration: none;
        padding: 0.5rem 1rem;
        display: block;
        transition: background 0.2s;
      }

      .wh_top_menu a:hover {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }

      /* Status panel wrapper styling */
      #qd-status {
        display: inline-block;
        vertical-align: middle;
        margin-left: auto;
      }

      /* Override status panel component styles for navbar integration */
      qd-status::part(status-panel) {
        min-width: 300px;
        padding: 0.75rem 1rem;
        border: 1px solid #444;
        background: #1a1a1a;
        color: #fff;
      }
    </style>

    <div class="wh_header_flex_container navbar-nav navbar-expand-md navbar-dark c-no-wrap">
      <div class="wh_logo_and_publication_title_container">
        <div class="wh_publication_title">
          <a href="#"><span class="title">Field Manual Pub-10 Mar 2025</span></a>
        </div>
      </div>

      <div class="wh_search_input" role="form">
        <input type="search" placeholder="Search" class="wh_search_textfield" aria-label="Search query"/>
        <button type="submit" class="wh_search_button" aria-label="Search">
          <span class="search_input_text">Search</span>
        </button>
      </div>

      <div class="wh_top_menu_and_indexterms_link">
        <nav class="wh_top_menu c-menu" aria-label="Menu Container">
          <ul role="menubar" aria-label="Menu">
            <li role="menuitem">
              <a href="#" class="quizPageBtn">Page Index</a>
            </li>
            <li role="menuitem">
              <a href="#" class="quizPageBtn">7 Questions</a>
            </li>
            <li role="menuitem">
              <a href="#" class="quizPageBtn">Background</a>
            </li>
          </ul>
        </nav>
        ${
          includeStatusPanel
            ? `
        <!-- Status panel auto-injected here as last child -->
        <div id="qd-status" style="display:inline-block; vertical-align:middle; margin-left:auto;">
          <qd-status
            state="incomplete"
            attempted="5"
            correct="3"
            total="10"
            isLoggedIn="true">
          </qd-status>
        </div>
        `
            : ''
        }
      </div>
    </div>
  `;

  return container;
}

/**
 * Default navbar with status panel (logged in state)
 *
 * Shows complete Oxygen WebHelp navbar with status panel displaying progress.
 * Logout button available at bottom-right of status panel.
 */
export const Default: Story = {
  render: () => createNavbar(true),
};

/**
 * Navbar without status panel (before injection)
 */
export const BeforeInjection: Story = {
  render: () => createNavbar(false),
};

/**
 * Status panel with different states (logged in, unstarted)
 *
 * Shows status panel with user logged in but no quiz progress.
 * Logout button available at bottom-right.
 */
export const UnstartedState: Story = {
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <style>
        .wh_header_flex_container {
          display: flex;
          align-items: center;
          background: #000;
          color: #fff;
          padding: 0.5rem 1rem;
          gap: 1rem;
        }

        .wh_top_menu_and_indexterms_link {
          display: flex;
          align-items: center;
          width: 100%;
        }

        #qd-status {
          display: inline-block;
          vertical-align: middle;
          margin-left: auto;
        }
      </style>

      <div class="wh_header_flex_container">
        <div class="wh_top_menu_and_indexterms_link">
          <span style="color: #fff;">Quiz Navigation</span>
          <div id="qd-status" style="display:inline-block; vertical-align:middle; margin-left:auto;">
            <qd-status
              state="unstarted"
              attempted="0"
              correct="0"
              total="10"
              isLoggedIn="true">
            </qd-status>
          </div>
        </div>
      </div>
    `;
    return container;
  },
};

/**
 * Status panel - Complete state (logged in, all correct)
 *
 * Shows status panel with all questions answered correctly.
 * Logout button available at bottom-right.
 */
export const CompleteState: Story = {
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <style>
        .wh_header_flex_container {
          display: flex;
          align-items: center;
          background: #000;
          color: #fff;
          padding: 0.5rem 1rem;
          gap: 1rem;
        }

        .wh_top_menu_and_indexterms_link {
          display: flex;
          align-items: center;
          width: 100%;
        }

        #qd-status {
          display: inline-block;
          vertical-align: middle;
          margin-left: auto;
        }
      </style>

      <div class="wh_header_flex_container">
        <div class="wh_top_menu_and_indexterms_link">
          <span style="color: #fff;">Quiz Navigation</span>
          <div id="qd-status" style="display:inline-block; vertical-align:middle; margin-left:auto;">
            <qd-status
              state="complete"
              attempted="10"
              correct="10"
              total="10"
              isLoggedIn="true">
            </qd-status>
          </div>
        </div>
      </div>
    `;
    return container;
  },
};

/**
 * Status panel - Not logged in state (shows login form)
 *
 * When user is not logged in, status panel displays the login component.
 * After login, status panel switches to showing progress.
 * Logout button (bottom-right) clears session and returns to login view.
 */
export const NotLoggedIn: Story = {
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <style>
        .wh_header_flex_container {
          display: flex;
          align-items: center;
          background: #000;
          color: #fff;
          padding: 0.5rem 1rem;
          gap: 1rem;
        }

        .wh_top_menu_and_indexterms_link {
          display: flex;
          align-items: center;
          width: 100%;
        }

        #qd-status {
          display: inline-block;
          vertical-align: middle;
          margin-left: auto;
        }
      </style>

      <div class="wh_header_flex_container">
        <div class="wh_top_menu_and_indexterms_link">
          <span style="color: #fff;">Quiz Navigation</span>
          <div id="qd-status" style="display:inline-block; vertical-align:middle; margin-left:auto;">
            <qd-status
              release="01-2025"
              docId="sonar-training">
            </qd-status>
          </div>
        </div>
      </div>
    `;
    return container;
  },
};

/**
 * Full page layout with navbar and content
 */
export const FullPageLayout: Story = {
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <style>
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .wh_header_flex_container {
          display: flex;
          align-items: center;
          background: #000;
          color: #fff;
          padding: 0.5rem 1rem;
          gap: 1rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .wh_logo_and_publication_title_container {
          display: flex;
          align-items: center;
        }

        .wh_publication_title a {
          color: #fff;
          text-decoration: none;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .wh_search_input {
          display: flex;
        }

        .wh_search_textfield {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px 0 0 4px;
          width: 200px;
        }

        .wh_search_button {
          padding: 0.5rem 1rem;
          background: #0066cc;
          color: #fff;
          border: none;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
        }

        .wh_top_menu_and_indexterms_link {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-left: 1rem;
          flex: 1;
        }

        .wh_top_menu ul {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: 1rem;
        }

        .wh_top_menu li {
          margin: 0;
        }

        .wh_top_menu a {
          color: #fff;
          text-decoration: none;
          padding: 0.5rem 1rem;
          display: block;
        }

        .wh_top_menu a:hover {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        #qd-status {
          display: inline-block;
          vertical-align: middle;
          margin-left: auto;
        }

        .content {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .quiz-table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
        }

        .quiz-table th,
        .quiz-table td {
          border: 1px solid #ddd;
          padding: 0.75rem;
          text-align: left;
        }

        .quiz-table th {
          background: #f5f5f5;
          font-weight: 600;
        }
      </style>

      <!-- Navbar -->
      <div class="wh_header_flex_container">
        <div class="wh_logo_and_publication_title_container">
          <div class="wh_publication_title">
            <a href="#"><span class="title">Field Manual Pub-10 Mar 2025</span></a>
          </div>
        </div>

        <div class="wh_search_input">
          <input type="search" placeholder="Search" class="wh_search_textfield"/>
          <button type="submit" class="wh_search_button">Search</button>
        </div>

        <div class="wh_top_menu_and_indexterms_link">
          <nav class="wh_top_menu">
            <ul role="menubar">
              <li><a href="#" class="quizPageBtn">Page Index</a></li>
              <li><a href="#" class="quizPageBtn">7 Questions</a></li>
              <li><a href="#" class="quizPageBtn">Background</a></li>
            </ul>
          </nav>

          <div id="qd-status" style="display:inline-block; vertical-align:middle; margin-left:auto;">
            <qd-status
              state="incomplete"
              attempted="5"
              correct="3"
              total="10"
              isLoggedIn="true">
            </qd-status>
          </div>
        </div>
      </div>

      <!-- Page Content -->
      <div class="content">
        <h1>Chapter 3: Signal Processing</h1>

        <p>This chapter covers the fundamentals of sonar signal processing...</p>

        <h2>Quiz</h2>
        <table class="quiz-table qd-quiz">
          <thead>
            <tr>
              <th>Question</th>
              <th>Answer</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>What does FFT stand for?</td>
              <td><input type="text" value="Fast Fourier Transform" disabled/></td>
              <td>
                <ol>
                  <li>Fast Fourier Transform</li>
                  <li>Frequency Filter Transform</li>
                  <li>Forward Fourier Technique</li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    return container;
  },
};
