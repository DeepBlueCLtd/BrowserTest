/**
 * Secure Logging Utility
 *
 * Provides controlled logging with:
 * - Debug mode filtering
 * - Sensitive data sanitization
 * - Consistent formatting
 * - Production safety
 */

/**
 * Configuration interface
 */
interface LoggerConfig {
  /** Enable debug logging */
  debug: boolean;
  /** Application prefix for all logs */
  prefix: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  debug: false,
  prefix: '[Sonar Quiz]',
};

/**
 * Current logger configuration
 */
let config: LoggerConfig = { ...DEFAULT_CONFIG };

/**
 * Configure the logger
 *
 * @param newConfig - Partial configuration to merge with defaults
 */
export function configureLogger(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get current logger configuration
 */
export function getLoggerConfig(): Readonly<LoggerConfig> {
  return { ...config };
}

/**
 * Sanitize sensitive data for logging
 *
 * Masks service IDs, student names, and other PII
 *
 * @param data - Data to sanitize
 * @returns Sanitized version safe for logging
 */
function sanitize(data: unknown): unknown {
  if (typeof data === 'string') {
    // Mask service IDs (e.g., RN2344 → RN****)
    return data.replace(/\b([A-Z]{2})\d{4}\b/g, '$1****');
  }

  if (typeof data === 'object' && data !== null) {
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => sanitize(item));
    }

    // Handle objects - sanitize known sensitive fields
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === 'serviceId' && typeof value === 'string') {
        // Mask service ID
        sanitized[key] = value.replace(/\b([A-Z]{2})\d{4}\b/g, '$1****');
      } else if (key === 'name' && typeof value === 'string') {
        // Mask student name (show only first initial)
        sanitized[key] = value.charAt(0) + '***';
      } else if (key === 'password' || key === 'hash') {
        // Never log passwords or hashes
        sanitized[key] = '[REDACTED]';
      } else {
        // Recursively sanitize nested objects
        sanitized[key] = sanitize(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Debug log (only in debug mode)
 *
 * @param message - Log message
 * @param data - Optional data to log (will be sanitized)
 */
export function debug(message: string, ...data: unknown[]): void {
  if (!config.debug) {
    return;
  }

  const sanitizedData = data.map((item) => sanitize(item));
  // eslint-disable-next-line no-console
  console.log(config.prefix, message, ...sanitizedData);
}

/**
 * Info log (always logs)
 *
 * @param message - Log message
 * @param data - Optional data to log (will be sanitized)
 */
export function info(message: string, ...data: unknown[]): void {
  const sanitizedData = data.map((item) => sanitize(item));
  // eslint-disable-next-line no-console
  console.log(config.prefix, message, ...sanitizedData);
}

/**
 * Warning log (always logs)
 *
 * @param message - Warning message
 * @param data - Optional data to log (will be sanitized)
 */
export function warn(message: string, ...data: unknown[]): void {
  const sanitizedData = data.map((item) => sanitize(item));
  console.warn(config.prefix, message, ...sanitizedData);
}

/**
 * Error log (always logs)
 *
 * @param message - Error message
 * @param error - Optional error object or additional data
 */
export function error(message: string, error?: unknown): void {
  if (error instanceof Error) {
    console.error(config.prefix, message, {
      name: error.name,
      message: error.message,
      // Only include stack in debug mode
      ...(config.debug && { stack: error.stack }),
    });
  } else if (error) {
    const sanitizedError = sanitize(error);
    console.error(config.prefix, message, sanitizedError);
  } else {
    console.error(config.prefix, message);
  }
}

/**
 * Export logger as default object
 */
export const logger = {
  configure: configureLogger,
  getConfig: getLoggerConfig,
  debug,
  info,
  warn,
  error,
};

export default logger;
