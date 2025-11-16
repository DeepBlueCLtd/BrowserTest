/**
 * Security Event Logging Tests
 *
 * Tests for the security-aware logger that sanitizes PII and provides
 * structured logging for security events.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger, SecurityEventType, logger as defaultLogger } from '../../src/utils/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new Logger({ enabled: true, securityEvents: true });

    // Spy on console methods
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Logging', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug message');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test debug message'),
        '',
      );
    });

    it('should log info messages', () => {
      logger.info('Test info message');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Test info message'), '');
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test warning message'),
        '',
      );
    });

    it('should log error messages', () => {
      logger.error('Test error message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error message'),
        '',
      );
    });

    it('should include timestamp in log output', () => {
      logger.info('Test message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        '',
      );
    });
  });

  describe('Metadata Logging', () => {
    it('should log metadata with messages', () => {
      const metadata = { action: 'test', count: 5 };
      logger.info('Test with metadata', metadata);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test with metadata'),
        expect.objectContaining({ action: 'test', count: 5 }),
      );
    });

    it('should handle empty metadata', () => {
      logger.info('Test message', {});

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('PII Sanitization', () => {
    it('should redact password fields', () => {
      const metadata = { username: 'john', password: 'secret123' };
      logger.info('Login attempt', metadata);

      const callArgs = consoleInfoSpy.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('password', '[REDACTED]');
      expect(callArgs[1]).not.toHaveProperty('password', 'secret123');
    });

    it('should redact serviceId fields', () => {
      const metadata = { serviceId: 'TEST123', action: 'submit' };
      logger.info('Answer submitted', metadata);

      const callArgs = consoleInfoSpy.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('serviceId', '[REDACTED]');
    });

    it('should redact name fields', () => {
      const metadata = { name: 'John Doe', release: '01-2025' };
      logger.info('Session created', metadata);

      const callArgs = consoleInfoSpy.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('name', '[REDACTED]');
      expect(callArgs[1]).toHaveProperty('release', '01-2025');
    });

    it('should redact email fields', () => {
      const metadata = { email: 'test@example.com', action: 'register' };
      logger.info('User action', metadata);

      const callArgs = consoleInfoSpy.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('email', '[REDACTED]');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(150);
      const metadata = { data: longString };
      logger.info('Long data', metadata);

      const callArgs = consoleInfoSpy.mock.calls[0];
      const loggedMetadata = callArgs[1] as Record<string, unknown>;
      const truncated = loggedMetadata.data as string;
      expect(truncated).toHaveLength(103); // 100 + '...'
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('should preserve non-sensitive fields', () => {
      const metadata = {
        action: 'submit',
        questionIndex: 5,
        success: true,
        timestamp: '2025-01-15T10:00:00Z',
      };
      logger.info('Quiz answer', metadata);

      const callArgs = consoleInfoSpy.mock.calls[0];
      expect(callArgs[1]).toMatchObject(metadata);
    });
  });

  describe('Security Event Logging', () => {
    it('should log authentication attempt events', () => {
      logger.logSecurityEvent(SecurityEventType.AUTH_ATTEMPT);

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security Event: AUTH_ATTEMPT'),
        expect.any(Object),
      );
    });

    it('should log authentication success events', () => {
      logger.logSecurityEvent(SecurityEventType.AUTH_SUCCESS);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security Event: AUTH_SUCCESS'),
        expect.any(Object),
      );
    });

    it('should log authentication failure events', () => {
      logger.logSecurityEvent(SecurityEventType.AUTH_FAILURE);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security Event: AUTH_FAILURE'),
        expect.any(Object),
      );
    });

    it('should log lockout events', () => {
      logger.logSecurityEvent(SecurityEventType.AUTH_LOCKOUT, {
        remainingTime: 30000,
      });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security Event: AUTH_LOCKOUT'),
        expect.objectContaining({ remainingTime: 30000 }),
      );
    });

    it('should log session creation events', () => {
      logger.logSecurityEvent(SecurityEventType.SESSION_CREATED);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security Event: SESSION_CREATED'),
        expect.any(Object),
      );
    });

    it('should log XSS prevention events', () => {
      logger.logSecurityEvent(SecurityEventType.XSS_PREVENTED, {
        location: 'quiz-table.ts',
      });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security Event: XSS_PREVENTED'),
        expect.objectContaining({ location: 'quiz-table.ts' }),
      );
    });

    it('should sanitize PII in security event metadata', () => {
      logger.logSecurityEvent(SecurityEventType.AUTH_SUCCESS, {
        serviceId: 'TEST123',
        password: 'secret',
      });

      const callArgs = consoleInfoSpy.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('serviceId', '[REDACTED]');
      expect(callArgs[1]).toHaveProperty('password', '[REDACTED]');
    });
  });

  describe('Logger Configuration', () => {
    it('should not log when disabled', () => {
      const disabledLogger = new Logger({ enabled: false });

      disabledLogger.debug('Test');
      disabledLogger.info('Test');
      disabledLogger.warn('Test');
      disabledLogger.error('Test');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should not log security events when disabled', () => {
      const noSecurityLogger = new Logger({ enabled: true, securityEvents: false });

      noSecurityLogger.logSecurityEvent(SecurityEventType.AUTH_SUCCESS);

      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should enable security events when configured', () => {
      const securityLogger = new Logger({ enabled: true, securityEvents: true });

      securityLogger.logSecurityEvent(SecurityEventType.AUTH_SUCCESS);

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    });

    it('should default to enabled if no options provided', () => {
      const defaultEnabledLogger = new Logger();

      defaultEnabledLogger.info('Test');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Default Logger Instance', () => {
    it('should export a default logger instance', () => {
      expect(defaultLogger).toBeDefined();
      expect(defaultLogger).toBeInstanceOf(Logger);
    });

    it('should be usable for logging', () => {
      defaultLogger.info('Test from default logger');

      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined metadata gracefully', () => {
      expect(() => logger.info('Test', undefined)).not.toThrow();
    });

    it('should handle null values in metadata', () => {
      const metadata = { value: null, count: 0 };
      expect(() => logger.info('Test', metadata)).not.toThrow();
    });

    it('should handle nested objects in metadata', () => {
      const metadata = {
        user: { id: 1, name: 'John' },
        action: 'submit',
      };

      logger.info('Nested metadata', metadata);

      const callArgs = consoleInfoSpy.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('user');
      expect(callArgs[1]).toHaveProperty('action', 'submit');
    });

    it('should handle arrays in metadata', () => {
      const metadata = { items: [1, 2, 3], count: 3 };

      logger.info('Array metadata', metadata);

      const callArgs = consoleInfoSpy.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('items');
      expect(callArgs[1]).toHaveProperty('count', 3);
    });

    it('should handle special characters in messages', () => {
      expect(() => logger.info('Test <script>alert("xss")</script>')).not.toThrow();
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });
});
