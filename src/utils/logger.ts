/**
 * Structured logging with sanitization
 *
 * Provides debug/info/error logging with automatic sanitization of sensitive data.
 * Debug logs are controlled by a runtime flag to prevent production leakage.
 */

import type { ServiceId } from '../types/contracts.js';

/**
 * Debug mode flag
 *
 * Set to true for development logging, false for production.
 * Can be controlled via data-debug attribute on script tag.
 */
let debugEnabled = false;

/**
 * Enable or disable debug logging
 *
 * @param enabled - Whether to enable debug logs
 */
export function setDebugMode(enabled: boolean): void {
  debugEnabled = enabled;
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return debugEnabled;
}

/**
 * Mask sensitive service ID
 *
 * Replaces middle characters with asterisks for privacy.
 *
 * @param serviceId - Service ID to mask
 * @returns Masked service ID (e.g., "RN2344" → "RN****")
 *
 * @example
 * ```typescript
 * const masked = maskServiceId('RN2344');
 * console.log(masked); // "RN****"
 * ```
 */
export function maskServiceId(serviceId: ServiceId): string {
  if (serviceId.length < 2) {
    return '**';
  }
  if (serviceId.length === 2) {
    return serviceId; // Keep 2-char IDs unmasked
  }
  const prefix = serviceId.slice(0, 2);
  const suffix = '*'.repeat(serviceId.length - 2);
  return prefix + suffix;
}

/**
 * Sanitize object by removing or masking sensitive fields
 *
 * Removes: name, passwordHash
 * Masks: serviceId
 *
 * @param obj - Object to sanitize
 * @returns Sanitized copy of object
 *
 * @example
 * ```typescript
 * const data = { serviceId: 'RN2344', name: 'John Doe', score: 95 };
 * const safe = sanitize(data);
 * console.log(safe); // { serviceId: 'RN****', score: 95 }
 * ```
 */
export function sanitize<T>(obj: T): Partial<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Remove sensitive fields
    if (key === 'name' || key === 'passwordHash') {
      continue;
    }

    // Mask service IDs
    if (key === 'serviceId' && typeof value === 'string') {
      sanitized[key] = maskServiceId(value);
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized as Partial<T>;
}

/**
 * Log debug message (only in debug mode)
 *
 * @param message - Debug message
 * @param data - Optional data to log (will be sanitized)
 */
export function debug(message: string, data?: unknown): void {
  if (debugEnabled) {
    if (data !== undefined) {
      // eslint-disable-next-line no-console
      console.log(`[DEBUG] ${message}`, sanitize(data));
    } else {
      // eslint-disable-next-line no-console
      console.log(`[DEBUG] ${message}`);
    }
  }
}

/**
 * Log info message
 *
 * @param message - Info message
 * @param data - Optional data to log (will be sanitized)
 */
export function info(message: string, data?: unknown): void {
  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`[INFO] ${message}`, sanitize(data));
  } else {
    // eslint-disable-next-line no-console
    console.log(`[INFO] ${message}`);
  }
}

/**
 * Log error message
 *
 * @param message - Error message
 * @param error - Error object or data
 */
export function error(message: string, error?: unknown): void {
  if (error instanceof Error) {
    const errorObj: { name: string; message: string; stack?: string } = {
      name: error.name,
      message: error.message,
    };
    if (debugEnabled && error.stack) {
      errorObj.stack = error.stack;
    }
    console.error(`[ERROR] ${message}`, errorObj);
  } else if (error !== undefined) {
    console.error(`[ERROR] ${message}`, sanitize(error));
  } else {
    console.error(`[ERROR] ${message}`);
  }
}

/**
 * Log warning message
 *
 * @param message - Warning message
 * @param data - Optional data to log (will be sanitized)
 */
export function warn(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.warn(`[WARN] ${message}`, sanitize(data));
  } else {
    console.warn(`[WARN] ${message}`);
  }
}

/**
 * Logger object with all methods
 */
export const logger = {
  setDebugMode,
  isDebugEnabled,
  debug,
  info,
  warn,
  error,
  sanitize,
  maskServiceId,
};
