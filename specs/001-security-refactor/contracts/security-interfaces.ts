/**
 * Security Interfaces Contract
 *
 * Defines the public API for security-related services and utilities.
 * These interfaces ensure consistent implementation across the security refactor.
 */

// ============================================================================
// Encryption Service
// ============================================================================

export interface IEncryptionService {
  /**
   * Encrypt sensitive data using AES-GCM
   * @param plaintext - Data to encrypt
   * @param key - Optional key (derives from session if not provided)
   * @returns Encrypted data with IV and salt
   */
  encrypt(plaintext: string, key?: CryptoKey): Promise<EncryptedData>;

  /**
   * Decrypt data encrypted with encrypt()
   * @param encrypted - Encrypted data with IV and salt
   * @param key - Optional key (derives from session if not provided)
   * @returns Original plaintext
   * @throws {Error} If decryption fails or data is corrupted
   */
  decrypt(encrypted: EncryptedData, key?: CryptoKey): Promise<string>;

  /**
   * Derive encryption key from password or session ID
   * @param secret - Password or session ID
   * @param salt - Salt for key derivation
   * @returns Crypto key for encryption/decryption
   */
  deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey>;

  /**
   * Generate cryptographically secure random values
   * @param length - Number of bytes to generate
   * @returns Random bytes
   */
  generateRandom(length: number): Uint8Array;
}

export interface EncryptedData {
  iv: string;         // Base64 encoded initialization vector
  salt: string;       // Base64 encoded salt
  ciphertext: string; // Base64 encoded encrypted data
  timestamp: string;  // ISO 8601 timestamp
}

// ============================================================================
// Authentication Service
// ============================================================================

export interface IAuthenticationService {
  /**
   * Validate instructor password
   * @param password - Password to validate
   * @returns Success and optional lockout info
   */
  validatePassword(password: string): Promise<AuthResult>;

  /**
   * Check if authentication is currently locked out
   * @returns Lockout status and remaining time
   */
  isLockedOut(): LockoutStatus;

  /**
   * Reset authentication state (for testing or admin)
   */
  resetAuthState(): void;

  /**
   * Get authentication history for audit
   * @param limit - Maximum number of entries
   * @returns Recent authentication attempts
   */
  getAuthHistory(limit?: number): AuthAttempt[];
}

export interface AuthResult {
  success: boolean;
  attemptsRemaining?: number;
  lockoutUntil?: Date;
  message: string;
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds?: number;
  message: string;
}

export interface AuthAttempt {
  timestamp: Date;
  success: boolean;
  attemptNumber: number;
}

// ============================================================================
// Rate Limiter
// ============================================================================

export interface IRateLimiter {
  /**
   * Check if action is allowed based on rate limit
   * @param key - Unique key for the rate limited action
   * @returns Whether action is allowed
   */
  isAllowed(key: string): boolean;

  /**
   * Record an attempt for rate limiting
   * @param key - Unique key for the rate limited action
   * @param success - Whether the attempt succeeded
   * @returns Delay in ms before next attempt allowed
   */
  recordAttempt(key: string, success: boolean): number;

  /**
   * Get current delay for a rate limited action
   * @param key - Unique key for the rate limited action
   * @returns Delay in ms (0 if not limited)
   */
  getDelay(key: string): number;

  /**
   * Reset rate limit state for a key
   * @param key - Unique key to reset
   */
  reset(key: string): void;
}

// ============================================================================
// Security Logger
// ============================================================================

export interface ISecurityLogger {
  /**
   * Log a security event
   * @param event - Security event to log
   */
  logEvent(event: SecurityEvent): void;

  /**
   * Get security events
   * @param filter - Optional filter criteria
   * @param limit - Maximum number of events
   * @returns Filtered security events
   */
  getEvents(filter?: EventFilter, limit?: number): SecurityEvent[];

  /**
   * Clear old security logs
   * @param olderThan - Remove events older than this date
   * @returns Number of events removed
   */
  clearOldEvents(olderThan: Date): number;

  /**
   * Export security logs for audit
   * @returns CSV formatted log data
   */
  exportLogs(): string;
}

export interface SecurityEvent {
  eventId: string;
  eventType: SecurityEventType;
  timestamp: Date;
  metadata: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export enum SecurityEventType {
  AUTH_ATTEMPT = 'AUTH_ATTEMPT',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  AUTH_LOCKOUT = 'AUTH_LOCKOUT',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  DATA_CLEARED = 'DATA_CLEARED',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  XSS_BLOCKED = 'XSS_BLOCKED',
  INVALID_MESSAGE = 'INVALID_MESSAGE'
}

export interface EventFilter {
  eventType?: SecurityEventType;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// Message Validator
// ============================================================================

export interface IMessageValidator {
  /**
   * Sign a message for cross-tab communication
   * @param message - Message to sign
   * @returns Signed message with HMAC
   */
  signMessage(message: BroadcastMessage): Promise<SignedMessage>;

  /**
   * Validate a signed message
   * @param signed - Signed message to validate
   * @returns Validation result with original message if valid
   */
  validateMessage(signed: SignedMessage): Promise<ValidationResult>;

  /**
   * Generate a nonce for replay prevention
   * @returns Unique nonce string
   */
  generateNonce(): string;
}

export interface BroadcastMessage {
  type: string;
  data: any;
}

export interface SignedMessage {
  type: string;
  data: any;
  nonce: string;
  timestamp: string;
  signature: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: BroadcastMessage;
  error?: string;
}

// ============================================================================
// DOM Sanitizer
// ============================================================================

export interface IDOMSanitizer {
  /**
   * Sanitize user input to prevent XSS
   * @param input - User input to sanitize
   * @param options - Sanitization options
   * @returns Sanitized string safe for display
   */
  sanitizeInput(input: string, options?: SanitizeOptions): string;

  /**
   * Safely set text content of an element
   * @param element - DOM element to update
   * @param content - Content to set (will be escaped)
   */
  setTextContent(element: Element, content: string): void;

  /**
   * Create a safe text node from user input
   * @param content - Content for text node
   * @returns Safe text node
   */
  createTextNode(content: string): Text;

  /**
   * Check if content contains potential XSS
   * @param content - Content to check
   * @returns True if potentially dangerous
   */
  isPotentiallyDangerous(content: string): boolean;
}

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  stripScripts?: boolean;
  stripStyles?: boolean;
  stripEvents?: boolean;
}

// ============================================================================
// Comparison Utilities
// ============================================================================

export interface IComparisonUtils {
  /**
   * Constant-time string comparison to prevent timing attacks
   * @param a - First string
   * @param b - Second string
   * @returns True if strings are equal
   */
  constantTimeCompare(a: string, b: string): boolean;

  /**
   * Constant-time buffer comparison
   * @param a - First buffer
   * @param b - Second buffer
   * @returns True if buffers are equal
   */
  constantTimeBufferCompare(a: Uint8Array, b: Uint8Array): boolean;
}

// ============================================================================
// Storage Helpers
// ============================================================================

export interface IStorageHelpers {
  /**
   * Safely get JSON from storage
   * @param key - Storage key
   * @param storage - Storage type (session or local)
   * @returns Parsed JSON or null
   */
  getJSON<T>(key: string, storage?: Storage): T | null;

  /**
   * Safely set JSON in storage
   * @param key - Storage key
   * @param value - Value to store
   * @param storage - Storage type (session or local)
   */
  setJSON<T>(key: string, value: T, storage?: Storage): void;

  /**
   * Get encrypted JSON from storage
   * @param key - Storage key
   * @param storage - Storage type
   * @returns Decrypted and parsed JSON or null
   */
  getEncryptedJSON<T>(key: string, storage?: Storage): Promise<T | null>;

  /**
   * Set encrypted JSON in storage
   * @param key - Storage key
   * @param value - Value to encrypt and store
   * @param storage - Storage type
   */
  setEncryptedJSON<T>(key: string, value: T, storage?: Storage): Promise<void>;
}

// ============================================================================
// DOM Cache
// ============================================================================

export interface IDOMCache {
  /**
   * Get element from cache or query DOM
   * @param selector - CSS selector
   * @returns Cached or queried element
   */
  get(selector: string): Element | null;

  /**
   * Get all elements from cache or query DOM
   * @param selector - CSS selector
   * @returns Cached or queried elements
   */
  getAll(selector: string): Element[];

  /**
   * Invalidate cache entry
   * @param selector - Selector to invalidate (or all if not provided)
   */
  invalidate(selector?: string): void;

  /**
   * Get cache statistics
   * @returns Cache hit/miss statistics
   */
  getStats(): CacheStats;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

// ============================================================================
// Debouncer
// ============================================================================

export interface IDebouncer {
  /**
   * Debounce a function call
   * @param key - Unique key for this debounced action
   * @param fn - Function to debounce
   * @param delay - Delay in milliseconds
   */
  debounce(key: string, fn: () => void, delay: number): void;

  /**
   * Cancel a debounced call
   * @param key - Key of debounced action to cancel
   */
  cancel(key: string): void;

  /**
   * Cancel all debounced calls
   */
  cancelAll(): void;

  /**
   * Check if a debounced call is pending
   * @param key - Key to check
   * @returns True if pending
   */
  isPending(key: string): boolean;
}