/**
 * Security-aware logging utilities
 *
 * Provides structured logging with automatic PII sanitization
 * and production-safe output control.
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Security event types
 */
export enum SecurityEventType {
  AUTH_ATTEMPT = 'AUTH_ATTEMPT',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  AUTH_LOCKOUT = 'AUTH_LOCKOUT',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  DATA_CLEARED = 'DATA_CLEARED',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  XSS_PREVENTED = 'XSS_PREVENTED',
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Security event log entry
 */
export interface SecurityEventLog {
  eventId: string;
  eventType: SecurityEventType;
  timestamp: string;
  metadata: Record<string, unknown>;
}

/**
 * Logger interface
 */
export interface ILogger {
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
  logSecurityEvent(eventType: SecurityEventType, metadata?: Record<string, unknown>): void;
}

/**
 * Base logger implementation
 *
 * This logger is safe for production use - it sanitizes all output
 * and can be configured to suppress logs entirely.
 */
export class Logger implements ILogger {
  private enabled: boolean;
  private securityEventsEnabled: boolean;

  constructor(options?: { enabled?: boolean; securityEvents?: boolean }) {
    this.enabled = options?.enabled ?? true;
    this.securityEventsEnabled = options?.securityEvents ?? false;
  }

  /**
   * Debug-level logging (development only)
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Info-level logging
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Warning-level logging
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Error-level logging
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Log security events
   */
  logSecurityEvent(eventType: SecurityEventType, metadata?: Record<string, unknown>): void {
    if (!this.securityEventsEnabled) return;

    const event: SecurityEventLog = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      metadata: this.sanitizeMetadata(metadata || {}),
    };

    this.log(LogLevel.INFO, `Security Event: ${eventType}`, event.metadata);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata: metadata ? this.sanitizeMetadata(metadata) : undefined,
    };

    // Route to appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        console.debug(`[${entry.timestamp}] ${message}`, entry.metadata || '');
        break;
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.info(`[${entry.timestamp}] ${message}`, entry.metadata || '');
        break;
      case LogLevel.WARN:
        console.warn(`[${entry.timestamp}] ${message}`, entry.metadata || '');
        break;
      case LogLevel.ERROR:
        console.error(`[${entry.timestamp}] ${message}`, entry.metadata || '');
        break;
    }
  }

  /**
   * Sanitize metadata to remove PII
   */
  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'serviceId', 'name', 'email'];

    for (const [key, value] of Object.entries(metadata)) {
      // Redact sensitive fields
      if (sensitiveKeys.includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 100) {
        // Truncate long strings
        sanitized[key] = value.substring(0, 100) + '...';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger({
  enabled: import.meta.env.DEV ?? true,
  securityEvents: import.meta.env.VITE_ENABLE_SECURITY_LOGS === true,
});
