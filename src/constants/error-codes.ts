/**
 * Error Code Constants
 *
 * Centralized error codes for security-safe error reporting.
 * These codes prevent leaking sensitive implementation details in production logs.
 *
 * Error Code Format: [COMPONENT]_[ERROR_TYPE]_[SPECIFIC_ERROR]
 * - COMPONENT: QT (Quiz Table), AT (Analysis Table), SS (Session Service), ST (Storage), etc.
 * - ERROR_TYPE: VAL (Validation), INIT (Initialization), OP (Operation), etc.
 * - SPECIFIC_ERROR: Descriptive short name
 *
 * Usage:
 * ```typescript
 * import { ERROR_CODES } from '../constants/error-codes';
 * logger.warn('Operation failed', { code: ERROR_CODES.QT_INIT_NO_TABLE });
 * ```
 */

/**
 * Error codes enumeration
 */
export const ERROR_CODES = {
  // Quiz Table - Initialization
  QT_INIT_NO_TABLE: 'QT_INIT_NO_TABLE',
  QT_INIT_NOT_PREPARED: 'QT_INIT_NOT_PREPARED',
  QT_INIT_NO_QUESTIONS: 'QT_INIT_NO_QUESTIONS',

  // Quiz Table - Validation
  QT_VAL_ERRORS: 'QT_VAL_ERRORS',
  QT_VAL_MISSING_METADATA: 'QT_VAL_MISSING_METADATA',
  QT_VAL_PARSE_OPTIONS: 'QT_VAL_PARSE_OPTIONS',
  QT_VAL_NO_OPTIONS: 'QT_VAL_NO_OPTIONS',

  // Quiz Table - Operations
  QT_OP_REVEAL_NO_TABLE: 'QT_OP_REVEAL_NO_TABLE',
  QT_OP_REVEAL_NO_ROWS: 'QT_OP_REVEAL_NO_ROWS',

  // Analysis Table - Operations
  AT_OP_SAVE_FAILED: 'AT_OP_SAVE_FAILED',
  AT_OP_LOAD_FAILED: 'AT_OP_LOAD_FAILED',

  // Analysis Table - Validation
  AT_VAL_NO_TABLE_ID: 'AT_VAL_NO_TABLE_ID',
  AT_VAL_NO_EDITABLE_CELLS: 'AT_VAL_NO_EDITABLE_CELLS',

  // Session Service - Data
  SS_DATA_CORRUPTED: 'SS_DATA_CORRUPTED',
  SS_DATA_MISSING_FIELDS: 'SS_DATA_MISSING_FIELDS',
  SS_DATA_MIGRATION_FAILED: 'SS_DATA_MIGRATION_FAILED',

  // Session Service - Operations
  SS_OP_CREATE_FAILED: 'SS_OP_CREATE_FAILED',
  SS_OP_UPDATE_FAILED: 'SS_OP_UPDATE_FAILED',
  SS_OP_CLEAR_FAILED: 'SS_OP_CLEAR_FAILED',

  // Storage - IndexedDB
  ST_IDB_OPEN_FAILED: 'ST_IDB_OPEN_FAILED',
  ST_IDB_SAVE_FAILED: 'ST_IDB_SAVE_FAILED',
  ST_IDB_LOAD_FAILED: 'ST_IDB_LOAD_FAILED',
  ST_IDB_DELETE_FAILED: 'ST_IDB_DELETE_FAILED',

  // Storage - Session/Local
  ST_CACHE_LOAD_FAILED: 'ST_CACHE_LOAD_FAILED',
  ST_CACHE_SAVE_FAILED: 'ST_CACHE_SAVE_FAILED',

  // Authentication
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_RATE_LIMIT_EXCEEDED: 'AUTH_RATE_LIMIT_EXCEEDED',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',

  // Encryption
  CRYPTO_ENCRYPTION_FAILED: 'CRYPTO_ENCRYPTION_FAILED',
  CRYPTO_DECRYPTION_FAILED: 'CRYPTO_DECRYPTION_FAILED',
  CRYPTO_KEY_GENERATION_FAILED: 'CRYPTO_KEY_GENERATION_FAILED',

  // Generic
  GENERIC_UNEXPECTED_ERROR: 'GENERIC_UNEXPECTED_ERROR',
  GENERIC_INVALID_INPUT: 'GENERIC_INVALID_INPUT',
} as const;

/**
 * Type for error codes
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Error code metadata for debugging
 *
 * Maps error codes to human-readable descriptions.
 * This is only used in development/debugging contexts.
 */
export const ERROR_CODE_DESCRIPTIONS: Record<ErrorCode, string> = {
  // Quiz Table - Initialization
  QT_INIT_NO_TABLE: 'Quiz table element not provided or not found',
  QT_INIT_NOT_PREPARED: 'Quiz table must be prepared before activation',
  QT_INIT_NO_QUESTIONS: 'No questions found in prepared quiz table',

  // Quiz Table - Validation
  QT_VAL_ERRORS: 'Quiz table failed validation checks',
  QT_VAL_MISSING_METADATA: 'Question missing required metadata attributes',
  QT_VAL_PARSE_OPTIONS: 'Failed to parse MCQ options from data attribute',
  QT_VAL_NO_OPTIONS: 'No options stored for MCQ question',

  // Quiz Table - Operations
  QT_OP_REVEAL_NO_TABLE: 'Cannot reveal answers: table not provided',
  QT_OP_REVEAL_NO_ROWS: 'Cannot reveal answers: no table rows found',

  // Analysis Table - Operations
  AT_OP_SAVE_FAILED: 'Failed to save analysis data to storage',
  AT_OP_LOAD_FAILED: 'Failed to load analysis data from storage',

  // Analysis Table - Validation
  AT_VAL_NO_TABLE_ID: 'Analysis table missing tableId attribute',
  AT_VAL_NO_EDITABLE_CELLS: 'No editable cells found in analysis table',

  // Session Service - Data
  SS_DATA_CORRUPTED: 'Session data is corrupted or invalid JSON',
  SS_DATA_MISSING_FIELDS: 'Session data missing required fields',
  SS_DATA_MIGRATION_FAILED: 'Failed to migrate session data to new format',

  // Session Service - Operations
  SS_OP_CREATE_FAILED: 'Failed to create new session',
  SS_OP_UPDATE_FAILED: 'Failed to update session data',
  SS_OP_CLEAR_FAILED: 'Failed to clear session data',

  // Storage - IndexedDB
  ST_IDB_OPEN_FAILED: 'Failed to open IndexedDB database',
  ST_IDB_SAVE_FAILED: 'Failed to save data to IndexedDB',
  ST_IDB_LOAD_FAILED: 'Failed to load data from IndexedDB',
  ST_IDB_DELETE_FAILED: 'Failed to delete data from IndexedDB',

  // Storage - Session/Local
  ST_CACHE_LOAD_FAILED: 'Failed to load cache from storage',
  ST_CACHE_SAVE_FAILED: 'Failed to save cache to storage',

  // Authentication
  AUTH_INVALID_CREDENTIALS: 'Invalid authentication credentials provided',
  AUTH_RATE_LIMIT_EXCEEDED: 'Too many authentication attempts',
  AUTH_SESSION_EXPIRED: 'Session has expired',

  // Encryption
  CRYPTO_ENCRYPTION_FAILED: 'Failed to encrypt data',
  CRYPTO_DECRYPTION_FAILED: 'Failed to decrypt data',
  CRYPTO_KEY_GENERATION_FAILED: 'Failed to generate encryption key',

  // Generic
  GENERIC_UNEXPECTED_ERROR: 'An unexpected error occurred',
  GENERIC_INVALID_INPUT: 'Invalid input provided',
};
