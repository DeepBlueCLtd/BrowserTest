/**
 * Unit tests for logger utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  logger,
  setDebugMode,
  isDebugEnabled,
  maskServiceId,
  sanitize,
  debug,
  info,
  warn,
  error,
} from '../../../src/utils/logger.js';

describe('Logger - Debug Mode', () => {
  beforeEach(() => {
    setDebugMode(false);
  });

  it('should be disabled by default', () => {
    expect(isDebugEnabled()).toBe(false);
  });

  it('should enable debug mode when set to true', () => {
    setDebugMode(true);
    expect(isDebugEnabled()).toBe(true);
  });

  it('should disable debug mode when set to false', () => {
    setDebugMode(true);
    setDebugMode(false);
    expect(isDebugEnabled()).toBe(false);
  });
});

describe('maskServiceId', () => {
  it('should mask service ID keeping first 2 characters', () => {
    expect(maskServiceId('RN2344')).toBe('RN****');
  });

  it('should handle short IDs', () => {
    expect(maskServiceId('AB')).toBe('AB');
    expect(maskServiceId('A')).toBe('**');
  });

  it('should handle long IDs', () => {
    expect(maskServiceId('LONGSERVICEID')).toBe('LO***********');
  });

  it('should handle empty string', () => {
    expect(maskServiceId('')).toBe('**');
  });
});

describe('sanitize', () => {
  it('should remove sensitive fields (name, passwordHash)', () => {
    const data = {
      serviceId: 'RN2344',
      name: 'John Doe',
      passwordHash: 'abc123',
      score: 95,
    };

    const sanitized = sanitize(data);

    expect(sanitized).toHaveProperty('serviceId');
    expect(sanitized).toHaveProperty('score', 95);
    expect(sanitized).not.toHaveProperty('name');
    expect(sanitized).not.toHaveProperty('passwordHash');
  });

  it('should mask serviceId field', () => {
    const data = {
      serviceId: 'RN2344',
      score: 100,
    };

    const sanitized = sanitize(data);

    expect(sanitized.serviceId).toBe('RN****');
    expect(sanitized.score).toBe(100);
  });

  it('should handle nested objects', () => {
    const data = {
      user: {
        serviceId: 'RN2344',
        name: 'Secret Name',
      },
      metadata: {
        score: 95,
      },
    };

    const sanitized = sanitize(data);

    expect(sanitized.user).toBeDefined();
    if (sanitized.user && typeof sanitized.user === 'object') {
      expect(sanitized.user.serviceId).toBe('RN****');
      expect(sanitized.user).not.toHaveProperty('name');
    }
    expect(sanitized.metadata).toEqual({ score: 95 });
  });

  it('should handle arrays', () => {
    const data = {
      students: [
        { serviceId: 'RN2344', name: 'Alice' },
        { serviceId: 'RN5678', name: 'Bob' },
      ],
    };

    const sanitized = sanitize(data);

    expect(sanitized.students).toBeDefined();
    if (Array.isArray(sanitized.students)) {
      expect(sanitized.students[0]).toBeDefined();
      if (sanitized.students[0] && typeof sanitized.students[0] === 'object') {
        expect(sanitized.students[0].serviceId).toBe('RN****');
        expect(sanitized.students[0]).not.toHaveProperty('name');
      }
    }
  });

  it('should handle null and undefined', () => {
    expect(sanitize(null)).toBe(null);
    expect(sanitize(undefined)).toBe(undefined);
  });

  it('should handle primitives', () => {
    expect(sanitize('string')).toBe('string');
    expect(sanitize(123)).toBe(123);
    expect(sanitize(true)).toBe(true);
  });
});

describe('Logger - Output', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setDebugMode(false);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('debug()', () => {
    it('should not log when debug mode is disabled', () => {
      setDebugMode(false);
      debug('Test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log when debug mode is enabled', () => {
      setDebugMode(true);
      debug('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Test message');
    });

    it('should sanitize data in debug mode', () => {
      setDebugMode(true);
      const data = { serviceId: 'RN2344', name: 'Secret' };
      debug('User data', data);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[DEBUG] User data',
        expect.objectContaining({
          serviceId: 'RN****',
        })
      );
    });
  });

  describe('info()', () => {
    it('should always log info messages', () => {
      setDebugMode(false);
      info('Info message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Info message');
    });

    it('should sanitize data', () => {
      const data = { serviceId: 'RN2344', passwordHash: 'secret' };
      info('Data', data);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[INFO] Data',
        expect.not.objectContaining({
          passwordHash: expect.anything(),
        })
      );
    });
  });

  describe('warn()', () => {
    it('should log warning messages', () => {
      warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Warning message');
    });

    it('should sanitize data', () => {
      const data = { serviceId: 'RN2344', name: 'Secret' };
      warn('Warning', data);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] Warning',
        expect.objectContaining({
          serviceId: 'RN****',
        })
      );
    });
  });

  describe('error()', () => {
    it('should log error messages', () => {
      error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error message');
    });

    it('should handle Error objects', () => {
      const err = new Error('Test error');
      error('An error occurred', err);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] An error occurred',
        expect.objectContaining({
          name: 'Error',
          message: 'Test error',
        })
      );
    });

    it('should include stack trace in debug mode', () => {
      setDebugMode(true);
      const err = new Error('Test error');
      error('An error occurred', err);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] An error occurred',
        expect.objectContaining({
          stack: expect.any(String),
        })
      );
    });

    it('should not include stack trace when debug disabled', () => {
      setDebugMode(false);
      const err = new Error('Test error');
      error('An error occurred', err);

      const call = consoleErrorSpy.mock.calls[0];
      expect(call?.[1]).not.toHaveProperty('stack');
    });

    it('should sanitize non-Error objects', () => {
      const data = { serviceId: 'RN2344', name: 'Secret' };
      error('Error with data', data);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] Error with data',
        expect.objectContaining({
          serviceId: 'RN****',
        })
      );
    });
  });
});

describe('Logger object', () => {
  it('should export all methods', () => {
    expect(logger.setDebugMode).toBeDefined();
    expect(logger.isDebugEnabled).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.sanitize).toBeDefined();
    expect(logger.maskServiceId).toBeDefined();
  });
});
