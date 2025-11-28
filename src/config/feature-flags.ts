/**
 * Feature Flags
 *
 * Compile-time feature toggles for the Sonar Quiz System.
 * Set via environment variables at build time.
 */

// Vite injects this at build time from ENCRYPT_STORAGE env var
declare const __ENCRYPT_STORAGE__: boolean;

/**
 * Enable storage obfuscation for IndexedDB data
 *
 * When true: StudentRecord values are XOR-encoded with base64 before storage.
 * When false: Data stored as plain JSON objects (readable in DevTools).
 *
 * IMPORTANT: Changing this flag requires data migration.
 * Use `window.SonarQuiz.migrateStorage()` to convert existing data.
 *
 * Set via environment variable at build time:
 *   ENCRYPT_STORAGE=true npm run build
 *
 * @default false - Development mode (readable data)
 */
export const ENCRYPT_STORAGE: boolean =
  typeof __ENCRYPT_STORAGE__ !== 'undefined' ? __ENCRYPT_STORAGE__ : false;
