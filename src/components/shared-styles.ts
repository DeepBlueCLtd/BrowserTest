/**
 * Shared CSS-in-JS style fragments for top-level Lit components.
 *
 * These are reusable `css` fragments that can be composed into a component's
 * `static styles` array. Only genuinely identical, single-source declarations
 * live here so that adopting a fragment never changes a component's rendering.
 *
 * Note: instructor sub-components share a separate, instructor-specific bundle
 * in `qd-instructor/shared-styles.ts`.
 */

import { css } from 'lit';

/**
 * Loading spinner plus its keyframes. Adopted by components that show an
 * in-progress indicator (e.g. the migration dialog) and, going forward, the
 * reusable `<qd-spinner>` component.
 */
export const spinnerStyles = css`
  .spinner {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 3px solid #e0e0e0;
    border-top-color: #0066cc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
