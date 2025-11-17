/**
 * Instructor password configuration
 *
 * Retrieves the instructor password hash from the DOM, injected by
 * Oxygen XSL transform during DITA publishing.
 *
 * The password hash is stored in a hidden span element:
 * ```html
 * <span id="instructor.password.hash" style="display:none;">hash-value</span>
 * ```
 *
 * This approach allows different passwords per deployment without rebuilding
 * the JavaScript bundle.
 */

import { error } from '../utils/logger.js';

/**
 * DOM element ID containing the instructor password hash
 *
 * This element is injected by the Oxygen XSL transform using a parameter.
 */
const PASSWORD_HASH_ELEMENT_ID = 'instructor.password.hash';

/**
 * Get the instructor password hash from the DOM
 *
 * @returns The SHA-256 hash of the instructor password
 * @throws Error if password hash element not found or empty
 *
 * @example
 * ```typescript
 * try {
 *   const hash = getInstructorPasswordHash();
 *   console.log('Hash retrieved:', hash);
 * } catch (err) {
 *   console.error('Password hash not configured:', err);
 * }
 * ```
 */
export function getInstructorPasswordHash(): string {
  const hashElement = document.getElementById(PASSWORD_HASH_ELEMENT_ID);

  if (!hashElement) {
    const errorMsg = `Instructor password hash not found. Expected element with id="${PASSWORD_HASH_ELEMENT_ID}". Check Oxygen XSL transform configuration.`;
    error(errorMsg);
    throw new Error(errorMsg);
  }

  const hash = hashElement.textContent?.trim();

  if (!hash) {
    const errorMsg = `Instructor password hash element is empty. Check Oxygen parameter configuration.`;
    error(errorMsg);
    throw new Error(errorMsg);
  }

  // Validate hash format (should be 64 hex characters for SHA-256)
  if (!/^[a-f0-9]{64}$/i.test(hash)) {
    const errorMsg = `Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${hash.substring(0, 20)}...`;
    error(errorMsg);
    throw new Error(errorMsg);
  }

  return hash.toLowerCase(); // Normalize to lowercase
}

/**
 * Check if instructor password hash is configured
 *
 * @returns true if password hash element exists and is non-empty
 */
export function isInstructorPasswordConfigured(): boolean {
  try {
    getInstructorPasswordHash();
    return true;
  } catch {
    return false;
  }
}
