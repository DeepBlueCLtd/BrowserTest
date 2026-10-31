/**
 * Instructor password authentication.
 *
 * The single source of instructor-password hashing/verification. Previously the
 * SHA-256 + 12-char-truncation logic was duplicated verbatim in `qd-login.ts`
 * (`hashPassword`/`getExpectedHash`) and `qd-migration-dialog.ts`
 * (`validatePassword`). Both components now consume this module.
 *
 * The 12-character truncation keeps hashes short enough to paste into
 * author-friendly Oxygen configuration dialogs.
 */

import { CONFIG_IDS } from '../../config/dom-config-reader.js';
import { constantTimeCompare } from '../../utils/security.js';

/**
 * Hash a plaintext instructor password.
 *
 * @param plain - Plaintext password
 * @returns SHA-256 hex digest truncated to the first 12 characters
 */
export async function hashPassword(plain: string): Promise<string> {
  // First 12 characters keep the hash short enough for Oxygen dialogs
  return (await hashPasswordFull(plain)).substring(0, 12);
}

/**
 * Full-length SHA-256 hex digest of a plaintext instructor password.
 *
 * @param plain - Plaintext password
 * @returns 64-character lowercase hex digest
 */
export async function hashPasswordFull(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Read the configured instructor-password hash from the hidden config element.
 *
 * @returns The trimmed configured hash, or an empty string when not configured
 */
export function getExpectedInstructorHash(): string {
  const hashElement = document.getElementById(CONFIG_IDS.instructorHash);
  return hashElement?.textContent?.trim() || '';
}

/**
 * Verify a plaintext password against the configured instructor hash.
 *
 * @param plain - Plaintext password to check
 * @returns true when the password matches the configured hash; false when it
 *   does not match or when no instructor hash is configured
 */
export async function verifyInstructorPassword(plain: string): Promise<boolean> {
  const expectedHash = getExpectedInstructorHash().toLowerCase();
  if (!expectedHash) {
    return false;
  }
  // A publication may configure the full 64-hex digest instead of the short
  // 12-hex form, for a stronger check (SRD 013 SEC-11)
  const fullHash = await hashPasswordFull(plain);
  const actualHash = expectedHash.length === 64 ? fullHash : fullHash.substring(0, 12);
  return constantTimeCompare(actualHash, expectedHash);
}
