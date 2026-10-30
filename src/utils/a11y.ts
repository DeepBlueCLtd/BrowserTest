/**
 * Accessibility helpers for progressively enhanced DITA content
 * (SRD 013 A11Y-01, A11Y-02, A11Y-03).
 */

/** Class that hides text visually but keeps it for screen readers. */
export const SR_ONLY_CLASS = 'qd-sr-only';

/** Id of the shared polite live region. */
export const LIVE_REGION_ID = 'qd-live-region';

let idCounter = 0;

/**
 * Return the element's id, assigning a unique one first if it has none.
 *
 * DITA output gives some cells ids (table headers) but not body cells, so
 * `aria-labelledby` targets are created on demand.
 *
 * @param el - Element that needs an id
 * @param prefix - Prefix for a generated id
 * @returns The element's id
 */
export function ensureId(el: Element, prefix: string): string {
  if (!el.id) {
    idCounter++;
    el.id = `${prefix}-${idCounter}`;
  }
  return el.id;
}

/**
 * Announce a short message to screen-reader users through a shared, visually
 * hidden polite live region. The region is created on first use.
 *
 * @param message - Text to announce
 */
export function announce(message: string): void {
  let region = document.getElementById(LIVE_REGION_ID);
  if (!region) {
    region = document.createElement('div');
    region.id = LIVE_REGION_ID;
    region.className = SR_ONLY_CLASS;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
  }
  // Clear first so repeating the same message is announced again
  region.textContent = '';
  region.textContent = message;
}
