/**
 * Global type declarations for compile-time constants
 */

/**
 * Build date injected at build time by Vite
 * Format: YYYY-MM-DD
 */
declare const __BUILD_DATE__: string;

/**
 * Environment variable type declarations
 */
interface ImportMetaEnv {
  /**
   * Development mode flag
   * @default false in production
   */
  readonly DEV: boolean;

  /**
   * Instructor password hash (SHA-256 or better)
   * Required for instructor mode authentication
   */
  readonly VITE_INSTRUCTOR_PASSWORD_HASH: string;

  /**
   * Enable session data encryption
   * @default true
   */
  readonly VITE_ENABLE_ENCRYPTION: boolean;

  /**
   * Enable rate limiting on authentication attempts
   * @default true
   */
  readonly VITE_ENABLE_RATE_LIMIT: boolean;

  /**
   * Enable security event logging
   * @default false
   */
  readonly VITE_ENABLE_SECURITY_LOGS: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
