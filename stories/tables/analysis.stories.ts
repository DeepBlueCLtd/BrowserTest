/**
 * Analysis Table Stories
 *
 * Demonstrates analysis table functionality with various configurations
 * and states for the Sonar Quiz System.
 */

import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import { enhanceAnalysisTable } from '../../src/enhancers/analysis-table';

const meta: Meta = {
  title: 'Tables/Analysis',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Analysis tables allow students to capture notes and calculations in structured cells. Cells without background-color style are editable.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Basic analysis table with mixed read-only and editable cells
 */
export const BasicAnalysisTable: Story = {
  name: 'Basic Analysis Table',
  render: () => {
    setTimeout(() => {
      const table = document.querySelector('.qd-analysis') as HTMLTableElement;
      if (table) enhanceAnalysisTable(table);
    }, 0);

    return html`
      <div style="padding: 2rem; font-family: sans-serif;">
        <h2>Basic Analysis Table</h2>
        <p>Cells with gray background are read-only. White cells are editable.</p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
          <thead>
            <tr>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Parameter</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Value</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Temperature</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Depth</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },
};

/**
 * Sonar contact analysis table
 */
export const SonarContactAnalysis: Story = {
  name: 'Sonar Contact Analysis',
  render: () => {
    setTimeout(() => {
      const table = document.querySelector('.qd-analysis') as HTMLTableElement;
      if (table) enhanceAnalysisTable(table);
    }, 0);

    return html`
      <div style="padding: 2rem; font-family: sans-serif;">
        <h2>Sonar Contact Analysis</h2>
        <p>Students analyze sonar contacts and fill in classification details.</p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
          <thead>
            <tr>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Contact ID</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Bearing (°)</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Classification</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Confidence</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">C-001</td>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">045</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">C-002</td>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">120</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">C-003</td>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">270</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },
};

/**
 * Performance calculation worksheet
 */
export const PerformanceCalculations: Story = {
  name: 'Performance Calculations',
  render: () => {
    setTimeout(() => {
      const table = document.querySelector('.qd-analysis') as HTMLTableElement;
      if (table) enhanceAnalysisTable(table);
    }, 0);

    return html`
      <div style="padding: 2rem; font-family: sans-serif;">
        <h2>Sonar Performance Calculations</h2>
        <p>Students perform calculations and record intermediate values.</p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
          <thead>
            <tr>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Parameter</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Given Value</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Your Calculation</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Source Level (SL)</td>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">220 dB</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Transmission Loss (TL)</td>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">80 dB</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Target Strength (TS)</td>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">15 dB</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Signal Excess (SE)</td>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">-</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },
};

/**
 * Tactical decision matrix
 */
export const TacticalDecisionMatrix: Story = {
  name: 'Tactical Decision Matrix',
  render: () => {
    setTimeout(() => {
      const table = document.querySelector('.qd-analysis') as HTMLTableElement;
      if (table) enhanceAnalysisTable(table);
    }, 0);

    return html`
      <div style="padding: 2rem; font-family: sans-serif;">
        <h2>Tactical Decision Matrix</h2>
        <p>Students record their tactical analysis decisions.</p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
          <tbody>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem; width: 30%;">Threat Assessment:</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Recommended Action:</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Course Change (if any):</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Speed Change (if any):</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Sonar Mode Selection:</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Justification:</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },
};

/**
 * Pre-populated analysis table with existing data
 */
export const WithExistingData: Story = {
  name: 'With Existing Data',
  render: () => {
    setTimeout(() => {
      const table = document.querySelector('.qd-analysis') as HTMLTableElement;
      if (table) enhanceAnalysisTable(table);
    }, 0);

    return html`
      <div style="padding: 2rem; font-family: sans-serif;">
        <h2>Analysis Table with Existing Data</h2>
        <p>Demonstration of a table with pre-filled student data.</p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
          <thead>
            <tr>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Question</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Your Answer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">What is the primary advantage of active sonar?</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">Provides precise range and bearing information</td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">What is the primary disadvantage?</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;">Reveals own position to adversaries</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 1rem; padding: 1rem; background-color: #d1ecf1; border-radius: 4px;">
          <strong>Note:</strong> Input fields are automatically injected into editable cells. Changes are auto-saved with 200ms debouncing.
        </div>
      </div>
    `;
  },
};

/**
 * All editable cells
 */
export const AllEditableCells: Story = {
  name: 'All Editable Cells',
  render: () => {
    setTimeout(() => {
      const table = document.querySelector('.qd-analysis') as HTMLTableElement;
      if (table) enhanceAnalysisTable(table);
    }, 0);

    return html`
      <div style="padding: 2rem; font-family: sans-serif;">
        <h2>Fully Editable Grid</h2>
        <p>All cells are editable (no background-color styling).</p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },
};

/**
 * Environmental analysis
 */
export const EnvironmentalAnalysis: Story = {
  name: 'Environmental Analysis',
  render: () => {
    setTimeout(() => {
      const table = document.querySelector('.qd-analysis') as HTMLTableElement;
      if (table) enhanceAnalysisTable(table);
    }, 0);

    return html`
      <div style="padding: 2rem; font-family: sans-serif;">
        <h2>Environmental Analysis</h2>
        <p>Combination of pre-filled data and student input fields.</p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
          <thead>
            <tr>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Depth (m)</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Temperature (°C)</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Sound Speed (m/s)</th>
              <th style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">Layer Type</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">0</td>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">20</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">50</td>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">18</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
            <tr>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">100</td>
              <td style="background-color: #e9ecef; border: 1px solid #ddd; padding: 0.75rem;">12</td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
              <td style="border: 1px solid #ddd; padding: 0.75rem;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },
};
