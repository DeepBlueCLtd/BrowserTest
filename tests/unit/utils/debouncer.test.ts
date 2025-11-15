/**
 * Debouncer Utility Tests
 *
 * Tests for the generic debouncer utility that delays function execution
 * until after a specified delay has elapsed since the last invocation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Debouncer } from '../../../src/utils/debouncer';

describe('Debouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should execute callback after delay', () => {
      const callback = vi.fn();
      const debouncer = new Debouncer(100);

      debouncer.debounce('key1', callback);

      // Should not execute immediately
      expect(callback).not.toHaveBeenCalled();

      // Should execute after delay
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should delay callback if called multiple times rapidly', () => {
      const callback = vi.fn();
      const debouncer = new Debouncer(100);

      // Call multiple times rapidly
      debouncer.debounce('key1', callback);
      vi.advanceTimersByTime(50);
      debouncer.debounce('key1', callback);
      vi.advanceTimersByTime(50);
      debouncer.debounce('key1', callback);

      // Should still not have executed
      expect(callback).not.toHaveBeenCalled();

      // Execute after final delay
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should execute callback only once after multiple calls', () => {
      const callback = vi.fn();
      const debouncer = new Debouncer(100);

      // Call 5 times rapidly
      for (let i = 0; i < 5; i++) {
        debouncer.debounce('key1', callback);
        vi.advanceTimersByTime(20);
      }

      // Advance past the final delay
      vi.advanceTimersByTime(100);

      // Should only execute once
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple Keys', () => {
    it('should handle different keys independently', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const debouncer = new Debouncer(100);

      debouncer.debounce('key1', callback1);
      debouncer.debounce('key2', callback2);

      // Advance time
      vi.advanceTimersByTime(100);

      // Both should execute
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should allow rapid updates to one key without affecting another', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const debouncer = new Debouncer(100);

      // Set up key2
      debouncer.debounce('key2', callback2);

      // Rapidly update key1
      for (let i = 0; i < 5; i++) {
        debouncer.debounce('key1', callback1);
        vi.advanceTimersByTime(20);
      }

      // Advance past key1's delay
      vi.advanceTimersByTime(100);

      // key1 should execute once, key2 should also execute
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cancellation', () => {
    it('should cancel pending callback for specific key', () => {
      const callback = vi.fn();
      const debouncer = new Debouncer(100);

      debouncer.debounce('key1', callback);
      debouncer.cancel('key1');

      // Advance time
      vi.advanceTimersByTime(100);

      // Should not execute
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not affect other keys when cancelling one', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const debouncer = new Debouncer(100);

      debouncer.debounce('key1', callback1);
      debouncer.debounce('key2', callback2);

      // Cancel only key1
      debouncer.cancel('key1');

      // Advance time
      vi.advanceTimersByTime(100);

      // key1 should not execute, key2 should
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should handle cancelling non-existent key gracefully', () => {
      const debouncer = new Debouncer(100);

      // Should not throw
      expect(() => debouncer.cancel('nonexistent')).not.toThrow();
    });

    it('should cancel all pending callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();
      const debouncer = new Debouncer(100);

      debouncer.debounce('key1', callback1);
      debouncer.debounce('key2', callback2);
      debouncer.debounce('key3', callback3);

      // Cancel all
      debouncer.cancelAll();

      // Advance time
      vi.advanceTimersByTime(100);

      // None should execute
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });
  });

  describe('Custom Delays', () => {
    it('should use custom delay when provided', () => {
      const callback = vi.fn();
      const debouncer = new Debouncer(100);

      debouncer.debounce('key1', callback, 250);

      // Should not execute at 100ms
      vi.advanceTimersByTime(100);
      expect(callback).not.toHaveBeenCalled();

      // Should execute at 250ms
      vi.advanceTimersByTime(150);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should use default delay when custom delay not provided', () => {
      const callback = vi.fn();
      const debouncer = new Debouncer(150);

      debouncer.debounce('key1', callback);

      // Should execute at default 150ms
      vi.advanceTimersByTime(150);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pending Status', () => {
    it('should report pending status for active timers', () => {
      const callback = vi.fn();
      const debouncer = new Debouncer(100);

      expect(debouncer.isPending('key1')).toBe(false);

      debouncer.debounce('key1', callback);
      expect(debouncer.isPending('key1')).toBe(true);

      vi.advanceTimersByTime(100);
      expect(debouncer.isPending('key1')).toBe(false);
    });

    it('should report not pending for cancelled timers', () => {
      const callback = vi.fn();
      const debouncer = new Debouncer(100);

      debouncer.debounce('key1', callback);
      expect(debouncer.isPending('key1')).toBe(true);

      debouncer.cancel('key1');
      expect(debouncer.isPending('key1')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero delay', () => {
      const callback = vi.fn();
      const debouncer = new Debouncer(0);

      debouncer.debounce('key1', callback);

      // Should execute immediately when timers advance
      vi.advanceTimersByTime(0);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle very short delays', () => {
      const callback = vi.fn();
      const debouncer = new Debouncer(1);

      debouncer.debounce('key1', callback);

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle updating same key before previous timer fires', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const debouncer = new Debouncer(100);

      debouncer.debounce('key1', callback1);
      vi.advanceTimersByTime(50);

      // Update with new callback before timer fires
      debouncer.debounce('key1', callback2);

      // Advance past both delays
      vi.advanceTimersByTime(100);

      // Only the second callback should execute
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should handle empty string keys', () => {
      const callback = vi.fn();
      const debouncer = new Debouncer(100);

      debouncer.debounce('', callback);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callback Execution Context', () => {
    it('should execute callback with correct parameters', () => {
      const callback = vi.fn((a: number, b: string) => {
        return a + b.length;
      });
      const debouncer = new Debouncer(100);

      debouncer.debounce('key1', () => callback(42, 'test'));

      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledWith(42, 'test');
    });

    it('should handle callback errors gracefully', () => {
      const callback = vi.fn(() => {
        throw new Error('Test error');
      });
      const debouncer = new Debouncer(100);

      debouncer.debounce('key1', callback);

      // Should not throw when advancing timers
      expect(() => vi.advanceTimersByTime(100)).not.toThrow();
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
