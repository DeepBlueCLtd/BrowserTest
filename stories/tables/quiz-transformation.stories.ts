/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../src/enhancers/quiz-table';
import { enhanceQuizTable, injectQuizStyles } from '../../src/enhancers/quiz-table';

/**
 * Dynamic transformation stories showing how static DITA quiz tables
 * are progressively enhanced with interactive elements.
 *
 * ## Transformation Process
 * 1. Static HTML table with quiz data
 * 2. Parser detects question types (MCQ vs numeric)
 * 3. Answer column is enhanced with appropriate inputs
 * 4. Event handlers attached for auto-save
 * 5. Visual feedback applied based on correctness
 */
const meta: Meta = {
  title: 'Tables/Quiz Transformation',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates the progressive enhancement of static DITA quiz tables into interactive forms.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Before and After: MCQ Table
 * Shows static table transforming into interactive dropdown
 */
export const McqTransformation: Story = {
  render: () => {
    // Inject styles
    injectQuizStyles();

    // Schedule enhancement after render
    setTimeout(() => {
      const table = document.getElementById('mcq-demo');
      if (table && !table.classList.contains('qd-enhanced')) {
        enhanceQuizTable(table as HTMLTableElement);
      }
    }, 100);

    return html`
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 1rem;">
        <div>
          <h3>Before Enhancement</h3>
          <p style="color: #666;">Static DITA HTML table</p>
          <table class="qd-quiz" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                  Question
                </th>
                <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                  Answer
                </th>
                <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 0.75rem;">What is active sonar?</td>
                <td style="border: 1px solid #ddd; padding: 0.75rem;">1</td>
                <td style="border: 1px solid #ddd; padding: 0.75rem;">
                  <ol>
                    <li>Uses sound reflections to detect objects</li>
                    <li>Only listens for sounds</li>
                    <li>Uses radar waves</li>
                  </ol>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3>After Enhancement</h3>
          <p style="color: #666;">Interactive with dropdown</p>
          <table id="mcq-demo" class="qd-quiz" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                  Question
                </th>
                <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                  Answer
                </th>
                <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 0.75rem;">What is active sonar?</td>
                <td style="border: 1px solid #ddd; padding: 0.75rem;">1</td>
                <td style="border: 1px solid #ddd; padding: 0.75rem;">
                  <ol>
                    <li>Uses sound reflections to detect objects</li>
                    <li>Only listens for sounds</li>
                    <li>Uses radar waves</li>
                  </ol>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
};

/**
 * Before and After: Numeric Table
 * Shows static table transforming into interactive number input
 */
export const NumericTransformation: Story = {
  render: () => {
    injectQuizStyles();

    // Schedule enhancement after render
    setTimeout(() => {
      const table = document.getElementById('numeric-demo');
      if (table && !table.classList.contains('qd-enhanced')) {
        enhanceQuizTable(table as HTMLTableElement);
      }
    }, 100);

    return html`
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 1rem;">
        <div>
          <h3>Before Enhancement</h3>
          <p style="color: #666;">Static DITA HTML table</p>
          <table class="qd-quiz" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                  Question
                </th>
                <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                  Answer
                </th>
                <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 0.75rem;">
                  What is the speed of sound in seawater (m/s)?
                </td>
                <td style="border: 1px solid #ddd; padding: 0.75rem;">1500</td>
                <td style="border: 1px solid #ddd; padding: 0.75rem;">50</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3>After Enhancement</h3>
          <p style="color: #666;">Interactive with number input</p>
          <table id="numeric-demo" class="qd-quiz" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                  Question
                </th>
                <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                  Answer
                </th>
                <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 0.75rem;">
                  What is the speed of sound in seawater (m/s)?
                </td>
                <td style="border: 1px solid #ddd; padding: 0.75rem;">1500</td>
                <td style="border: 1px solid #ddd; padding: 0.75rem;">50</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
};

/**
 * Interactive Demo: Live Transformation
 * User can trigger transformation with a button
 */
export const LiveTransformation: Story = {
  render: () => {
    injectQuizStyles();

    return html`
      <div style="max-width: 800px; margin: 0 auto; padding: 1rem;">
        <h3>Live Transformation Demo</h3>
        <p style="color: #666; margin-bottom: 1rem;">
          Click the button to see the table transform in real-time
        </p>

        <button
          id="transform-btn"
          style="padding: 0.75rem 1.5rem; font-size: 1rem; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 1rem;"
          @click=${() => {
            const table = document.getElementById('live-table');
            const btn = document.getElementById('transform-btn');
            if (table && btn) {
              enhanceQuizTable(table as HTMLTableElement);
              (btn as HTMLButtonElement).disabled = true;
              (btn as HTMLButtonElement).textContent = '✓ Enhanced';
              (btn as HTMLButtonElement).style.background = '#4caf50';
            }
          }}
        >
          Enhance Table
        </button>

        <table id="live-table" class="qd-quiz" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                Question
              </th>
              <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">Answer</th>
              <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                Which type of sonar uses sound reflections?
              </td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">1</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                <ol>
                  <li>Active sonar</li>
                  <li>Passive sonar</li>
                  <li>Side-scan sonar</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                At what frequency (kHz) does hull-mounted sonar typically operate?
              </td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">5</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">0.5</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },
};

/**
 * Visual Feedback Demo
 * Shows correct and incorrect answer styling
 */
export const VisualFeedback: Story = {
  render: () => {
    injectQuizStyles();

    // Pre-saved answers to demonstrate visual feedback
    const savedAnswers = [
      { answer: '1', success: true, timestamp: new Date().toISOString() },
      { answer: '1450', success: false, timestamp: new Date().toISOString() },
    ];

    setTimeout(() => {
      const table = document.getElementById('feedback-table');
      if (table && !table.classList.contains('qd-enhanced')) {
        enhanceQuizTable(table as HTMLTableElement, savedAnswers);
      }
    }, 100);

    return html`
      <div style="max-width: 800px; margin: 0 auto; padding: 1rem;">
        <h3>Visual Feedback</h3>
        <p style="color: #666; margin-bottom: 1rem;">
          Table with answers showing correct (green) and incorrect (red) styling
        </p>

        <table id="feedback-table" class="qd-quiz" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                Question
              </th>
              <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">Answer</th>
              <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                What is active sonar? (Correct answer pre-filled)
              </td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">1</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                <ol>
                  <li>Uses sound reflections</li>
                  <li>Only listens</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                Speed of sound in water (m/s)? (Incorrect answer pre-filled)
              </td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">1500</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">50</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
          <h4 style="margin-top: 0;">Visual Feedback Key:</h4>
          <ul style="margin-bottom: 0;">
            <li><strong>Green background:</strong> Correct answer</li>
            <li><strong>Red background:</strong> Incorrect answer</li>
            <li><strong>Border color:</strong> Matches feedback (green/red)</li>
          </ul>
        </div>
      </div>
    `;
  },
};

/**
 * Mixed Question Types
 * Shows table with both MCQ and numeric questions being enhanced
 */
export const MixedQuestionTypes: Story = {
  render: () => {
    injectQuizStyles();

    setTimeout(() => {
      const table = document.getElementById('mixed-table');
      if (table && !table.classList.contains('qd-enhanced')) {
        enhanceQuizTable(table as HTMLTableElement);
      }
    }, 100);

    return html`
      <div style="max-width: 900px; margin: 0 auto; padding: 1rem;">
        <h3>Mixed Question Types</h3>
        <p style="color: #666; margin-bottom: 1rem;">
          Table containing both MCQ (dropdowns) and numeric (inputs) questions
        </p>

        <table id="mixed-table" class="qd-quiz" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                Question
              </th>
              <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">Answer</th>
              <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                What is the primary function of sonar?
              </td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">3</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                <ol>
                  <li>Navigate using stars</li>
                  <li>Communicate with vessels</li>
                  <li>Detect underwater objects using sound</li>
                  <li>Measure water depth only</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                What is the speed of sound in seawater (m/s)?
              </td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">1500</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">50</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                Which sonar type uses reflections?
              </td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">1</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                <ol>
                  <li>Active sonar</li>
                  <li>Passive sonar</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                At what frequency (kHz) does typical hull-mounted sonar operate?
              </td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">5</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">0.5</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
          <h4 style="margin-top: 0;">Question Type Detection:</h4>
          <ul style="margin-bottom: 0;">
            <li><strong>MCQ:</strong> Detail column contains &lt;ol&gt; → Dropdown injected</li>
            <li>
              <strong>Numeric:</strong> Detail column contains number (tolerance) → Number input
              injected
            </li>
          </ul>
        </div>
      </div>
    `;
  },
};

/**
 * Auto-save demonstration
 * Shows event emission when answers change
 */
export const AutoSaveDemo: Story = {
  render: () => {
    injectQuizStyles();

    setTimeout(() => {
      const table = document.getElementById('autosave-table');
      if (table && !table.classList.contains('qd-enhanced')) {
        enhanceQuizTable(table as HTMLTableElement);

        // Listen for answer-saved events
        document.addEventListener('qd:answer-saved', (e: Event) => {
          const detail = (e as CustomEvent).detail;
          const log = document.getElementById('event-log');
          if (log) {
            const entry = document.createElement('div');
            entry.style.padding = '0.5rem';
            entry.style.marginBottom = '0.5rem';
            entry.style.background = '#e8f5e9';
            entry.style.borderLeft = '4px solid #4caf50';
            entry.style.fontSize = '0.875rem';
            entry.innerHTML = `
              <strong>Answer Saved:</strong>
              Q${detail.questionIndex + 1} = "${detail.answer.answer}"
              (${detail.answer.success ? 'Correct' : 'Incorrect'})
              <br><small>${new Date(detail.answer.timestamp).toLocaleTimeString()}</small>
            `;
            log.prepend(entry);
          }
        });
      }
    }, 100);

    return html`
      <div style="max-width: 900px; margin: 0 auto; padding: 1rem;">
        <h3>Auto-Save Demo</h3>
        <p style="color: #666; margin-bottom: 1rem;">
          Change answers to see auto-save events in the log below
        </p>

        <table
          id="autosave-table"
          class="qd-quiz"
          style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;"
        >
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">
                Question
              </th>
              <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">Answer</th>
              <th style="border: 1px solid #ddd; padding: 0.75rem; background: #f5f5f5;">Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">Which type of sonar?</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">1</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">
                <ol>
                  <li>Active</li>
                  <li>Passive</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">Enter frequency (kHz)</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">5</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">0.5</td>
            </tr>
          </tbody>
        </table>

        <div style="border: 1px solid #ddd; border-radius: 4px; padding: 1rem;">
          <h4 style="margin-top: 0;">Event Log:</h4>
          <div id="event-log" style="max-height: 300px; overflow-y: auto;">
            <p style="color: #666; text-align: center; font-style: italic;">
              Select an answer above to see events...
            </p>
          </div>
        </div>

        <div style="margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
          <h4 style="margin-top: 0;">Auto-Save Behavior:</h4>
          <ul style="margin-bottom: 0;">
            <li><strong>Dropdowns:</strong> Save immediately on change</li>
            <li><strong>Text inputs:</strong> Debounced save (150ms after last keystroke)</li>
            <li><strong>Event:</strong> qd:answer-saved with answer details</li>
          </ul>
        </div>
      </div>
    `;
  },
};
