/**
 * Analysis Table Transformation Stories
 *
 * Demonstrates the dynamic transformation of analysis tables from
 * plain HTML to interactive input-enhanced tables.
 */

import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import { enhanceAnalysisTable } from '../../src/enhancers/analysis-table';

const meta: Meta = {
  title: 'Tables/Analysis Transformation',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Visualizes the progressive enhancement transformation: plain DITA HTML → interactive analysis table with auto-save inputs.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Side-by-side comparison of before and after transformation
 */
export const BeforeAfterComparison: Story = {
  name: 'Before/After Transformation',
  render: () => {
    setTimeout(() => {
      const enhancedTable = document.querySelector('#enhanced-table') as HTMLTableElement;
      if (enhancedTable) enhanceAnalysisTable(enhancedTable);
    }, 0);

    return html`
      <div style="padding: 2rem; font-family: sans-serif;">
        <h1>Analysis Table Progressive Enhancement</h1>
        <p>Demonstrates how plain DITA HTML tables are transformed into interactive analysis forms.</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
          <!-- BEFORE: Plain HTML -->
          <div>
            <h2 style="color: #6c757d;">❌ Before (Plain HTML)</h2>
            <div style="background-color: #f8f9fa; padding: 1rem; border-radius: 4px;">
              <p><strong>Static DITA Output</strong></p>
              <p>No JavaScript, no interaction, just plain HTML table cells.</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
              <thead>
                <tr>
                  <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Parameter</th>
                  <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Temperature</td>
                  <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
                </tr>
                <tr>
                  <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Depth</td>
                  <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
                </tr>
                <tr>
                  <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Salinity</td>
                  <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- AFTER: Enhanced with inputs -->
          <div>
            <h2 style="color: #28a745;">✅ After (Enhanced)</h2>
            <div style="background-color: #d4edda; padding: 1rem; border-radius: 4px;">
              <p><strong>Progressively Enhanced</strong></p>
              <p>Text inputs injected, auto-save enabled, data persisted.</p>
            </div>

            <table id="enhanced-table" class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
              <thead>
                <tr>
                  <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Parameter</th>
                  <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Temperature</td>
                  <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
                </tr>
                <tr>
                  <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Depth</td>
                  <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
                </tr>
                <tr>
                  <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Salinity</td>
                  <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="margin-top: 2rem; padding: 1.5rem; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <h3>🔄 Transformation Process</h3>
          <ol style="margin: 0.5rem 0;">
            <li><strong>Detect:</strong> Find tables with <code>qd-analysis</code> class</li>
            <li><strong>Parse:</strong> Identify editable cells (those without background-color)</li>
            <li><strong>Generate Keys:</strong> Create unique cell identifiers (R{row}C{col}#f:{hash})</li>
            <li><strong>Inject Inputs:</strong> Replace cell content with text inputs</li>
            <li><strong>Load Data:</strong> Restore previously saved values from storage</li>
            <li><strong>Attach Handlers:</strong> Enable auto-save with 200ms debouncing</li>
          </ol>
        </div>
      </div>
    `;
  },
};

/**
 * Animated transformation demonstration
 */
export const AnimatedTransformation: Story = {
  name: 'Animated Transformation',
  render: () => {
    // Delay enhancement to show the transformation
    setTimeout(() => {
      const table = document.querySelector('#animate-table') as HTMLTableElement;
      if (table) {
        // Add a visual highlight during transformation
        table.style.transition = 'all 0.3s ease-in-out';
        table.style.backgroundColor = '#fff3cd';

        setTimeout(() => {
          enhanceAnalysisTable(table);
          table.style.backgroundColor = 'transparent';
        }, 500);
      }
    }, 1000);

    return html`
      <div style="padding: 2rem; font-family: sans-serif;">
        <h2>Animated Transformation</h2>
        <p>Watch the table transform from static HTML to interactive form (1 second delay).</p>

        <div style="margin: 2rem 0; padding: 1rem; background-color: #d1ecf1; border-radius: 4px;">
          <strong>⏱️ Transformation Timeline:</strong>
          <ul style="margin: 0.5rem 0;">
            <li>0ms: Page loads with plain HTML</li>
            <li>1000ms: Enhancement begins (yellow highlight)</li>
            <li>1500ms: Inputs injected, handlers attached</li>
          </ul>
        </div>

        <table id="animate-table" class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
          <tbody>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem; width: 40%;">Observation 1:</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Observation 2:</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Observation 3:</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },
};

/**
 * Multiple tables on one page
 */
export const MultipleTablesTransformation: Story = {
  name: 'Multiple Tables on Page',
  render: () => {
    setTimeout(() => {
      const tables = document.querySelectorAll('.qd-analysis');
      tables.forEach(table => {
        if (table instanceof HTMLTableElement) {
          enhanceAnalysisTable(table);
        }
      });
    }, 0);

    return html`
      <div style="padding: 2rem; font-family: sans-serif;">
        <h2>Multiple Analysis Tables</h2>
        <p>Demonstrates enhancement of multiple analysis tables on a single page.</p>

        <div style="margin-bottom: 2rem;">
          <h3>Table 1: Contact Classification</h3>
          <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
            <thead>
              <tr>
                <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Contact</th>
                <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">C-001</td>
                <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              </tr>
              <tr>
                <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">C-002</td>
                <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 2rem;">
          <h3>Table 2: Environmental Data</h3>
          <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
            <tbody>
              <tr>
                <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem; width: 40%;">Sea State:</td>
                <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              </tr>
              <tr>
                <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Wind Speed:</td>
                <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="padding: 1rem; background-color: #d4edda; border-radius: 4px;">
          <strong>✅ Both tables enhanced independently</strong>
          <p style="margin: 0.5rem 0 0 0;">Each table gets its own unique table ID and cell keys for isolated data storage.</p>
        </div>
      </div>
    `;
  },
};

/**
 * Graceful degradation demonstration
 */
export const GracefulDegradation: Story = {
  name: 'Graceful Degradation',
  render: () => {
    // Intentionally don't enhance to show fallback
    return html`
      <div style="padding: 2rem; font-family: sans-serif;">
        <h2>Graceful Degradation</h2>
        <p>This story intentionally does NOT run the enhancer to demonstrate graceful degradation.</p>

        <div style="margin: 1rem 0; padding: 1rem; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <strong>⚠️ Scenario: JavaScript Disabled or Failed</strong>
          <p style="margin: 0.5rem 0 0 0;">
            If the enhancement script fails to load or JavaScript is disabled, the table remains as functional static HTML.
            Content authors can still create training materials, and students can print/read the content.
          </p>
        </div>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
          <thead>
            <tr>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Parameter</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Temperature</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">[Student would write here manually]</td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Pressure</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">[Student would write here manually]</td>
            </tr>
          </tbody>
        </table>

        <div style="padding: 1rem; background-color: #d4edda; border-radius: 4px;">
          <strong>✅ Zero Impact on Author Workflow</strong>
          <p style="margin: 0.5rem 0 0 0;">
            Content authors write standard DITA without any special markup beyond the <code>qd-analysis</code> class.
            The enhancement is completely opt-in and non-breaking.
          </p>
        </div>
      </div>
    `;
  },
};

/**
 * Cell key generation visualization
 */
export const CellKeyGeneration: Story = {
  name: 'Cell Key Generation',
  render: () => {
    setTimeout(() => {
      const table = document.querySelector('#key-demo-table') as HTMLTableElement;
      if (table) {
        enhanceAnalysisTable(table);

        // Show cell keys in the UI
        setTimeout(() => {
          const inputs = table.querySelectorAll('input');
          inputs.forEach(input => {
            const key = input.dataset.cellKey;
            if (key) {
              const badge = document.createElement('div');
              badge.textContent = key;
              badge.style.cssText = 'font-size: 0.7rem; color: #6c757d; margin-top: 0.25rem; font-family: monospace;';
              input.parentElement?.appendChild(badge);
            }
          });
        }, 100);
      }
    }, 0);

    return html`
      <div style="padding: 2rem; font-family: sans-serif;">
        <h2>Cell Key Generation</h2>
        <p>Each editable cell gets a unique key in format: <code>R{row}C{col}#f:{hash}</code></p>

        <table id="key-demo-table" class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
          <tbody>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem; width: 30%;">Cell A:</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">Content A</td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Cell B:</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">Content B</td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Cell C:</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">Content C</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 1rem; padding: 1rem; background-color: #d1ecf1; border-radius: 4px;">
          <strong>🔑 Key Components:</strong>
          <ul style="margin: 0.5rem 0;">
            <li><strong>R{row}:</strong> Row index (0-based) from tbody</li>
            <li><strong>C{col}:</strong> Column index (0-based)</li>
            <li><strong>#f:{hash}:</strong> 8-char content hash for uniqueness</li>
          </ul>
          <p style="margin-top: 0.5rem;">
            Keys are shown below each input in this demo. In production, they're stored as data attributes.
          </p>
        </div>
      </div>
    `;
  },
};
