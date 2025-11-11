/**
 * Home Page Badge Workflow - Enhanced Interactive Story
 *
 * Simulates the complete workflow:
 * 1. Student logs in
 * 2. Navigates to quiz page
 * 3. Answers questions
 * 4. Returns to home page
 * 5. Sees updated badges
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import type { SessionCache, SessionData, AnswerRecord } from '../../src/types/contracts';
import { injectBadges } from '../../src/enhancers/home-badges';
import { STORAGE_KEYS } from '../../src/types/contracts';

const meta: Meta = {
  title: 'Tables/Home Badges Workflow',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

/**
 * Complete workflow simulation with tabs for different "pages"
 */
export const CompleteWorkflow: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = 'font-family: system-ui, sans-serif;';

    container.innerHTML = `
      <style>
        .workflow-container {
          display: flex;
          height: 100vh;
        }

        .sidebar {
          width: 300px;
          background: #f8f9fa;
          padding: 1rem;
          border-right: 2px solid #dee2e6;
          overflow-y: auto;
        }

        .main-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          border-bottom: 2px solid #dee2e6;
          padding-bottom: 0.5rem;
        }

        .tab {
          padding: 0.75rem 1.5rem;
          background: #e9ecef;
          border: none;
          border-radius: 4px 4px 0 0;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .tab:hover {
          background: #dee2e6;
        }

        .tab.active {
          background: white;
          border-bottom: 2px solid white;
          font-weight: bold;
        }

        .page {
          display: none;
        }

        .page.active {
          display: block;
          animation: fadeIn 0.3s;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .quiz-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }

        .quiz-table th,
        .quiz-table td {
          padding: 0.75rem;
          border: 1px solid #dee2e6;
          text-align: left;
        }

        .quiz-table th {
          background: #e9ecef;
          font-weight: bold;
        }

        .quiz-input {
          width: 100%;
          padding: 0.5rem;
          border: 2px solid #ced4da;
          border-radius: 4px;
          font-size: 1rem;
        }

        .quiz-input:focus {
          outline: none;
          border-color: #0066cc;
        }

        .quiz-input.correct {
          border-color: #28a745;
          background: #d4edda;
        }

        .quiz-input.incorrect {
          border-color: #dc3545;
          background: #f8d7da;
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          margin: 0.5rem 0;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          text-decoration: none;
          color: #0066cc;
          transition: all 0.2s;
        }

        .nav-link:hover {
          background: #e7f3ff;
          transform: translateX(4px);
        }

        .badge {
          display: inline-block;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          margin-left: auto;
        }

        .info-panel {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          border: 1px solid #dee2e6;
        }

        .info-panel h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          color: #6c757d;
        }

        .info-panel pre {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.75rem;
          margin: 0;
        }

        .event-log {
          max-height: 200px;
          overflow-y: auto;
          font-size: 0.75rem;
        }

        .event-entry {
          padding: 0.5rem;
          margin: 0.25rem 0;
          background: #f8f9fa;
          border-left: 3px solid #0066cc;
          border-radius: 2px;
        }

        .event-time {
          color: #6c757d;
          font-size: 0.7rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          margin: 0.25rem;
          transition: all 0.2s;
        }

        .btn:hover {
          background: #0052a3;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #6c757d;
        }

        .btn-secondary:hover {
          background: #5a6268;
        }

        .btn-danger {
          background: #dc3545;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .login-form {
          max-width: 400px;
          padding: 2rem;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }

        .form-group input {
          width: 100%;
          padding: 0.5rem;
          border: 2px solid #ced4da;
          border-radius: 4px;
          font-size: 1rem;
        }

        .session-status {
          padding: 1rem;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          color: #155724;
          margin-bottom: 1rem;
        }

        .totals {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin: 1rem 0;
        }

        .total-card {
          padding: 1rem;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          text-align: center;
        }

        .total-value {
          font-size: 2rem;
          font-weight: bold;
          color: #0066cc;
        }

        .total-label {
          font-size: 0.875rem;
          color: #6c757d;
          text-transform: uppercase;
        }
      </style>

      <div class="workflow-container">
        <!-- Sidebar with live state -->
        <div class="sidebar">
          <h2 style="margin-top: 0;">System State</h2>

          <div class="info-panel">
            <h3>Session</h3>
            <div id="session-display">Not logged in</div>
          </div>

          <div class="info-panel">
            <h3>Cache Totals</h3>
            <div class="totals">
              <div class="total-card">
                <div class="total-value" id="total-answered">0</div>
                <div class="total-label">Answered</div>
              </div>
              <div class="total-card">
                <div class="total-value" id="total-correct">0</div>
                <div class="total-label">Correct</div>
              </div>
            </div>
          </div>

          <div class="info-panel">
            <h3>Page States</h3>
            <pre id="cache-display">{}</pre>
          </div>

          <div class="info-panel">
            <h3>Event Log</h3>
            <div class="event-log" id="event-log"></div>
            <button class="btn btn-secondary" onclick="document.getElementById('event-log').innerHTML = ''">
              Clear Log
            </button>
          </div>

          <div class="info-panel">
            <h3>Actions</h3>
            <button class="btn" id="btn-simulate-timeout">Simulate Timeout</button>
            <button class="btn btn-danger" id="btn-clear-all">Clear All Data</button>
          </div>
        </div>

        <!-- Main content area with tabs -->
        <div class="main-content">
          <!-- Tab navigation -->
          <div class="tabs">
            <button class="tab active" data-page="login">Login</button>
            <button class="tab" data-page="home">Home</button>
            <button class="tab" data-page="quiz1">Chapter 1 Quiz</button>
            <button class="tab" data-page="quiz2">Chapter 2 Quiz</button>
            <button class="tab" data-page="quiz3">Chapter 3 Quiz</button>
          </div>

          <!-- Login page -->
          <div class="page active" id="page-login">
            <h1>Sonar Training System</h1>
            <div class="login-form">
              <h2>Student Login</h2>
              <div class="form-group">
                <label for="service-id">Service ID:</label>
                <input type="text" id="service-id" placeholder="e.g., RN2344" value="TEST001" />
              </div>
              <div class="form-group">
                <label for="student-name">Name:</label>
                <input type="text" id="student-name" placeholder="e.g., Smith, J" value="John Doe" />
              </div>
              <button class="btn" id="btn-login">Login</button>
            </div>
          </div>

          <!-- Home page -->
          <div class="page" id="page-home">
            <h1>Training Manual - Table of Contents</h1>
            <div id="session-info" style="display: none;" class="session-status">
              Logged in as <strong id="student-name-display"></strong> (<span id="student-id-display"></span>)
              <button class="btn btn-secondary" style="float: right;" id="btn-logout">Logout</button>
            </div>

            <p>Select a chapter to begin your training:</p>

            <nav id="home-nav">
              <a href="#" class="nav-link qd-test-link" data-page-id="chapter-1">
                Chapter 1: Introduction to Sonar Systems
              </a>
              <a href="#" class="nav-link qd-test-link" data-page-id="chapter-2">
                Chapter 2: Operating Principles
              </a>
              <a href="#" class="nav-link qd-test-link" data-page-id="chapter-3">
                Chapter 3: Signal Processing
              </a>
            </nav>
          </div>

          <!-- Quiz page 1 -->
          <div class="page" id="page-quiz1">
            <h1>Chapter 1: Introduction to Sonar Systems - Quiz</h1>
            <p>Answer all questions to complete this chapter.</p>

            <table class="quiz-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Your Answer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>What does SONAR stand for?</td>
                  <td>
                    <select class="quiz-input" data-correct="2" data-page="chapter-1">
                      <option value="">-- Select Answer --</option>
                      <option value="1">Sound Navigation and Radar</option>
                      <option value="2">Sound Navigation and Ranging</option>
                      <option value="3">Sonic Navigation and Ranging</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td>What is the typical frequency range for active sonar?</td>
                  <td>
                    <select class="quiz-input" data-correct="2" data-page="chapter-1">
                      <option value="">-- Select Answer --</option>
                      <option value="1">1-10 Hz</option>
                      <option value="2">1-500 kHz</option>
                      <option value="3">1-10 MHz</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td>Speed of sound in seawater is approximately?</td>
                  <td>
                    <input type="number" class="quiz-input" data-correct="1500" data-tolerance="50" data-page="chapter-1" placeholder="Enter value in m/s" />
                  </td>
                </tr>
              </tbody>
            </table>

            <button class="btn" onclick="history.back()">← Back to Home</button>
          </div>

          <!-- Quiz page 2 -->
          <div class="page" id="page-quiz2">
            <h1>Chapter 2: Operating Principles - Quiz</h1>
            <p>Answer all questions to complete this chapter.</p>

            <table class="quiz-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Your Answer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>What is the Doppler effect in sonar?</td>
                  <td>
                    <select class="quiz-input" data-correct="1" data-page="chapter-2">
                      <option value="">-- Select Answer --</option>
                      <option value="1">Frequency shift due to relative motion</option>
                      <option value="2">Signal attenuation over distance</option>
                      <option value="3">Echo return time delay</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td>Passive sonar primarily detects:</td>
                  <td>
                    <select class="quiz-input" data-correct="3" data-page="chapter-2">
                      <option value="">-- Select Answer --</option>
                      <option value="1">Transmitted signals</option>
                      <option value="2">Reflected signals</option>
                      <option value="3">Radiated noise</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>

            <button class="btn" onclick="history.back()">← Back to Home</button>
          </div>

          <!-- Quiz page 3 -->
          <div class="page" id="page-quiz3">
            <h1>Chapter 3: Signal Processing - Quiz</h1>
            <p>Answer all questions to complete this chapter.</p>

            <table class="quiz-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Your Answer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>FFT stands for:</td>
                  <td>
                    <select class="quiz-input" data-correct="1" data-page="chapter-3">
                      <option value="">-- Select Answer --</option>
                      <option value="1">Fast Fourier Transform</option>
                      <option value="2">Frequency Filter Transform</option>
                      <option value="3">Forward Fourier Technique</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td>Beamforming is used to:</td>
                  <td>
                    <select class="quiz-input" data-correct="2" data-page="chapter-3">
                      <option value="">-- Select Answer --</option>
                      <option value="1">Increase signal power</option>
                      <option value="2">Focus acoustic energy in a direction</option>
                      <option value="3">Filter out noise</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>

            <button class="btn" onclick="history.back()">← Back to Home</button>
          </div>
        </div>
      </div>
    `;

    // Setup state management
    const state = {
      session: null as SessionData | null,
      cache: {
        totals: { answered: 0, correct: 0 },
        pages: {},
      } as SessionCache,
    };

    // Utility functions
    function logEvent(message: string) {
      const log = container.querySelector('#event-log')!;
      const entry = document.createElement('div');
      entry.className = 'event-entry';
      entry.innerHTML = `
        <div class="event-time">${new Date().toLocaleTimeString()}</div>
        <div>${message}</div>
      `;
      log.insertBefore(entry, log.firstChild);
    }

    function updateDisplays() {
      // Update session display
      const sessionDisplay = container.querySelector('#session-display')!;
      if (state.session) {
        sessionDisplay.innerHTML = `
          <strong>${state.session.name}</strong><br>
          <small>ID: ${state.session.serviceId}</small><br>
          <small>Expires: ${new Date(state.session.expiresAt).toLocaleTimeString()}</small>
        `;
      } else {
        sessionDisplay.textContent = 'Not logged in';
      }

      // Update cache display
      const cacheDisplay = container.querySelector('#cache-display')!;
      cacheDisplay.textContent = JSON.stringify(state.cache.pages, null, 2);

      // Update totals
      (container.querySelector('#total-answered') as HTMLElement).textContent =
        String(state.cache.totals.answered);
      (container.querySelector('#total-correct') as HTMLElement).textContent =
        String(state.cache.totals.correct);

      // Update home page badges
      updateBadges();
    }

    function updateBadges() {
      const homeNav = container.querySelector('#home-nav');
      if (homeNav) {
        injectBadges(homeNav as HTMLElement, state.cache);
      }
    }

    function calculatePageState(pageId: string): 'unstarted' | 'incomplete' | 'complete' {
      const quizInputs = Array.from(
        container.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
          `.quiz-input[data-page="${pageId}"]`,
        ),
      );

      if (quizInputs.length === 0) return 'unstarted';

      const allAnswered = quizInputs.every((input) => input.value.trim() !== '');
      const allCorrect = quizInputs.every((input) => {
        if (!input.value.trim()) return false;
        return input.classList.contains('correct');
      });

      if (!allAnswered) return quizInputs.some((input) => input.value.trim()) ? 'incomplete' : 'unstarted';
      if (allCorrect) return 'complete';
      return 'incomplete';
    }

    // Tab navigation
    container.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const pageId = (tab as HTMLElement).dataset.page;

        // Update tabs
        container.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        // Update pages
        container.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
        container.querySelector(`#page-${pageId}`)?.classList.add('active');

        logEvent(`📄 Navigated to ${(tab as HTMLElement).textContent}`);
      });
    });

    // Login handler
    container.querySelector('#btn-login')!.addEventListener('click', () => {
      const serviceId = (container.querySelector('#service-id') as HTMLInputElement).value;
      const name = (container.querySelector('#student-name') as HTMLInputElement).value;

      if (!serviceId || !name) {
        alert('Please enter both Service ID and Name');
        return;
      }

      // Create session
      const now = new Date();
      state.session = {
        serviceId,
        name,
        release: '01-2025',
        loginTime: now.toISOString(),
        lastActivity: now.toISOString(),
        expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
        instructorUnlocked: false,
      };

      // Show session info
      const sessionInfo = container.querySelector('#session-info')!;
      sessionInfo.removeAttribute('style');
      (container.querySelector('#student-name-display') as HTMLElement).textContent = name;
      (container.querySelector('#student-id-display') as HTMLElement).textContent = serviceId;

      logEvent(`✅ Logged in as ${name} (${serviceId})`);
      updateDisplays();

      // Navigate to home
      (container.querySelector('.tab[data-page="home"]') as HTMLElement).click();
    });

    // Logout handler
    container.querySelector('#btn-logout')!.addEventListener('click', () => {
      state.session = null;
      state.cache = {
        totals: { answered: 0, correct: 0 },
        pages: {},
      };

      container.querySelector('#session-info')!.setAttribute('style', 'display: none;');
      logEvent('🚪 Logged out');
      updateDisplays();

      // Navigate to login
      (container.querySelector('.tab[data-page="login"]') as HTMLElement).click();
    });

    // Quiz input handlers
    container.querySelectorAll('.quiz-input').forEach((input) => {
      input.addEventListener('change', () => {
        const element = input as HTMLInputElement | HTMLSelectElement;
        const value = element.value.trim();
        const pageId = element.dataset.page!;

        if (!value || !state.session) return;

        // Check correctness
        let isCorrect = false;
        if (element.tagName === 'SELECT') {
          isCorrect = value === element.dataset.correct;
        } else {
          const correctValue = parseFloat(element.dataset.correct!);
          const tolerance = parseFloat(element.dataset.tolerance || '0');
          const inputValue = parseFloat(value);
          isCorrect = Math.abs(inputValue - correctValue) <= tolerance;
        }

        // Apply visual feedback
        element.classList.remove('correct', 'incorrect');
        element.classList.add(isCorrect ? 'correct' : 'incorrect');

        // Update cache
        if (!state.cache.pages[pageId]) {
          state.cache.pages[pageId] = {
            state: 'unstarted',
            answered: 0,
            correct: 0,
          };
        }

        state.cache.pages[pageId].answered++;
        if (isCorrect) state.cache.pages[pageId].correct++;

        // Update totals
        state.cache.totals.answered++;
        if (isCorrect) state.cache.totals.correct++;

        // Recalculate page state
        state.cache.pages[pageId].state = calculatePageState(pageId);

        logEvent(
          `${isCorrect ? '✅' : '❌'} Answer saved for ${pageId}: ${value} (${isCorrect ? 'correct' : 'incorrect'})`,
        );
        logEvent(`📊 Page state: ${state.cache.pages[pageId].state}`);

        updateDisplays();
      });
    });

    // Simulate timeout
    container.querySelector('#btn-simulate-timeout')!.addEventListener('click', () => {
      if (!state.session) {
        alert('No active session to timeout');
        return;
      }

      state.session.expiresAt = new Date(Date.now() - 1000).toISOString();
      logEvent('⏱️ Session expired (simulated)');
      alert('Session has expired. You will need to log in again.');
      (container.querySelector('#btn-logout') as HTMLElement).click();
    });

    // Clear all data
    container.querySelector('#btn-clear-all')!.addEventListener('click', () => {
      if (confirm('Clear all session data and cache?')) {
        state.session = null;
        state.cache = {
          totals: { answered: 0, correct: 0 },
          pages: {},
        };

        // Reset all quiz inputs
        container.querySelectorAll('.quiz-input').forEach((input) => {
          (input as HTMLInputElement | HTMLSelectElement).value = '';
          input.classList.remove('correct', 'incorrect');
        });

        logEvent('🗑️ All data cleared');
        updateDisplays();
      }
    });

    // Initial render
    setTimeout(() => {
      updateDisplays();
      logEvent('🚀 Workflow simulator initialized');
    }, 100);

    return container;
  },
};
