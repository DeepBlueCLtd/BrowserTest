/**
 * Debouncer Utility
 *
 * Provides debouncing functionality to limit how often a function can be called.
 * Useful for auto-save operations, search inputs, and other high-frequency events.
 *
 * Eliminates code duplication between quiz-table.ts and analysis-table.ts
 * (11 lines duplicated × 2 files).
 */

/**
 * Debouncer class for managing multiple debounced operations
 *
 * @example
 * ```typescript
 * const debouncer = new Debouncer();
 *
 * // Debounce auto-save for cell1
 * debouncer.debounce('cell1', () => {
 *   saveData('cell1');
 * }, 200);
 *
 * // Debounce auto-save for cell2
 * debouncer.debounce('cell2', () => {
 *   saveData('cell2');
 * }, 200);
 * ```
 */
export class Debouncer {
  /**
   * Map of timer IDs keyed by operation ID
   */
  private timers = new Map<string, number>();

  /**
   * Debounce a function call
   *
   * If the function is called again with the same key before the delay expires,
   * the previous call is cancelled and the timer restarts.
   *
   * @param key - Unique identifier for this debounced operation
   * @param fn - Function to execute after delay
   * @param delay - Delay in milliseconds (default 200ms)
   *
   * @example
   * ```typescript
   * const debouncer = new Debouncer();
   *
   * input.addEventListener('input', () => {
   *   debouncer.debounce('search', () => {
   *     performSearch(input.value);
   *   }, 300);
   * });
   * ```
   */
  debounce(key: string, fn: () => void, delay = 200): void {
    // Clear existing timer for this key
    const existingTimer = this.timers.get(key);
    if (existingTimer !== undefined) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timerId = setTimeout(() => {
      fn();
      this.timers.delete(key);
    }, delay);

    this.timers.set(key, timerId as unknown as number);
  }

  /**
   * Cancel a pending debounced operation
   *
   * @param key - Unique identifier of the operation to cancel
   *
   * @example
   * ```typescript
   * debouncer.cancel('search'); // Cancel pending search
   * ```
   */
  cancel(key: string): void {
    const timerId = this.timers.get(key);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      this.timers.delete(key);
    }
  }

  /**
   * Cancel all pending debounced operations
   *
   * @example
   * ```typescript
   * debouncer.cancelAll(); // Cancel all pending operations
   * ```
   */
  cancelAll(): void {
    for (const timerId of this.timers.values()) {
      clearTimeout(timerId);
    }
    this.timers.clear();
  }

  /**
   * Check if a debounced operation is pending
   *
   * @param key - Unique identifier of the operation
   * @returns True if operation is pending
   *
   * @example
   * ```typescript
   * if (debouncer.isPending('save')) {
   *   console.log('Save is pending...');
   * }
   * ```
   */
  isPending(key: string): boolean {
    return this.timers.has(key);
  }

  /**
   * Get number of pending operations
   *
   * @returns Count of pending debounced operations
   */
  getPendingCount(): number {
    return this.timers.size;
  }

  /**
   * Flush a pending operation (execute immediately)
   *
   * Note: This requires storing the callback, which adds memory overhead.
   * For now, users should track callbacks themselves if flush is needed.
   *
   * @param key - Unique identifier of the operation to flush
   */
  flush(key: string): void {
    // Cancel the timer (operation will not execute)
    this.cancel(key);
    // Note: Caller must re-execute the function manually if needed
  }
}

/**
 * Create a simple debounced function (functional approach)
 *
 * Simpler alternative to the Debouncer class for single-use debouncing.
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced version of the function
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 *
 * input.addEventListener('input', (e) => {
 *   debouncedSearch((e.target as HTMLInputElement).value);
 * });
 * ```
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay = 200,
): (...args: Parameters<T>) => void {
  let timerId: number | undefined;

  return function debounced(...args: Parameters<T>): void {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      fn(...args);
      timerId = undefined;
    }, delay) as unknown as number;
  };
}

/**
 * Create a throttled function (limits call frequency)
 *
 * Unlike debounce, throttle ensures the function is called at most once per delay period,
 * even if invoked multiple times.
 *
 * @param fn - Function to throttle
 * @param delay - Minimum delay between calls in milliseconds
 * @returns Throttled version of the function
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *   updateScrollPosition();
 * }, 100);
 *
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay = 200,
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function throttled(...args: Parameters<T>): void {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}
