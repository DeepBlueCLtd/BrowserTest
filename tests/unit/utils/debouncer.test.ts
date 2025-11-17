/**
 * Unit tests for Debouncer utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Debouncer } from '../../../src/utils/debouncer.js';

describe('Debouncer', () => {
  let debouncer: Debouncer;

  beforeEach(() => {
    debouncer = new Debouncer();
    vi.useFakeTimers();
  });

  describe('debounce()', () => {
    it('should execute function after delay', () => {
      const fn = vi.fn();

      debouncer.debounce('test', fn, 200);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(200);

      expect(fn).toHaveBeenCalledOnce();
    });

    it('should cancel previous timer when called again', () => {
      const fn = vi.fn();

      debouncer.debounce('test', fn, 200);
      vi.advanceTimersByTime(100);

      debouncer.debounce('test', fn, 200);
      vi.advanceTimersByTime(100);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledOnce();
    });

    it('should use default delay of 200ms', () => {
      const fn = vi.fn();

      debouncer.debounce('test', fn);

      vi.advanceTimersByTime(199);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should handle multiple independent operations', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      debouncer.debounce('op1', fn1, 200);
      debouncer.debounce('op2', fn2, 300);

      vi.advanceTimersByTime(200);
      expect(fn1).toHaveBeenCalledOnce();
      expect(fn2).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn2).toHaveBeenCalledOnce();
    });

    it('should only execute last function when called multiple times', () => {
      const fn1 = vi.fn(() => 'first');
      const fn2 = vi.fn(() => 'second');
      const fn3 = vi.fn(() => 'third');

      debouncer.debounce('test', fn1, 200);
      debouncer.debounce('test', fn2, 200);
      debouncer.debounce('test', fn3, 200);

      vi.advanceTimersByTime(200);

      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
      expect(fn3).toHaveBeenCalledOnce();
    });
  });

  describe('cancel()', () => {
    it('should cancel pending operation', () => {
      const fn = vi.fn();

      debouncer.debounce('test', fn, 200);

      const cancelled = debouncer.cancel('test');

      expect(cancelled).toBe(true);

      vi.advanceTimersByTime(200);

      expect(fn).not.toHaveBeenCalled();
    });

    it('should return false for non-existent operation', () => {
      const cancelled = debouncer.cancel('nonexistent');

      expect(cancelled).toBe(false);
    });

    it('should allow new operation after cancel', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      debouncer.debounce('test', fn1, 200);
      debouncer.cancel('test');
      debouncer.debounce('test', fn2, 200);

      vi.advanceTimersByTime(200);

      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledOnce();
    });
  });

  describe('cancelAll()', () => {
    it('should cancel all pending operations', () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();
      const fn3 = vi.fn();

      debouncer.debounce('op1', fn1, 200);
      debouncer.debounce('op2', fn2, 200);
      debouncer.debounce('op3', fn3, 200);

      const count = debouncer.cancelAll();

      expect(count).toBe(3);

      vi.advanceTimersByTime(200);

      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).not.toHaveBeenCalled();
      expect(fn3).not.toHaveBeenCalled();
    });

    it('should return 0 when no operations pending', () => {
      const count = debouncer.cancelAll();

      expect(count).toBe(0);
    });
  });

  describe('isPending()', () => {
    it('should return true for pending operation', () => {
      const fn = vi.fn();

      debouncer.debounce('test', fn, 200);

      expect(debouncer.isPending('test')).toBe(true);
    });

    it('should return false after operation executes', () => {
      const fn = vi.fn();

      debouncer.debounce('test', fn, 200);

      vi.advanceTimersByTime(200);

      expect(debouncer.isPending('test')).toBe(false);
    });

    it('should return false for non-existent operation', () => {
      expect(debouncer.isPending('nonexistent')).toBe(false);
    });

    it('should return false after cancel', () => {
      const fn = vi.fn();

      debouncer.debounce('test', fn, 200);
      debouncer.cancel('test');

      expect(debouncer.isPending('test')).toBe(false);
    });
  });

  describe('getPendingCount()', () => {
    it('should return 0 initially', () => {
      expect(debouncer.getPendingCount()).toBe(0);
    });

    it('should return count of pending operations', () => {
      const fn = vi.fn();

      debouncer.debounce('op1', fn, 200);
      expect(debouncer.getPendingCount()).toBe(1);

      debouncer.debounce('op2', fn, 200);
      expect(debouncer.getPendingCount()).toBe(2);

      debouncer.debounce('op3', fn, 200);
      expect(debouncer.getPendingCount()).toBe(3);
    });

    it('should decrement after operations execute', () => {
      const fn = vi.fn();

      debouncer.debounce('op1', fn, 100);
      debouncer.debounce('op2', fn, 200);

      expect(debouncer.getPendingCount()).toBe(2);

      vi.advanceTimersByTime(100);

      expect(debouncer.getPendingCount()).toBe(1);

      vi.advanceTimersByTime(100);

      expect(debouncer.getPendingCount()).toBe(0);
    });

    it('should return 0 after cancelAll', () => {
      const fn = vi.fn();

      debouncer.debounce('op1', fn, 200);
      debouncer.debounce('op2', fn, 200);

      debouncer.cancelAll();

      expect(debouncer.getPendingCount()).toBe(0);
    });
  });
});
