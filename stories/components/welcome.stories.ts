/**
 * Welcome Story - Phase 0 Bootstrap
 *
 * This story demonstrates that Storybook is correctly configured
 * and can render basic content for the Sonar Quiz System.
 */

import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import '../../src/index.js';

const meta: Meta = {
  title: 'Bootstrap/Welcome',
  tags: ['autodocs'],
  render: () => html`
    <div style="padding: 2rem; font-family: sans-serif;">
      <h1>🎉 Sonar Quiz System - Phase 0 Complete</h1>

      <div
        style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 1rem; margin: 1rem 0;"
      >
        <h3>✅ Toolchain Bootstrap Successful</h3>
        <p>The following tools are now configured:</p>
        <ul>
          <li>TypeScript 5.x with ES2022 target</li>
          <li>Lit 3 for Web Components</li>
          <li>Vite for build (IIFE + ESM outputs)</li>
          <li>Vitest for unit testing</li>
          <li>Playwright for E2E testing (file:// protocol support)</li>
          <li>Storybook with Lit framework (you're viewing it now!)</li>
          <li>Chromatic for visual regression</li>
          <li>ESLint + Prettier for code quality</li>
          <li>GitHub Actions CI workflow</li>
        </ul>
      </div>

      <div
        style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; margin: 1rem 0;"
      >
        <h3>📝 Frozen Contracts Published</h3>
        <p>Type contracts are now available at <code>src/types/contracts.ts</code></p>
        <p>These types are FROZEN and require version bump + migration for changes.</p>
      </div>

      <div
        style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 1rem; margin: 1rem 0;"
      >
        <h3>🎨 Demo Fixtures Created</h3>
        <p>Example HTML files are available:</p>
        <ul>
          <li><code>demo/quiz-examples.html</code> - Quiz table demonstrations</li>
          <li><code>demo/analysis-examples.html</code> - Analysis table demonstrations</li>
        </ul>
      </div>

      <div style="margin-top: 2rem; padding: 1rem; background-color: #f8f9fa; border-radius: 4px;">
        <h3>🚀 Next Steps: Phase 1</h3>
        <p>Phase 1 will implement:</p>
        <ol>
          <li>Storage Layer (IndexedDB adapter)</li>
          <li>Session Management (30-minute timeout)</li>
          <li>Validation & Utilities (table validation, state calculator)</li>
        </ol>
      </div>
    </div>
  `,
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};
